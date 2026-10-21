// Static Mock内の選択肢と入力制約。Domain enum / API Schemaではない。
(() => {
  const choices = {
    certificationId: [["synthetic-cloud-associate", "架空のCloud Associate"]],
    examTopicIds: [
      ["topic-routing", "リクエストルーティング"],
      ["topic-security", "セキュリティ"],
      ["topic-operations", "運用"],
      ["unknown", "覚えていない / 判断できない"],
    ],
    questionStyles: [
      ["knowledge", "知識"],
      ["scenario", "シナリオ"],
      ["configuration", "設定の読み取り"],
      ["troubleshooting", "トラブルシューティング"],
      ["lab", "実機・Lab形式"],
      ["unknown", "判断できない"],
    ],
    difficulty: [
      [1, "1 · 易しい"],
      [2, "2 · やや易しい"],
      [3, "3 · 中程度"],
      [4, "4 · やや難しい"],
      [5, "5 · 難しい"],
      ["unknown", "判断できない"],
    ],
    scenarioRatio: [
      ["none", "ほとんどなし"],
      ["few", "少なめ"],
      ["half", "半分程度"],
      ["many", "多め"],
      ["unknown", "覚えていない"],
    ],
    practicalImportance: [
      [1, "1 · ほぼ不要"],
      [2, "2 · あまり重要でない"],
      [3, "3 · ある程度重要"],
      [4, "4 · 重要"],
      [5, "5 · とても重要"],
      ["unknown", "判断できない"],
    ],
    similarityConcept: [
      [1, "1 · 論点が大きく違う"],
      [2, "2 · あまり近くない"],
      [3, "3 · 一部近い"],
      [4, "4 · 近い"],
      [5, "5 · とても近い"],
      ["not_used", "refriqを利用していない"],
      ["unknown", "利用したが判断できない"],
    ],
    similarityJudgment: [
      [1, "1 · 判断方法が大きく違う"],
      [2, "2 · あまり近くない"],
      [3, "3 · 一部近い"],
      [4, "4 · 近い"],
      [5, "5 · とても近い"],
      ["not_used", "refriqを利用していない"],
      ["unknown", "利用したが判断できない"],
    ],
    similarityDifficulty: [
      ["easier", "実試験の方が易しい"],
      ["similar", "同程度"],
      ["harder", "実試験の方が難しい"],
      ["not_used", "refriqを利用していない"],
      ["unknown", "利用したが判断できない"],
    ],
    missingTopicIds: [
      ["topic-routing", "リクエストルーティング"],
      ["topic-security", "セキュリティ"],
      ["topic-operations", "運用"],
      ["none", "不足を感じなかった"],
      ["unknown", "判断できない"],
    ],
  };
  const labels = {
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
  };
  const multiple = ["examTopicIds", "questionStyles", "missingTopicIds"];
  const similarityFields = [
    "similarityConcept",
    "similarityJudgment",
    "similarityDifficulty",
  ];
  function errors(payload) {
    if (!payload || typeof payload !== "object" || Array.isArray(payload))
      return [
        { field: "_form", message: "選択データの形式を確認してください。" },
      ];
    const result = [];
    if (Object.keys(payload).some((key) => !Object.hasOwn(choices, key)))
      result.push({
        field: "_form",
        message: "許可されていない入力項目があります。",
      });
    for (const [key, options] of Object.entries(choices)) {
      const selected = multiple.includes(key) ? payload[key] : [payload[key]];
      let message = "";
      if (
        !Object.hasOwn(payload, key) ||
        !Array.isArray(selected) ||
        !selected.length ||
        selected.some((v) => v === undefined || v === null)
      )
        message = "この項目を選択してください。";
      else if (
        selected.length > 1 &&
        selected.some((value) => value === "unknown" || value === "none")
      )
        message =
          "不明・不足なしは他の選択と併用できません。単独で選んでください。";
      else if (
        selected.length > options.length ||
        new Set(selected).size !== selected.length ||
        selected.some((value) => !options.some(([id]) => id === value))
      )
        message = "定義済みの選択肢を重複せず選んでください。";
      if (message) result.push({ field: key, message });
    }
    if (
      similarityFields.some((key) => payload[key] === "not_used") &&
      !similarityFields.every((key) => payload[key] === "not_used")
    )
      for (const field of similarityFields)
        if (!result.some((error) => error.field === field))
          result.push({
            field,
            message:
              "refriq未利用の場合、比較の3項目すべてを「refriqを利用していない」にしてください。Rating・判断できないとは併用できません。",
          });
    return result;
  }
  const validate = (payload) => errors(payload).length === 0;
  const example = {
    certificationId: "synthetic-cloud-associate",
    examTopicIds: ["topic-routing"],
    questionStyles: ["scenario", "configuration"],
    difficulty: 4,
    scenarioRatio: "many",
    practicalImportance: 4,
    similarityConcept: 4,
    similarityJudgment: 3,
    similarityDifficulty: "harder",
    missingTopicIds: ["topic-operations"],
  };
  const examples = {
    allNotUsed: {
      ...example,
      ...Object.fromEntries(similarityFields.map((key) => [key, "not_used"])),
    },
    independentUnknown: {
      ...example,
      similarityConcept: "unknown",
      similarityJudgment: 4,
      similarityDifficulty: "similar",
    },
    mixedNotUsedRating: {
      ...example,
      similarityConcept: "not_used",
      similarityJudgment: 4,
      similarityDifficulty: "similar",
    },
    mixedNotUsedUnknown: {
      ...example,
      similarityConcept: "not_used",
      similarityJudgment: "unknown",
      similarityDifficulty: "not_used",
    },
  };
  globalThis.reviewerFeedbackContract = {
    choices,
    labels,
    multiple,
    similarityFields,
    validate,
    errors,
    example,
    examples,
  };
})();
