import type {
  HumanQuestionReview,
  HumanQuestionReviewDecision,
  QuestionSource,
  SourcePolicyDecision,
  SourceRevisionPolicySnapshot,
} from "@refriq/domain";
import type {
  GroundingSegment,
  QuestionContent,
  QuestionRevisionCandidate,
  QuestionEvaluationOutput,
  QuestionIntent,
  ReviewEligibility,
  SourceReference,
} from "../pipeline/contracts.js";

/** #6の凍結Contentを表す読取Contract。CandidateのContentとは別対象。 */
export interface ExactQuestionRevision
  extends Omit<QuestionContent, "sourceReferences"> {
  readonly questionId: string;
  readonly questionRevisionId: string;
  readonly language: string;
  readonly difficulty: QuestionIntent["difficulty"];
  readonly knowledgePointIds: readonly string[];
  readonly questionSources: readonly QuestionSource[];
  readonly questionIntent: Omit<
    QuestionIntent,
    "knowledgePointCandidateIds"
  > & {
    readonly knowledgePointIds: readonly string[];
  };
}

/** DiffとEvaluation bindingの項目正本。UIはこの定義から表示する。 */
export const REVISION_CONTENT_FIELDS = [
  ["type", "形式"],
  ["stem", "問題文"],
  ["options", "選択肢"],
  ["correctOptionIds", "正答"],
  ["explanation", "解説"],
  ["optionExplanations", "選択肢ごとの説明"],
  ["language", "言語"],
  ["difficulty", "難易度"],
  ["knowledgePointIds", "KnowledgePoint関係"],
  ["questionSources", "QuestionSource関係・取得時Provenance"],
  ["questionIntent", "凍結時の学習意図"],
] as const satisfies readonly (readonly [
  keyof ExactQuestionRevision,
  string,
])[];

export interface KnowledgeContext {
  readonly knowledgePointId: string;
  readonly title: string;
  readonly summary: string;
  readonly examTopicId: string;
  readonly sourceReferences: readonly SourceReference[];
}
export interface EvaluationContext {
  readonly certificationId: string;
  readonly examTopicIds: readonly string[];
  readonly knowledgePoints: readonly KnowledgeContext[];
  readonly groundingSegments: readonly GroundingSegment[];
}
export interface RevisionEvaluation {
  readonly pipelineRunId: string;
  readonly evaluationId: string;
  readonly targetKind: "Candidate" | "QuestionRevision";
  readonly candidateId: string;
  readonly questionRevisionId: string | null;
  readonly evaluatedContent: ExactQuestionRevision | null;
  readonly evaluatedContext: EvaluationContext | null;
  readonly result: QuestionEvaluationOutput;
  readonly reviewEligibility: ReviewEligibility;
  /** currentな評価参照として読取Portが確認する。過去Resultを自動適用しない。 */
  readonly current: boolean;
}
export interface CandidateMetadata {
  readonly pipelineRunId: string;
  readonly candidateId: string;
}
export interface ReviewRecord {
  readonly questionId: string;
  readonly questionRevisionId: string;
  readonly certificationId: string;
  readonly queuedAt: string;
  readonly revision: ExactQuestionRevision | null;
  readonly state:
    | "DRAFT"
    | "REVIEW_REQUIRED"
    | "PUBLISHED"
    | "CHANGES_REQUESTED"
    | "REJECTED";
  readonly questionVersion: number;
  readonly revisionVersion: number;
  readonly review: HumanQuestionReview | null;
  readonly currentPublishedRevisionId: string | null;
  readonly previousRevision: ExactQuestionRevision | null;
  readonly candidate: CandidateMetadata | null;
  readonly context: EvaluationContext;
  readonly evaluation: RevisionEvaluation | null;
  readonly sourceRevisionSnapshots: readonly SourceRevisionPolicySnapshot[];
  readonly currentPolicyDecisions: readonly SourcePolicyDecision[];
  readonly editSourceReferences: readonly SourceReference[];
}
export interface FieldError {
  readonly field: string;
  readonly message: string;
}
export type FailureCode =
  | "VALIDATION"
  | "NOT_FOUND"
  | "TARGET_MISMATCH"
  | "INVALID_STATE"
  | "STALE_VERSION"
  | "CONFLICT"
  | "SOURCE_BLOCKER"
  | "EVALUATION_MISSING"
  | "EVALUATION_MISMATCH"
  | "EVALUATION_STALE"
  | "EVALUATION_NOT_PASS"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "CONFIRMED_FAILURE"
  | "SYSTEM_ERROR";
export interface Failure {
  readonly code: FailureCode;
  readonly message: string;
  readonly fields: readonly FieldError[];
}
export type Result<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: Failure };
export type SaveResult<T> =
  | Result<T>
  | { readonly ok: false; readonly unknown: true; readonly message: string };
export type Reconciliation<T> =
  | { readonly state: "committed"; readonly value: T }
  | { readonly state: "definitely-not-committed" }
  | { readonly state: "still-unknown" };
export interface HumanContext {
  /** 外部で検証したContextのみを渡す。HTTP PayloadのActor値は受け付けない。 */
  readonly actorId: string;
}
export interface Operation {
  readonly actorId: string;
  readonly operationId: string;
  readonly kind: "human-decision" | "edit" | "feedback";
  readonly inputIdentity: string;
  readonly targetId: string;
}
export interface HumanDecisionCommand {
  readonly operationId: string;
  readonly questionId: string;
  readonly questionRevisionId: string;
  readonly expectedQuestionVersion: number;
  readonly expectedRevisionVersion: number;
  readonly decision: HumanQuestionReviewDecision;
  readonly expectedEvaluationId?: string | null;
  readonly expectedPolicyDecisionIds?: readonly string[];
}
export interface EditDraft extends QuestionContent {
  readonly language: string;
  readonly difficulty: QuestionIntent["difficulty"];
  readonly knowledgePointIds: readonly string[];
}
export interface EditCommand {
  readonly operationId: string;
  readonly questionRevisionId: string;
  readonly expectedRevisionVersion: number;
  readonly expectedPolicyDecisionIds: readonly string[];
  readonly draft: EditDraft;
}
export interface EditedCandidate {
  readonly pipelineRunId: string;
  readonly candidateId: string;
  readonly baseQuestionRevisionId: string;
  readonly questionId: string;
  readonly draft: EditDraft;
  readonly questionIntent: ExactQuestionRevision["questionIntent"];
  readonly createdAt: string;
  readonly evaluation: null;
  readonly requiresValidation: true;
  readonly requiresEvaluation: true;
}
export interface Catalog {
  readonly certificationId: string;
  readonly name: string;
  readonly topics: readonly {
    readonly examTopicId: string;
    readonly name: string;
  }[];
}
export interface QueueRequest {
  readonly certificationId: string;
  readonly cursor?: string;
  readonly limit: number;
}
export interface Page<T> {
  readonly items: readonly T[];
  readonly nextCursor: string | null;
}
export interface SourceStatus {
  readonly source: QuestionSource;
  readonly snapshot: SourceRevisionPolicySnapshot | null;
  readonly decisions: readonly SourcePolicyDecision[];
  readonly label: string;
  readonly remediation: string | null;
}
export interface ContentDifference {
  readonly field: (typeof REVISION_CONTENT_FIELDS)[number][0];
  readonly label: string;
  readonly previous: unknown;
  readonly current: unknown;
  readonly changed: boolean;
}
export interface ReviewDetail {
  readonly record: ReviewRecord;
  readonly evaluationState: Result<{ readonly matches: true }>;
  readonly approve: Result<true>;
  readonly edit: Result<true>;
  readonly sources: readonly SourceStatus[];
  readonly diff: readonly ContentDifference[] | null;
}
/** Domain ID未解決のPipeline出力。Human Review対象とは別のQueue投影。 */
export interface QueuedCandidate {
  readonly queuedAt: string;
  readonly candidateProjection: QuestionRevisionCandidate;
}
export type ReviewQueueRecord = ReviewRecord | QueuedCandidate;
export interface QueueItem {
  readonly questionRevisionId: string | null;
  readonly questionId: string | null;
  readonly pendingCandidate?: QuestionRevisionCandidate;
  readonly queuedAt: string;
  readonly candidate: CandidateMetadata | null;
  readonly stem: string;
  readonly state: ReviewRecord["state"] | "Application Candidate";
  readonly humanDecision: HumanQuestionReviewDecision | null;
  readonly evaluationDecision: QuestionEvaluationOutput["decision"] | null;
  readonly evaluationMatches: boolean;
  readonly sourceSummary: string;
}
