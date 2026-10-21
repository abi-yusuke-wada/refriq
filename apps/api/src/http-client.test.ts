import { describe, expect, it } from "vitest";
import { createHttpReviewerClient } from "../../web/src/http-client.js";
import {
  FEEDBACK_CONTRACT_VERSION,
  ReviewerService,
  stableJson,
  success,
} from "@refriq/application";
import { InMemoryReviewerStore } from "../../api/src/in-memory-reviewer-store.js";
import { createReviewerHandler } from "../../api/src/reviewer.js";
import {
  catalog,
  decision,
  feedbackSelection,
  seed,
} from "../../api/test/reviewer-fixtures.js";

describe("production HTTP client", () => {
  it("reads exact content and commits through the real HTTP/Application boundary", async () => {
    const r = seed();
    const store = new InMemoryReviewerStore([r], catalog);
    const handler = createReviewerHandler(
      new ReviewerService(store),
      async () => success({ actorId: "human" }),
    );
    const client = createHttpReviewerClient(
      "http://localhost/api/reviewer",
      async (url, init) => handler(new Request(url, init)),
    );
    expect(await client.detail(r.questionRevisionId)).toMatchObject({
      ok: true,
      value: { record: { revision: r.revision } },
    });
    expect(await client.decide(decision(r))).toMatchObject({
      ok: true,
      value: { decision: "APPROVE" },
    });
  });
  it("treats a disconnected write as result unknown and never retries", async () => {
    let calls = 0;
    const client = createHttpReviewerClient("/api/reviewer", async () => {
      calls++;
      throw new Error("disconnect");
    });
    expect(await client.decide(decision(seed()))).toMatchObject({
      ok: false,
      unknown: true,
    });
    expect(calls).toBe(1);
  });
  it("refuses another Revision response with no Candidate fallback", async () => {
    const client = createHttpReviewerClient("/api/reviewer", async () =>
      Response.json({
        ok: true,
        value: { record: { questionRevisionId: "other" } },
      }),
    );
    expect(await client.detail("exact")).toMatchObject({
      ok: false,
      error: { code: "SYSTEM_ERROR" },
    });
  });
  it("preserves an authorization error without converting it to a save failure", async () => {
    const client = createHttpReviewerClient("/api/reviewer", async () =>
      Response.json({
        ok: false,
        error: { code: "FORBIDDEN", message: "権限がありません", fields: [] },
      }),
    );
    expect(await client.decide(decision(seed()))).toMatchObject({
      ok: false,
      error: { code: "FORBIDDEN" },
    });
  });
});

describe("Feedback HTTP client without an earlier catalog call", () => {
  const command = {
    operationId: "feedback-operation",
    feedbackContractVersion: FEEDBACK_CONTRACT_VERSION,
    selection: feedbackSelection,
  };
  const operation = {
    operationId: command.operationId,
    kind: "feedback" as const,
    targetId: catalog.certificationId,
    inputIdentity: stableJson({
      feedbackContractVersion: command.feedbackContractVersion,
      selection: command.selection,
    }),
  };
  const request = { certificationId: catalog.certificationId, limit: 20 };
  function boundary() {
    const store = new InMemoryReviewerStore([seed()], catalog);
    const service = new ReviewerService(store);
    const handler = createReviewerHandler(service, async () =>
      success({ actorId: "human" }),
    );
    const calls: string[] = [];
    const fetcher: typeof fetch = async (url, init) => {
      calls.push(JSON.parse(String(init?.body)).operation);
      return handler(new Request(url, init));
    };
    return { service, store, calls, fetcher };
  }
  it("submits, caches the catalog and reconciles the same immutable submission", async () => {
    const { calls, fetcher } = boundary();
    const client = createHttpReviewerClient(
      "http://localhost/api/reviewer",
      fetcher,
    );
    const result = await client.submitFeedback(command);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Feedback must commit");
    expect(await client.submitFeedback(command)).toEqual(result);
    expect(await client.feedbacks(request)).toMatchObject({
      ok: true,
      value: { items: [result.value] },
    });
    expect(await client.feedback(result.value.examFeedbackId)).toEqual(result);
    expect(await client.reconcile(operation)).toEqual(
      success({ state: "committed", value: result.value }),
    );
    expect(calls).toEqual([
      "catalog",
      "submitFeedback",
      "submitFeedback",
      "feedbacks",
      "feedback",
      "reconcile",
    ]);
  });
  it.each(["feedbacks", "feedback", "reconcile"] as const)(
    "%s loads the catalog for an independent client",
    async (kind) => {
      const { service, calls, fetcher } = boundary();
      const saved = await service.submitFeedback(command, { actorId: "human" });
      if (!saved.ok) throw new Error("Feedback must commit");
      const client = createHttpReviewerClient(
        "http://localhost/api/reviewer",
        fetcher,
      );
      const result =
        kind === "feedbacks"
          ? await client.feedbacks(request)
          : kind === "feedback"
            ? await client.feedback(saved.value.examFeedbackId)
            : await client.reconcile(operation);
      expect(result).toMatchObject(
        kind === "feedbacks"
          ? { ok: true, value: { items: [saved.value] } }
          : kind === "feedback"
            ? saved
            : success({ state: "committed", value: saved.value }),
      );
      expect(calls).toEqual(["catalog", kind]);
    },
  );
  it.each(["submitFeedback", "feedbacks", "feedback", "reconcile"] as const)(
    "%s stops before dispatch when catalog loading fails",
    async (kind) => {
      const calls: string[] = [];
      const client = createHttpReviewerClient(
        "/api/reviewer",
        async (_url, init) => {
          calls.push(JSON.parse(String(init?.body)).operation);
          throw new Error("catalog disconnected");
        },
      );
      const result =
        kind === "submitFeedback"
          ? await client.submitFeedback(command)
          : kind === "feedbacks"
            ? await client.feedbacks(request)
            : kind === "feedback"
              ? await client.feedback("feedback-id")
              : await client.reconcile(operation);
      expect(result).toMatchObject({
        ok: false,
        error: { code: "SYSTEM_ERROR" },
      });
      expect(result).not.toHaveProperty("unknown");
      expect(calls).toEqual(["catalog"]);
    },
  );
  it("reconciles a committed but disconnected submission without resending", async () => {
    const { calls, fetcher } = boundary();
    const client = createHttpReviewerClient(
      "http://localhost/api/reviewer",
      async (url, init) => {
        const response = await fetcher(url, init);
        if (JSON.parse(String(init?.body)).operation === "submitFeedback")
          throw new Error("response disconnected after commit");
        return response;
      },
    );
    expect(await client.submitFeedback(command)).toMatchObject({
      ok: false,
      unknown: true,
    });
    expect(await client.reconcile(operation)).toMatchObject({
      ok: true,
      value: { state: "committed", value: { selection: feedbackSelection } },
    });
    expect(calls).toEqual(["catalog", "submitFeedback", "reconcile"]);
  });
  it("preserves catalog authorization failure and does not send a write", async () => {
    const calls: string[] = [];
    const client = createHttpReviewerClient(
      "/api/reviewer",
      async (_url, init) => {
        calls.push(JSON.parse(String(init?.body)).operation);
        return Response.json({
          ok: false,
          error: { code: "FORBIDDEN", message: "権限がありません", fields: [] },
        });
      },
    );
    expect(await client.submitFeedback(command)).toMatchObject({
      ok: false,
      error: { code: "FORBIDDEN" },
    });
    expect(calls).toEqual(["catalog"]);
  });
});
