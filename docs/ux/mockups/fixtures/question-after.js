window.refriqQuestionAfter = {
  certification: "Kong Gateway Certified Associate",
  single: {
    questionId: "Q-demo-current-01",
    questionRevisionId: "QR-demo-current-01-r2",
    type: "single_choice",
    stem: "あるチームが、複数のAPIをGateway経由で公開する構成を検討しています。商品検索APIと注文APIは別のサービスで動作し、クライアントは共通の入口へリクエストします。商品検索は /catalog、注文は /orders というパスで識別する想定です。\n\n運用チームは、接続先の変更と、受信したリクエストを振り分ける条件を別々に見直したいと考えています。レビューでは「どの入口条件で、どの接続先を利用するか」を説明できるようにしたい、という要望がありました。下の設計メモを読み、リクエストの振り分け条件を確認する観点として最も適切なものを1つ選んでください。",
    code: "設計メモ（表示確認用）\n入口: https://gateway.example.invalid\n商品検索: /catalog → 商品サービス\n注文:     /orders  → 注文サービス",
    options: [
      { id: "a", text: "サービスの表示名がアルファベット順になっているか" },
      {
        id: "b",
        text: "受信するパス条件と、対応する接続先の関係が整理されているか",
      },
      { id: "c", text: "すべてのAPIが同じレスポンス本文を返しているか" },
      { id: "d", text: "監視画面の背景色が、APIごとに異なっているか" },
    ],
    userOptionIds: ["b"],
    correctOptionIds: ["b"],
    correctness: true,
    explanation:
      "この設計例では、受信条件と接続先の対応を読み手が追えるように整理します。入口のパスからどのAPIへ進むかを説明できることが、レビューの目的に合っています。",
    optionExplanation: [
      "表示名の順序は、リクエストの振り分け条件を説明しません。",
      "受信条件と接続先を対応させることで、想定する流れを確認できます。",
      "レスポンス本文を統一することは、この設計メモの目的ではありません。",
      "監視画面の配色は、振り分け条件とは別の情報です。",
    ],
  },
  multiple: {
    questionId: "Q-demo-current-02",
    questionRevisionId: "QR-demo-current-02-r1",
    type: "multiple_select",
    stem: "構成レビューの前に、Gatewayを経由するリクエストの流れをチームで確認します。接続先、受信条件、運用時の確認方法を、読み手が取り違えないメモにすることが目的です。複数のAPIと長い設定例が含まれているため、情報を分けて整理する必要があります。\n\n次の候補から、リクエストの流れを説明する設計メモへ含める情報をすべて選んでください。",
    code: "クライアント → 共通の入口 → 振り分け条件 → 接続先\nレビュー対象: 商品検索API / 注文API",
    options: [
      { id: "a", text: "受信リクエストを識別する条件" },
      { id: "b", text: "開発者の机に置く備品の一覧" },
      { id: "c", text: "条件ごとに対応するAPIの接続先" },
      { id: "d", text: "画面のテーマカラーの候補" },
    ],
    userOptionIds: ["a", "c"],
    correctOptionIds: ["a", "c"],
    correctness: true,
    explanation:
      "受信条件と接続先を組み合わせて、想定するリクエストの流れを説明します。この例の複数選択は、選択集合が完全に一致した保存済み回答です。",
    optionExplanation: [
      "入口の判断条件を説明します。",
      "リクエストの流れとは関係しません。",
      "受信条件に対応する接続先を説明します。",
      "表示の配色は別の設計情報です。",
    ],
  },
  source: {
    title: "Gateway設計メモ · 受信条件と接続先",
    locator: "第2節 · リクエストの流れ",
    revision: "SR-demo-01",
    url: "https://example.invalid/design/gateway",
    note: "架空の出典。設計比較用であり、実際の技術根拠ではありません。",
  },
};
