import type {
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

export type ReviewTarget =
  | {
      readonly kind: "CANDIDATE";
      readonly pipelineRunId: string;
      readonly candidateId: string;
      readonly candidate: QuestionRevisionCandidate;
    }
  | {
      readonly kind: "QUESTION_REVISION";
      readonly revision: QuestionRevisionDocument;
      readonly version: number;
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
