// Static Mock専用の架空Fixture。API Payload / Persistence Modelではありません。
window.refriqSelectedBefore = {
  sessions: {
    practice: {
      id: "session-demo-active-practice",
      snapshotId: "snapshot-demo-fixed-practice",
      userId: "learner-demo-01",
      certificationId: "cert-demo-kgca",
      certification: "Kong Gateway Certified Associate",
      mode: "practice",
      startedAt: "2026年10月3日 18:20",
      position: 3,
      questions: [
        {
          questionId: "Q-demo-fixed-01",
          questionRevisionId: "QR-demo-fixed-01-r1",
          type: "single_choice",
          stem: "設計例 01：あるチームが、複数のAPIをGateway経由で公開する構成を検討しています。商品検索APIと注文APIは別のサービスで動作し、クライアントは共通の入口へリクエストします。商品検索は /catalog、注文は /orders というパスで識別する想定です。\n\n運用チームは、接続先の変更と、受信したリクエストを振り分ける条件を別々に見直したいと考えています。レビューでは「どの入口条件で、どの接続先を利用するか」を説明できるようにしたい、という要望がありました。下の設計メモを読み、リクエストの振り分け条件を確認する観点として最も適切なものを1つ選んでください。",
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
          order: 1,
          topic: "基本概念・リクエストの流れ",
          confirmed: true,
          pendingOptionIds: ["b"],
        },
        {
          questionId: "Q-demo-fixed-02",
          questionRevisionId: "QR-demo-fixed-02-r1",
          type: "single_choice",
          stem: "設計例 02：あるチームが、複数のAPIをGateway経由で公開する構成を検討しています。商品検索APIと注文APIは別のサービスで動作し、クライアントは共通の入口へリクエストします。商品検索は /catalog、注文は /orders というパスで識別する想定です。\n\n運用チームは、接続先の変更と、受信したリクエストを振り分ける条件を別々に見直したいと考えています。レビューでは「どの入口条件で、どの接続先を利用するか」を説明できるようにしたい、という要望がありました。下の設計メモを読み、リクエストの振り分け条件を確認する観点として最も適切なものを1つ選んでください。",
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
          order: 2,
          topic: "基本概念・リクエストの流れ",
          confirmed: true,
          pendingOptionIds: ["b"],
        },
        {
          questionId: "Q-demo-current-01",
          questionRevisionId: "QR-demo-current-01-r2",
          type: "single_choice",
          stem: "あるチームが、複数のAPIをGateway経由で公開する構成を検討しています。商品検索APIと注文APIは別のサービスで動作し、クライアントは共通の入口へリクエストします。商品検索は /catalog、注文は /orders というパスで識別する想定です。\n\n運用チームは、接続先の変更と、受信したリクエストを振り分ける条件を別々に見直したいと考えています。レビューでは「どの入口条件で、どの接続先を利用するか」を説明できるようにしたい、という要望がありました。下の設計メモを読み、リクエストの振り分け条件を確認する観点として最も適切なものを1つ選んでください。",
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
          userOptionIds: [],
          order: 3,
          topic: "基本概念・リクエストの流れ",
          confirmed: false,
          pendingOptionIds: ["b"],
        },
        {
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
          userOptionIds: [],
          order: 4,
          topic: "構成・主要エンティティ",
          confirmed: false,
          pendingOptionIds: ["a"],
        },
        {
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
          userOptionIds: [],
          order: 5,
          topic: "基本概念・リクエストの流れ",
          confirmed: false,
          pendingOptionIds: ["b"],
        },
        {
          questionId: "Q-demo-fixed-06",
          questionRevisionId: "QR-demo-fixed-06-r1",
          type: "single_choice",
          stem: "設計例 06：あるチームが、複数のAPIをGateway経由で公開する構成を検討しています。商品検索APIと注文APIは別のサービスで動作し、クライアントは共通の入口へリクエストします。商品検索は /catalog、注文は /orders というパスで識別する想定です。\n\n運用チームは、接続先の変更と、受信したリクエストを振り分ける条件を別々に見直したいと考えています。レビューでは「どの入口条件で、どの接続先を利用するか」を説明できるようにしたい、という要望がありました。下の設計メモを読み、リクエストの振り分け条件を確認する観点として最も適切なものを1つ選んでください。",
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
          userOptionIds: [],
          order: 6,
          topic: "基本概念・リクエストの流れ",
          confirmed: false,
          pendingOptionIds: ["b"],
        },
        {
          questionId: "Q-demo-fixed-07",
          questionRevisionId: "QR-demo-fixed-07-r1",
          type: "single_choice",
          stem: "設計例 07：あるチームが、複数のAPIをGateway経由で公開する構成を検討しています。商品検索APIと注文APIは別のサービスで動作し、クライアントは共通の入口へリクエストします。商品検索は /catalog、注文は /orders というパスで識別する想定です。\n\n運用チームは、接続先の変更と、受信したリクエストを振り分ける条件を別々に見直したいと考えています。レビューでは「どの入口条件で、どの接続先を利用するか」を説明できるようにしたい、という要望がありました。下の設計メモを読み、リクエストの振り分け条件を確認する観点として最も適切なものを1つ選んでください。",
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
          userOptionIds: [],
          order: 7,
          topic: "基本概念・リクエストの流れ",
          confirmed: false,
          pendingOptionIds: ["b"],
        },
        {
          questionId: "Q-demo-fixed-08",
          questionRevisionId: "QR-demo-fixed-08-r1",
          type: "multiple_select",
          stem: "設計例 08：構成レビューの前に、Gatewayを経由するリクエストの流れをチームで確認します。接続先、受信条件、運用時の確認方法を、読み手が取り違えないメモにすることが目的です。複数のAPIと長い設定例が含まれているため、情報を分けて整理する必要があります。\n\n次の候補から、リクエストの流れを説明する設計メモへ含める情報をすべて選んでください。",
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
          userOptionIds: [],
          order: 8,
          topic: "構成・主要エンティティ",
          confirmed: false,
          pendingOptionIds: ["a"],
        },
        {
          questionId: "Q-demo-fixed-09",
          questionRevisionId: "QR-demo-fixed-09-r1",
          type: "single_choice",
          stem: "設計例 09：あるチームが、複数のAPIをGateway経由で公開する構成を検討しています。商品検索APIと注文APIは別のサービスで動作し、クライアントは共通の入口へリクエストします。商品検索は /catalog、注文は /orders というパスで識別する想定です。\n\n運用チームは、接続先の変更と、受信したリクエストを振り分ける条件を別々に見直したいと考えています。レビューでは「どの入口条件で、どの接続先を利用するか」を説明できるようにしたい、という要望がありました。下の設計メモを読み、リクエストの振り分け条件を確認する観点として最も適切なものを1つ選んでください。",
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
          userOptionIds: [],
          order: 9,
          topic: "基本概念・リクエストの流れ",
          confirmed: false,
          pendingOptionIds: ["b"],
        },
        {
          questionId: "Q-demo-fixed-10",
          questionRevisionId: "QR-demo-fixed-10-r1",
          type: "single_choice",
          stem: "設計例 10：あるチームが、複数のAPIをGateway経由で公開する構成を検討しています。商品検索APIと注文APIは別のサービスで動作し、クライアントは共通の入口へリクエストします。商品検索は /catalog、注文は /orders というパスで識別する想定です。\n\n運用チームは、接続先の変更と、受信したリクエストを振り分ける条件を別々に見直したいと考えています。レビューでは「どの入口条件で、どの接続先を利用するか」を説明できるようにしたい、という要望がありました。下の設計メモを読み、リクエストの振り分け条件を確認する観点として最も適切なものを1つ選んでください。",
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
          userOptionIds: [],
          order: 10,
          topic: "基本概念・リクエストの流れ",
          confirmed: false,
          pendingOptionIds: ["b"],
        },
      ],
    },
    mock: {
      id: "session-demo-active-mock",
      snapshotId: "snapshot-demo-fixed-mock",
      userId: "learner-demo-01",
      certificationId: "cert-demo-kgca",
      certification: "Kong Gateway Certified Associate",
      mode: "mock",
      startedAt: "2026年10月3日 18:20",
      position: 3,
      questions: [
        {
          questionId: "Q-demo-fixed-01",
          questionRevisionId: "QR-demo-fixed-01-r1",
          type: "single_choice",
          stem: "設計例 01：あるチームが、複数のAPIをGateway経由で公開する構成を検討しています。商品検索APIと注文APIは別のサービスで動作し、クライアントは共通の入口へリクエストします。商品検索は /catalog、注文は /orders というパスで識別する想定です。\n\n運用チームは、接続先の変更と、受信したリクエストを振り分ける条件を別々に見直したいと考えています。レビューでは「どの入口条件で、どの接続先を利用するか」を説明できるようにしたい、という要望がありました。下の設計メモを読み、リクエストの振り分け条件を確認する観点として最も適切なものを1つ選んでください。",
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
          order: 1,
          topic: "基本概念・リクエストの流れ",
          confirmed: false,
        },
        {
          questionId: "Q-demo-fixed-02",
          questionRevisionId: "QR-demo-fixed-02-r1",
          type: "single_choice",
          stem: "設計例 02：あるチームが、複数のAPIをGateway経由で公開する構成を検討しています。商品検索APIと注文APIは別のサービスで動作し、クライアントは共通の入口へリクエストします。商品検索は /catalog、注文は /orders というパスで識別する想定です。\n\n運用チームは、接続先の変更と、受信したリクエストを振り分ける条件を別々に見直したいと考えています。レビューでは「どの入口条件で、どの接続先を利用するか」を説明できるようにしたい、という要望がありました。下の設計メモを読み、リクエストの振り分け条件を確認する観点として最も適切なものを1つ選んでください。",
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
          order: 2,
          topic: "基本概念・リクエストの流れ",
          confirmed: false,
        },
        {
          questionId: "Q-demo-current-01",
          questionRevisionId: "QR-demo-current-01-r2",
          type: "single_choice",
          stem: "あるチームが、複数のAPIをGateway経由で公開する構成を検討しています。商品検索APIと注文APIは別のサービスで動作し、クライアントは共通の入口へリクエストします。商品検索は /catalog、注文は /orders というパスで識別する想定です。\n\n運用チームは、接続先の変更と、受信したリクエストを振り分ける条件を別々に見直したいと考えています。レビューでは「どの入口条件で、どの接続先を利用するか」を説明できるようにしたい、という要望がありました。下の設計メモを読み、リクエストの振り分け条件を確認する観点として最も適切なものを1つ選んでください。",
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
          order: 3,
          topic: "基本概念・リクエストの流れ",
          confirmed: false,
        },
        {
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
          confirmed: false,
        },
        {
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
          confirmed: false,
        },
        {
          questionId: "Q-demo-fixed-06",
          questionRevisionId: "QR-demo-fixed-06-r1",
          type: "single_choice",
          stem: "設計例 06：あるチームが、複数のAPIをGateway経由で公開する構成を検討しています。商品検索APIと注文APIは別のサービスで動作し、クライアントは共通の入口へリクエストします。商品検索は /catalog、注文は /orders というパスで識別する想定です。\n\n運用チームは、接続先の変更と、受信したリクエストを振り分ける条件を別々に見直したいと考えています。レビューでは「どの入口条件で、どの接続先を利用するか」を説明できるようにしたい、という要望がありました。下の設計メモを読み、リクエストの振り分け条件を確認する観点として最も適切なものを1つ選んでください。",
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
          userOptionIds: [],
          order: 6,
          topic: "基本概念・リクエストの流れ",
          confirmed: false,
        },
        {
          questionId: "Q-demo-fixed-07",
          questionRevisionId: "QR-demo-fixed-07-r1",
          type: "single_choice",
          stem: "設計例 07：あるチームが、複数のAPIをGateway経由で公開する構成を検討しています。商品検索APIと注文APIは別のサービスで動作し、クライアントは共通の入口へリクエストします。商品検索は /catalog、注文は /orders というパスで識別する想定です。\n\n運用チームは、接続先の変更と、受信したリクエストを振り分ける条件を別々に見直したいと考えています。レビューでは「どの入口条件で、どの接続先を利用するか」を説明できるようにしたい、という要望がありました。下の設計メモを読み、リクエストの振り分け条件を確認する観点として最も適切なものを1つ選んでください。",
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
          order: 7,
          topic: "基本概念・リクエストの流れ",
          confirmed: false,
        },
        {
          questionId: "Q-demo-fixed-08",
          questionRevisionId: "QR-demo-fixed-08-r1",
          type: "multiple_select",
          stem: "設計例 08：構成レビューの前に、Gatewayを経由するリクエストの流れをチームで確認します。接続先、受信条件、運用時の確認方法を、読み手が取り違えないメモにすることが目的です。複数のAPIと長い設定例が含まれているため、情報を分けて整理する必要があります。\n\n次の候補から、リクエストの流れを説明する設計メモへ含める情報をすべて選んでください。",
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
          order: 8,
          topic: "構成・主要エンティティ",
          confirmed: false,
        },
        {
          questionId: "Q-demo-fixed-09",
          questionRevisionId: "QR-demo-fixed-09-r1",
          type: "single_choice",
          stem: "設計例 09：あるチームが、複数のAPIをGateway経由で公開する構成を検討しています。商品検索APIと注文APIは別のサービスで動作し、クライアントは共通の入口へリクエストします。商品検索は /catalog、注文は /orders というパスで識別する想定です。\n\n運用チームは、接続先の変更と、受信したリクエストを振り分ける条件を別々に見直したいと考えています。レビューでは「どの入口条件で、どの接続先を利用するか」を説明できるようにしたい、という要望がありました。下の設計メモを読み、リクエストの振り分け条件を確認する観点として最も適切なものを1つ選んでください。",
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
          userOptionIds: [],
          order: 9,
          topic: "基本概念・リクエストの流れ",
          confirmed: false,
        },
        {
          questionId: "Q-demo-fixed-10",
          questionRevisionId: "QR-demo-fixed-10-r1",
          type: "single_choice",
          stem: "設計例 10：あるチームが、複数のAPIをGateway経由で公開する構成を検討しています。商品検索APIと注文APIは別のサービスで動作し、クライアントは共通の入口へリクエストします。商品検索は /catalog、注文は /orders というパスで識別する想定です。\n\n運用チームは、接続先の変更と、受信したリクエストを振り分ける条件を別々に見直したいと考えています。レビューでは「どの入口条件で、どの接続先を利用するか」を説明できるようにしたい、という要望がありました。下の設計メモを読み、リクエストの振り分け条件を確認する観点として最も適切なものを1つ選んでください。",
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
          order: 10,
          topic: "基本概念・リクエストの流れ",
          confirmed: false,
        },
        {
          questionId: "Q-demo-fixed-11",
          questionRevisionId: "QR-demo-fixed-11-r1",
          type: "single_choice",
          stem: "設計例 11：あるチームが、複数のAPIをGateway経由で公開する構成を検討しています。商品検索APIと注文APIは別のサービスで動作し、クライアントは共通の入口へリクエストします。商品検索は /catalog、注文は /orders というパスで識別する想定です。\n\n運用チームは、接続先の変更と、受信したリクエストを振り分ける条件を別々に見直したいと考えています。レビューでは「どの入口条件で、どの接続先を利用するか」を説明できるようにしたい、という要望がありました。下の設計メモを読み、リクエストの振り分け条件を確認する観点として最も適切なものを1つ選んでください。",
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
          order: 11,
          topic: "基本概念・リクエストの流れ",
          confirmed: false,
        },
        {
          questionId: "Q-demo-fixed-12",
          questionRevisionId: "QR-demo-fixed-12-r1",
          type: "multiple_select",
          stem: "設計例 12：構成レビューの前に、Gatewayを経由するリクエストの流れをチームで確認します。接続先、受信条件、運用時の確認方法を、読み手が取り違えないメモにすることが目的です。複数のAPIと長い設定例が含まれているため、情報を分けて整理する必要があります。\n\n次の候補から、リクエストの流れを説明する設計メモへ含める情報をすべて選んでください。",
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
          userOptionIds: [],
          order: 12,
          topic: "構成・主要エンティティ",
          confirmed: false,
        },
        {
          questionId: "Q-demo-fixed-13",
          questionRevisionId: "QR-demo-fixed-13-r1",
          type: "single_choice",
          stem: "設計例 13：あるチームが、複数のAPIをGateway経由で公開する構成を検討しています。商品検索APIと注文APIは別のサービスで動作し、クライアントは共通の入口へリクエストします。商品検索は /catalog、注文は /orders というパスで識別する想定です。\n\n運用チームは、接続先の変更と、受信したリクエストを振り分ける条件を別々に見直したいと考えています。レビューでは「どの入口条件で、どの接続先を利用するか」を説明できるようにしたい、という要望がありました。下の設計メモを読み、リクエストの振り分け条件を確認する観点として最も適切なものを1つ選んでください。",
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
          order: 13,
          topic: "基本概念・リクエストの流れ",
          confirmed: false,
        },
        {
          questionId: "Q-demo-fixed-14",
          questionRevisionId: "QR-demo-fixed-14-r1",
          type: "single_choice",
          stem: "設計例 14：あるチームが、複数のAPIをGateway経由で公開する構成を検討しています。商品検索APIと注文APIは別のサービスで動作し、クライアントは共通の入口へリクエストします。商品検索は /catalog、注文は /orders というパスで識別する想定です。\n\n運用チームは、接続先の変更と、受信したリクエストを振り分ける条件を別々に見直したいと考えています。レビューでは「どの入口条件で、どの接続先を利用するか」を説明できるようにしたい、という要望がありました。下の設計メモを読み、リクエストの振り分け条件を確認する観点として最も適切なものを1つ選んでください。",
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
          order: 14,
          topic: "基本概念・リクエストの流れ",
          confirmed: false,
        },
        {
          questionId: "Q-demo-fixed-15",
          questionRevisionId: "QR-demo-fixed-15-r1",
          type: "single_choice",
          stem: "設計例 15：あるチームが、複数のAPIをGateway経由で公開する構成を検討しています。商品検索APIと注文APIは別のサービスで動作し、クライアントは共通の入口へリクエストします。商品検索は /catalog、注文は /orders というパスで識別する想定です。\n\n運用チームは、接続先の変更と、受信したリクエストを振り分ける条件を別々に見直したいと考えています。レビューでは「どの入口条件で、どの接続先を利用するか」を説明できるようにしたい、という要望がありました。下の設計メモを読み、リクエストの振り分け条件を確認する観点として最も適切なものを1つ選んでください。",
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
          userOptionIds: [],
          order: 15,
          topic: "基本概念・リクエストの流れ",
          confirmed: false,
        },
        {
          questionId: "Q-demo-fixed-16",
          questionRevisionId: "QR-demo-fixed-16-r1",
          type: "multiple_select",
          stem: "設計例 16：構成レビューの前に、Gatewayを経由するリクエストの流れをチームで確認します。接続先、受信条件、運用時の確認方法を、読み手が取り違えないメモにすることが目的です。複数のAPIと長い設定例が含まれているため、情報を分けて整理する必要があります。\n\n次の候補から、リクエストの流れを説明する設計メモへ含める情報をすべて選んでください。",
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
          order: 16,
          topic: "構成・主要エンティティ",
          confirmed: false,
        },
        {
          questionId: "Q-demo-fixed-17",
          questionRevisionId: "QR-demo-fixed-17-r1",
          type: "single_choice",
          stem: "設計例 17：あるチームが、複数のAPIをGateway経由で公開する構成を検討しています。商品検索APIと注文APIは別のサービスで動作し、クライアントは共通の入口へリクエストします。商品検索は /catalog、注文は /orders というパスで識別する想定です。\n\n運用チームは、接続先の変更と、受信したリクエストを振り分ける条件を別々に見直したいと考えています。レビューでは「どの入口条件で、どの接続先を利用するか」を説明できるようにしたい、という要望がありました。下の設計メモを読み、リクエストの振り分け条件を確認する観点として最も適切なものを1つ選んでください。",
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
          order: 17,
          topic: "基本概念・リクエストの流れ",
          confirmed: false,
        },
        {
          questionId: "Q-demo-fixed-18",
          questionRevisionId: "QR-demo-fixed-18-r1",
          type: "single_choice",
          stem: "設計例 18：あるチームが、複数のAPIをGateway経由で公開する構成を検討しています。商品検索APIと注文APIは別のサービスで動作し、クライアントは共通の入口へリクエストします。商品検索は /catalog、注文は /orders というパスで識別する想定です。\n\n運用チームは、接続先の変更と、受信したリクエストを振り分ける条件を別々に見直したいと考えています。レビューでは「どの入口条件で、どの接続先を利用するか」を説明できるようにしたい、という要望がありました。下の設計メモを読み、リクエストの振り分け条件を確認する観点として最も適切なものを1つ選んでください。",
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
          userOptionIds: [],
          order: 18,
          topic: "基本概念・リクエストの流れ",
          confirmed: false,
        },
        {
          questionId: "Q-demo-fixed-19",
          questionRevisionId: "QR-demo-fixed-19-r1",
          type: "single_choice",
          stem: "設計例 19：あるチームが、複数のAPIをGateway経由で公開する構成を検討しています。商品検索APIと注文APIは別のサービスで動作し、クライアントは共通の入口へリクエストします。商品検索は /catalog、注文は /orders というパスで識別する想定です。\n\n運用チームは、接続先の変更と、受信したリクエストを振り分ける条件を別々に見直したいと考えています。レビューでは「どの入口条件で、どの接続先を利用するか」を説明できるようにしたい、という要望がありました。下の設計メモを読み、リクエストの振り分け条件を確認する観点として最も適切なものを1つ選んでください。",
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
          order: 19,
          topic: "基本概念・リクエストの流れ",
          confirmed: false,
        },
        {
          questionId: "Q-demo-fixed-20",
          questionRevisionId: "QR-demo-fixed-20-r1",
          type: "multiple_select",
          stem: "設計例 20：構成レビューの前に、Gatewayを経由するリクエストの流れをチームで確認します。接続先、受信条件、運用時の確認方法を、読み手が取り違えないメモにすることが目的です。複数のAPIと長い設定例が含まれているため、情報を分けて整理する必要があります。\n\n次の候補から、リクエストの流れを説明する設計メモへ含める情報をすべて選んでください。",
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
          userOptionIds: [],
          order: 20,
          topic: "構成・主要エンティティ",
          confirmed: false,
        },
      ],
    },
  },
  newSessions: {
    practice: {
      id: "session-demo-new-practice",
      snapshotId: "snapshot-demo-new-practice",
      userId: "learner-demo-01",
      certificationId: "cert-demo-kgca",
      certification: "Kong Gateway Certified Associate",
      mode: "practice",
      startedAt: "2026年10月3日 18:20",
      position: 1,
      questions: [
        {
          questionId: "Q-demo-fixed-01",
          questionRevisionId: "QR-demo-fixed-01-r1",
          type: "single_choice",
          stem: "設計例 01：あるチームが、複数のAPIをGateway経由で公開する構成を検討しています。商品検索APIと注文APIは別のサービスで動作し、クライアントは共通の入口へリクエストします。商品検索は /catalog、注文は /orders というパスで識別する想定です。\n\n運用チームは、接続先の変更と、受信したリクエストを振り分ける条件を別々に見直したいと考えています。レビューでは「どの入口条件で、どの接続先を利用するか」を説明できるようにしたい、という要望がありました。下の設計メモを読み、リクエストの振り分け条件を確認する観点として最も適切なものを1つ選んでください。",
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
          userOptionIds: [],
          order: 1,
          topic: "基本概念・リクエストの流れ",
          confirmed: false,
          pendingOptionIds: ["b"],
        },
        {
          questionId: "Q-demo-fixed-02",
          questionRevisionId: "QR-demo-fixed-02-r1",
          type: "single_choice",
          stem: "設計例 02：あるチームが、複数のAPIをGateway経由で公開する構成を検討しています。商品検索APIと注文APIは別のサービスで動作し、クライアントは共通の入口へリクエストします。商品検索は /catalog、注文は /orders というパスで識別する想定です。\n\n運用チームは、接続先の変更と、受信したリクエストを振り分ける条件を別々に見直したいと考えています。レビューでは「どの入口条件で、どの接続先を利用するか」を説明できるようにしたい、という要望がありました。下の設計メモを読み、リクエストの振り分け条件を確認する観点として最も適切なものを1つ選んでください。",
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
          userOptionIds: [],
          order: 2,
          topic: "基本概念・リクエストの流れ",
          confirmed: false,
          pendingOptionIds: ["b"],
        },
        {
          questionId: "Q-demo-current-01",
          questionRevisionId: "QR-demo-current-01-r2",
          type: "single_choice",
          stem: "あるチームが、複数のAPIをGateway経由で公開する構成を検討しています。商品検索APIと注文APIは別のサービスで動作し、クライアントは共通の入口へリクエストします。商品検索は /catalog、注文は /orders というパスで識別する想定です。\n\n運用チームは、接続先の変更と、受信したリクエストを振り分ける条件を別々に見直したいと考えています。レビューでは「どの入口条件で、どの接続先を利用するか」を説明できるようにしたい、という要望がありました。下の設計メモを読み、リクエストの振り分け条件を確認する観点として最も適切なものを1つ選んでください。",
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
          userOptionIds: [],
          order: 3,
          topic: "基本概念・リクエストの流れ",
          confirmed: false,
          pendingOptionIds: ["b"],
        },
        {
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
          userOptionIds: [],
          order: 4,
          topic: "構成・主要エンティティ",
          confirmed: false,
          pendingOptionIds: ["a"],
        },
        {
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
          userOptionIds: [],
          order: 5,
          topic: "基本概念・リクエストの流れ",
          confirmed: false,
          pendingOptionIds: ["b"],
        },
        {
          questionId: "Q-demo-fixed-06",
          questionRevisionId: "QR-demo-fixed-06-r1",
          type: "single_choice",
          stem: "設計例 06：あるチームが、複数のAPIをGateway経由で公開する構成を検討しています。商品検索APIと注文APIは別のサービスで動作し、クライアントは共通の入口へリクエストします。商品検索は /catalog、注文は /orders というパスで識別する想定です。\n\n運用チームは、接続先の変更と、受信したリクエストを振り分ける条件を別々に見直したいと考えています。レビューでは「どの入口条件で、どの接続先を利用するか」を説明できるようにしたい、という要望がありました。下の設計メモを読み、リクエストの振り分け条件を確認する観点として最も適切なものを1つ選んでください。",
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
          userOptionIds: [],
          order: 6,
          topic: "基本概念・リクエストの流れ",
          confirmed: false,
          pendingOptionIds: ["b"],
        },
        {
          questionId: "Q-demo-fixed-07",
          questionRevisionId: "QR-demo-fixed-07-r1",
          type: "single_choice",
          stem: "設計例 07：あるチームが、複数のAPIをGateway経由で公開する構成を検討しています。商品検索APIと注文APIは別のサービスで動作し、クライアントは共通の入口へリクエストします。商品検索は /catalog、注文は /orders というパスで識別する想定です。\n\n運用チームは、接続先の変更と、受信したリクエストを振り分ける条件を別々に見直したいと考えています。レビューでは「どの入口条件で、どの接続先を利用するか」を説明できるようにしたい、という要望がありました。下の設計メモを読み、リクエストの振り分け条件を確認する観点として最も適切なものを1つ選んでください。",
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
          userOptionIds: [],
          order: 7,
          topic: "基本概念・リクエストの流れ",
          confirmed: false,
          pendingOptionIds: ["b"],
        },
        {
          questionId: "Q-demo-fixed-08",
          questionRevisionId: "QR-demo-fixed-08-r1",
          type: "multiple_select",
          stem: "設計例 08：構成レビューの前に、Gatewayを経由するリクエストの流れをチームで確認します。接続先、受信条件、運用時の確認方法を、読み手が取り違えないメモにすることが目的です。複数のAPIと長い設定例が含まれているため、情報を分けて整理する必要があります。\n\n次の候補から、リクエストの流れを説明する設計メモへ含める情報をすべて選んでください。",
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
          userOptionIds: [],
          order: 8,
          topic: "構成・主要エンティティ",
          confirmed: false,
          pendingOptionIds: ["a"],
        },
        {
          questionId: "Q-demo-fixed-09",
          questionRevisionId: "QR-demo-fixed-09-r1",
          type: "single_choice",
          stem: "設計例 09：あるチームが、複数のAPIをGateway経由で公開する構成を検討しています。商品検索APIと注文APIは別のサービスで動作し、クライアントは共通の入口へリクエストします。商品検索は /catalog、注文は /orders というパスで識別する想定です。\n\n運用チームは、接続先の変更と、受信したリクエストを振り分ける条件を別々に見直したいと考えています。レビューでは「どの入口条件で、どの接続先を利用するか」を説明できるようにしたい、という要望がありました。下の設計メモを読み、リクエストの振り分け条件を確認する観点として最も適切なものを1つ選んでください。",
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
          userOptionIds: [],
          order: 9,
          topic: "基本概念・リクエストの流れ",
          confirmed: false,
          pendingOptionIds: ["b"],
        },
        {
          questionId: "Q-demo-fixed-10",
          questionRevisionId: "QR-demo-fixed-10-r1",
          type: "single_choice",
          stem: "設計例 10：あるチームが、複数のAPIをGateway経由で公開する構成を検討しています。商品検索APIと注文APIは別のサービスで動作し、クライアントは共通の入口へリクエストします。商品検索は /catalog、注文は /orders というパスで識別する想定です。\n\n運用チームは、接続先の変更と、受信したリクエストを振り分ける条件を別々に見直したいと考えています。レビューでは「どの入口条件で、どの接続先を利用するか」を説明できるようにしたい、という要望がありました。下の設計メモを読み、リクエストの振り分け条件を確認する観点として最も適切なものを1つ選んでください。",
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
          userOptionIds: [],
          order: 10,
          topic: "基本概念・リクエストの流れ",
          confirmed: false,
          pendingOptionIds: ["b"],
        },
      ],
    },
    mock: {
      id: "session-demo-new-mock",
      snapshotId: "snapshot-demo-new-mock",
      userId: "learner-demo-01",
      certificationId: "cert-demo-kgca",
      certification: "Kong Gateway Certified Associate",
      mode: "mock",
      startedAt: "2026年10月3日 18:20",
      position: 1,
      questions: [
        {
          questionId: "Q-demo-fixed-01",
          questionRevisionId: "QR-demo-fixed-01-r1",
          type: "single_choice",
          stem: "設計例 01：あるチームが、複数のAPIをGateway経由で公開する構成を検討しています。商品検索APIと注文APIは別のサービスで動作し、クライアントは共通の入口へリクエストします。商品検索は /catalog、注文は /orders というパスで識別する想定です。\n\n運用チームは、接続先の変更と、受信したリクエストを振り分ける条件を別々に見直したいと考えています。レビューでは「どの入口条件で、どの接続先を利用するか」を説明できるようにしたい、という要望がありました。下の設計メモを読み、リクエストの振り分け条件を確認する観点として最も適切なものを1つ選んでください。",
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
          userOptionIds: [],
          order: 1,
          topic: "基本概念・リクエストの流れ",
          confirmed: false,
        },
        {
          questionId: "Q-demo-fixed-02",
          questionRevisionId: "QR-demo-fixed-02-r1",
          type: "single_choice",
          stem: "設計例 02：あるチームが、複数のAPIをGateway経由で公開する構成を検討しています。商品検索APIと注文APIは別のサービスで動作し、クライアントは共通の入口へリクエストします。商品検索は /catalog、注文は /orders というパスで識別する想定です。\n\n運用チームは、接続先の変更と、受信したリクエストを振り分ける条件を別々に見直したいと考えています。レビューでは「どの入口条件で、どの接続先を利用するか」を説明できるようにしたい、という要望がありました。下の設計メモを読み、リクエストの振り分け条件を確認する観点として最も適切なものを1つ選んでください。",
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
          userOptionIds: [],
          order: 2,
          topic: "基本概念・リクエストの流れ",
          confirmed: false,
        },
        {
          questionId: "Q-demo-current-01",
          questionRevisionId: "QR-demo-current-01-r2",
          type: "single_choice",
          stem: "あるチームが、複数のAPIをGateway経由で公開する構成を検討しています。商品検索APIと注文APIは別のサービスで動作し、クライアントは共通の入口へリクエストします。商品検索は /catalog、注文は /orders というパスで識別する想定です。\n\n運用チームは、接続先の変更と、受信したリクエストを振り分ける条件を別々に見直したいと考えています。レビューでは「どの入口条件で、どの接続先を利用するか」を説明できるようにしたい、という要望がありました。下の設計メモを読み、リクエストの振り分け条件を確認する観点として最も適切なものを1つ選んでください。",
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
          userOptionIds: [],
          order: 3,
          topic: "基本概念・リクエストの流れ",
          confirmed: false,
        },
        {
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
          userOptionIds: [],
          order: 4,
          topic: "構成・主要エンティティ",
          confirmed: false,
        },
        {
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
          userOptionIds: [],
          order: 5,
          topic: "基本概念・リクエストの流れ",
          confirmed: false,
        },
        {
          questionId: "Q-demo-fixed-06",
          questionRevisionId: "QR-demo-fixed-06-r1",
          type: "single_choice",
          stem: "設計例 06：あるチームが、複数のAPIをGateway経由で公開する構成を検討しています。商品検索APIと注文APIは別のサービスで動作し、クライアントは共通の入口へリクエストします。商品検索は /catalog、注文は /orders というパスで識別する想定です。\n\n運用チームは、接続先の変更と、受信したリクエストを振り分ける条件を別々に見直したいと考えています。レビューでは「どの入口条件で、どの接続先を利用するか」を説明できるようにしたい、という要望がありました。下の設計メモを読み、リクエストの振り分け条件を確認する観点として最も適切なものを1つ選んでください。",
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
          userOptionIds: [],
          order: 6,
          topic: "基本概念・リクエストの流れ",
          confirmed: false,
        },
        {
          questionId: "Q-demo-fixed-07",
          questionRevisionId: "QR-demo-fixed-07-r1",
          type: "single_choice",
          stem: "設計例 07：あるチームが、複数のAPIをGateway経由で公開する構成を検討しています。商品検索APIと注文APIは別のサービスで動作し、クライアントは共通の入口へリクエストします。商品検索は /catalog、注文は /orders というパスで識別する想定です。\n\n運用チームは、接続先の変更と、受信したリクエストを振り分ける条件を別々に見直したいと考えています。レビューでは「どの入口条件で、どの接続先を利用するか」を説明できるようにしたい、という要望がありました。下の設計メモを読み、リクエストの振り分け条件を確認する観点として最も適切なものを1つ選んでください。",
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
          userOptionIds: [],
          order: 7,
          topic: "基本概念・リクエストの流れ",
          confirmed: false,
        },
        {
          questionId: "Q-demo-fixed-08",
          questionRevisionId: "QR-demo-fixed-08-r1",
          type: "multiple_select",
          stem: "設計例 08：構成レビューの前に、Gatewayを経由するリクエストの流れをチームで確認します。接続先、受信条件、運用時の確認方法を、読み手が取り違えないメモにすることが目的です。複数のAPIと長い設定例が含まれているため、情報を分けて整理する必要があります。\n\n次の候補から、リクエストの流れを説明する設計メモへ含める情報をすべて選んでください。",
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
          userOptionIds: [],
          order: 8,
          topic: "構成・主要エンティティ",
          confirmed: false,
        },
        {
          questionId: "Q-demo-fixed-09",
          questionRevisionId: "QR-demo-fixed-09-r1",
          type: "single_choice",
          stem: "設計例 09：あるチームが、複数のAPIをGateway経由で公開する構成を検討しています。商品検索APIと注文APIは別のサービスで動作し、クライアントは共通の入口へリクエストします。商品検索は /catalog、注文は /orders というパスで識別する想定です。\n\n運用チームは、接続先の変更と、受信したリクエストを振り分ける条件を別々に見直したいと考えています。レビューでは「どの入口条件で、どの接続先を利用するか」を説明できるようにしたい、という要望がありました。下の設計メモを読み、リクエストの振り分け条件を確認する観点として最も適切なものを1つ選んでください。",
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
          userOptionIds: [],
          order: 9,
          topic: "基本概念・リクエストの流れ",
          confirmed: false,
        },
        {
          questionId: "Q-demo-fixed-10",
          questionRevisionId: "QR-demo-fixed-10-r1",
          type: "single_choice",
          stem: "設計例 10：あるチームが、複数のAPIをGateway経由で公開する構成を検討しています。商品検索APIと注文APIは別のサービスで動作し、クライアントは共通の入口へリクエストします。商品検索は /catalog、注文は /orders というパスで識別する想定です。\n\n運用チームは、接続先の変更と、受信したリクエストを振り分ける条件を別々に見直したいと考えています。レビューでは「どの入口条件で、どの接続先を利用するか」を説明できるようにしたい、という要望がありました。下の設計メモを読み、リクエストの振り分け条件を確認する観点として最も適切なものを1つ選んでください。",
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
          userOptionIds: [],
          order: 10,
          topic: "基本概念・リクエストの流れ",
          confirmed: false,
        },
        {
          questionId: "Q-demo-fixed-11",
          questionRevisionId: "QR-demo-fixed-11-r1",
          type: "single_choice",
          stem: "設計例 11：あるチームが、複数のAPIをGateway経由で公開する構成を検討しています。商品検索APIと注文APIは別のサービスで動作し、クライアントは共通の入口へリクエストします。商品検索は /catalog、注文は /orders というパスで識別する想定です。\n\n運用チームは、接続先の変更と、受信したリクエストを振り分ける条件を別々に見直したいと考えています。レビューでは「どの入口条件で、どの接続先を利用するか」を説明できるようにしたい、という要望がありました。下の設計メモを読み、リクエストの振り分け条件を確認する観点として最も適切なものを1つ選んでください。",
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
          userOptionIds: [],
          order: 11,
          topic: "基本概念・リクエストの流れ",
          confirmed: false,
        },
        {
          questionId: "Q-demo-fixed-12",
          questionRevisionId: "QR-demo-fixed-12-r1",
          type: "multiple_select",
          stem: "設計例 12：構成レビューの前に、Gatewayを経由するリクエストの流れをチームで確認します。接続先、受信条件、運用時の確認方法を、読み手が取り違えないメモにすることが目的です。複数のAPIと長い設定例が含まれているため、情報を分けて整理する必要があります。\n\n次の候補から、リクエストの流れを説明する設計メモへ含める情報をすべて選んでください。",
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
          userOptionIds: [],
          order: 12,
          topic: "構成・主要エンティティ",
          confirmed: false,
        },
        {
          questionId: "Q-demo-fixed-13",
          questionRevisionId: "QR-demo-fixed-13-r1",
          type: "single_choice",
          stem: "設計例 13：あるチームが、複数のAPIをGateway経由で公開する構成を検討しています。商品検索APIと注文APIは別のサービスで動作し、クライアントは共通の入口へリクエストします。商品検索は /catalog、注文は /orders というパスで識別する想定です。\n\n運用チームは、接続先の変更と、受信したリクエストを振り分ける条件を別々に見直したいと考えています。レビューでは「どの入口条件で、どの接続先を利用するか」を説明できるようにしたい、という要望がありました。下の設計メモを読み、リクエストの振り分け条件を確認する観点として最も適切なものを1つ選んでください。",
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
          userOptionIds: [],
          order: 13,
          topic: "基本概念・リクエストの流れ",
          confirmed: false,
        },
        {
          questionId: "Q-demo-fixed-14",
          questionRevisionId: "QR-demo-fixed-14-r1",
          type: "single_choice",
          stem: "設計例 14：あるチームが、複数のAPIをGateway経由で公開する構成を検討しています。商品検索APIと注文APIは別のサービスで動作し、クライアントは共通の入口へリクエストします。商品検索は /catalog、注文は /orders というパスで識別する想定です。\n\n運用チームは、接続先の変更と、受信したリクエストを振り分ける条件を別々に見直したいと考えています。レビューでは「どの入口条件で、どの接続先を利用するか」を説明できるようにしたい、という要望がありました。下の設計メモを読み、リクエストの振り分け条件を確認する観点として最も適切なものを1つ選んでください。",
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
          userOptionIds: [],
          order: 14,
          topic: "基本概念・リクエストの流れ",
          confirmed: false,
        },
        {
          questionId: "Q-demo-fixed-15",
          questionRevisionId: "QR-demo-fixed-15-r1",
          type: "single_choice",
          stem: "設計例 15：あるチームが、複数のAPIをGateway経由で公開する構成を検討しています。商品検索APIと注文APIは別のサービスで動作し、クライアントは共通の入口へリクエストします。商品検索は /catalog、注文は /orders というパスで識別する想定です。\n\n運用チームは、接続先の変更と、受信したリクエストを振り分ける条件を別々に見直したいと考えています。レビューでは「どの入口条件で、どの接続先を利用するか」を説明できるようにしたい、という要望がありました。下の設計メモを読み、リクエストの振り分け条件を確認する観点として最も適切なものを1つ選んでください。",
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
          userOptionIds: [],
          order: 15,
          topic: "基本概念・リクエストの流れ",
          confirmed: false,
        },
        {
          questionId: "Q-demo-fixed-16",
          questionRevisionId: "QR-demo-fixed-16-r1",
          type: "multiple_select",
          stem: "設計例 16：構成レビューの前に、Gatewayを経由するリクエストの流れをチームで確認します。接続先、受信条件、運用時の確認方法を、読み手が取り違えないメモにすることが目的です。複数のAPIと長い設定例が含まれているため、情報を分けて整理する必要があります。\n\n次の候補から、リクエストの流れを説明する設計メモへ含める情報をすべて選んでください。",
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
          userOptionIds: [],
          order: 16,
          topic: "構成・主要エンティティ",
          confirmed: false,
        },
        {
          questionId: "Q-demo-fixed-17",
          questionRevisionId: "QR-demo-fixed-17-r1",
          type: "single_choice",
          stem: "設計例 17：あるチームが、複数のAPIをGateway経由で公開する構成を検討しています。商品検索APIと注文APIは別のサービスで動作し、クライアントは共通の入口へリクエストします。商品検索は /catalog、注文は /orders というパスで識別する想定です。\n\n運用チームは、接続先の変更と、受信したリクエストを振り分ける条件を別々に見直したいと考えています。レビューでは「どの入口条件で、どの接続先を利用するか」を説明できるようにしたい、という要望がありました。下の設計メモを読み、リクエストの振り分け条件を確認する観点として最も適切なものを1つ選んでください。",
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
          userOptionIds: [],
          order: 17,
          topic: "基本概念・リクエストの流れ",
          confirmed: false,
        },
        {
          questionId: "Q-demo-fixed-18",
          questionRevisionId: "QR-demo-fixed-18-r1",
          type: "single_choice",
          stem: "設計例 18：あるチームが、複数のAPIをGateway経由で公開する構成を検討しています。商品検索APIと注文APIは別のサービスで動作し、クライアントは共通の入口へリクエストします。商品検索は /catalog、注文は /orders というパスで識別する想定です。\n\n運用チームは、接続先の変更と、受信したリクエストを振り分ける条件を別々に見直したいと考えています。レビューでは「どの入口条件で、どの接続先を利用するか」を説明できるようにしたい、という要望がありました。下の設計メモを読み、リクエストの振り分け条件を確認する観点として最も適切なものを1つ選んでください。",
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
          userOptionIds: [],
          order: 18,
          topic: "基本概念・リクエストの流れ",
          confirmed: false,
        },
        {
          questionId: "Q-demo-fixed-19",
          questionRevisionId: "QR-demo-fixed-19-r1",
          type: "single_choice",
          stem: "設計例 19：あるチームが、複数のAPIをGateway経由で公開する構成を検討しています。商品検索APIと注文APIは別のサービスで動作し、クライアントは共通の入口へリクエストします。商品検索は /catalog、注文は /orders というパスで識別する想定です。\n\n運用チームは、接続先の変更と、受信したリクエストを振り分ける条件を別々に見直したいと考えています。レビューでは「どの入口条件で、どの接続先を利用するか」を説明できるようにしたい、という要望がありました。下の設計メモを読み、リクエストの振り分け条件を確認する観点として最も適切なものを1つ選んでください。",
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
          userOptionIds: [],
          order: 19,
          topic: "基本概念・リクエストの流れ",
          confirmed: false,
        },
        {
          questionId: "Q-demo-fixed-20",
          questionRevisionId: "QR-demo-fixed-20-r1",
          type: "multiple_select",
          stem: "設計例 20：構成レビューの前に、Gatewayを経由するリクエストの流れをチームで確認します。接続先、受信条件、運用時の確認方法を、読み手が取り違えないメモにすることが目的です。複数のAPIと長い設定例が含まれているため、情報を分けて整理する必要があります。\n\n次の候補から、リクエストの流れを説明する設計メモへ含める情報をすべて選んでください。",
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
          userOptionIds: [],
          order: 20,
          topic: "構成・主要エンティティ",
          confirmed: false,
        },
      ],
    },
  },
};
