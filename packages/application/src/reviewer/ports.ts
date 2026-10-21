import type { HumanQuestionReview } from "@refriq/domain";
import type {
  Catalog,
  EditedCandidate,
  Operation,
  Page,
  QueueRequest,
  Reconciliation,
  Result,
  ReviewRecord,
  ReviewQueueRecord,
  SaveResult,
} from "./contracts.js";
import type { ExamFeedback } from "./feedback.js";

export interface HumanDecisionEffect {
  readonly review: HumanQuestionReview;
  readonly state: "PUBLISHED" | "CHANGES_REQUESTED" | "REJECTED";
}
export type CommandValue = HumanQuestionReview | EditedCandidate | ExamFeedback;
/**
 * #11 AP-REVIEW-004/005/006/008・AP-FEEDBACK-001のStorage非依存境界。
 * Adapterは既成功操作を先に照合する。checkは現在のexact原本に対して実行し、
 * 読取後のRevision / Question / Evaluation / 全Source Policy変更を条件commitで検知する。
 * Human Record最大1、State、APPROVEの公開pointer、操作結果を一貫して確定する。
 * check失敗では部分保存なし。timeoutを未保存確定に変換しない。
 */
export interface ReviewerStore {
  readReview(questionRevisionId: string): Promise<Result<ReviewRecord>>;
  reviews(request: QueueRequest): Promise<Result<Page<ReviewQueueRecord>>>;
  catalog(): Promise<Result<Catalog>>;
  humanDecision(
    operation: Operation,
    check: (current: ReviewRecord) => Result<HumanDecisionEffect>,
  ): Promise<SaveResult<HumanQuestionReview>>;
  edit(
    operation: Operation,
    check: (current: ReviewRecord) => Result<EditedCandidate>,
  ): Promise<SaveResult<EditedCandidate>>;
  submitFeedback(
    operation: Operation,
    record: ExamFeedback,
  ): Promise<SaveResult<ExamFeedback>>;
  feedbacks(request: QueueRequest): Promise<Result<Page<ExamFeedback>>>;
  feedback(examFeedbackId: string): Promise<Result<ExamFeedback>>;
  /** 同じ操作の結果だけを照合する。照合中に新しいDecision / operationIdを開始しない。 */
  reconcile(
    operation: Operation,
  ): Promise<Result<Reconciliation<CommandValue>>>;
}
