import {
  failure,
  stableJson,
  success,
  type Catalog,
  type CommandValue,
  type EditedCandidate,
  type ExamFeedback,
  type HumanDecisionEffect,
  type Operation,
  type Page,
  type QueueRequest,
  type QueuedCandidate,
  type ReviewQueueRecord,
  type Reconciliation,
  type Result,
  type ReviewRecord,
  type ReviewerStore,
  type SaveResult,
} from "@refriq/application";
import type { HumanQuestionReview, SourcePolicyDecision } from "@refriq/domain";

export type SaveFault =
  | "confirmed-failure"
  | "unknown-committed"
  | "unknown-uncommitted";
interface Receipt {
  readonly operation: Operation;
  value: CommandValue | null;
  aborted: boolean;
}
const clone = <T>(value: T): T => structuredClone(value);
const key = (op: Operation) =>
  stableJson([op.actorId, op.kind, op.operationId]);

/** 開発・Test用Adapter。実DBの永続化・分散Transactionの保証とは区別する。 */
export class InMemoryReviewerStore implements ReviewerStore {
  private readonly records = new Map<string, ReviewRecord>();
  private readonly receipts = new Map<string, Receipt>();
  private readonly feedbackRecords: ExamFeedback[] = [];
  private readonly policyHistory = new Map<string, string>();
  private readonly heads = new Map<
    string,
    { version: number; current: string | null }
  >();
  readonly candidates: EditedCandidate[] = [];
  nextFault: SaveFault | null = null;
  /** Testで読取後・確定直前の変更を再生する。Domain / ApplicationはこのHookに依存しない。 */
  beforeCommit: (() => void) | null = null;
  constructor(
    records: readonly ReviewRecord[],
    private readonly catalogRecord: Catalog,
    private readonly pendingCandidates: readonly QueuedCandidate[] = [],
  ) {
    for (const record of records) {
      this.rememberPolicies(record.currentPolicyDecisions);
      this.records.set(record.questionRevisionId, clone(record));
      if (!this.heads.has(record.questionId))
        this.heads.set(record.questionId, {
          version: record.questionVersion,
          current: record.currentPublishedRevisionId,
        });
    }
  }
  private rememberPolicies(policies: readonly SourcePolicyDecision[]) {
    for (const policy of policies) {
      const semantic = stableJson(policy);
      const previous = this.policyHistory.get(policy.sourcePolicyDecisionId);
      if (previous !== undefined && previous !== semantic)
        throw new Error(
          "same SourcePolicyDecision ID must preserve decision semantics",
        );
      this.policyHistory.set(policy.sourcePolicyDecisionId, semantic);
    }
  }
  refreshPolicies(id: string, decisions: readonly SourcePolicyDecision[]) {
    const record = this.records.get(id);
    if (!record) throw new Error("unknown revision");
    this.rememberPolicies(decisions);
    const affected = new Set([
      ...record.currentPolicyDecisions.map((p) =>
        stableJson([p.sourceDocumentId, p.usagePurpose]),
      ),
      ...(record.revision?.questionSources.flatMap((q) =>
        record.sourceRevisionSnapshots
          .filter((s) => s.sourceRevisionId === q.sourceRevisionId)
          .map((s) => stableJson([s.sourceDocumentId, q.usagePurpose])),
      ) ?? []),
      ...decisions.map((p) => stableJson([p.sourceDocumentId, p.usagePurpose])),
    ]);
    // 同じSource / Purposeを参照する別Revisionも、同じ現在Policyを再取得する。
    for (const [revisionId, current] of this.records) {
      const relevant = new Set(
        current.revision?.questionSources.flatMap((q) =>
          current.sourceRevisionSnapshots
            .filter((s) => s.sourceRevisionId === q.sourceRevisionId)
            .map((s) => stableJson([s.sourceDocumentId, q.usagePurpose])),
        ) ?? [],
      );
      if (![...relevant].some((pair) => affected.has(pair))) continue;
      this.records.set(revisionId, {
        ...current,
        currentPolicyDecisions: clone([
          ...current.currentPolicyDecisions.filter(
            (p) =>
              !affected.has(stableJson([p.sourceDocumentId, p.usagePurpose])),
          ),
          ...decisions.filter((p) =>
            relevant.has(stableJson([p.sourceDocumentId, p.usagePurpose])),
          ),
        ]),
      });
    }
  }
  replaceEvaluation(id: string, evaluation: ReviewRecord["evaluation"]) {
    const record = this.records.get(id);
    if (!record) throw new Error("unknown revision");
    this.records.set(id, { ...record, evaluation: clone(evaluation) });
  }
  changeState(id: string, state: ReviewRecord["state"]) {
    const record = this.records.get(id);
    if (!record) throw new Error("unknown revision");
    this.records.set(id, {
      ...record,
      state,
      revisionVersion: record.revisionVersion + 1,
    });
  }
  confirmAborted(operationId: string) {
    for (const receipt of this.receipts.values())
      if (receipt.operation.operationId === operationId && !receipt.value)
        receipt.aborted = true;
  }
  async catalog(): Promise<Result<Catalog>> {
    return success(clone(this.catalogRecord));
  }
  async readReview(id: string): Promise<Result<ReviewRecord>> {
    const record = this.records.get(id);
    return record
      ? success(this.withHead(record))
      : failure("NOT_FOUND", "指定のexact QuestionRevisionがありません。");
  }
  private withHead(record: ReviewRecord): ReviewRecord {
    const head = this.heads.get(record.questionId);
    return clone({
      ...record,
      questionVersion: head?.version ?? record.questionVersion,
      currentPublishedRevisionId: head
        ? head.current
        : record.currentPublishedRevisionId,
    });
  }
  private page<T>(
    items: readonly T[],
    request: QueueRequest,
    kind: string,
    itemKey: (item: T) => string,
  ): Result<Page<T>> {
    if (
      request.certificationId !== this.catalogRecord.certificationId ||
      !Number.isSafeInteger(request.limit) ||
      request.limit <= 0
    )
      return failure("VALIDATION", "資格とページ条件を確認してください。");
    let last = "";
    let upper: string | null = null;
    if (request.cursor) {
      try {
        const decoded = JSON.parse(
          decodeURIComponent(request.cursor),
        ) as unknown;
        if (
          !decoded ||
          typeof decoded !== "object" ||
          !("kind" in decoded) ||
          decoded.kind !== kind ||
          !("certificationId" in decoded) ||
          decoded.certificationId !== request.certificationId ||
          !("last" in decoded) ||
          typeof decoded.last !== "string" ||
          !("upper" in decoded) ||
          !(decoded.upper === null || typeof decoded.upper === "string")
        )
          return failure("VALIDATION", "この一覧のcursorではありません。");
        last = decoded.last;
        upper = decoded.upper;
      } catch {
        return failure("VALIDATION", "cursorを確認してください。");
      }
    }
    const sorted = [...items].sort((a, b) =>
      itemKey(a) < itemKey(b) ? -1 : itemKey(a) > itemKey(b) ? 1 : 0,
    );
    if (!request.cursor && kind === "feedback")
      upper = sorted.at(-1) ? itemKey(sorted.at(-1) as T) : "";
    const remaining = sorted.filter(
      (item) =>
        itemKey(item) > last && (upper === null || itemKey(item) <= upper),
    );
    const selected = remaining.slice(0, request.limit);
    const tail = selected.at(-1);
    return success({
      items: clone(selected),
      nextCursor:
        remaining.length > selected.length && tail
          ? encodeURIComponent(
              stableJson({
                kind,
                certificationId: request.certificationId,
                last: itemKey(tail),
                upper,
              }),
            )
          : null,
    });
  }
  async reviews(request: QueueRequest) {
    return this.page(
      (
        [...this.records.values()].map((record) =>
          this.withHead(record),
        ) as ReviewQueueRecord[]
      )
        .concat(clone(this.pendingCandidates))
        .filter(
          (r) =>
            ("candidateProjection" in r
              ? r.candidateProjection.certification.certificationId
              : r.certificationId) === request.certificationId,
        ),
      request,
      "review",
      (r) =>
        `${new Date(r.queuedAt).toISOString()}\u0000${"candidateProjection" in r ? stableJson([r.candidateProjection.pipelineRunId, r.candidateProjection.candidateId]) : r.questionRevisionId}`,
    );
  }
  async feedbacks(request: QueueRequest) {
    // submittedAt desc + ID desc。逆順keyの比較を使わず、固定順のcursor位置を保持する。
    if (
      request.certificationId !== this.catalogRecord.certificationId ||
      !Number.isSafeInteger(request.limit) ||
      request.limit <= 0
    )
      return failure("VALIDATION", "一覧条件を確認してください。");
    const records = this.feedbackRecords
      .filter((f) => f.selection.certificationId === request.certificationId)
      .sort(
        (a, b) =>
          b.submittedAt.localeCompare(a.submittedAt) ||
          b.examFeedbackId.localeCompare(a.examFeedbackId),
      );
    let ids = records.map((r) => r.examFeedbackId);
    let start = 0;
    if (request.cursor) {
      try {
        const c = JSON.parse(decodeURIComponent(request.cursor)) as {
          certificationId: string;
          kind: string;
          ids: string[];
          offset: number;
        };
        if (
          c.kind !== "feedback" ||
          c.certificationId !== request.certificationId ||
          !Array.isArray(c.ids) ||
          c.ids.some((id) => typeof id !== "string") ||
          !Number.isSafeInteger(c.offset) ||
          c.offset < 0
        )
          return failure(
            "VALIDATION",
            "このFeedback一覧のcursorではありません。",
          );
        ids = c.ids;
        start = c.offset;
      } catch {
        return failure("VALIDATION", "cursorを確認してください。");
      }
    }
    const selected = ids
      .slice(start, start + request.limit)
      .map((id) => records.find((r) => r.examFeedbackId === id));
    if (selected.some((r) => !r))
      return failure("SYSTEM_ERROR", "Feedbackの確定原本を取得できません。");
    return success({
      items: clone(selected as ExamFeedback[]),
      nextCursor:
        start + selected.length < ids.length
          ? encodeURIComponent(
              stableJson({
                kind: "feedback",
                certificationId: request.certificationId,
                ids,
                offset: start + selected.length,
              }),
            )
          : null,
    });
  }
  async feedback(id: string) {
    const record = this.feedbackRecords.find((r) => r.examFeedbackId === id);
    return record
      ? success(clone(record))
      : failure("NOT_FOUND", "Feedbackが見つかりません。");
  }
  private execute<T extends CommandValue>(
    operation: Operation,
    apply: () => Result<T>,
  ): SaveResult<T> {
    const prior = this.receipts.get(key(operation));
    if (
      prior &&
      (prior.operation.inputIdentity !== operation.inputIdentity ||
        prior.operation.targetId !== operation.targetId)
    )
      return failure("CONFLICT", "同じoperationIdを別入力へ再利用できません。");
    if (prior?.value) return success(clone(prior.value) as T);
    if (prior && !prior.aborted)
      return {
        ok: false,
        unknown: true,
        message: "保存結果を確認できません。同じ操作を照合してください。",
      };
    if (
      [...this.receipts.values()].some(
        (r) =>
          r.operation.actorId === operation.actorId &&
          r.operation.kind === operation.kind &&
          r.operation.targetId === operation.targetId &&
          !r.value &&
          !r.aborted,
      )
    )
      return failure(
        "CONFLICT",
        "同じ対象の結果不明操作を先に照合してください。",
      );
    const fault = this.nextFault;
    this.nextFault = null;
    if (fault === "confirmed-failure") {
      this.receipts.set(key(operation), {
        operation: clone(operation),
        value: null,
        aborted: true,
      });
      return failure(
        "CONFIRMED_FAILURE",
        "保存できませんでした。この操作は保存されていません。",
      );
    }
    if (fault === "unknown-uncommitted") {
      this.receipts.set(key(operation), {
        operation: clone(operation),
        value: null,
        aborted: false,
      });
      return {
        ok: false,
        unknown: true,
        message: "保存結果を確認できません。再送せず照合してください。",
      };
    }
    const hook = this.beforeCommit;
    this.beforeCommit = null;
    hook?.();
    // 同期check・変更・receipt更新の間にawaitを置かない。プロセス内で原子的に実行。
    const result = apply();
    if (!result.ok) {
      this.receipts.set(key(operation), {
        operation: clone(operation),
        value: null,
        aborted: true,
      });
      return result;
    }
    this.receipts.set(key(operation), {
      operation: clone(operation),
      value: clone(result.value),
      aborted: false,
    });
    return fault === "unknown-committed"
      ? {
          ok: false,
          unknown: true,
          message: "保存結果を確認できません。再送せず照合してください。",
        }
      : clone(result);
  }
  async humanDecision(
    operation: Operation,
    check: (current: ReviewRecord) => Result<HumanDecisionEffect>,
  ): Promise<SaveResult<HumanQuestionReview>> {
    return this.execute(operation, () => {
      const record = this.records.get(operation.targetId);
      if (!record) return failure("NOT_FOUND", "exact Revisionがありません。");
      if (record.review)
        return failure("CONFLICT", "このRevisionには決定記録が存在します。");
      const effect = check(this.withHead(record));
      if (!effect.ok) return effect;
      const { review, state } = effect.value;
      if (review.questionRevisionId !== record.questionRevisionId)
        return failure("TARGET_MISMATCH", "決定対象が一致しません。");
      if (state === "PUBLISHED") {
        const head = this.heads.get(record.questionId);
        this.heads.set(record.questionId, {
          version: (head?.version ?? record.questionVersion) + 1,
          current: record.questionRevisionId,
        });
      }
      this.records.set(record.questionRevisionId, {
        ...record,
        review: clone(review),
        state,
        revisionVersion: record.revisionVersion + 1,
        questionVersion:
          record.questionVersion + (state === "PUBLISHED" ? 1 : 0),
        currentPublishedRevisionId:
          state === "PUBLISHED"
            ? record.questionRevisionId
            : record.currentPublishedRevisionId,
      });
      return success(review);
    });
  }
  async edit(
    operation: Operation,
    check: (current: ReviewRecord) => Result<EditedCandidate>,
  ): Promise<SaveResult<EditedCandidate>> {
    return this.execute(operation, () => {
      const record = this.records.get(operation.targetId);
      if (!record) return failure("NOT_FOUND", "base Revisionがありません。");
      const candidate = check(clone(record));
      if (candidate.ok) this.candidates.push(clone(candidate.value));
      return candidate;
    });
  }
  async submitFeedback(
    operation: Operation,
    record: ExamFeedback,
  ): Promise<SaveResult<ExamFeedback>> {
    return this.execute(operation, () => {
      this.feedbackRecords.push(clone(record));
      return success(clone(record));
    });
  }
  async reconcile(
    operation: Operation,
  ): Promise<Result<Reconciliation<CommandValue>>> {
    const receipt = this.receipts.get(key(operation));
    if (!receipt) return success({ state: "still-unknown" });
    if (
      receipt.operation.inputIdentity !== operation.inputIdentity ||
      receipt.operation.targetId !== operation.targetId
    )
      return failure("CONFLICT", "照合対象が同じ操作ではありません。");
    return success(
      receipt.value
        ? { state: "committed", value: clone(receipt.value) }
        : receipt.aborted
          ? { state: "definitely-not-committed" }
          : { state: "still-unknown" },
    );
  }
}
