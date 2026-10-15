import { describe, expect, it } from "vitest";
import {
  EVALUATION_CRITERIA,
  validateQuestionGenerationInput,
  validateQuestionGenerationOutput,
  validateQuestionEvaluationInput,
  validateQuestionEvaluationOutput,
} from "../../../../packages/application/src/pipeline/index.ts";
import {
  canPublishQuestionRevision,
  validateSourceRevisionPolicySnapshot,
} from "../../../../packages/domain/src/index.ts";
import "./fixtures.js";

const records = globalThis.reviewerFixtures;

// Snapshotにはない評価日時・Reason等を補わず、記録されているDecision項目だけ照合する。
function historicalPolicyDecision(snapshot) {
  return {
    sourcePolicyDecisionId: snapshot.sourcePolicyDecisionId,
    sourceDocumentId: snapshot.sourceDocumentId,
    classification: snapshot.classificationAtUse,
    usagePurpose: snapshot.usagePurposeAtUse,
    sourceKind: snapshot.sourceKindAtUse,
    sourceReviewId: snapshot.sourceReviewId,
    matchedAllowRuleSnapshot: snapshot.matchedAllowRuleSnapshot,
    sourceMetadataSnapshot: snapshot.sourceMetadataSnapshot,
    termsMetadataSnapshot: snapshot.termsMetadataSnapshot,
  };
}

function assertPolicyDecisionConsistency(decisions) {
  const byId = new Map();
  for (const { sourcePolicyDecisionId, ...semantics } of decisions) {
    // Optional参照の不在も記録内容。取得時Snapshotに存在しない項目は補わない。
    semantics.sourceReviewId ??= undefined;
    semantics.matchedAllowRuleSnapshot ??= undefined;
    if (Object.hasOwn(semantics, "evaluatedAt"))
      semantics.matchedAllowRuleId ??= undefined;
    const known = byId.get(sourcePolicyDecisionId) ?? new Map();
    for (const [field, value] of Object.entries(semantics)) {
      if (known.has(field))
        expect(value, `${sourcePolicyDecisionId}: ${field}`).toEqual(
          known.get(field),
        );
      else known.set(field, value);
    }
    byId.set(sourcePolicyDecisionId, known);
  }
}

describe("Reviewer Fixtureと既存Domain / Pipelineの整合性", () => {
  it.each(records)(
    "$keyの内容・評価・Source Snapshotが既存Contractを満たす",
    (record) => {
      const candidate = record.candidate;
      const {
        candidateId: _id,
        knowledgePointCandidateIds: _points,
        ...question
      } = candidate.question;
      const input = {
        certification: candidate.certification,
        examTopics: candidate.examTopics,
        knowledgePoints: candidate.knowledgePoints,
        questionIntent: candidate.questionIntent,
        groundingSegments: candidate.groundingSegments,
        rules: ["Use provided grounding only."],
      };
      validateQuestionGenerationInput(input);
      expect(
        validateQuestionGenerationOutput({ question }, input).question,
      ).toEqual(question);
      const { rules: _rules, ...context } = input;
      const evaluationInput = {
        ...context,
        question,
        criteria: EVALUATION_CRITERIA,
      };
      validateQuestionEvaluationInput(evaluationInput);
      expect(
        validateQuestionEvaluationOutput(candidate.evaluation, evaluationInput),
      ).toEqual(candidate.evaluation);
      expect(
        validateSourceRevisionPolicySnapshot(candidate.sourceRevision).allowed,
      ).toBe(true);
    },
  );
  it.each(records.filter((record) => record.revision))(
    "$keyの公開可否を既存Domain Gateで確認する",
    (record) => {
      const input = {
        questionRevisionId: record.reviewTargetRevision.questionRevisionId,
        knowledgePointIds: record.reviewTargetRevision.knowledgePointIds,
        questionSources: record.reviewTargetRevision.questionSources,
        sourceRevisionSnapshots: record.sourceRevisionSnapshots,
        currentPolicyDecisions: record.currentPolicyDecisions,
      };
      expect(canPublishQuestionRevision(input).allowed).toBe(false);
      const review = {
        questionReviewId: "synthetic-test-review",
        questionRevisionId: input.questionRevisionId,
        reviewerId: "synthetic-reviewer",
        decision: "APPROVE",
        reviewedAt: "2026-10-03T00:00:00.000Z",
      };
      expect(
        canPublishQuestionRevision({ ...input, questionReview: review })
          .allowed,
      ).toBe(record.sourcePolicyGate.eligible);
      expect(
        canPublishQuestionRevision({ ...input, questionReview: review })
          .reasonCodes,
      ).toEqual(record.sourcePolicyGate.blockers);
      expect(
        canPublishQuestionRevision({
          ...input,
          questionReview: {
            ...review,
            questionRevisionId: "synthetic-other-revision",
          },
        }).allowed,
      ).toBe(false);
    },
  );
  it("現在のPolicy変更が取得時Snapshotを書き換えていない", () => {
    for (const key of ["source-review", "source-prohibited"]) {
      const record = records.find((item) => item.key === key);
      expect(record.candidate.sourceRevision.classificationAtUse).toBe(
        "TRUSTED",
      );
      expect(
        record.candidate.sourceRevision.termsMetadataSnapshot.reviewStatus,
      ).toBe("CLEARED_FOR_PRODUCT_USE");
      expect(record.currentPolicyDecisions[0].classification).not.toBe(
        "TRUSTED",
      );
    }
  });
  it("Source Review後の再取得例も既存Domain Gateと一致し、過去Decisionを更新しない", () => {
    const record = records.find((item) => item.key === "sources-review");
    const read = record.sourcePolicyRefresh;
    const target = read.reviewTargetRevision;
    const result = canPublishQuestionRevision({
      questionRevisionId: target.questionRevisionId,
      knowledgePointIds: target.knowledgePointIds,
      questionSources: target.questionSources,
      sourceRevisionSnapshots: record.sourceRevisionSnapshots,
      currentPolicyDecisions: read.currentPolicyDecisions,
      questionReview: {
        questionReviewId: "synthetic-test-review-after-source-resolution",
        questionRevisionId: target.questionRevisionId,
        reviewerId: "synthetic-reviewer",
        decision: "APPROVE",
        reviewedAt: "2026-10-04T02:00:00.000Z",
      },
    });
    expect(result.allowed).toBe(read.sourcePolicyGate.eligible);
    expect(result.reasonCodes).toEqual(read.sourcePolicyGate.blockers);
    expect(read.currentPolicyDecisions[1].sourcePolicyDecisionId).not.toBe(
      record.currentPolicyDecisions[1].sourcePolicyDecisionId,
    );
    expect(record.currentPolicyDecisions[1].classification).toBe(
      "REVIEW_REQUIRED",
    );
    expect(read.currentPolicyDecisions[1].classification).toBe("TRUSTED");
    expect(record.sourceRevisionSnapshots[1].sourcePolicyDecisionId).toBe(
      "synthetic-policy-decision-02",
    );
  });
});

describe("N-02 SourcePolicyDecisionの履歴Identity整合性", () => {
  const trusted = records.find((record) => record.key === "sources-trusted");
  const decision = trusted.currentPolicyDecisions[1];

  it("取得時・現在・Source Review後の全投影で、同じIDのDecision内容が一致する", () => {
    assertPolicyDecisionConsistency(
      records.flatMap((record) => [
        historicalPolicyDecision(record.candidate.sourceRevision),
        ...record.sourceRevisionSnapshots.map(historicalPolicyDecision),
        ...record.currentPolicyDecisions,
        ...(record.sourcePolicyRefresh?.currentPolicyDecisions ?? []),
      ]),
    );
  });

  it.each([
    ["sources-review", "REVIEW_REQUIRED"],
    ["sources-prohibited", "PROHIBITED"],
  ])(
    "%sのPolicy変更は取得時とは別のDecision IDを使う",
    (key, classification) => {
      const record = records.find((item) => item.key === key);
      const historical = record.sourceRevisionSnapshots[1];
      const current = record.currentPolicyDecisions.find(
        (policy) => policy.sourceDocumentId === historical.sourceDocumentId,
      );
      expect(historical.sourcePolicyDecisionId).toBe(
        "synthetic-policy-decision-02",
      );
      expect(historical.classificationAtUse).toBe("TRUSTED");
      expect(historical.termsMetadataSnapshot.reviewStatus).toBe(
        "CLEARED_FOR_PRODUCT_USE",
      );
      expect(current.classification).toBe(classification);
      expect(current.sourcePolicyDecisionId).not.toBe(
        historical.sourcePolicyDecisionId,
      );
      expect(
        record.reviewTargetRevision.questionSources.find(
          (source) => source.sourceRevisionId === historical.sourceRevisionId,
        ).sourcePolicyDecisionId,
      ).toBe(historical.sourcePolicyDecisionId);
    },
  );

  it("同じID・同じ内容のRecordを複数投影から参照できる", () => {
    expect(() =>
      assertPolicyDecisionConsistency([
        decision,
        structuredClone(decision),
        historicalPolicyDecision(trusted.sourceRevisionSnapshots[1]),
      ]),
    ).not.toThrow();
  });

  it.each([
    ["classification", "REVIEW_REQUIRED"],
    ["usagePurpose", "DISCOVERY"],
    ["reasonCodes", ["TERMS_REVIEW_REQUIRED"]],
    ["sourceReviewId", "synthetic-different-source-review"],
    ["evaluatedAt", "2026-10-04T03:00:00.000Z"],
    ["matchedAllowRuleId", "synthetic-different-allow-rule"],
    [
      "termsMetadataSnapshot",
      { ...decision.termsMetadataSnapshot, reviewStatus: "REQUIRES_REVIEW" },
    ],
    [
      "sourceMetadataSnapshot",
      { ...decision.sourceMetadataSnapshot, sourceOwner: "Different Owner" },
    ],
  ])("同じIDで%sが異なるRecordは検査失敗になる", (field, value) => {
    expect(() =>
      assertPolicyDecisionConsistency([
        decision,
        { ...structuredClone(decision), [field]: value },
      ]),
    ).toThrow(`${decision.sourcePolicyDecisionId}: ${field}`);
  });

  it("Snapshotとcurrent Decisionで同じIDのTermsが異なれば検査失敗になる", () => {
    expect(() =>
      assertPolicyDecisionConsistency([
        historicalPolicyDecision(trusted.sourceRevisionSnapshots[1]),
        {
          ...structuredClone(decision),
          termsMetadataSnapshot: {
            ...decision.termsMetadataSnapshot,
            reviewStatus: "PROHIBITED",
          },
        },
      ]),
    ).toThrow(`${decision.sourcePolicyDecisionId}: termsMetadataSnapshot`);
  });
});

describe("N-03 取得後のPolicy変更Fixtureの時系列", () => {
  function policyChangesAfterRetrieval(record) {
    return record.sourceRevisionSnapshots.flatMap((snapshot) =>
      record.currentPolicyDecisions
        .filter(
          (decision) =>
            decision.sourceDocumentId === snapshot.sourceDocumentId &&
            decision.usagePurpose === snapshot.usagePurposeAtUse &&
            decision.sourcePolicyDecisionId !==
              snapshot.sourcePolicyDecisionId &&
            decision.classification !== snapshot.classificationAtUse,
        )
        .map((decision) => ({ key: record.key, snapshot, decision })),
    );
  }

  const changes = records.flatMap(policyChangesAfterRetrieval);

  it("REVIEW_REQUIRED / PROHIBITEDの必須変更例を検査対象に含む", () => {
    expect(changes.map((change) => change.key)).toEqual(
      expect.arrayContaining(["sources-review", "sources-prohibited"]),
    );
  });

  it.each(changes)(
    "$keyの変更後DecisionはSource取得より後に評価される",
    ({ snapshot, decision }) => {
      expect(Date.parse(decision.evaluatedAt)).toBeGreaterThan(
        Date.parse(snapshot.retrievedAt),
      );
    },
  );

  it("同じDecision / 分類を参照する通常例に取得後の評価を要求しない", () => {
    for (const key of ["ready", "sources-trusted", "sources-ambiguous"]) {
      const record = records.find((item) => item.key === key);
      expect(policyChangesAfterRetrieval(record)).toEqual([]);
    }
  });
});
