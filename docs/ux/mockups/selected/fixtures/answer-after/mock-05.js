// Static Mock専用の架空Fixture。
window.refriqSelectedAfter = {
  session: {
    id: "session-demo-active-mock",
    snapshotId: "snapshot-demo-fixed-mock",
    userId: "learner-demo-01",
    certificationId: "cert-demo-kgca",
    certification: "Kong Gateway Certified Associate",
    mode: "mock",
    startedAt: "2026年10月3日 18:20",
    position: 3,
  },
  question: {
    questionId: "Q-demo-fixed-05",
    questionRevisionId: "QR-demo-fixed-05-r1",
    type: "single_choice",
    stem: "設計例 05：あるチームが、複数のAPIをGateway経由で公開する構成を検討しています。商品検索APIと注文APIは別のサービスで動作し、クライアントは共通の入口へリクエストします。商品検索は /catalog、注文は /orders というパスで識別する想定です。\n\n運用チームは、接続先の変更と、受信したリクエストを振り分ける条件を別々に見直したいと考えています。レビューでは「どの入口条件で、どの接続先を利用するか」を説明できるようにしたい、という要望がありました。下の設計メモを読み、リクエストの振り分け条件を確認する観点として最も適切なものを1つ選んでください。",
    code: "設計メモ（表示確認用）\n入口: https://gateway.example.invalid\n商品検索: /catalog → 商品サービス\n注文:     /orders  → 注文サービス",
    options: [
      {
        id: "a",
        text: "サービスの表示名がアルファベット順になっているか",
      },
      {
        id: "b",
        text: "受信するパス条件と、対応する接続先の関係が整理されているか",
      },
      {
        id: "c",
        text: "すべてのAPIが同じレスポンス本文を返しているか",
      },
      {
        id: "d",
        text: "監視画面の背景色が、APIごとに異なっているか",
      },
    ],
    userOptionIds: ["b"],
    order: 5,
    topic: "基本概念・リクエストの流れ",
    confirmed: true,
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
    source: {
      title: "Gateway設計メモ · 受信条件と接続先",
      locator: "第2節 · 設計例 5",
      revision: "SR-demo-fixed-5",
      url: "https://example.invalid/design/gateway",
      note: "架空の出典。設計比較用であり、実際の技術根拠ではありません。",
      fetchedAt: "2026年9月25日 10:00（架空の取得時点）",
    },
  },
  newSession: {
    id: "session-demo-new-mock",
    snapshotId: "snapshot-demo-new-mock",
    userId: "learner-demo-01",
    certificationId: "cert-demo-kgca",
    certification: "Kong Gateway Certified Associate",
    mode: "mock",
    startedAt: "2026年10月3日 18:20",
    position: 3,
  },
};
