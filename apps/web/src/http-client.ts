import {
  FEEDBACK_CONTRACT_VERSION,
  validateFeedback,
  type Catalog,
  type FeedbackCommand,
  type Result,
  type ReviewerClient,
  type SaveResult,
} from "@refriq/contracts";

const object = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
const string = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;
const system = (): Result<never> => ({
  ok: false,
  error: {
    code: "SYSTEM_ERROR",
    message: "応答を確認できません。再取得してください。",
    fields: [],
  },
});
const unknown = (): SaveResult<never> => ({
  ok: false,
  unknown: true,
  message: "保存結果を確認できません。同じ操作を照合してください。",
});

/** UIはStorage形ではなくApplication DTOを受け取る。通信失敗と確定未保存を区別する。 */
export function createHttpReviewerClient(
  endpoint: string,
  fetcher: typeof fetch = fetch,
): ReviewerClient {
  let catalog: Catalog | null = null;
  async function call<T>(
    operation: string,
    input: unknown,
    writing: boolean,
    valid: (value: unknown) => boolean,
  ): Promise<SaveResult<T>> {
    try {
      const response = await fetcher(endpoint, {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ operation, input }),
        signal: AbortSignal.timeout(15000),
      });
      const body: unknown = await response.json();
      if (!object(body)) return writing ? unknown() : system();
      if (body.ok === true && valid(body.value))
        return { ok: true, value: body.value as T };
      if (body.ok === false && body.unknown === true)
        return writing ? unknown() : system();
      if (
        body.ok === false &&
        object(body.error) &&
        string(body.error.code) &&
        string(body.error.message) &&
        Array.isArray(body.error.fields) &&
        body.error.fields.every(
          (f) => object(f) && string(f.field) && string(f.message),
        )
      )
        return body as unknown as Result<T>;
      return writing ? unknown() : system();
    } catch {
      return writing ? unknown() : system();
    }
  }
  const read = async <T>(
    op: string,
    input: unknown,
    valid: (value: unknown) => boolean,
  ): Promise<Result<T>> => {
    const result = await call<T>(op, input, false, valid);
    return !result.ok && "unknown" in result ? system() : result;
  };
  const page = (value: unknown, valid: (item: unknown) => boolean) =>
    object(value) &&
    Array.isArray(value.items) &&
    value.items.every(valid) &&
    (value.nextCursor === null || typeof value.nextCursor === "string");
  const feedback = (value: unknown) =>
    object(value) &&
    string(value.examFeedbackId) &&
    string(value.submittedAt) &&
    value.feedbackContractVersion === FEEDBACK_CONTRACT_VERSION &&
    catalog !== null &&
    validateFeedback(value.selection, catalog).ok &&
    Object.keys(value).every((key) =>
      [
        "examFeedbackId",
        "submittedAt",
        "feedbackContractVersion",
        "selection",
      ].includes(key),
    );
  return {
    async catalog() {
      const result = await read<Catalog>(
        "catalog",
        null,
        (value) =>
          object(value) &&
          string(value.certificationId) &&
          string(value.name) &&
          Array.isArray(value.topics) &&
          value.topics.every(
            (t) => object(t) && string(t.examTopicId) && string(t.name),
          ),
      );
      if (result.ok) catalog = result.value;
      return result;
    },
    queue: (input) =>
      read("queue", input, (value) =>
        page(
          value,
          (item) =>
            object(item) &&
            ((string(item.questionRevisionId) && string(item.questionId)) ||
              (item.questionRevisionId === null &&
                item.questionId === null &&
                object(item.pendingCandidate) &&
                object(item.pendingCandidate.question) &&
                Array.isArray(item.pendingCandidate.question.options))) &&
            typeof item.stem === "string" &&
            typeof item.evaluationMatches === "boolean",
        ),
      ),
    detail: (id) =>
      read(
        "detail",
        id,
        (value) =>
          object(value) &&
          object(value.record) &&
          value.record.questionRevisionId === id &&
          object(value.record.revision) &&
          value.record.revision.questionRevisionId === id &&
          value.record.revision.questionId === value.record.questionId &&
          Array.isArray(value.record.revision.options) &&
          Array.isArray(value.sources) &&
          object(value.approve) &&
          object(value.edit) &&
          object(value.evaluationState),
      ),
    decide: (input) =>
      call(
        "decide",
        input,
        true,
        (value) =>
          object(value) &&
          value.questionRevisionId === input.questionRevisionId &&
          value.decision === input.decision &&
          string(value.questionReviewId),
      ),
    edit: (input) =>
      call(
        "edit",
        input,
        true,
        (value) =>
          object(value) &&
          value.baseQuestionRevisionId === input.questionRevisionId &&
          string(value.candidateId) &&
          value.evaluation === null &&
          value.requiresEvaluation === true,
      ),
    submitFeedback: (input: FeedbackCommand) =>
      call("submitFeedback", input, true, feedback),
    feedbacks: (input) =>
      read("feedbacks", input, (value) => page(value, feedback)),
    feedback: (id) =>
      read(
        "feedback",
        id,
        (value) =>
          feedback(value) && object(value) && value.examFeedbackId === id,
      ),
    reconcile: (input) =>
      read(
        "reconcile",
        input,
        (value) =>
          object(value) &&
          (["still-unknown", "definitely-not-committed"].includes(
            String(value.state),
          ) ||
            (value.state === "committed" &&
              object(value.value) &&
              (input.kind === "feedback"
                ? feedback(value.value)
                : input.kind === "edit"
                  ? value.value.baseQuestionRevisionId === input.targetId &&
                    string(value.value.candidateId)
                  : value.value.questionRevisionId === input.targetId &&
                    string(value.value.questionReviewId)))),
      ),
  };
}
