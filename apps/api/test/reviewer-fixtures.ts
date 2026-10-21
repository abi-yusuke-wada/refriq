import type {
  Catalog,
  EditCommand,
  EditDraft,
  ExactQuestionRevision,
  HumanDecisionCommand,
  KnowledgeContext,
  ReviewRecord,
  QuestionRevisionCandidate,
} from "@refriq/application";
import type {
  HumanQuestionReview,
  SourcePolicyDecision,
  SourceRevisionPolicySnapshot,
} from "@refriq/domain";
import "../../../docs/ux/mockups/reviewer/fixtures.js";
interface DesignRecord {
  key: string;
  questionId: string;
  revision: { questionRevisionId: string; state: ReviewRecord["state"] } | null;
  candidate: QuestionRevisionCandidate;
  knowledgePoints: readonly KnowledgeContext[];
  reviewTargetRevision: ExactQuestionRevision | null;
  previousRevision: { frozenContent: ExactQuestionRevision } | null;
  humanReview: HumanQuestionReview | null;
  currentPublishedRevisionId: string | null;
  sourceRevisionSnapshots: readonly SourceRevisionPolicySnapshot[];
  currentPolicyDecisions: readonly SourcePolicyDecision[];
  editSourceReferences?: ReviewRecord["editSourceReferences"];
  reviewEvaluation: ReviewRecord["evaluation"];
  sourcePolicyRefresh?: {
    currentPolicyDecisions: readonly SourcePolicyDecision[];
  };
}
const design = (
  globalThis as unknown as { reviewerFixtures: readonly DesignRecord[] }
).reviewerFixtures;
export const catalog: Catalog = {
  certificationId: "synthetic-cloud-associate",
  name: "架空のCloud Associate（検証用）",
  topics: [
    { examTopicId: "topic-routing", name: "リクエストルーティング" },
    { examTopicId: "topic-security", name: "セキュリティ" },
    { examTopicId: "topic-operations", name: "運用" },
  ],
};
export function seed(key = "ready"): ReviewRecord {
  const fixture = design.find((r) => r.key === key);
  if (!fixture?.revision || !fixture.reviewTargetRevision)
    throw new Error("resolved design fixture required");
  const r = structuredClone(fixture);
  const context = {
    certificationId: r.candidate.certification.certificationId,
    examTopicIds: r.candidate.examTopics.map((t) => t.examTopicId),
    knowledgePoints: r.knowledgePoints.map((p) => ({
      knowledgePointId: p.knowledgePointId,
      title: p.title,
      summary: p.summary,
      examTopicId: p.examTopicId,
      sourceReferences: p.sourceReferences,
    })),
    groundingSegments: r.candidate.groundingSegments,
  };
  return {
    questionId: r.questionId,
    questionRevisionId: r.revision?.questionRevisionId ?? "",
    certificationId: context.certificationId,
    queuedAt: "2026-10-03T00:00:00.000Z",
    revision: r.reviewTargetRevision,
    state: r.revision?.state ?? "DRAFT",
    questionVersion: 1,
    revisionVersion: 1,
    review: r.humanReview,
    currentPublishedRevisionId: r.currentPublishedRevisionId,
    previousRevision: r.previousRevision?.frozenContent ?? null,
    candidate: {
      pipelineRunId: r.candidate.pipelineRunId,
      candidateId: r.candidate.candidateId,
    },
    context,
    evaluation: r.reviewEvaluation
      ? {
          ...r.reviewEvaluation,
          evaluationId: `evaluation-${key}`,
          pipelineRunId: r.candidate.pipelineRunId,
          evaluatedContent:
            r.reviewEvaluation.targetKind === "QuestionRevision"
              ? r.reviewEvaluation.evaluatedContent
              : null,
          evaluatedContext: structuredClone(context),
          current: true,
        }
      : null,
    sourceRevisionSnapshots: r.sourceRevisionSnapshots,
    currentPolicyDecisions: r.currentPolicyDecisions,
    editSourceReferences:
      r.editSourceReferences ?? r.candidate.question.sourceReferences,
  };
}
export const keys = [
  "ready",
  "revise",
  "reject",
  "source-review",
  "source-prohibited",
  "completed",
  "multiple",
  "content-mismatch",
  "sources-trusted",
  "sources-review",
  "sources-prohibited",
  "sources-ambiguous",
  "sources-missing",
  "evaluation-missing",
  "same-locator",
  "diff-reordered",
];
export function decision(
  record: ReviewRecord,
  action: HumanDecisionCommand["decision"] = "APPROVE",
  operationId = "operation-1",
): HumanDecisionCommand {
  return {
    operationId,
    questionId: record.questionId,
    questionRevisionId: record.questionRevisionId,
    expectedQuestionVersion: record.questionVersion,
    expectedRevisionVersion: record.revisionVersion,
    decision: action,
    expectedEvaluationId: record.evaluation?.evaluationId ?? null,
    expectedPolicyDecisionIds:
      record.revision?.questionSources
        .flatMap((source) => {
          const snapshot = record.sourceRevisionSnapshots.find(
            (s) => s.sourceRevisionId === source.sourceRevisionId,
          );
          return record.currentPolicyDecisions
            .filter(
              (p) =>
                p.sourceDocumentId === snapshot?.sourceDocumentId &&
                p.usagePurpose === source.usagePurpose,
            )
            .map((p) => p.sourcePolicyDecisionId);
        })
        .sort() ?? [],
  };
}
export function draft(record: ReviewRecord): EditDraft {
  if (!record.revision) throw new Error("revision required");
  const r = record.revision;
  return {
    type: r.type,
    stem: r.stem,
    options: r.options,
    correctOptionIds: r.correctOptionIds,
    explanation: r.explanation,
    optionExplanations: r.optionExplanations,
    sourceReferences: record.editSourceReferences,
    language: r.language,
    difficulty: r.difficulty,
    knowledgePointIds: r.knowledgePointIds,
  };
}
export function edit(record: ReviewRecord): EditCommand {
  return {
    operationId: "edit-operation",
    questionRevisionId: record.questionRevisionId,
    expectedRevisionVersion: record.revisionVersion,
    expectedPolicyDecisionIds: decision(record).expectedPolicyDecisionIds ?? [],
    draft: draft(record),
  };
}
export function resolvedPolicies() {
  const value = design.find(
    (r) => r.key === "sources-review",
  )?.sourcePolicyRefresh;
  if (!value) throw new Error("refresh fixture missing");
  return structuredClone(value.currentPolicyDecisions);
}
export const feedbackSelection = {
  certificationId: catalog.certificationId,
  examTopicIds: ["topic-routing"],
  questionStyles: ["scenario"],
  difficulty: 4,
  scenarioRatio: "many",
  practicalImportance: 4,
  similarityConcept: 4,
  similarityJudgment: 3,
  similarityDifficulty: "harder",
  missingTopicIds: ["none"],
} as const;

export function unresolvedCandidate() {
  const fixture = design.find((record) => !record.revision);
  if (!fixture) throw new Error("unresolved Candidate fixture required");
  return structuredClone(fixture.candidate);
}
