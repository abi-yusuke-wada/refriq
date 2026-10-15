import { describe, expect, it } from "vitest";
import { createHttpReviewerClient } from "../../web/src/http-client.js";
import { ReviewerService, success } from "@refriq/application";
import { InMemoryReviewerStore } from "../../api/src/in-memory-reviewer-store.js";
import { createReviewerHandler } from "../../api/src/reviewer.js";
import { catalog, decision, seed } from "../../api/test/reviewer-fixtures.js";

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
