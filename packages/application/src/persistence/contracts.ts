import type {
  HumanQuestionReview,
  QuestionSource,
  SourcePolicyDecision,
  SourceRevisionPolicySnapshot,
} from "@refriq/domain";
import type {
  QuestionContent,
  QuestionIntent,
  QuestionRevisionCandidate,
} from "../pipeline/contracts.js";

/** Storage非依存のApplication DTO。Domain Aggregateの新設ではない。 */
export interface ArtifactReference {
  readonly artifactId: string;
  readonly checksum: { readonly algorithm: "SHA-256"; readonly value: string };
  readonly contentType: string;
  readonly byteSize: number;
  readonly createdAt: string;
  readonly schemaVersion: number;
}

export interface SourceRevisionDocument {
  readonly snapshot: SourceRevisionPolicySnapshot;
  readonly originalArtifact: ArtifactReference;
  readonly normalizedArtifact: ArtifactReference;
  readonly normalizationVersion: string;
}

export interface PolicyExpectation {
  readonly sourceDocumentId: string;
  readonly usagePurpose: SourcePolicyDecision["usagePurpose"];
  readonly sourcePolicyDecisionId: string;
  readonly version: number;
}

export interface QuestionRevisionDocument {
  readonly questionId: string;
  readonly questionRevisionId: string;
  readonly certificationId: string;
  readonly revisionOrdinal: number;
  readonly createdAt: string;
  readonly knowledgePointIds: readonly string[];
  readonly questionIntent: Omit<QuestionIntent, "knowledgePointCandidateIds">;
  readonly question: QuestionContent;
  readonly questionSources: readonly QuestionSource[];
}

/** Evaluation本文はArtifactStoreから取得し、Human Reviewと区別する。 */
export interface QuestionRevisionEvaluationReference {
  readonly questionRevisionId: string;
  readonly evaluationId: string;
  readonly pipelineRunId: string;
  readonly contentChecksum: ArtifactReference["checksum"];
  readonly artifact: ArtifactReference;
}

/** 不変Contentと可変Stateを組み合わせたReviewer向け読取Projection。 */
export interface QuestionRevisionReviewDetail {
  readonly revision: QuestionRevisionDocument;
  readonly status:
    | "DRAFT"
    | "REVIEW_REQUIRED"
    | "PUBLISHED"
    | "CHANGES_REQUESTED"
    | "REJECTED";
  readonly questionVersion: number;
  readonly revisionVersion: number;
  readonly review: HumanQuestionReview | null;
  readonly evaluations: readonly QuestionRevisionEvaluationReference[];
}

export type ReviewTarget =
  | {
      readonly kind: "CANDIDATE";
      readonly pipelineRunId: string;
      readonly candidateId: string;
      readonly candidate: QuestionRevisionCandidate;
    }
  | {
      readonly kind: "QUESTION_REVISION";
      readonly detail: QuestionRevisionReviewDetail;
    };

/** Human判断APIはCandidate Targetを受け取らない。 */
export interface ConfirmedRevisionTarget {
  readonly kind: "QUESTION_REVISION";
  readonly questionId: string;
  readonly questionRevisionId: string;
  readonly expectedQuestionVersion: number;
  readonly expectedRevisionVersion: number;
}

export interface CandidateMaterialization {
  readonly pipelineRunId: string;
  readonly candidateId: string;
  readonly questionId: string;
  readonly questionRevisionId: string;
}

export interface OperationIdentity {
  readonly actorId: string;
  readonly operationId: string;
  readonly requestDigest: string;
}

export type RepositoryResult<T> =
  | { readonly status: "OK" | "ALREADY_COMMITTED"; readonly value: T }
  | {
      readonly status:
        | "NOT_FOUND"
        | "CONFLICT"
        | "VALIDATION_REJECTED"
        | "UNAVAILABLE";
      readonly reason: string;
    };

export interface PageRequest {
  readonly limit: number;
  readonly cursor?: string;
}

export interface Page<T> {
  readonly items: readonly T[];
  readonly nextCursor?: string;
}

export type LearningMode = "practice" | "mock";

export interface SessionQuestionSnapshot {
  readonly ordinal: number;
  readonly questionId: string;
  readonly questionRevisionId: string;
  readonly examTopicIds: readonly string[];
}

export interface LearningSessionDocument {
  readonly sessionId: string;
  readonly userId: string;
  readonly certificationId: string;
  readonly mode: LearningMode;
  readonly version: number;
  readonly startedAt: string;
  readonly endedAt?: string;
  readonly submittedAt?: string;
  readonly questions: readonly SessionQuestionSnapshot[];
}

export interface AnswerSelection {
  readonly ordinal: number;
  readonly selectedOptionIds: readonly string[];
}

/** 保存成功した全Mock Draft集合。未保存のClient編集を含めない。 */
export interface SavedMockDrafts {
  readonly selections: readonly AnswerSelection[];
  readonly savedVersion: number;
  readonly draftDigest: string;
}

/**
 * 同じ論理読取Snapshotに属するSession・確定回答・保存済みDraftを返す。
 * PracticeのDraft、および一度も保存していないMockのDraftはnull。
 * 未提出Mockのanswersは空で、採点結果を含めない。
 */
export interface LearningSessionResume {
  readonly session: LearningSessionDocument;
  readonly answers: readonly ConfirmedUserAnswer[];
  readonly savedMockDrafts: SavedMockDrafts | null;
}

/** 未回答のRecordを作らない。Revision identityはSession Snapshotから復元する。 */
export interface ConfirmedUserAnswer extends AnswerSelection {
  readonly userAnswerId: string;
  readonly sessionId: string;
  readonly userId: string;
  readonly questionId: string;
  readonly questionRevisionId: string;
  readonly correctness: boolean;
  readonly submittedAt: string;
}

export interface SessionResult {
  readonly session: LearningSessionDocument;
  readonly answers: readonly ConfirmedUserAnswer[];
  readonly correctCount: number;
  readonly denominator: number;
}

export interface ProgressScope {
  readonly userId: string;
  readonly certificationId: string;
  readonly mode: LearningMode;
}

export interface ProgressProjection {
  readonly scope: ProgressScope;
  readonly overall: {
    readonly correctCount: number;
    readonly denominator: number;
  };
  readonly topics: readonly {
    readonly examTopicId: string;
    readonly correctCount: number;
    readonly denominator: number;
  }[];
}
