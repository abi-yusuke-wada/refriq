// Static Mock専用の架空Fixture。
window.refriqSelectedAfter = {
  session: {
    id: "session-demo-active-practice",
    snapshotId: "snapshot-demo-fixed-practice",
    userId: "learner-demo-01",
    certificationId: "cert-demo-kgca",
    certification: "Kong Gateway Certified Associate",
    mode: "practice",
    startedAt: "2026年10月3日 18:20",
    position: 3,
  },
  question: {
    questionId: "Q-demo-current-02",
    questionRevisionId: "QR-demo-current-02-r1",
    type: "multiple_select",
    stem: "構成レビューの前に、Gatewayを経由するリクエストの流れをチームで確認します。接続先、受信条件、運用時の確認方法を、読み手が取り違えないメモにすることが目的です。複数のAPIと長い設定例が含まれているため、情報を分けて整理する必要があります。\n\n次の候補から、リクエストの流れを説明する設計メモへ含める情報をすべて選んでください。",
    code: "クライアント → 共通の入口 → 振り分け条件 → 接続先\nレビュー対象: 商品検索API / 注文API",
    options: [
      {
        id: "a",
        text: "受信リクエストを識別する条件",
      },
      {
        id: "b",
        text: "開発者の机に置く備品の一覧",
      },
      {
        id: "c",
        text: "条件ごとに対応するAPIの接続先",
      },
      {
        id: "d",
        text: "画面のテーマカラーの候補",
      },
    ],
    userOptionIds: ["a"],
    order: 4,
    topic: "構成・主要エンティティ",
    confirmed: true,
    correctOptionIds: ["a", "c"],
    correctness: false,
    explanation:
      "受信条件と接続先を組み合わせて、想定するリクエストの流れを説明します。この例の複数選択は、選択集合が完全に一致した保存済み回答です。",
    optionExplanation: [
      "入口の判断条件を説明します。",
      "リクエストの流れとは関係しません。",
      "受信条件に対応する接続先を説明します。",
      "表示の配色は別の設計情報です。",
    ],
    source: {
      title: "Gateway設計メモ · 受信条件と接続先",
      locator: "第2節 · 設計例 4",
      revision: "SR-demo-fixed-4",
      url: "https://example.invalid/design/gateway",
      note: "架空の出典。設計比較用であり、実際の技術根拠ではありません。",
      fetchedAt: "2026年9月25日 10:00（架空の取得時点）",
    },
  },
  newSession: {
    id: "session-demo-new-practice",
    snapshotId: "snapshot-demo-new-practice",
    userId: "learner-demo-01",
    certificationId: "cert-demo-kgca",
    certification: "Kong Gateway Certified Associate",
    mode: "practice",
    startedAt: "2026年10月3日 18:20",
    position: 3,
  },
};
