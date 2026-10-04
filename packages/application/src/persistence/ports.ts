import type {
  HumanQuestionReview,
  SourcePolicyDecision,
  SourceReviewRecord,
} from "@refriq/domain";
import type {
  CertificationReference,
  ExamTopicReference,
  PipelineStage,
  PipelineStageRun,
  QuestionPipelineRun,
} from "../pipeline/contracts.js";
import type {
  AnswerSelection,
  ArtifactReference,
  CandidateMaterialization,
  ConfirmedRevisionTarget,
  ConfirmedUserAnswer,
  LearningSessionDocument,
  LearningSessionResume,
  OperationIdentity,
  Page,
  PageRequest,
  PolicyExpectation,
  ProgressProjection,
  ProgressScope,
  QuestionRevisionDocument,
  QuestionRevisionReviewDetail,
  RepositoryResult,
  ReviewTarget,
  SessionResult,
  SourceRevisionDocument,
} from "./contracts.js";

export interface CertificationCatalog {
  get(
    certificationId: string,
  ): Promise<RepositoryResult<CertificationReference>>;
  topics(
    certificationId: string,
  ): Promise<RepositoryResult<readonly ExamTopicReference[]>>;
}

export interface SourceRepository {
  /** 履歴追記と用途別current pointerを原子的に更新する。nullは未作成条件。 */
  appendPolicyDecision(input: {
    readonly operation: OperationIdentity;
    readonly expectedPolicyVersion: number | null;
    readonly decision: SourcePolicyDecision;
  }): Promise<
    RepositoryResult<{
      readonly decision: SourcePolicyDecision;
      readonly version: number;
    }>
  >;
  appendSourceReview(input: {
    readonly operation: OperationIdentity;
    readonly review: SourceReviewRecord;
  }): Promise<RepositoryResult<SourceReviewRecord>>;
  getRevision(
    sourceRevisionId: string,
  ): Promise<RepositoryResult<SourceRevisionDocument>>;
  currentPolicy(
    sourceDocumentId: string,
    purpose: SourcePolicyDecision["usagePurpose"],
  ): Promise<
    RepositoryResult<{
      readonly decision: SourcePolicyDecision;
      readonly version: number;
    }>
  >;
  revisions(
    sourceDocumentId: string,
    page: PageRequest,
  ): Promise<RepositoryResult<Page<SourceRevisionDocument>>>;
  reviews(
    sourceDocumentId: string,
    page: PageRequest,
  ): Promise<RepositoryResult<Page<SourceReviewRecord>>>;
  /** Revision非存在・親versionを検査し、履歴とpointerを同時保存する。 */
  appendRevision(input: {
    readonly operation: OperationIdentity;
    readonly expectedSourceVersion: number;
    readonly revisionOrdinal: number;
    readonly revision: SourceRevisionDocument;
  }): Promise<RepositoryResult<SourceRevisionDocument>>;
}

export interface QuestionRepository {
  getRevision(
    questionRevisionId: string,
  ): Promise<RepositoryResult<QuestionRevisionDocument>>;
  /**
   * exact Content・State・最大1 Review・Evaluation参照と親 / Stateの両versionを返す。
   * 同じ論理読取Snapshotから復元し、commitでは両versionを再検査する。
   * GSI投影のversionやCandidate IDからHuman判断対象を推測しない。
   */
  getReviewDetail(
    questionRevisionId: string,
  ): Promise<RepositoryResult<QuestionRevisionReviewDetail>>;
  revisions(
    questionId: string,
    page: PageRequest,
  ): Promise<RepositoryResult<Page<QuestionRevisionDocument>>>;
  reviewQueue(
    certificationId: string,
    page: PageRequest,
  ): Promise<RepositoryResult<Page<ReviewTarget>>>;
  published(
    certificationId: string,
    page: PageRequest,
  ): Promise<RepositoryResult<Page<QuestionRevisionDocument>>>;
  /** GSI候補取得後に現在公開参照を再検査する。全公開集合の鮮度保証はU02。 */
  currentPublished(
    questionId: string,
  ): Promise<RepositoryResult<QuestionRevisionDocument>>;
  appendRevision(input: {
    readonly operation: OperationIdentity;
    readonly expectedQuestionVersion: number;
    readonly revision: QuestionRevisionDocument;
  }): Promise<RepositoryResult<QuestionRevisionDocument>>;
  /**
   * targetとreviewのexact Revision一致を検査。最大1 Review。
   * APPROVEはPolicy条件確認・Review・State・公開pointerを同時commitする。
   * REQUEST_CHANGES / REJECTもReviewとStateを同時commitする。
   */
  commitHumanDecision(input: {
    readonly operation: OperationIdentity;
    readonly target: ConfirmedRevisionTarget;
    readonly review: HumanQuestionReview;
    readonly currentPolicies: readonly PolicyExpectation[];
  }): Promise<RepositoryResult<HumanQuestionReview>>;
}

export interface PipelineRunRepository {
  get(pipelineRunId: string): Promise<
    RepositoryResult<{
      readonly run: QuestionPipelineRun;
      readonly version: number;
    }>
  >;
  waiting(
    certificationId: string,
    stage: PipelineStage,
    page: PageRequest,
  ): Promise<
    RepositoryResult<
      Page<{ readonly stage: PipelineStageRun; readonly version: number }>
    >
  >;
  /** 現行RuntimeへHookを追加する実装は別途。Candidateを公開しない。 */
  checkpoint(input: {
    readonly operation: OperationIdentity;
    readonly expectedVersion: number;
    readonly run: QuestionPipelineRun;
    readonly artifacts: readonly ArtifactReference[];
  }): Promise<RepositoryResult<QuestionPipelineRun>>;
  /** Domain ID解決後の対応を保存するだけで、割当algorithmはU05。 */
  recordMaterialization(input: {
    readonly operation: OperationIdentity;
    readonly materialization: CandidateMaterialization;
  }): Promise<RepositoryResult<CandidateMaterialization>>;
}

export interface LearningSessionRepository {
  /** Session・全固定出題・分類・receiptを同じTransactionで保存。 */
  start(input: {
    readonly operation: OperationIdentity;
    readonly session: LearningSessionDocument;
  }): Promise<RepositoryResult<LearningSessionDocument>>;
  active(
    scope: ProgressScope,
  ): Promise<RepositoryResult<LearningSessionDocument>>;
  /**
   * 所有者を照合し、固定Snapshot・確定回答・保存済みDraftを一貫して復元する。
   * Draft集合のsavedVersion / digestは同じ保存結果の組。Submitはこの組を検査する。
   * 現在公開Revisionへの再解決・再抽選をしない。
   */
  resume(
    userId: string,
    sessionId: string,
  ): Promise<RepositoryResult<LearningSessionResume>>;
  /** Mockのみ、未提出のみ。全Draft集合・Session version・receiptの一括commit。 */
  saveMockDrafts(input: {
    readonly operation: OperationIdentity;
    readonly sessionId: string;
    readonly expectedVersion: number;
    readonly selections: readonly AnswerSelection[];
  }): Promise<
    RepositoryResult<{
      readonly savedVersion: number;
      readonly draftDigest: string;
    }>
  >;
  /** exact Snapshot照合後、確定Answer・進行状態・receiptを同時保存。 */
  confirmPracticeAnswer(input: {
    readonly operation: OperationIdentity;
    readonly expectedVersion: number;
    readonly answer: ConfirmedUserAnswer;
  }): Promise<RepositoryResult<ConfirmedUserAnswer>>;
  /** 未回答を除く実回答のみ。全SnapshotからResult分母を再構築する。 */
  submitMock(input: {
    readonly operation: OperationIdentity;
    readonly sessionId: string;
    readonly expectedVersion: number;
    readonly savedDraftDigest: string;
    readonly submittedAt: string;
    readonly answers: readonly ConfirmedUserAnswer[];
  }): Promise<RepositoryResult<SessionResult>>;
  endPractice(input: {
    readonly operation: OperationIdentity;
    readonly sessionId: string;
    readonly expectedVersion: number;
    readonly endedAt: string;
  }): Promise<RepositoryResult<LearningSessionDocument>>;
}

/** 書込はSessionの原子的commandだけに限定する。 */
export interface UserAnswerRepository {
  get(
    userId: string,
    userAnswerId: string,
  ): Promise<RepositoryResult<ConfirmedUserAnswer>>;
  forSession(
    userId: string,
    sessionId: string,
  ): Promise<RepositoryResult<readonly ConfirmedUserAnswer[]>>;
}

export interface LearningResultReader {
  get(
    userId: string,
    sessionId: string,
  ): Promise<RepositoryResult<SessionResult>>;
  history(
    scope: ProgressScope,
    page: PageRequest,
  ): Promise<RepositoryResult<Page<SessionResult>>>;
}

export interface LearningProgressReader {
  /** 確定回答＋提出済みSession＋全固定Snapshot等が再構築元。 */
  get(scope: ProgressScope): Promise<RepositoryResult<ProgressProjection>>;
}

export interface ArtifactStore {
  /** Policy Gateで許可した内容のみ。不変保存、同IDの異内容は拒否する。 */
  putImmutable(
    reference: ArtifactReference,
    body: Uint8Array,
  ): Promise<RepositoryResult<ArtifactReference>>;
  get(reference: ArtifactReference): Promise<RepositoryResult<Uint8Array>>;
}

// KnowledgePoint更新契約・ExamFeedback入力 / summary語彙はU05/U10の判断後に定義する。
// 未確定Contractを汎用CRUD / 自由JSONで補完しない。
