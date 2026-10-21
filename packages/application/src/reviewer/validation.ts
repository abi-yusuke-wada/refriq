import { canPublishQuestionRevision } from "@refriq/domain";
import { referenceKey } from "../pipeline/validation.js";
import {
  QUESTION_TYPES,
  QUESTION_DIFFICULTIES,
} from "../pipeline/contracts.js";
import { revisionDiff, stableJson } from "./content.js";
import type {
  EditDraft,
  FailureCode,
  FieldError,
  HumanDecisionCommand,
  Result,
  ReviewRecord,
  SourceStatus,
} from "./contracts.js";
import { REVISION_CONTENT_FIELDS } from "./contracts.js";

export const success = <T>(value: T): Result<T> => ({ ok: true, value });
export const failure = (
  code: FailureCode,
  message: string,
  fields: readonly FieldError[] = [],
): Result<never> => ({ ok: false, error: { code, message, fields } });
export const isObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
export const text = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

function hasFrozenContent(value: unknown): boolean {
  if (
    !isObject(value) ||
    !REVISION_CONTENT_FIELDS.every(([key]) => Object.hasOwn(value, key))
  )
    return false;
  return (
    text(value.questionId) &&
    text(value.questionRevisionId) &&
    text(value.stem) &&
    text(value.explanation) &&
    text(value.language) &&
    Array.isArray(value.options) &&
    value.options.every((o) => isObject(o) && text(o.id) && text(o.text)) &&
    Array.isArray(value.correctOptionIds) &&
    value.correctOptionIds.every(text) &&
    isObject(value.optionExplanations) &&
    Array.isArray(value.knowledgePointIds) &&
    value.knowledgePointIds.every(text) &&
    Array.isArray(value.questionSources) &&
    value.questionSources.every(isObject) &&
    isObject(value.questionIntent) &&
    Array.isArray(value.questionIntent.knowledgePointIds)
  );
}

export function validateExactTarget(record: ReviewRecord): Result<true> {
  const r = record.revision;
  if (!r || !hasFrozenContent(r))
    return failure(
      "TARGET_MISMATCH",
      "exact QuestionRevisionのContentを確認できません。Candidateへ置換しません。",
    );
  if (
    r.questionRevisionId !== record.questionRevisionId ||
    r.questionId !== record.questionId ||
    r.questionSources.some((s) => s.questionRevisionId !== r.questionRevisionId)
  )
    return failure(
      "TARGET_MISMATCH",
      "Human Review対象のQuestion / QuestionRevisionが一致しません。",
    );
  return success(true);
}
/** Evaluation / Sourceの公開条件を全Human Decisionへ広げない。 */
export function validateHumanDecisionTarget(
  record: ReviewRecord,
  command: HumanDecisionCommand,
): Result<true> {
  const exact = validateExactTarget(record);
  if (!exact.ok) return exact;
  if (
    command.questionRevisionId !== record.questionRevisionId ||
    command.questionId !== record.questionId
  )
    return failure(
      "TARGET_MISMATCH",
      "確認したexact Revisionと保存対象が一致しません。",
    );
  if (record.review)
    return failure(
      "CONFLICT",
      "このRevisionにはHuman decisionが記録済みです。再取得してください。",
    );
  if (record.state !== "REVIEW_REQUIRED")
    return failure(
      "INVALID_STATE",
      "このRevisionはHuman Review待ちではありません。",
    );
  if (
    record.revisionVersion !== command.expectedRevisionVersion ||
    record.questionVersion !== command.expectedQuestionVersion
  )
    return failure(
      "STALE_VERSION",
      "確認後に状態が変わりました。対象を再取得してください。",
    );
  return success(true);
}
export function evaluationBinding(
  record: ReviewRecord,
): Result<{ readonly matches: true }> {
  const exact = validateExactTarget(record);
  if (!exact.ok) return exact;
  const e = record.evaluation;
  const r = record.revision;
  if (!e)
    return failure(
      "EVALUATION_MISSING",
      "exact Revisionに対応するEvaluationが未確認です。",
    );
  if (e.current !== true)
    return failure(
      "EVALUATION_STALE",
      "過去のEvaluationはAPPROVE根拠にできません。再取得してください。",
    );
  if (
    !r ||
    e.targetKind !== "QuestionRevision" ||
    e.questionRevisionId !== r.questionRevisionId ||
    e.candidateId !== record.candidate?.candidateId ||
    e.pipelineRunId !== record.candidate?.pipelineRunId ||
    !text(e.evaluationId) ||
    !e.evaluatedContent ||
    !hasFrozenContent(e.evaluatedContent) ||
    !e.evaluatedContext ||
    e.evaluatedContent.questionId !== r.questionId ||
    e.evaluatedContent.questionRevisionId !== r.questionRevisionId ||
    e.evaluatedContent.questionSources.some(
      (s) => s.questionRevisionId !== r.questionRevisionId,
    ) ||
    revisionDiff(e.evaluatedContent, r).some((row) => row.changed) ||
    stableJson(e.evaluatedContext) !== stableJson(record.context)
  )
    return failure(
      "EVALUATION_MISMATCH",
      "このEvaluationは現在Review中のexact RevisionのContent / Contextに適用されません。",
    );
  return success({ matches: true });
}
export function sourceStatuses(record: ReviewRecord): readonly SourceStatus[] {
  return (record.revision?.questionSources ?? []).map((source) => {
    const snapshots = record.sourceRevisionSnapshots.filter(
      (s) => s.sourceRevisionId === source.sourceRevisionId,
    );
    const snapshot = snapshots.length === 1 ? (snapshots[0] ?? null) : null;
    const decisions = snapshot
      ? record.currentPolicyDecisions.filter(
          (p) =>
            p.sourceDocumentId === snapshot.sourceDocumentId &&
            p.usagePurpose === source.usagePurpose,
        )
      : [];
    const classification =
      decisions.length === 1 ? decisions[0]?.classification : null;
    const label =
      !snapshot || decisions.length === 0
        ? "current Policy missing"
        : decisions.length > 1
          ? "current Policy ambiguous"
          : (classification ?? "current Policy missing");
    const remediation =
      label === "TRUSTED"
        ? null
        : label === "REVIEW_REQUIRED"
          ? "Source Review等による利用可否・Terms / Policy解決を待ち、完了後に再取得してください。"
          : label === "PROHIBITED"
            ? "このRevisionのContentをEditで流用できません。TRUSTED Sourceから独立した再生成 / 再提案が必要です。"
            : label.includes("ambiguous")
              ? "同じSource / Purposeの現在Policyを一意に解決してから再取得してください。"
              : "現在のSource Policyを確認・解決してから再取得してください。";
    return { source, snapshot, decisions, label, remediation };
  });
}
export function validateSourceEligibility(record: ReviewRecord): Result<true> {
  const exact = validateExactTarget(record);
  if (!exact.ok) return exact;
  const r = record.revision;
  if (!r) return exact;
  // 既存Domain GateのSource / Provenance部分を使用。Human条件は別に検査する。
  const gate = canPublishQuestionRevision({
    questionRevisionId: r.questionRevisionId,
    knowledgePointIds: r.knowledgePointIds,
    questionSources: r.questionSources,
    sourceRevisionSnapshots: record.sourceRevisionSnapshots,
    currentPolicyDecisions: record.currentPolicyDecisions,
  });
  return gate.reasonCodes.every(
    (reason) => reason === "QUESTION_REVIEW_REQUIRED",
  )
    ? success(true)
    : failure(
        "SOURCE_BLOCKER",
        "base RevisionにSource / Provenance blockerがあります。APPROVE・Editはできません。" +
          sourceStatuses(record)
            .filter((s) => s.remediation)
            .map((s) => s.remediation)
            .join(" "),
      );
}
export function validateApproveReadiness(record: ReviewRecord): Result<true> {
  const binding = evaluationBinding(record);
  if (!binding.ok) return binding;
  if (
    record.evaluation?.result.decision !== "PASS" ||
    record.evaluation.reviewEligibility !== "ELIGIBLE_FOR_HUMAN_REVIEW"
  )
    return failure(
      "EVALUATION_NOT_PASS",
      "matching EvaluationはPASS / eligibleではありません。APPROVEできません。",
    );
  return validateSourceEligibility(record);
}
export function policyIdentity(record: ReviewRecord): readonly string[] {
  return sourceStatuses(record)
    .flatMap((s) => s.decisions.map((p) => p.sourcePolicyDecisionId))
    .sort();
}
export function validateEditDraft(
  input: unknown,
  record: ReviewRecord,
): Result<EditDraft> {
  const source = validateSourceEligibility(record);
  if (!source.ok) return source;
  if (!isObject(input))
    return failure("VALIDATION", "編集内容を確認してください。", [
      { field: "_form", message: "編集データの形式を確認してください。" },
    ]);
  const errors: FieldError[] = [];
  const allowed = [
    "type",
    "stem",
    "options",
    "correctOptionIds",
    "explanation",
    "optionExplanations",
    "sourceReferences",
    "language",
    "difficulty",
    "knowledgePointIds",
  ];
  if (Object.keys(input).some((k) => !allowed.includes(k)))
    errors.push({
      field: "_form",
      message: "許可されていない編集項目があります。",
    });
  for (const key of ["stem", "explanation", "language"])
    if (!text(input[key]))
      errors.push({ field: key, message: "この項目を入力してください。" });
  if (!(QUESTION_TYPES as readonly unknown[]).includes(input.type))
    errors.push({
      field: "type",
      message: "定義済みの形式を選択してください。",
    });
  if (!(QUESTION_DIFFICULTIES as readonly unknown[]).includes(input.difficulty))
    errors.push({
      field: "difficulty",
      message: "定義済みの難易度を選択してください。",
    });
  for (const field of ["type", "language", "difficulty"] as const)
    if (record.revision && input[field] !== record.revision[field])
      errors.push({
        field,
        message: "現在の学習意図の形式・言語・難易度は閲覧専用です。",
      });
  const options = Array.isArray(input.options) ? input.options : [];
  if (
    options.length < 2 ||
    options.some(
      (o) =>
        !isObject(o) ||
        Object.keys(o).some((k) => !["id", "text"].includes(k)) ||
        !text(o.id) ||
        !text(o.text),
    ) ||
    new Set(options.map((o) => (isObject(o) ? o.id : null))).size !==
      options.length
  )
    errors.push({
      field: "options",
      message: "重複のない選択肢IDと本文を2件以上入力してください。",
    });
  const ids = options.map((o) => (isObject(o) ? o.id : null));
  const correct = Array.isArray(input.correctOptionIds)
    ? input.correctOptionIds
    : [];
  if (
    !correct.length ||
    new Set(correct).size !== correct.length ||
    correct.some((id) => !ids.includes(id)) ||
    (input.type === "single_choice" && correct.length !== 1)
  )
    errors.push({
      field: "correctOptionIds",
      message: "形式に合う正答を選択してください。",
    });
  const explanations = input.optionExplanations;
  if (
    !isObject(explanations) ||
    Object.keys(explanations).length !== ids.length ||
    ids.some((id) => typeof id !== "string" || !text(explanations[id]))
  )
    errors.push({
      field: "optionExplanations",
      message: "全選択肢の説明を入力してください。",
    });
  const points = Array.isArray(input.knowledgePointIds)
    ? input.knowledgePointIds
    : [];
  if (
    !points.length ||
    new Set(points).size !== points.length ||
    points.some((id) => !record.revision?.knowledgePointIds.includes(id))
  )
    errors.push({
      field: "knowledgePointIds",
      message: "同じ学習意図のstable KnowledgePointを選択してください。",
    });
  const refs = Array.isArray(input.sourceReferences)
    ? input.sourceReferences
    : [];
  if (
    !refs.length ||
    refs.some(
      (ref) =>
        !isObject(ref) ||
        Object.keys(ref).some(
          (k) => !["sourceRevisionId", "locator"].includes(k),
        ) ||
        !text(ref.sourceRevisionId) ||
        !text(ref.locator) ||
        !record.editSourceReferences.some(
          (allowedRef) =>
            allowedRef.sourceRevisionId === ref.sourceRevisionId &&
            allowedRef.locator === ref.locator,
        ),
    ) ||
    new Set(
      refs.map((ref) =>
        isObject(ref)
          ? referenceKey({
              sourceRevisionId: String(ref.sourceRevisionId),
              locator: String(ref.locator),
            })
          : "",
      ),
    ).size !== refs.length
  )
    errors.push({
      field: "sourceReferences",
      message:
        "許可されたSourceRevisionとLocatorの組を重複せず選択してください。",
    });
  return errors.length
    ? failure("VALIDATION", "編集内容を修正してください。", errors)
    : success(structuredClone(input) as unknown as EditDraft);
}
