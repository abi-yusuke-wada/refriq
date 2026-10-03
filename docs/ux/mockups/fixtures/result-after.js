window.refriqResultAfter = {
  certification: "Kong Gateway Certified Associate",
  sessionId: "session-demo-completed-02",
  questionId: "Q-demo-history-09",
  questionRevisionId: "QR-demo-history-09-r1",
  practice: { correct: 8, total: 10, percentage: 80 },
  mock: { correct: 17, total: 20, percentage: 85 },
  finishedAt: "2026年10月2日 19:42",
  topics: [
    {
      name: "基本概念・リクエストの流れ",
      correct: 3,
      total: 3,
      percentage: 100,
    },
    { name: "構成・主要エンティティ", correct: 3, total: 4, percentage: 75 },
    { name: "トラフィックの振り分け", correct: 2, total: 3, percentage: 67 },
  ],
  incorrect: [
    {
      number: 6,
      title: "設定変更時の確認手順",
      topic: "構成・主要エンティティ",
      label: "不正解",
    },
    {
      number: 9,
      title: "接続先を確認する設計レビュー",
      topic: "トラフィックの振り分け",
      label: "不正解",
    },
  ],
  correctOptionIds: ["c"],
  userOptionIds: ["a"],
  correctness: false,
  explanation:
    "この保存済みの別Sessionでは、変更する項目と確認する項目を分けて読むことがポイントでした。接続先の変更だけでなく、既存の入口条件との対応も確認する、という設計上の意図を整理します。",
  optionExplanation:
    "選択肢Aは一部の確認に留まるため、設計例で求められた確認範囲を満たしません。",
  source: {
    title: "Gateway設計メモ · 変更レビュー",
    locator: "第4節 · 変更前後の確認",
    revision: "SR-demo-history-01",
    url: "https://example.invalid/design/review",
    note: "架空の出典。設計比較用であり、実際の技術根拠ではありません。",
  },
};
