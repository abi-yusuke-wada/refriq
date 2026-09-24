import { describe, expect, it } from "vitest";
import { KONG_MVP_SOURCE_ALLOWLIST } from "./source-allowlist.js";
import {
  canPublishQuestionRevision,
  canUseForKnowledgeExtraction,
  canUseForQuestionGeneration,
  createQuestionSourceAssociation,
  createSourceRevisionPolicySnapshot,
  evaluateSourcePolicy,
  type AllowedSource,
  type SourcePolicyCandidate,
  type SourceReviewRecord,
  type SourceTermsMetadata,
} from "./source-governance.js";

const allowedSource: AllowedSource = {
  id: "allow-kong-docs",
  owner: "Kong",
  hostname: "developer.konghq.com",
  pathPrefix: "/gateway",
  allowedKinds: ["OFFICIAL_DOCUMENTATION"],
  allowedPurposes: ["NORMATIVE_TECHNICAL"],
  notes: "公開Gateway Documentationの個別Pathを確認して許可する。",
};

const clearedTerms: SourceTermsMetadata = {
  reviewStatus: "CLEARED_FOR_PRODUCT_USE",
  termsUrl: "https://terms.example.test/source",
  checkedAt: "2026-09-24T00:00:00.000Z",
  checkedBy: "reviewer-test",
  notes: "Synthetic Product Policy metadata; not a legal conclusion.",
};

function candidate(
  overrides: Partial<SourcePolicyCandidate> = {},
): SourcePolicyCandidate {
  return {
    sourceDocumentId: "source-kong-routes",
    sourceUrl: "https://developer.konghq.com/gateway/routes/",
    sourceOwner: "Kong",
    sourceKind: "OFFICIAL_DOCUMENTATION",
    usagePurpose: "NORMATIVE_TECHNICAL",
    originStatus: "VERIFIED",
    accessClassification: "PUBLIC",
    automatedAccess: "ALLOWED",
    purposeAlignment: "ALIGNED",
    terms: clearedTerms,
    ...overrides,
  };
}

function evaluate(
  value: SourcePolicyCandidate = candidate(),
  sourceReview?: SourceReviewRecord,
) {
  return evaluateSourcePolicy(value, KONG_MVP_SOURCE_ALLOWLIST, {
    sourcePolicyDecisionId: "policy-decision-01",
    evaluatedAt: "2026-09-24T00:01:00.000Z",
    ...(sourceReview ? { sourceReview } : {}),
  });
}

function makeRevisionSnapshot() {
  const decision = evaluate();
  return createSourceRevisionPolicySnapshot(decision, {
    sourceRevisionId: "source-revision-01",
    sourceUrlAtRetrieval: "https://developer.konghq.com/gateway/routes/",
    retrievedAt: "2026-09-24T00:02:00.000Z",
    contentFingerprint: "sha256:synthetic-content-fingerprint",
  });
}

describe("Source Policy", () => {
  it("許可された公式公開SourceをTRUSTEDとし、Pipeline利用を許可する", () => {
    const decision = evaluate();

    expect(decision.classification).toBe("TRUSTED");
    expect(decision.matchedAllowRuleId).toBe("kong-gateway-documentation");
    expect(canUseForKnowledgeExtraction(decision).allowed).toBe(true);
    expect(canUseForQuestionGeneration(decision).allowed).toBe(true);
  });

  it("Certification Scope用のAllowlist Ruleを個別HostとPathで評価する", () => {
    const decision = evaluate(
      candidate({
        sourceDocumentId: "source-kong-exam-preparation",
        sourceUrl: "https://konghq.com/academy/exam-preparation/",
        sourceKind: "CERTIFICATION_SCOPE",
      }),
    );

    expect(decision.classification).toBe("TRUSTED");
    expect(decision.matchedAllowRuleId).toBe("kong-certification-scope");
  });

  it("公式SampleはHuman Review済みのStyle Referenceに限りQuestion Generationで利用できる", () => {
    const styleRule: AllowedSource = {
      id: "synthetic-sample-style-rule",
      owner: "Example Vendor",
      hostname: "samples.example.test",
      pathPrefix: "/public-format",
      allowedKinds: ["OFFICIAL_SAMPLE"],
      allowedPurposes: ["STYLE_REFERENCE"],
      notes: "Synthetic test rule for high-level format reference only.",
    };
    const sourceReview: SourceReviewRecord = {
      sourceReviewId: "synthetic-sample-review",
      sourceDocumentId: "synthetic-sample-source",
      reviewerId: "reviewer-test",
      reviewedAt: "2026-09-24T00:03:00.000Z",
      outcome: "APPROVED_FOR_USE",
      approvedPurposes: ["STYLE_REFERENCE"],
    };
    const decision = evaluateSourcePolicy(
      candidate({
        sourceDocumentId: "synthetic-sample-source",
        sourceUrl: "https://samples.example.test/public-format/sample",
        sourceOwner: "Example Vendor",
        sourceKind: "OFFICIAL_SAMPLE",
        usagePurpose: "STYLE_REFERENCE",
      }),
      [styleRule],
      {
        sourcePolicyDecisionId: "synthetic-sample-policy",
        evaluatedAt: "2026-09-24T00:04:00.000Z",
        sourceReview,
      },
    );

    expect(decision.classification).toBe("TRUSTED");
    expect(canUseForKnowledgeExtraction(decision).allowed).toBe(false);
    expect(canUseForQuestionGeneration(decision).allowed).toBe(true);
    const snapshot = createSourceRevisionPolicySnapshot(decision, {
      sourceRevisionId: "synthetic-sample-revision",
      sourceUrlAtRetrieval: "https://samples.example.test/public-format/sample",
      retrievedAt: "2026-09-24T00:05:00.000Z",
      contentFingerprint: "sha256:synthetic-style-reference-fingerprint",
    });
    expect(snapshot.allowed).toBe(true);
    if (!snapshot.allowed) return;

    expect(
      createQuestionSourceAssociation(
        {
          questionRevisionId: "question-revision-01",
          knowledgePointId: "knowledge-point-01",
          relation: "SUPPORTS_EXPLANATION",
        },
        snapshot.snapshot,
      ),
    ).toMatchObject({
      allowed: false,
      reasonCodes: ["SOURCE_USAGE_NOT_ALLOWED"],
    });
  });

  it("Allowlist一致だけではTRUSTEDにせず、未確認のOriginをHuman Reviewへ送る", () => {
    const decision = evaluate(candidate({ originStatus: "UNKNOWN" }));

    expect(decision.classification).toBe("REVIEW_REQUIRED");
    expect(canUseForKnowledgeExtraction(decision).allowed).toBe(false);
  });

  it("Wildcard Allowlistを一致Ruleとして受理しない", () => {
    const wildcardRule: AllowedSource = {
      ...allowedSource,
      id: "wildcard-rule",
      hostname: "*.com",
    };
    const decision = evaluateSourcePolicy(candidate(), [wildcardRule], {
      sourcePolicyDecisionId: "policy-wildcard",
      evaluatedAt: "2026-09-24T00:01:00.000Z",
    });

    expect(decision.classification).toBe("REVIEW_REQUIRED");
    expect(decision.reasonCodes).toContain("SOURCE_NOT_ALLOWLISTED");
  });

  it("REVIEW_REQUIREDはSource Review完了前にPipeline利用を拒否する", () => {
    const decision = evaluate(
      candidate({
        accessClassification: "AUTHENTICATED",
        terms: {
          reviewStatus: "REQUIRES_REVIEW",
          termsUrl: "https://example.test/terms",
        },
      }),
    );

    expect(decision.classification).toBe("REVIEW_REQUIRED");
    expect(canUseForKnowledgeExtraction(decision)).toMatchObject({
      allowed: false,
    });
    expect(canUseForQuestionGeneration(decision)).toMatchObject({
      allowed: false,
    });
  });

  it("Source Reviewの承認と確認済みMetadataが揃えばREVIEW_REQUIREDから利用可能になる", () => {
    const sourceReview: SourceReviewRecord = {
      sourceReviewId: "source-review-01",
      sourceDocumentId: "source-kong-routes",
      reviewerId: "reviewer-01",
      reviewedAt: "2026-09-24T00:03:00.000Z",
      outcome: "APPROVED_FOR_USE",
      approvedPurposes: ["NORMATIVE_TECHNICAL"],
    };
    const decision = evaluate(
      candidate({ accessClassification: "AUTHENTICATED" }),
      sourceReview,
    );

    expect(decision.classification).toBe("TRUSTED");
    expect(decision.sourceReviewId).toBe("source-review-01");
    expect(canUseForKnowledgeExtraction(decision).allowed).toBe(true);
  });

  it("HumanによるSource却下をPROHIBITEDとして扱う", () => {
    const sourceReview: SourceReviewRecord = {
      sourceReviewId: "source-review-rejected",
      sourceDocumentId: "source-kong-routes",
      reviewerId: "reviewer-01",
      reviewedAt: "2026-09-24T00:03:00.000Z",
      outcome: "REJECTED",
    };
    const decision = evaluate(candidate(), sourceReview);

    expect(decision.classification).toBe("PROHIBITED");
    expect(canUseForKnowledgeExtraction(decision).allowed).toBe(false);
  });

  it("Needs More InformationのSource Review後も利用を停止する", () => {
    const sourceReview: SourceReviewRecord = {
      sourceReviewId: "source-review-needs-info",
      sourceDocumentId: "source-kong-routes",
      reviewerId: "reviewer-01",
      reviewedAt: "2026-09-24T00:03:00.000Z",
      outcome: "NEEDS_MORE_INFORMATION",
    };
    const decision = evaluate(candidate(), sourceReview);

    expect(decision.classification).toBe("REVIEW_REQUIRED");
    expect(canUseForKnowledgeExtraction(decision).allowed).toBe(false);
  });

  it.each([
    ["Exam Dump", "EXAM_DUMP"],
    ["流出Source", "LEAKED_EXAM_CONTENT"],
    ["再構成された実試験Item", "RECALLED_OR_RECONSTRUCTED_EXAM_ITEM"],
    [
      "禁止試験Content由来の非公式Answer Key",
      "UNOFFICIAL_ANSWER_KEY_FROM_PROHIBITED_CONTENT",
    ],
    ["実試験Itemの再現", "REAL_EXAM_REPRODUCTION"],
    ["アクセス制御回避", "ACCESS_CONTROL_BYPASS"],
    ["利用禁止Terms", "PROHIBITED_BY_TERMS"],
  ] as const)(
    "%sをPROHIBITEDとしてPipeline境界で拒否する",
    (_label, category) => {
      const decision = evaluate(candidate({ prohibitedCategory: category }));

      expect(decision.classification).toBe("PROHIBITED");
      expect(canUseForKnowledgeExtraction(decision).allowed).toBe(false);
      const sourceRevision = createSourceRevisionPolicySnapshot(decision, {
        sourceRevisionId: "synthetic-rejected-revision",
        sourceUrlAtRetrieval: "https://example.test/source",
        retrievedAt: "2026-09-24T00:02:00.000Z",
        contentFingerprint: "sha256:synthetic-fingerprint",
      });
      expect(sourceRevision.allowed).toBe(false);
      expect(
        createQuestionSourceAssociation(
          {
            questionRevisionId: "question-revision-01",
            knowledgePointId: "knowledge-point-01",
            relation: "SUPPORTS_CORRECT_ANSWER",
          },
          sourceRevision,
        ),
      ).toMatchObject({ allowed: false });
    },
  );

  it("UNKNOWN SourceをREVIEW_REQUIREDにし、利用を拒否する", () => {
    const decision = evaluate(
      candidate({
        sourceKind: "UNKNOWN",
        sourceOwner: "",
        sourceUrl: "",
        originStatus: "UNKNOWN",
        accessClassification: "UNKNOWN",
        automatedAccess: "UNKNOWN",
        purposeAlignment: "UNKNOWN",
        terms: { reviewStatus: "UNKNOWN" },
      }),
    );

    expect(decision.classification).toBe("REVIEW_REQUIRED");
    expect(canUseForKnowledgeExtraction(decision).allowed).toBe(false);
  });

  it("ExamFeedbackやCommunity SourceをNormative Technical Sourceにできない", () => {
    const feedback = evaluate(candidate({ sourceKind: "EXAM_FEEDBACK" }));
    const community = evaluate(candidate({ sourceKind: "COMMUNITY_ARTICLE" }));

    expect(feedback.classification).toBe("PROHIBITED");
    expect(community.classification).toBe("PROHIBITED");
  });

  it("SourceRevisionのPolicy Snapshotを固定し、後日のPolicy変更で書き換えない", () => {
    const result = makeRevisionSnapshot();
    expect(result.allowed).toBe(true);
    if (!result.allowed) return;

    const laterDecision = evaluate(
      candidate({
        terms: { reviewStatus: "PROHIBITED" },
      }),
    );

    expect(laterDecision.classification).toBe("PROHIBITED");
    expect(result.snapshot.classificationAtUse).toBe("TRUSTED");
    expect(result.snapshot.termsMetadataSnapshot.reviewStatus).toBe(
      "CLEARED_FOR_PRODUCT_USE",
    );
    expect(result.snapshot.matchedAllowRuleSnapshot).toBeDefined();
    expect(Object.isFrozen(result.snapshot)).toBe(true);
    expect(Object.isFrozen(result.snapshot.sourceMetadataSnapshot)).toBe(true);
    expect(Object.isFrozen(result.snapshot.matchedAllowRuleSnapshot)).toBe(
      true,
    );
    expect(Object.isFrozen(result.snapshot.termsMetadataSnapshot)).toBe(true);
  });

  it("SourceRevision必須MetadataがなければSnapshotを作らない", () => {
    const decision = evaluate();
    const result = createSourceRevisionPolicySnapshot(decision, {
      sourceRevisionId: "",
      sourceUrlAtRetrieval: "file:///tmp/untrusted",
      retrievedAt: "not-a-timestamp",
      contentFingerprint: "",
    });

    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain("MISSING_PROVENANCE");
  });

  it("Allowlist外へRedirectされた取得URLからSourceRevisionを作らない", () => {
    const result = createSourceRevisionPolicySnapshot(evaluate(), {
      sourceRevisionId: "source-revision-redirected",
      sourceUrlAtRetrieval: "https://unlisted.example.test/content",
      retrievedAt: "2026-09-24T00:02:00.000Z",
      contentFingerprint: "sha256:synthetic-content-fingerprint",
    });

    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain("SOURCE_NOT_ALLOWLISTED");
  });
});

describe("Question provenance and Publish gate", () => {
  it("QuestionSourceへQuestionRevision・KnowledgePoint・SourceRevisionの根拠を結ぶ", () => {
    const snapshot = makeRevisionSnapshot();
    expect(snapshot.allowed).toBe(true);
    if (!snapshot.allowed) return;

    const result = createQuestionSourceAssociation(
      {
        questionRevisionId: "question-revision-01",
        knowledgePointId: "knowledge-point-01",
        relation: "SUPPORTS_CORRECT_ANSWER",
      },
      snapshot.snapshot,
    );

    expect(result.allowed).toBe(true);
    if (result.allowed) {
      expect(result.questionSource).toMatchObject({
        questionRevisionId: "question-revision-01",
        knowledgePointId: "knowledge-point-01",
        sourceRevisionId: "source-revision-01",
        usagePurpose: "NORMATIVE_TECHNICAL",
      });
    }
  });

  it("KnowledgePoint・SourceRevision provenanceのないQuestionはPublishできない", () => {
    const result = canPublishQuestionRevision({
      questionRevisionId: "question-revision-01",
      knowledgePointIds: [],
      questionSources: [],
      sourceRevisionSnapshots: [],
      currentPolicyDecisions: [],
      questionReview: {
        questionReviewId: "question-review-01",
        questionRevisionId: "question-revision-01",
        reviewerId: "reviewer-01",
        decision: "APPROVE",
        reviewedAt: "2026-09-24T00:04:00.000Z",
      },
    });

    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain("QUESTION_PROVENANCE_MISSING");
  });

  it("Human QuestionReviewなしではProvenanceが揃っていてもPublishできない", () => {
    const snapshot = makeRevisionSnapshot();
    expect(snapshot.allowed).toBe(true);
    if (!snapshot.allowed) return;
    const questionSource = createQuestionSourceAssociation(
      {
        questionRevisionId: "question-revision-01",
        knowledgePointId: "knowledge-point-01",
        relation: "SUPPORTS_EXPLANATION",
      },
      snapshot.snapshot,
    );
    expect(questionSource.allowed).toBe(true);
    if (!questionSource.allowed) return;
    const decision = evaluate();

    const result = canPublishQuestionRevision({
      questionRevisionId: "question-revision-01",
      knowledgePointIds: ["knowledge-point-01"],
      questionSources: [questionSource.questionSource],
      sourceRevisionSnapshots: [snapshot.snapshot],
      currentPolicyDecisions: [decision],
    });

    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain("QUESTION_REVIEW_REQUIRED");
  });

  it("Human QuestionReviewとProvenance、現在TRUSTEDのSourceが揃ったQuestionはPublishできる", () => {
    const snapshot = makeRevisionSnapshot();
    expect(snapshot.allowed).toBe(true);
    if (!snapshot.allowed) return;
    const questionSource = createQuestionSourceAssociation(
      {
        questionRevisionId: "question-revision-01",
        knowledgePointId: "knowledge-point-01",
        relation: "SUPPORTS_KNOWLEDGE_POINT",
      },
      snapshot.snapshot,
    );
    expect(questionSource.allowed).toBe(true);
    if (!questionSource.allowed) return;

    const result = canPublishQuestionRevision({
      questionRevisionId: "question-revision-01",
      knowledgePointIds: ["knowledge-point-01"],
      questionSources: [questionSource.questionSource],
      sourceRevisionSnapshots: [snapshot.snapshot],
      currentPolicyDecisions: [evaluate()],
      questionReview: {
        questionReviewId: "question-review-02",
        questionRevisionId: "question-revision-01",
        reviewerId: "reviewer-01",
        decision: "APPROVE",
        reviewedAt: "2026-09-24T00:04:00.000Z",
      },
    });

    expect(result).toEqual({ allowed: true, reasonCodes: [] });
  });

  it("取得時はTRUSTEDでもPublish前に現在PolicyがPROHIBITEDなら拒否する", () => {
    const snapshot = makeRevisionSnapshot();
    expect(snapshot.allowed).toBe(true);
    if (!snapshot.allowed) return;
    const questionSource = createQuestionSourceAssociation(
      {
        questionRevisionId: "question-revision-01",
        knowledgePointId: "knowledge-point-01",
        relation: "SUPPORTS_CORRECT_ANSWER",
      },
      snapshot.snapshot,
    );
    expect(questionSource.allowed).toBe(true);
    if (!questionSource.allowed) return;

    const currentDecision = evaluate(
      candidate({
        prohibitedCategory: "PROHIBITED_BY_TERMS",
        terms: { reviewStatus: "PROHIBITED" },
      }),
    );
    const result = canPublishQuestionRevision({
      questionRevisionId: "question-revision-01",
      knowledgePointIds: ["knowledge-point-01"],
      questionSources: [questionSource.questionSource],
      sourceRevisionSnapshots: [snapshot.snapshot],
      currentPolicyDecisions: [currentDecision],
      questionReview: {
        questionReviewId: "question-review-03",
        questionRevisionId: "question-revision-01",
        reviewerId: "reviewer-01",
        decision: "APPROVE",
        reviewedAt: "2026-09-24T00:04:00.000Z",
      },
    });

    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain("SOURCE_POLICY_NOT_TRUSTED");
  });
});
