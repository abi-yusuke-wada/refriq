import { canPublishQuestionRevision } from "@refriq/domain";
import {
  canonicalEditCommand,
  humanDecisionIdentity,
  revisionDiff,
  stableJson,
} from "./content.js";
import type {
  EditCommand,
  EditedCandidate,
  HumanContext,
  HumanDecisionCommand,
  Operation,
  QueueItem,
  QueueRequest,
  Result,
  ReviewDetail,
  ReviewRecord,
} from "./contracts.js";
import { FEEDBACK_CONTRACT_VERSION, validateFeedback } from "./feedback.js";
import type { ReviewerStore } from "./ports.js";
import {
  evaluationBinding,
  failure,
  isObject,
  policyIdentity,
  sourceStatuses,
  success,
  text,
  validateApproveReadiness,
  validateEditDraft,
  validateExactTarget,
  validateHumanDecisionTarget,
  validateSourceEligibility,
} from "./validation.js";

export class ReviewerService {
  constructor(
    readonly store: ReviewerStore,
    private readonly now: () => string = () => new Date().toISOString(),
    private readonly id: () => string = () => crypto.randomUUID(),
  ) {}
  private human(context: HumanContext): Result<true> {
    return text(context.actorId)
      ? success(true)
      : failure("UNAUTHORIZED", "Human Contextを確認できません。");
  }
  async catalog() {
    return this.store.catalog();
  }
  async queue(request: QueueRequest): Promise<
    Result<{
      readonly items: readonly QueueItem[];
      readonly nextCursor: string | null;
    }>
  > {
    const page = await this.store.reviews(request);
    if (!page.ok) return page;
    return success({
      nextCursor: page.value.nextCursor,
      items: page.value.items.map((record): QueueItem => {
        if ("candidateProjection" in record) {
          const candidate = record.candidateProjection;
          return {
            questionRevisionId: null,
            questionId: null,
            queuedAt: record.queuedAt,
            candidate: {
              candidateId: candidate.candidateId,
              pipelineRunId: candidate.pipelineRunId,
            },
            pendingCandidate: {
              ...candidate,
              groundingSegments: candidate.groundingSegments.map((segment) => ({
                ...segment,
                text: "",
              })),
            },
            stem: candidate.question.stem,
            state: "Application Candidate",
            humanDecision: null,
            evaluationDecision: candidate.evaluation.decision,
            evaluationMatches: false,
            sourceSummary: "Domain Identity未解決 / 現在Policy未確認",
          };
        }
        return {
          questionRevisionId: record.questionRevisionId,
          questionId: record.questionId,
          queuedAt: record.queuedAt,
          candidate: record.candidate,
          stem: record.revision?.stem ?? "exact Revision未確認",
          state: record.state,
          humanDecision: record.review?.decision ?? null,
          evaluationDecision: record.evaluation?.result.decision ?? null,
          evaluationMatches: evaluationBinding(record).ok,
          sourceSummary:
            [...new Set(sourceStatuses(record).map((s) => s.label))].join(
              " / ",
            ) || "current Policy missing",
        };
      }),
    });
  }
  async detail(questionRevisionId: string): Promise<Result<ReviewDetail>> {
    const result = await this.store.readReview(questionRevisionId);
    if (!result.ok) return result;
    const record = result.value;
    const exact = validateExactTarget(record);
    if (!exact.ok) return exact;
    if (
      record.previousRevision &&
      (record.previousRevision.questionId !== record.questionId ||
        record.previousRevision.questionRevisionId ===
          record.questionRevisionId)
    )
      return failure(
        "TARGET_MISMATCH",
        "前Revisionのexact対象を確認できません。差分なし・初版として扱いません。",
      );
    const command: HumanDecisionCommand = {
      operationId: "readiness-only",
      questionRevisionId,
      questionId: record.questionId,
      decision: "APPROVE",
      expectedQuestionVersion: record.questionVersion,
      expectedRevisionVersion: record.revisionVersion,
      expectedEvaluationId: record.evaluation?.evaluationId ?? null,
      expectedPolicyDecisionIds: policyIdentity(record),
    };
    const common = validateHumanDecisionTarget(record, command);
    const approve = common.ok ? validateApproveReadiness(record) : common;
    const sources = sourceStatuses(record);
    const prohibited = new Set(
      sources
        .filter((s) =>
          s.decisions.some((p) => p.classification === "PROHIBITED"),
        )
        .map((s) => s.source.sourceRevisionId),
    );
    // 禁止Sourceの本文をHTTP応答へ含めない。Candidate由来Groundingの参照metadataは保持。
    const safe = structuredClone(record);
    const redactContext = (context: ReviewRecord["context"]) => ({
      ...context,
      groundingSegments: context.groundingSegments.map((segment) =>
        prohibited.has(segment.sourceRevisionId)
          ? { ...segment, text: "" }
          : segment,
      ),
    });
    const publicRecord = {
      ...safe,
      context: redactContext(safe.context),
      evaluation: safe.evaluation
        ? {
            ...safe.evaluation,
            evaluatedContext: safe.evaluation.evaluatedContext
              ? redactContext(safe.evaluation.evaluatedContext)
              : null,
          }
        : null,
    };
    return success({
      record: publicRecord,
      sources,
      evaluationState: evaluationBinding(record),
      approve,
      edit: validateSourceEligibility(record),
      diff:
        record.previousRevision && record.revision
          ? revisionDiff(record.previousRevision, record.revision)
          : null,
    });
  }
  async decide(input: unknown, context: HumanContext) {
    const human = this.human(context);
    if (!human.ok) return human;
    const keys = [
      "operationId",
      "questionId",
      "questionRevisionId",
      "expectedQuestionVersion",
      "expectedRevisionVersion",
      "decision",
      "expectedEvaluationId",
      "expectedPolicyDecisionIds",
    ];
    if (
      !isObject(input) ||
      !keys.slice(0, 6).every((key) => Object.hasOwn(input, key)) ||
      Object.keys(input).some((key) => !keys.includes(key)) ||
      !text(input.operationId) ||
      !text(input.questionId) ||
      !text(input.questionRevisionId) ||
      !["APPROVE", "REQUEST_CHANGES", "REJECT"].includes(
        String(input.decision),
      ) ||
      !Number.isSafeInteger(input.expectedQuestionVersion) ||
      !Number.isSafeInteger(input.expectedRevisionVersion) ||
      !(
        input.expectedEvaluationId === undefined ||
        input.expectedEvaluationId === null ||
        text(input.expectedEvaluationId)
      ) ||
      !(
        input.expectedPolicyDecisionIds === undefined ||
        (Array.isArray(input.expectedPolicyDecisionIds) &&
          input.expectedPolicyDecisionIds.every(text))
      ) ||
      (input.decision === "APPROVE" &&
        (!Object.hasOwn(input, "expectedEvaluationId") ||
          !Array.isArray(input.expectedPolicyDecisionIds)))
    )
      return failure("VALIDATION", "Human decisionの入力を確認してください。");
    const command = input as unknown as HumanDecisionCommand;
    const operation = this.operation(
      "human-decision",
      command.operationId,
      command.questionRevisionId,
      humanDecisionIdentity(command),
      context,
    );
    return this.store.humanDecision(operation, (record) => {
      const common = validateHumanDecisionTarget(record, command);
      if (!common.ok) return common;
      if (command.decision === "APPROVE") {
        const readiness = validateApproveReadiness(record);
        if (!readiness.ok) return readiness;
        if (
          record.evaluation?.evaluationId !== command.expectedEvaluationId ||
          stableJson(policyIdentity(record)) !==
            stableJson([...(command.expectedPolicyDecisionIds ?? [])].sort())
        )
          return failure(
            "STALE_VERSION",
            "確認後にEvaluation / Source Policyが変わりました。再取得してください。",
          );
      }
      const review = {
        questionReviewId: this.id(),
        questionRevisionId: command.questionRevisionId,
        reviewerId: context.actorId,
        decision: command.decision,
        reviewedAt: this.now(),
      };
      if (command.decision === "APPROVE" && record.revision) {
        const gate = canPublishQuestionRevision({
          questionRevisionId: command.questionRevisionId,
          knowledgePointIds: record.revision.knowledgePointIds,
          questionSources: record.revision.questionSources,
          sourceRevisionSnapshots: record.sourceRevisionSnapshots,
          currentPolicyDecisions: record.currentPolicyDecisions,
          questionReview: review,
        });
        if (!gate.allowed)
          return failure(
            "SOURCE_BLOCKER",
            "Publish Gateを満たしません。公開していません。",
          );
      }
      const state =
        command.decision === "APPROVE"
          ? "PUBLISHED"
          : command.decision === "REQUEST_CHANGES"
            ? "CHANGES_REQUESTED"
            : "REJECTED";
      return success({ review, state });
    });
  }
  async edit(input: unknown, context: HumanContext) {
    const human = this.human(context);
    if (!human.ok) return human;
    const keys = [
      "operationId",
      "questionRevisionId",
      "expectedRevisionVersion",
      "expectedPolicyDecisionIds",
      "draft",
    ];
    if (
      !isObject(input) ||
      Object.keys(input).length !== keys.length ||
      Object.keys(input).some((key) => !keys.includes(key)) ||
      !text(input.operationId) ||
      !text(input.questionRevisionId) ||
      !Number.isSafeInteger(input.expectedRevisionVersion) ||
      !Array.isArray(input.expectedPolicyDecisionIds) ||
      input.expectedPolicyDecisionIds.some((id) => !text(id))
    )
      return failure("VALIDATION", "編集操作の入力を確認してください。");
    if (
      !isObject(input.draft) ||
      !Array.isArray(input.draft.correctOptionIds) ||
      !input.draft.correctOptionIds.every(text) ||
      !Array.isArray(input.draft.knowledgePointIds) ||
      !input.draft.knowledgePointIds.every(text) ||
      !Array.isArray(input.draft.sourceReferences) ||
      !input.draft.sourceReferences.every(
        (ref) =>
          isObject(ref) && text(ref.sourceRevisionId) && text(ref.locator),
      )
    )
      return failure("VALIDATION", "編集候補の参照形式を確認してください。");
    const command = canonicalEditCommand(input as unknown as EditCommand);
    const operation = this.operation(
      "edit",
      command.operationId,
      command.questionRevisionId,
      command,
      context,
    );
    // 保存済み操作の再取得は、新しいEditの許可判定と分ける。過去Candidateを再生成しない。
    const prior = await this.store.reconcile(operation);
    if (!prior.ok) return prior;
    if (prior.value.state === "committed") {
      if ("candidateId" in prior.value.value) return success(prior.value.value);
      return failure("SYSTEM_ERROR", "編集操作の保存結果を確認できません。");
    }
    const initial = await this.store.readReview(command.questionRevisionId);
    if (!initial.ok) return initial;
    const validated = validateEditDraft(command.draft, initial.value);
    if (!validated.ok) return validated;
    return this.store.edit(operation, (record) => {
      const base = validateSourceEligibility(record);
      if (!base.ok) return base;
      if (
        command.expectedRevisionVersion !== record.revisionVersion ||
        stableJson(policyIdentity(record)) !==
          stableJson([...command.expectedPolicyDecisionIds].sort())
      )
        return failure(
          "STALE_VERSION",
          "編集開始後にbase Revision / Policyが変わりました。再取得してください。",
        );
      const draft = validateEditDraft(command.draft, record);
      if (!draft.ok) return draft;
      if (!record.revision)
        return failure("TARGET_MISMATCH", "exact base Revisionが未確認です。");
      const pipelineRunId = this.id();
      const candidate: EditedCandidate = {
        pipelineRunId,
        candidateId: `${pipelineRunId}:edited-candidate:1`,
        baseQuestionRevisionId: record.questionRevisionId,
        questionId: record.questionId,
        draft: draft.value,
        questionIntent: {
          ...record.revision.questionIntent,
          questionType: draft.value.type,
          difficulty: draft.value.difficulty,
          knowledgePointIds: draft.value.knowledgePointIds,
          sourceReferences: draft.value.sourceReferences,
        },
        createdAt: this.now(),
        evaluation: null,
        requiresValidation: true,
        requiresEvaluation: true,
      };
      return success(candidate);
    });
  }
  async submitFeedback(input: unknown, context: HumanContext) {
    const human = this.human(context);
    if (!human.ok) return human;
    if (
      !isObject(input) ||
      Object.keys(input).length !== 3 ||
      Object.keys(input).some(
        (key) =>
          !["operationId", "feedbackContractVersion", "selection"].includes(
            key,
          ),
      ) ||
      !text(input.operationId) ||
      input.feedbackContractVersion !== FEEDBACK_CONTRACT_VERSION
    )
      return failure(
        "VALIDATION",
        "Feedbackの承認済みContract版と操作を確認してください。",
      );
    const catalog = await this.store.catalog();
    if (!catalog.ok) return catalog;
    const selection = validateFeedback(input.selection, catalog.value);
    if (!selection.ok) return selection;
    const operation = this.operation(
      "feedback",
      input.operationId,
      catalog.value.certificationId,
      {
        feedbackContractVersion: input.feedbackContractVersion,
        selection: selection.value,
      },
      context,
    );
    return this.store.submitFeedback(operation, {
      examFeedbackId: this.id(),
      submittedAt: this.now(),
      feedbackContractVersion: FEEDBACK_CONTRACT_VERSION,
      selection: selection.value,
    });
  }
  feedbacks(request: QueueRequest) {
    return this.store.feedbacks(request);
  }
  feedback(id: string) {
    return this.store.feedback(id);
  }
  async reconcile(input: unknown, context: HumanContext) {
    const human = this.human(context);
    if (!human.ok) return human;
    if (
      !isObject(input) ||
      Object.keys(input).length !== 4 ||
      Object.keys(input).some(
        (key) =>
          !["operationId", "kind", "targetId", "inputIdentity"].includes(key),
      ) ||
      !text(input.operationId) ||
      !text(input.targetId) ||
      !text(input.inputIdentity) ||
      !["human-decision", "edit", "feedback"].includes(String(input.kind))
    )
      return failure("VALIDATION", "照合する同じ操作を確認してください。");
    return this.store.reconcile({
      ...input,
      actorId: context.actorId,
    } as unknown as Operation);
  }
  operation(
    kind: Operation["kind"],
    operationId: string,
    targetId: string,
    input: unknown,
    context: HumanContext,
  ): Operation {
    return {
      kind,
      operationId,
      targetId,
      actorId: context.actorId,
      inputIdentity: stableJson(input),
    };
  }
}
