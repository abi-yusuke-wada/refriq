import type { HumanQuestionReview } from "@refriq/domain";
import { ContractValidationError } from "../pipeline/validation.js";
import type {
  ConfirmedRevisionTarget,
  ConfirmedUserAnswer,
  LearningSessionDocument,
} from "./contracts.js";

/** Storageへ書く前の対象照合。Domain Publish Gate・現在Policy条件確認は別途必須。 */
export function assertHumanReviewTarget(
  target: ConfirmedRevisionTarget,
  review: HumanQuestionReview,
): void {
  if (
    target.kind !== "QUESTION_REVISION" ||
    target.questionRevisionId !== review.questionRevisionId ||
    !target.questionId.trim() ||
    !target.questionRevisionId.trim()
  ) {
    throw new ContractValidationError(
      "Human Review requires the confirmed exact Domain Revision",
    );
  }
}

/** 出題数・Question重複・順序は固定契約。Topicの解決時点はU04。 */
export function assertSessionSnapshot(session: LearningSessionDocument): void {
  const expectedCount =
    session.mode === "practice" ? 10 : session.mode === "mock" ? 20 : 0;
  if (
    expectedCount === 0 ||
    session.questions.length !== expectedCount ||
    new Set(session.questions.map((question) => question.questionId)).size !==
      expectedCount ||
    session.questions.some(
      (question, index) =>
        question.ordinal !== index + 1 ||
        !question.questionId.trim() ||
        !question.questionRevisionId.trim() ||
        question.examTopicIds.length === 0 ||
        question.examTopicIds.some((id) => !id.trim()) ||
        new Set(question.examTopicIds).size !== question.examTopicIds.length,
    )
  ) {
    throw new ContractValidationError(
      "Session requires fixed unique Questions, exact Revisions, order and Topic Snapshot",
    );
  }
}

/** 物理Answer行から復元したidentityが固定出題と一致することを確認する。 */
export function assertAnswerSnapshot(
  session: LearningSessionDocument,
  answer: ConfirmedUserAnswer,
): void {
  const snapshot = session.questions.find(
    (question) => question.ordinal === answer.ordinal,
  );
  if (
    session.sessionId !== answer.sessionId ||
    session.userId !== answer.userId ||
    !snapshot ||
    snapshot.questionId !== answer.questionId ||
    snapshot.questionRevisionId !== answer.questionRevisionId ||
    answer.selectedOptionIds.length === 0 ||
    answer.selectedOptionIds.some((id) => !id.trim()) ||
    new Set(answer.selectedOptionIds).size !== answer.selectedOptionIds.length
  ) {
    throw new ContractValidationError(
      "UserAnswer must be an actual answer to the fixed Session Snapshot",
    );
  }
}
