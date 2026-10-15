import type { HumanQuestionReview } from "@refriq/domain";
import type {
  Catalog,
  CommandValue,
  EditCommand,
  EditedCandidate,
  ExamFeedback,
  FeedbackSelection,
  HumanDecisionCommand,
  Operation,
  Page,
  QueueItem,
  QueueRequest,
  Reconciliation,
  Result,
  ReviewDetail,
  SaveResult,
} from "@refriq/application";
export type {
  Catalog,
  CommandValue,
  EditCommand,
  EditDraft,
  EditedCandidate,
  ExamFeedback,
  FeedbackField,
  FeedbackSelection,
  FieldError,
  HumanDecisionCommand,
  Operation,
  QueueItem,
  QueueRequest,
  Reconciliation,
  Result,
  ReviewDetail,
  SaveResult,
} from "@refriq/application";
export {
  canonicalEditCommand,
  humanDecisionIdentity,
  QUESTION_DIFFICULTIES,
  QUESTION_TYPES,
  FEEDBACK_CONTRACT_VERSION,
  FEEDBACK_LABELS,
  FEEDBACK_MULTIPLE_FIELDS,
  SIMILARITY_FIELDS,
  feedbackChoices,
  validateFeedback,
  REVISION_CONTENT_FIELDS,
  referenceValue,
  selectSourceReferences,
  stableJson,
} from "@refriq/application";
export interface FeedbackCommand {
  readonly operationId: string;
  readonly feedbackContractVersion: string;
  readonly selection: FeedbackSelection;
}
export interface ReviewerClient {
  catalog(): Promise<Result<Catalog>>;
  queue(request: QueueRequest): Promise<Result<Page<QueueItem>>>;
  detail(questionRevisionId: string): Promise<Result<ReviewDetail>>;
  decide(
    command: HumanDecisionCommand,
  ): Promise<SaveResult<HumanQuestionReview>>;
  edit(command: EditCommand): Promise<SaveResult<EditedCandidate>>;
  submitFeedback(command: FeedbackCommand): Promise<SaveResult<ExamFeedback>>;
  feedbacks(request: QueueRequest): Promise<Result<Page<ExamFeedback>>>;
  feedback(id: string): Promise<Result<ExamFeedback>>;
  reconcile(
    operation: Omit<Operation, "actorId">,
  ): Promise<Result<Reconciliation<CommandValue>>>;
}
