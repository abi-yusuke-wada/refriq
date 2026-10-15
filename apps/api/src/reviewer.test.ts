import { describe, expect, it } from "vitest";
import {
  FEEDBACK_CONTRACT_VERSION,
  REVISION_CONTENT_FIELDS,
  ReviewerService,
  referenceValue,
  revisionDiff,
  selectSourceReferences,
  stableJson,
  success,
  validateFeedback,
  type ReviewRecord,
} from "@refriq/application";
import { InMemoryReviewerStore } from "./in-memory-reviewer-store.js";
import { createReviewerHandler } from "./reviewer.js";
import {
  catalog,
  decision,
  edit,
  feedbackSelection,
  resolvedPolicies,
  seed,
  unresolvedCandidate,
} from "../test/reviewer-fixtures.js";

const human = { actorId: "human-reviewer" };
const setup = (record = seed()) => {
  let count = 0;
  const store = new InMemoryReviewerStore([record], catalog);
  return {
    record,
    store,
    service: new ReviewerService(
      store,
      () => "2026-10-14T00:00:00.000Z",
      () => `record-${++count}`,
    ),
  };
};
const feedback = (
  selection: unknown = feedbackSelection,
  operationId = "feedback-operation",
) => ({
  operationId,
  feedbackContractVersion: FEEDBACK_CONTRACT_VERSION,
  selection,
});

describe("production Human Decision Matrix", () => {
  it.each([
    ["ready", true],
    ["revise", false],
    ["reject", false],
    ["content-mismatch", false],
    ["evaluation-missing", false],
  ])("%s → APPROVE readiness %s", async (key, allowed) => {
    const { record, service, store } = setup(seed(String(key)));
    const result = await service.decide(decision(record), human);
    expect(result.ok).toBe(allowed);
    const fresh = await store.readReview(record.questionRevisionId);
    expect(fresh.ok && fresh.value.review !== null).toBe(allowed);
  });
  it.each([
    "ready",
    "revise",
    "reject",
    "content-mismatch",
    "evaluation-missing",
  ])("%s → REQUEST_CHANGES succeeds on exact Revision", async (key) => {
    const { record, service, store } = setup(seed(key));
    const original = structuredClone(record.revision);
    const result = await service.decide(
      decision(record, "REQUEST_CHANGES"),
      human,
    );
    expect(result).toMatchObject({
      ok: true,
      value: {
        decision: "REQUEST_CHANGES",
        questionRevisionId: record.questionRevisionId,
      },
    });
    const fresh = await store.readReview(record.questionRevisionId);
    expect(fresh).toMatchObject({
      ok: true,
      value: {
        state: "CHANGES_REQUESTED",
        currentPublishedRevisionId: record.currentPublishedRevisionId,
        revision: original,
      },
    });
  });
  it.each([
    "ready",
    "revise",
    "reject",
    "content-mismatch",
    "evaluation-missing",
  ])("%s → REJECT succeeds on exact Revision", async (key) => {
    const { record, service, store } = setup(seed(key));
    const result = await service.decide(decision(record, "REJECT"), human);
    expect(result).toMatchObject({
      ok: true,
      value: {
        decision: "REJECT",
        questionRevisionId: record.questionRevisionId,
      },
    });
    expect(await store.readReview(record.questionRevisionId)).toMatchObject({
      ok: true,
      value: {
        state: "REJECTED",
        currentPublishedRevisionId: record.currentPublishedRevisionId,
      },
    });
  });
  it.each([
    "candidate",
    "run",
    "revision",
    "content",
    "context",
    "stale",
    "unverified",
  ])("APPROVE rejects %s Evaluation", async (kind) => {
    const record = seed();
    if (
      !record.evaluation?.evaluatedContent ||
      !record.evaluation.evaluatedContext
    )
      throw new Error("evaluation required");
    const e = structuredClone(record.evaluation);
    if (!e.evaluatedContent || !e.evaluatedContext)
      throw new Error("evaluation snapshot required");
    if (kind === "run") Object.assign(e, { pipelineRunId: "other-run" });
    if (kind === "candidate")
      Object.assign(e, { candidateId: "other-candidate" });
    if (kind === "revision")
      Object.assign(e, { questionRevisionId: "other-revision" });
    if (kind === "content")
      Object.assign(e.evaluatedContent, {
        stem: "Different evaluated content",
      });
    if (kind === "context")
      Object.assign(e.evaluatedContext, {
        certificationId: "other-certification",
      });
    if (kind === "stale") Object.assign(e, { current: false });
    if (kind === "unverified") Object.assign(e, { evaluatedContent: null });
    const { service } = setup({ ...record, evaluation: e });
    expect(await service.decide(decision(record), human)).toMatchObject({
      ok: false,
      error: {
        code: kind === "stale" ? "EVALUATION_STALE" : "EVALUATION_MISMATCH",
      },
    });
  });
});
describe("production Human共通条件・競合・exact正本", () => {
  it("detail never substitutes mismatching Candidate Content", async () => {
    const { record, service } = setup(seed("content-mismatch"));
    const result = await service.detail(record.questionRevisionId);
    expect(result).toMatchObject({
      ok: true,
      value: { record: { revision: record.revision }, approve: { ok: false } },
    });
    expect(record.revision?.stem).not.toContain("Candidate-only");
  });
  it.each(["APPROVE", "REQUEST_CHANGES", "REJECT"] as const)(
    "%s rejects missing / mismatching exact target",
    async (action) => {
      const base = seed();
      for (const revision of [
        null,
        {
          ...base.revision,
          questionRevisionId: "candidate-id",
        } as ReviewRecord["revision"],
      ]) {
        const { service } = setup({ ...base, revision });
        expect(
          await service.decide(decision(base, action), human),
        ).toMatchObject({ ok: false, error: { code: "TARGET_MISMATCH" } });
      }
    },
  );
  it.each(["DRAFT", "PUBLISHED", "CHANGES_REQUESTED", "REJECTED"] as const)(
    "%s is not pending Human Review",
    async (state) => {
      const { record, service } = setup({ ...seed(), state });
      expect(
        await service.decide(decision(record, "REJECT"), human),
      ).toMatchObject({ ok: false, error: { code: "INVALID_STATE" } });
    },
  );
  it("requires Human Context and expected versions", async () => {
    const { record, service } = setup();
    expect(
      await service.decide(decision(record), { actorId: "" }),
    ).toMatchObject({ ok: false, error: { code: "UNAUTHORIZED" } });
    expect(
      await service.decide(
        { ...decision(record, "REJECT"), expectedRevisionVersion: 0 },
        human,
      ),
    ).toMatchObject({ ok: false, error: { code: "STALE_VERSION" } });
  });
  it.each([
    ["APPROVE", "REJECT"],
    ["APPROVE", "REQUEST_CHANGES"],
    ["REJECT", "REQUEST_CHANGES"],
  ] as const)("%s vs %s creates max1 definitive decision", async (a, b) => {
    const { record, service, store } = setup();
    const results = await Promise.all([
      service.decide(decision(record, a, "operation-a"), human),
      service.decide(decision(record, b, "operation-b"), human),
    ]);
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(results.filter((r) => !r.ok)).toHaveLength(1);
    expect(await store.readReview(record.questionRevisionId)).toMatchObject({
      ok: true,
      value: { review: { decision: a } },
    });
  });
  it("later matching Evaluation does not reopen a rejected Revision", async () => {
    const { record, service, store } = setup(seed("evaluation-missing"));
    expect((await service.decide(decision(record, "REJECT"), human)).ok).toBe(
      true,
    );
    store.replaceEvaluation(record.questionRevisionId, seed().evaluation);
    expect(
      await service.decide(decision(record, "APPROVE", "later"), human),
    ).toMatchObject({ ok: false, error: { code: "CONFLICT" } });
  });
  it("same operation returns original result before stale checks; different input conflicts", async () => {
    const { record, service } = setup();
    const command = decision(record);
    const first = await service.decide(command, human);
    expect(await service.decide(command, human)).toEqual(first);
    expect(
      await service.decide({ ...command, decision: "REJECT" }, human),
    ).toMatchObject({ ok: false, error: { code: "CONFLICT" } });
  });
  it("competing publication on the same Question detects stale head and retry never rolls back", async () => {
    const first = seed();
    const next = structuredClone(first);
    const nextId = "next-revision";
    Object.assign(next, { questionRevisionId: nextId });
    Object.assign(next.revision ?? {}, { questionRevisionId: nextId });
    next.revision?.questionSources.forEach((s) => {
      Object.assign(s, { questionRevisionId: nextId });
    });
    if (next.evaluation?.evaluatedContent) {
      Object.assign(next.evaluation, {
        questionRevisionId: nextId,
        evaluationId: "new-eval",
      });
      Object.assign(next.evaluation.evaluatedContent, {
        questionRevisionId: nextId,
      });
      next.evaluation.evaluatedContent.questionSources.forEach((s) => {
        Object.assign(s, { questionRevisionId: nextId });
      });
    }
    const store = new InMemoryReviewerStore([first, next], catalog);
    const service = new ReviewerService(store);
    const a = decision(first, "APPROVE", "a");
    const b = decision(next, "APPROVE", "b");
    expect((await service.decide(a, human)).ok).toBe(true);
    expect(await service.decide(b, human)).toMatchObject({
      ok: false,
      error: { code: "STALE_VERSION" },
    });
    const fresh = await store.readReview(nextId);
    if (!fresh.ok) throw new Error("fresh required");
    expect(
      (await service.decide(decision(fresh.value, "APPROVE", "c"), human)).ok,
    ).toBe(true);
    expect((await service.decide(a, human)).ok).toBe(true);
    expect(await store.readReview(first.questionRevisionId)).toMatchObject({
      ok: true,
      value: { currentPublishedRevisionId: nextId },
    });
  });
});
describe("production Source / Edit / Policy refresh", () => {
  it.each([
    "sources-trusted",
    "sources-review",
    "sources-prohibited",
    "sources-ambiguous",
    "sources-missing",
  ])(
    "%s checks all Sources and blocks base-source Edit bypass",
    async (key) => {
      const { record, service, store } = setup(seed(key));
      const trusted = key === "sources-trusted";
      const detail = await service.detail(record.questionRevisionId);
      expect(detail).toMatchObject({
        ok: true,
        value: { approve: { ok: trusted }, edit: { ok: trusted } },
      });
      const command = edit(record);
      const bypass = {
        ...command,
        draft: {
          ...command.draft,
          sourceReferences: command.draft.sourceReferences.slice(0, 1),
        },
      };
      const result = await service.edit(bypass, human);
      expect(result.ok).toBe(trusted);
      expect(store.candidates.length).toBe(trusted ? 1 : 0);
      if (!trusted)
        expect(result).toMatchObject({
          ok: false,
          error: { code: "SOURCE_BLOCKER" },
        });
      expect(
        (await service.decide(decision(record, "REQUEST_CHANGES"), human)).ok,
      ).toBe(true);
    },
  );
  it("policy refresh restores Review / Edit without rewriting historical Snapshot or references", async () => {
    const { record, service, store } = setup(seed("sources-review"));
    const history = structuredClone(record.sourceRevisionSnapshots);
    const relations = structuredClone(record.revision?.questionSources);
    store.refreshPolicies(record.questionRevisionId, resolvedPolicies());
    const fresh = await service.detail(record.questionRevisionId);
    expect(fresh).toMatchObject({
      ok: true,
      value: {
        approve: { ok: true },
        edit: { ok: true },
        record: {
          sourceRevisionSnapshots: history,
          revision: { questionSources: relations },
        },
      },
    });
    if (!fresh.ok) throw new Error("detail required");
    expect((await service.edit(edit(fresh.value.record), human)).ok).toBe(true);
  });
  it("policy change at commit blocks APPROVE and Edit, even when original UI was eligible", async () => {
    for (const kind of ["approve", "edit"]) {
      const { record, service, store } = setup(seed("sources-trusted"));
      const changed = seed("sources-prohibited").currentPolicyDecisions;
      store.beforeCommit = () =>
        store.refreshPolicies(record.questionRevisionId, changed);
      const result =
        kind === "approve"
          ? await service.decide(decision(record), human)
          : await service.edit(edit(record), human);
      expect(result).toMatchObject({
        ok: false,
        error: { code: "SOURCE_BLOCKER" },
      });
      expect(store.candidates).toHaveLength(0);
      expect(await store.readReview(record.questionRevisionId)).toMatchObject({
        ok: true,
        value: { review: null },
      });
    }
  });
  it("evaluation reference change at commit rejects APPROVE", async () => {
    const { record, service, store } = setup();
    store.beforeCommit = () =>
      store.replaceEvaluation(record.questionRevisionId, {
        ...(record.evaluation as NonNullable<ReviewRecord["evaluation"]>),
        evaluationId: "later-evaluation",
      });
    expect(await service.decide(decision(record), human)).toMatchObject({
      ok: false,
      error: { code: "STALE_VERSION" },
    });
  });
  it("PROHIBITED Grounding text is absent from the public response", async () => {
    const { record, service } = setup(seed("source-prohibited"));
    const result = await service.detail(record.questionRevisionId);
    expect(
      result.ok &&
        result.value.record.context.groundingSegments.every(
          (g) => g.text === "",
        ),
    ).toBe(true);
  });
  it("same ID same semantics permits projections; classification / Terms changes require new ID", () => {
    const { record, store } = setup();
    store.refreshPolicies(
      record.questionRevisionId,
      structuredClone(record.currentPolicyDecisions),
    );
    for (const field of ["classification", "terms"]) {
      const changed = structuredClone(record.currentPolicyDecisions);
      if (field === "classification")
        Object.assign(changed[0] ?? {}, { classification: "PROHIBITED" });
      else
        Object.assign(changed[0]?.termsMetadataSnapshot ?? {}, {
          reviewStatus: "REQUIRES_REVIEW",
        });
      expect(() =>
        store.refreshPolicies(record.questionRevisionId, changed),
      ).toThrow(/same SourcePolicyDecision ID/);
    }
  });
  it("Edit creates a distinct Candidate and pending new evaluation, preserving frozen Revision", async () => {
    const { record, service, store } = setup(seed("evaluation-missing"));
    const command = edit(record);
    const result = await service.edit(
      {
        ...command,
        draft: { ...command.draft, stem: "Edited new Candidate content" },
      },
      human,
    );
    expect(result).toMatchObject({
      ok: true,
      value: {
        baseQuestionRevisionId: record.questionRevisionId,
        evaluation: null,
        requiresValidation: true,
        requiresEvaluation: true,
      },
    });
    expect(await store.readReview(record.questionRevisionId)).toMatchObject({
      ok: true,
      value: {
        revision: record.revision,
        review: null,
        currentPublishedRevisionId: record.currentPublishedRevisionId,
      },
    });
  });
});
describe("production SourceReference / immutable Diff", () => {
  it.each([[[0]], [[1]], [[0, 1]]])(
    "same locator / different revisions %j saves only selected references",
    async (indices) => {
      const { record, service } = setup(seed("same-locator"));
      const refs = record.editSourceReferences;
      const selected = indices
        .map((i) => refs[i])
        .filter((r): r is NonNullable<typeof r> => !!r);
      const values = selected.map(referenceValue);
      const resolved = selectSourceReferences(refs, values);
      expect(resolved).toEqual(selected);
      const command = edit(record);
      expect(
        await service.edit(
          {
            ...command,
            draft: { ...command.draft, sourceReferences: resolved ?? [] },
          },
          human,
        ),
      ).toMatchObject({
        ok: true,
        value: { draft: { sourceReferences: selected } },
      });
    },
  );
  it("same revision / different locators remain distinct", async () => {
    const base = seed();
    const ref = base.editSourceReferences[0];
    if (!ref) throw new Error("ref required");
    const record = {
      ...base,
      editSourceReferences: [ref, { ...ref, locator: "section:other" }],
    };
    const { service } = setup(record);
    const second = record.editSourceReferences[1];
    if (!second) throw new Error("ref required");
    expect(referenceValue(ref)).not.toBe(referenceValue(second));
    expect(
      await service.edit(
        {
          ...edit(record),
          draft: { ...edit(record).draft, sourceReferences: [second] },
        },
        human,
      ),
    ).toMatchObject({
      ok: true,
      value: { draft: { sourceReferences: [second] } },
    });
  });
  it("covers all 11 frozen Content fields; current Policy is outside Diff", () => {
    const record = seed("diff-reordered");
    if (!record.revision || !record.previousRevision)
      throw new Error("content required");
    const rows = revisionDiff(record.previousRevision, record.revision);
    expect(rows.map((r) => r.field)).toEqual([
      "type",
      "stem",
      "options",
      "correctOptionIds",
      "explanation",
      "optionExplanations",
      "language",
      "difficulty",
      "knowledgePointIds",
      "questionSources",
      "questionIntent",
    ]);
    expect(rows).toHaveLength(REVISION_CONTENT_FIELDS.length);
    expect(rows.some((r) => String(r.field).includes("Policy"))).toBe(false);
  });
  it("unordered relations / answers ignore reorder; real relations / ordered options change", () => {
    const before = seed("sources-trusted").revision;
    if (!before) throw new Error("content required");
    const after = structuredClone(before);
    const relations = [...after.questionSources].reverse();
    const same = revisionDiff(before, {
      ...after,
      questionSources: relations,
      knowledgePointIds: [...after.knowledgePointIds].reverse(),
      correctOptionIds: [...after.correctOptionIds].reverse(),
    });
    expect(
      same
        .filter((r) =>
          ["questionSources", "knowledgePointIds", "correctOptionIds"].includes(
            r.field,
          ),
        )
        .every((r) => !r.changed),
    ).toBe(true);
    Object.assign(relations[0] ?? {}, { relation: "SUPPORTS_EXPLANATION" });
    expect(
      revisionDiff(before, { ...after, questionSources: relations }).find(
        (r) => r.field === "questionSources",
      )?.changed,
    ).toBe(true);
    expect(
      revisionDiff(before, {
        ...after,
        options: [...after.options].reverse(),
      }).find((r) => r.field === "options")?.changed,
    ).toBe(true);
  });
});
describe("production save / result reconciliation", () => {
  it("confirmed failure permits same-operation retry without duplicate", async () => {
    const { record, service, store } = setup();
    store.nextFault = "confirmed-failure";
    const command = decision(record);
    expect(await service.decide(command, human)).toMatchObject({
      ok: false,
      error: { code: "CONFIRMED_FAILURE" },
    });
    expect(await store.readReview(record.questionRevisionId)).toMatchObject({
      ok: true,
      value: { review: null },
    });
    const result = await service.decide(command, human);
    expect(result.ok).toBe(true);
    expect(await service.decide(command, human)).toEqual(result);
  });
  it("unknown committed reconciles original record; alternate decision cannot create another", async () => {
    const { record, service, store } = setup();
    store.nextFault = "unknown-committed";
    const command = decision(record);
    expect(await service.decide(command, human)).toMatchObject({
      ok: false,
      unknown: true,
    });
    const op = service.operation(
      "human-decision",
      command.operationId,
      command.questionRevisionId,
      command,
      human,
    );
    expect(await store.reconcile(op)).toMatchObject({
      ok: true,
      value: {
        state: "committed",
        value: { questionRevisionId: record.questionRevisionId },
      },
    });
    expect(
      await service.decide(decision(record, "REJECT", "other"), human),
    ).toMatchObject({ ok: false, error: { code: "CONFLICT" } });
  });
  it("unknown uncommitted remains unknown until proof, blocks alternate operation, then permits retry", async () => {
    const { record, service, store } = setup();
    store.nextFault = "unknown-uncommitted";
    const command = decision(record);
    expect(await service.decide(command, human)).toMatchObject({
      ok: false,
      unknown: true,
    });
    const op = service.operation(
      "human-decision",
      command.operationId,
      command.questionRevisionId,
      command,
      human,
    );
    expect(await store.reconcile(op)).toMatchObject({
      ok: true,
      value: { state: "still-unknown" },
    });
    expect(
      await service.decide(decision(record, "REJECT", "other"), human),
    ).toMatchObject({ ok: false, error: { code: "CONFLICT" } });
    store.confirmAborted(command.operationId);
    expect(await store.reconcile(op)).toMatchObject({
      ok: true,
      value: { state: "definitely-not-committed" },
    });
    expect((await service.decide(command, human)).ok).toBe(true);
  });
});
describe("production Feedback / HTTP boundary", () => {
  it.each(["rating", "unknown", "not_used"])(
    "%s immutable Feedback preserves approved meanings",
    async (kind) => {
      const { service } = setup();
      const selection = {
        ...feedbackSelection,
        ...(kind === "unknown"
          ? {
              similarityConcept: "unknown",
              similarityJudgment: 4,
              similarityDifficulty: "similar",
            }
          : kind === "not_used"
            ? {
                similarityConcept: "not_used",
                similarityJudgment: "not_used",
                similarityDifficulty: "not_used",
              }
            : {}),
      };
      const first = await service.submitFeedback(feedback(selection), human);
      expect(first.ok).toBe(true);
      expect(await service.submitFeedback(feedback(selection), human)).toEqual(
        first,
      );
      const next = await service.submitFeedback(
        feedback(selection, "resubmit"),
        human,
      );
      expect(next.ok).toBe(true);
      if (first.ok && next.ok)
        expect(next.value.examFeedbackId).not.toBe(first.value.examFeedbackId);
    },
  );
  it.each([
    {
      similarityConcept: "not_used",
      similarityJudgment: 4,
      similarityDifficulty: "similar",
    },
    {
      similarityConcept: "not_used",
      similarityJudgment: "unknown",
      similarityDifficulty: "not_used",
    },
  ])("mixed not_used rejects across all Similarity fields", async (mixed) => {
    const { service } = setup();
    expect(
      await service.submitFeedback(
        feedback({ ...feedbackSelection, ...mixed }),
        human,
      ),
    ).toMatchObject({
      ok: false,
      error: {
        code: "VALIDATION",
        fields: expect.arrayContaining([
          { field: "similarityConcept", message: expect.any(String) },
          { field: "similarityJudgment", message: expect.any(String) },
          { field: "similarityDifficulty", message: expect.any(String) },
        ]),
      },
    });
  });
  it.each([
    "stem",
    "options",
    "answer",
    "comment",
    "attachment",
    "screenshot",
    "url",
    "questionRevisionId",
    "sourceRevisionId",
  ])("forbidden %s is rejected before storage", async (field) => {
    const { service, store } = setup();
    expect(
      await service.submitFeedback(
        feedback({
          ...feedbackSelection,
          [field]: "https://example.invalid/forbidden",
        }),
        human,
      ),
    ).toMatchObject({ ok: false, error: { code: "VALIDATION" } });
    expect(
      await store.feedbacks({
        certificationId: catalog.certificationId,
        limit: 20,
      }),
    ).toMatchObject({ ok: true, value: { items: [] } });
  });
  it("multi-select unknown mixing / duplicate / free text / object reject", () => {
    for (const selection of [
      { ...feedbackSelection, examTopicIds: ["unknown", "topic-routing"] },
      { ...feedbackSelection, questionStyles: ["scenario", "scenario"] },
      { ...feedbackSelection, similarityConcept: "free text" },
      { ...feedbackSelection, missingTopicIds: { file: "attachment" } },
    ])
      expect(validateFeedback(selection, catalog).ok).toBe(false);
  });
  it("Feedback unknown result resolves the same immutable Record; public projection has no Actor", async () => {
    const { service, store } = setup();
    store.nextFault = "unknown-committed";
    const input = feedback();
    expect(await service.submitFeedback(input, human)).toMatchObject({
      ok: false,
      unknown: true,
    });
    const valid = validateFeedback(feedbackSelection, catalog);
    if (!valid.ok) throw new Error("valid required");
    const op = service.operation(
      "feedback",
      input.operationId,
      catalog.certificationId,
      {
        feedbackContractVersion: FEEDBACK_CONTRACT_VERSION,
        selection: valid.value,
      },
      human,
    );
    const result = await store.reconcile(op);
    expect(result).toMatchObject({ ok: true, value: { state: "committed" } });
    expect(stableJson(result)).not.toContain(human.actorId);
  });
  it("HTTP invokes production Use Case, rejects unknown fields and respects external authorization", async () => {
    const { record, service } = setup();
    const handler = createReviewerHandler(service, async () => success(human));
    const request = (operation: string, input: unknown) =>
      new Request("https://refriq.invalid/api/reviewer", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ operation, input }),
      });
    expect(
      await (
        await handler(request("decide", decision(record, "REJECT")))
      ).json(),
    ).toMatchObject({
      ok: true,
      value: {
        questionRevisionId: record.questionRevisionId,
        decision: "REJECT",
      },
    });
    expect(
      await (
        await handler(
          request(
            "submitFeedback",
            feedback({ ...feedbackSelection, comment: "not allowed" }),
          ),
        )
      ).json(),
    ).toMatchObject({ ok: false, error: { code: "VALIDATION" } });
  });
});

describe("production decision-specific boundaries", () => {
  it.each([
    ["content-mismatch", "REQUEST_CHANGES"],
    ["content-mismatch", "REJECT"],
    ["evaluation-missing", "REQUEST_CHANGES"],
    ["evaluation-missing", "REJECT"],
  ] as const)(
    "%s accepts %s without APPROVE-only fields",
    async (scenario, action) => {
      const { record, service } = setup(seed(scenario));
      const {
        expectedEvaluationId: _e,
        expectedPolicyDecisionIds: _p,
        ...command
      } = decision(record, action);
      expect(await service.decide(command, human)).toMatchObject({
        ok: true,
        value: {
          questionRevisionId: record.questionRevisionId,
          decision: action,
        },
      });
    },
  );
  it("rejects malformed JSON as validation without starting a write", async () => {
    const { service } = setup();
    const handler = createReviewerHandler(service, async () => success(human));
    const result = await handler(
      new Request("http://localhost/api/reviewer", {
        method: "POST",
        body: "{",
      }),
    );
    expect(result.status).toBe(400);
    expect(await result.json()).toMatchObject({
      ok: false,
      error: { code: "VALIDATION" },
    });
  });
  it("refreshes current Policy for every Revision sharing that Source", async () => {
    const a = seed("sources-review");
    const b = structuredClone(a);
    Object.assign(b, { questionRevisionId: "second-revision" });
    if (!b.revision) throw new Error("exact required");
    Object.assign(b.revision, {
      questionRevisionId: b.questionRevisionId,
      questionSources: b.revision.questionSources.map((s) => ({
        ...s,
        questionRevisionId: b.questionRevisionId,
      })),
    });
    const store = new InMemoryReviewerStore([a, b], catalog);
    store.refreshPolicies(a.questionRevisionId, resolvedPolicies());
    const after = await store.readReview(b.questionRevisionId);
    expect(after.ok && after.value.currentPolicyDecisions).toEqual(
      resolvedPolicies(),
    );
    expect(after.ok && after.value.sourceRevisionSnapshots).toEqual(
      b.sourceRevisionSnapshots,
    );
  });
});

describe("production approved Edit scope", () => {
  it.each(["type", "language", "difficulty"] as const)(
    "rejects forged change to readonly %s",
    async (field) => {
      const { record, service, store } = setup();
      const command = edit(record);
      const changed = {
        ...command.draft,
        [field]:
          field === "type"
            ? "multiple_select"
            : field === "language"
              ? "fr"
              : "advanced",
      };
      expect(
        await service.edit({ ...command, draft: changed }, human),
      ).toMatchObject({
        ok: false,
        error: {
          code: "VALIDATION",
          fields: expect.arrayContaining([expect.objectContaining({ field })]),
        },
      });
      expect(store.candidates).toHaveLength(0);
    },
  );
});

it("replays the same saved Edit after current Policy changes without creating another Candidate", async () => {
  const { record, service, store } = setup();
  const command = edit(record);
  const saved = await service.edit(command, human);
  expect(saved.ok).toBe(true);
  store.refreshPolicies(
    record.questionRevisionId,
    record.currentPolicyDecisions.map((p) => ({
      ...p,
      sourcePolicyDecisionId: `${p.sourcePolicyDecisionId}-later`,
      classification: "PROHIBITED",
    })),
  );
  expect(await service.edit(command, human)).toEqual(saved);
  expect(store.candidates).toHaveLength(1);
  expect(
    await service.edit({ ...command, operationId: "new-edit" }, human),
  ).toMatchObject({ ok: false, error: { code: "SOURCE_BLOCKER" } });
});

it("lists unresolved Pipeline Candidate separately and never uses its ID as a Domain Revision", async () => {
  const candidate = unresolvedCandidate();
  const store = new InMemoryReviewerStore([], catalog, [
    { queuedAt: "2026-10-03T00:00:00.000Z", candidateProjection: candidate },
  ]);
  const service = new ReviewerService(store);
  expect(
    await service.queue({
      certificationId: catalog.certificationId,
      limit: 20,
    }),
  ).toMatchObject({
    ok: true,
    value: {
      items: [
        {
          questionRevisionId: null,
          questionId: null,
          state: "Application Candidate",
          pendingCandidate: {
            candidateId: candidate.candidateId,
            question: candidate.question,
          },
        },
      ],
    },
  });
  expect(await service.detail(candidate.candidateId)).toMatchObject({
    ok: false,
    error: { code: "NOT_FOUND" },
  });
  expect(
    await service.decide(
      { ...decision(seed()), questionRevisionId: candidate.candidateId },
      human,
    ),
  ).toMatchObject({ ok: false, error: { code: "NOT_FOUND" } });
});
