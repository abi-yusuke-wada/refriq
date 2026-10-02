import type {
  SourcePolicyDecision,
  SourceRevisionPolicySnapshot,
} from "@refriq/domain";

export const PIPELINE_STAGES = [
  "KNOWLEDGE_EXTRACTION",
  "QUESTION_PLANNING",
  "QUESTION_GENERATION",
  "QUESTION_EVALUATION",
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export const QUESTION_TYPES = ["single_choice", "multiple_select"] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const QUESTION_FORMATS = ["direct", "scenario"] as const;
export type QuestionFormat = (typeof QUESTION_FORMATS)[number];

export const QUESTION_DIFFICULTIES = [
  "beginner",
  "intermediate",
  "advanced",
] as const;
export type QuestionDifficulty = (typeof QUESTION_DIFFICULTIES)[number];

export const EVALUATION_DECISIONS = ["PASS", "REVISE", "REJECT"] as const;
export type EvaluationDecision = (typeof EVALUATION_DECISIONS)[number];

export const EVALUATION_CRITERIA = [
  "CERTIFICATION_SCOPE",
  "KNOWLEDGE_POINT_ALIGNMENT",
  "ANSWER_GROUNDED",
  "DISTRACTORS_INCORRECT",
  "ANSWER_CARDINALITY",
  "NO_UNSUPPORTED_CLAIMS",
  "NO_AMBIGUITY",
  "QUESTION_TYPE_APPROPRIATE",
  "STEM_SELF_CONTAINED",
] as const;
export type EvaluationCriterion = (typeof EVALUATION_CRITERIA)[number];

export const EVALUATION_CHECK_RESULTS = ["PASS", "CONCERN", "FAIL"] as const;
export type EvaluationCheckResult = (typeof EVALUATION_CHECK_RESULTS)[number];

export const EVALUATION_FINDING_SEVERITIES = [
  "info",
  "warning",
  "error",
] as const;
export type EvaluationFindingSeverity =
  (typeof EVALUATION_FINDING_SEVERITIES)[number];

export interface CertificationReference {
  readonly certificationId: string;
  readonly name: string;
}

export interface ExamTopicReference {
  readonly examTopicId: string;
  readonly certificationId: string;
  readonly name: string;
}

export interface SourceReference {
  readonly sourceRevisionId: string;
  readonly locator: string;
}

/**
 * A selected excerpt from an immutable SourceRevision. The full revision and
 * its Policy Snapshot stay outside LLM request context.
 */
export interface GroundingSegment extends SourceReference {
  readonly text: string;
}

export interface PipelineSourceRevision {
  readonly policyDecision: SourcePolicyDecision;
  readonly snapshot: SourceRevisionPolicySnapshot;
}

export interface QuestionPipelineInput {
  readonly certification: CertificationReference;
  readonly examTopics: readonly ExamTopicReference[];
  readonly sourceRevision: PipelineSourceRevision;
  /** Selected context windows, not the full SourceRevision content. */
  readonly groundingSegments: readonly GroundingSegment[];
}

export interface KnowledgeExtractionInput {
  readonly certification: CertificationReference;
  readonly examTopics: readonly ExamTopicReference[];
  readonly sourceRevisionId: string;
  readonly groundingSegments: readonly GroundingSegment[];
}

export interface KnowledgePointDraft {
  readonly title: string;
  readonly summary: string;
  readonly examTopicId: string;
  readonly sourceReferences: readonly SourceReference[];
}

/** The model output; candidate IDs are assigned by the application. */
export interface KnowledgeExtractionOutput {
  readonly knowledgePoints: readonly KnowledgePointDraft[];
}

export interface KnowledgePointCandidate extends KnowledgePointDraft {
  /** Run-scoped candidate identity, not a persisted Domain KnowledgePointId. */
  readonly candidateId: string;
}

export interface QuestionPlanningInput {
  readonly certification: CertificationReference;
  readonly examTopics: readonly ExamTopicReference[];
  readonly knowledgePoints: readonly KnowledgePointCandidate[];
}

export interface QuestionIntent {
  readonly knowledgePointCandidateIds: readonly string[];
  readonly questionType: QuestionType;
  readonly format: QuestionFormat;
  readonly learningObjective: string;
  readonly difficulty: QuestionDifficulty;
  readonly targetConcept: string;
  readonly constraints: readonly string[];
  readonly sourceReferences: readonly SourceReference[];
}

export interface QuestionPlanningOutput {
  readonly questionIntent: QuestionIntent;
}

export interface QuestionGenerationInput {
  readonly certification: CertificationReference;
  readonly examTopics: readonly ExamTopicReference[];
  readonly knowledgePoints: readonly KnowledgePointCandidate[];
  readonly questionIntent: QuestionIntent;
  readonly groundingSegments: readonly GroundingSegment[];
  readonly rules: readonly string[];
}

export interface QuestionOption {
  readonly id: string;
  readonly text: string;
}

export interface QuestionContent {
  readonly type: QuestionType;
  readonly stem: string;
  readonly options: readonly QuestionOption[];
  readonly correctOptionIds: readonly string[];
  readonly explanation: string;
  readonly optionExplanations: Readonly<Record<string, string>>;
  readonly sourceReferences: readonly SourceReference[];
}

export interface QuestionGenerationOutput {
  readonly question: QuestionContent;
}

export interface QuestionCandidate extends QuestionContent {
  /** Run-scoped identity; it is not a QuestionRevisionId. */
  readonly candidateId: string;
  readonly knowledgePointCandidateIds: readonly string[];
}

export interface QuestionEvaluationInput {
  readonly certification: CertificationReference;
  readonly examTopics: readonly ExamTopicReference[];
  readonly knowledgePoints: readonly KnowledgePointCandidate[];
  readonly questionIntent: QuestionIntent;
  readonly question: QuestionContent;
  readonly groundingSegments: readonly GroundingSegment[];
  readonly criteria: readonly EvaluationCriterion[];
}

export interface EvaluationFinding {
  readonly code: EvaluationCriterion;
  readonly severity: EvaluationFindingSeverity;
  readonly message: string;
  readonly sourceReferences: readonly SourceReference[];
}

export interface QuestionEvaluationOutput {
  readonly decision: EvaluationDecision;
  readonly checks: Readonly<Record<EvaluationCriterion, EvaluationCheckResult>>;
  readonly findings: readonly EvaluationFinding[];
  readonly ambiguityNotes: readonly string[];
  readonly assumptions: readonly string[];
}

export type ReviewEligibility =
  | "ELIGIBLE_FOR_HUMAN_REVIEW"
  | "REVISION_REQUIRED"
  | "REJECTED_BY_EVALUATION";

/**
 * Application handoff for a future Human Review flow. This is not a Domain
 * QuestionRevision and does not carry a Human QuestionReview or publish state.
 */
export interface QuestionRevisionCandidate {
  readonly candidateId: string;
  readonly certification: CertificationReference;
  readonly examTopics: readonly ExamTopicReference[];
  readonly knowledgePoints: readonly KnowledgePointCandidate[];
  readonly questionIntent: QuestionIntent;
  readonly question: QuestionCandidate;
  readonly sourceRevision: SourceRevisionPolicySnapshot;
  readonly groundingSegments: readonly GroundingSegment[];
  readonly evaluation: QuestionEvaluationOutput;
  readonly reviewEligibility: ReviewEligibility;
  readonly pipelineRunId: string;
  readonly stageRuns: readonly PipelineStageRun[];
}

export type PipelineStageRunStatus =
  | "PENDING"
  | "RUNNING"
  | "SUCCEEDED"
  | "FAILED";

export interface PipelineStageRun {
  readonly pipelineRunId: string;
  readonly stage: PipelineStage;
  readonly attempt: number;
  readonly status: PipelineStageRunStatus;
  readonly startedAt?: string;
  readonly completedAt?: string;
  readonly generationMetadata?: GenerationMetadata;
  readonly failure?: {
    readonly code:
      | "SOURCE_POLICY_BLOCKED"
      | "INPUT_VALIDATION_FAILED"
      | "PROVIDER_FAILED"
      | "OUTPUT_VALIDATION_FAILED";
    readonly retryable: boolean;
    readonly message: string;
  };
}

/** Provider-neutral identifiers useful for Human Review and troubleshooting. */
export interface GenerationMetadata {
  readonly providerId: string;
  readonly modelId?: string;
  readonly promptVersion?: string;
  readonly requestId?: string;
}

export interface PipelineArtifacts {
  readonly knowledgePoints?: readonly KnowledgePointCandidate[];
  readonly questionIntent?: QuestionIntent;
  readonly question?: QuestionCandidate;
  readonly evaluation?: QuestionEvaluationOutput;
  readonly questionRevisionCandidate?: QuestionRevisionCandidate;
}

export interface QuestionPipelineRun {
  readonly pipelineRunId: string;
  readonly status: "SUCCEEDED" | "FAILED";
  /** SHA-256 identity of immutable generation inputs, excluding current Policy Decision. */
  readonly immutableInputFingerprint?: string;
  readonly stages: Readonly<Record<PipelineStage, PipelineStageRun>>;
  readonly stageRunHistory: readonly PipelineStageRun[];
  readonly artifacts: PipelineArtifacts;
  readonly failedStage?: PipelineStage;
}

export interface StructuredOutputRequest {
  readonly stage: PipelineStage;
  readonly input:
    | KnowledgeExtractionInput
    | QuestionPlanningInput
    | QuestionGenerationInput
    | QuestionEvaluationInput;
  readonly responseSchema: StructuredOutputSchema;
}

export interface StructuredOutputResponse {
  readonly output: unknown;
  readonly generationMetadata: GenerationMetadata;
}

export type StructuredOutputSchema =
  | boolean
  | Readonly<Record<string, unknown>>;

/** Provider SDKs and provider-specific configuration stay behind this port. */
export interface StructuredOutputProvider {
  generateStructuredOutput(
    request: StructuredOutputRequest,
  ): Promise<StructuredOutputResponse>;
}

export interface PipelineExecutionOptions {
  readonly pipelineRunId: string;
}
