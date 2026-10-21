import type { Catalog, FieldError, Result } from "./contracts.js";
import { failure, isObject, success } from "./validation.js";

export const FEEDBACK_CONTRACT_VERSION = "issue10-v1";
export type Rating = 1 | 2 | 3 | 4 | 5 | "unknown";
export interface FeedbackSelection {
  readonly certificationId: string;
  readonly examTopicIds: readonly string[];
  readonly questionStyles: readonly string[];
  readonly difficulty: Rating;
  readonly scenarioRatio: "none" | "few" | "half" | "many" | "unknown";
  readonly practicalImportance: Rating;
  readonly similarityConcept: Rating | "not_used";
  readonly similarityJudgment: Rating | "not_used";
  readonly similarityDifficulty:
    | "easier"
    | "similar"
    | "harder"
    | "not_used"
    | "unknown";
  readonly missingTopicIds: readonly string[];
}
export interface ExamFeedback {
  readonly examFeedbackId: string;
  readonly submittedAt: string;
  readonly feedbackContractVersion: typeof FEEDBACK_CONTRACT_VERSION;
  readonly selection: FeedbackSelection;
}
export const SIMILARITY_FIELDS = [
  "similarityConcept",
  "similarityJudgment",
  "similarityDifficulty",
] as const;
export const FEEDBACK_MULTIPLE_FIELDS = [
  "examTopicIds",
  "questionStyles",
  "missingTopicIds",
] as const;
export const FEEDBACK_LABELS = {
  certificationId: "受験した資格",
  examTopicIds: "出題が多かった分野",
  questionStyles: "見られた問題形式",
  difficulty: "実試験の難易度",
  scenarioRatio: "シナリオ問題の比率の印象",
  practicalImportance: "実機操作・経験の重要度",
  similarityConcept: "refriqとの論点の近さ",
  similarityJudgment: "refriqとの判断方法の近さ",
  similarityDifficulty: "refriqとの難易度差",
  missingTopicIds: "refriqで不足していた分野",
} as const;
export type FeedbackField = keyof FeedbackSelection;
export type Choice = readonly [string | number, string];
export function feedbackChoices(
  catalog: Catalog,
): Readonly<Record<FeedbackField, readonly Choice[]>> {
  const topics: Choice[] = catalog.topics.map((t) => [t.examTopicId, t.name]);
  const rating = (labels: readonly string[]): Choice[] => [
    ...labels.map((label, i): Choice => [i + 1, `${i + 1} · ${label}`]),
    ["unknown", "判断できない"],
  ];
  const similarity = (labels: readonly string[]): Choice[] => [
    ...rating(labels).filter(([id]) => id !== "unknown"),
    ["not_used", "refriqを利用していない"],
    ["unknown", "利用したが判断できない"],
  ];
  return {
    certificationId: [[catalog.certificationId, catalog.name]],
    examTopicIds: [...topics, ["unknown", "覚えていない / 判断できない"]],
    questionStyles: [
      ["knowledge", "知識"],
      ["scenario", "シナリオ"],
      ["configuration", "設定の読み取り"],
      ["troubleshooting", "トラブルシューティング"],
      ["lab", "実機・Lab形式"],
      ["unknown", "判断できない"],
    ],
    difficulty: rating([
      "易しい",
      "やや易しい",
      "中程度",
      "やや難しい",
      "難しい",
    ]),
    scenarioRatio: [
      ["none", "ほとんどなし"],
      ["few", "少なめ"],
      ["half", "半分程度"],
      ["many", "多め"],
      ["unknown", "覚えていない"],
    ],
    practicalImportance: rating([
      "ほぼ不要",
      "あまり重要でない",
      "ある程度重要",
      "重要",
      "とても重要",
    ]),
    similarityConcept: similarity([
      "論点が大きく違う",
      "あまり近くない",
      "一部近い",
      "近い",
      "とても近い",
    ]),
    similarityJudgment: similarity([
      "判断方法が大きく違う",
      "あまり近くない",
      "一部近い",
      "近い",
      "とても近い",
    ]),
    similarityDifficulty: [
      ["easier", "実試験の方が易しい"],
      ["similar", "同程度"],
      ["harder", "実試験の方が難しい"],
      ["not_used", "refriqを利用していない"],
      ["unknown", "利用したが判断できない"],
    ],
    missingTopicIds: [
      ...topics,
      ["none", "不足を感じなかった"],
      ["unknown", "判断できない"],
    ],
  };
}
export function validateFeedback(
  input: unknown,
  catalog: Catalog,
): Result<FeedbackSelection> {
  if (!isObject(input))
    return failure("VALIDATION", "選択データの形式を確認してください。", [
      { field: "_form", message: "選択データの形式を確認してください。" },
    ]);
  const errors: FieldError[] = [];
  const choices = feedbackChoices(catalog);
  if (Object.keys(input).some((key) => !Object.hasOwn(choices, key)))
    errors.push({
      field: "_form",
      message: "許可されていない入力項目があります。",
    });
  for (const field of Object.keys(choices) as FeedbackField[]) {
    const selected = (FEEDBACK_MULTIPLE_FIELDS as readonly string[]).includes(
      field,
    )
      ? input[field]
      : [input[field]];
    if (
      !Array.isArray(selected) ||
      !selected.length ||
      selected.some((value) => !choices[field].some(([id]) => id === value)) ||
      new Set(selected).size !== selected.length
    )
      errors.push({
        field,
        message: "定義済みの選択肢を重複せず選んでください。",
      });
    else if (
      selected.length > 1 &&
      selected.some((value) => value === "unknown" || value === "none")
    )
      errors.push({
        field,
        message:
          "不明・不足なしは他の選択と併用できません。単独で選んでください。",
      });
  }
  if (
    SIMILARITY_FIELDS.some((field) => input[field] === "not_used") &&
    !SIMILARITY_FIELDS.every((field) => input[field] === "not_used")
  )
    for (const field of SIMILARITY_FIELDS)
      errors.push({
        field,
        message:
          "refriq未利用の場合、比較の3項目すべてを「refriqを利用していない」にしてください。",
      });
  if (errors.length)
    return failure(
      "VALIDATION",
      "Feedbackの選択内容を修正してください。",
      errors,
    );
  const selection = structuredClone(input) as unknown as FeedbackSelection;
  return success({
    ...selection,
    examTopicIds: [...selection.examTopicIds].sort(),
    questionStyles: [...selection.questionStyles].sort(),
    missingTopicIds: [...selection.missingTopicIds].sort(),
  });
}
