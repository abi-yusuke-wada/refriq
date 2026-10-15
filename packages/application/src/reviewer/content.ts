import { referenceKey } from "../pipeline/validation.js";
import type { SourceReference } from "../pipeline/contracts.js";
import {
  REVISION_CONTENT_FIELDS,
  type ExactQuestionRevision,
  type EditCommand,
  type HumanDecisionCommand,
} from "./contracts.js";

export function stableJson(value: unknown): string {
  return JSON.stringify(value, (_key, item: unknown) => {
    if (item && typeof item === "object" && !Array.isArray(item))
      return Object.fromEntries(
        Object.entries(item).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
      );
    return item;
  });
}
export function humanDecisionIdentity(command: HumanDecisionCommand): unknown {
  const { expectedEvaluationId, expectedPolicyDecisionIds, ...common } =
    command;
  return command.decision === "APPROVE"
    ? {
        ...common,
        expectedEvaluationId,
        expectedPolicyDecisionIds: [
          ...(expectedPolicyDecisionIds ?? []),
        ].sort(),
      }
    : common;
}
export function canonicalEditCommand(command: EditCommand): EditCommand {
  return {
    ...command,
    expectedPolicyDecisionIds: [...command.expectedPolicyDecisionIds].sort(),
    draft: {
      ...command.draft,
      correctOptionIds: [...command.draft.correctOptionIds].sort(),
      knowledgePointIds: [...command.draft.knowledgePointIds].sort(),
      sourceReferences: [...command.draft.sourceReferences].sort((a, b) =>
        referenceKey(a) < referenceKey(b)
          ? -1
          : referenceKey(a) > referenceKey(b)
            ? 1
            : 0,
      ),
    },
  };
}
function canonicalField(field: string, value: unknown): unknown {
  if (field === "questionSources")
    return (value as ExactQuestionRevision["questionSources"])
      .map(({ questionRevisionId: _owner, ...relation }) =>
        stableJson(relation),
      )
      .sort();
  if (field === "knowledgePointIds" || field === "correctOptionIds")
    return [...(value as readonly string[])].sort();
  if (field === "questionIntent") {
    const intent = value as ExactQuestionRevision["questionIntent"];
    return {
      ...intent,
      knowledgePointIds: [...intent.knowledgePointIds].sort(),
    };
  }
  return value;
}
export function revisionDiff(
  previous: ExactQuestionRevision,
  current: ExactQuestionRevision,
) {
  return REVISION_CONTENT_FIELDS.map(([field, label]) => ({
    field,
    label,
    previous: previous[field],
    current: current[field],
    changed:
      stableJson(canonicalField(field, previous[field])) !==
      stableJson(canonicalField(field, current[field])),
  }));
}
export function referenceValue(reference: SourceReference): string {
  return encodeURIComponent(referenceKey(reference));
}
export function selectSourceReferences(
  available: readonly SourceReference[],
  values: readonly string[],
): readonly SourceReference[] | null {
  if (
    new Set(values).size !== values.length ||
    values.some(
      (value) => !available.some((ref) => referenceValue(ref) === value),
    )
  )
    return null;
  return available
    .filter((ref) => values.includes(referenceValue(ref)))
    .map((ref) => ({ ...ref }));
}
