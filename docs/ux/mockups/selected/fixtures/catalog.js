// Static Mock専用の架空Fixture。API Payload / Persistence Modelではありません。
window.refriqSelectedCatalog = {
  overview: {
    certification: "Kong Gateway Certified Associate",
    greeting: "今日も、ひとつ理解を深めよう。",
    availableQuestions: 32,
    practice: {
      correct: 38,
      total: 52,
      percentage: 73,
      sessions: 5,
    },
    mock: {
      correct: 31,
      total: 40,
      percentage: 78,
      sessions: 2,
    },
    active: [
      {
        mode: "演習",
        position: 3,
        total: 10,
        text: "2問の回答を確定済み",
      },
      {
        mode: "模擬試験",
        position: 3,
        total: 20,
        text: "途中保存済み・未提出",
      },
    ],
    topics: [
      {
        name: "基本概念・リクエストの流れ",
        practice: 83,
        mock: 80,
        count: 12,
        practiceCount: {
          correct: 10,
          total: 12,
        },
        mockCount: {
          correct: 8,
          total: 10,
        },
      },
      {
        name: "構成・主要エンティティ",
        practice: 67,
        mock: 75,
        count: 15,
        practiceCount: {
          correct: 10,
          total: 15,
        },
        mockCount: {
          correct: 9,
          total: 12,
        },
      },
      {
        name: "トラフィックの振り分け",
        practice: 60,
        mock: 67,
        count: 10,
        practiceCount: {
          correct: 6,
          total: 10,
        },
        mockCount: {
          correct: 6,
          total: 9,
        },
      },
      {
        name: "セキュリティ・アクセス制御",
        practice: 80,
        mock: 75,
        count: 10,
        practiceCount: {
          correct: 8,
          total: 10,
        },
        mockCount: {
          correct: 6,
          total: 8,
        },
      },
      {
        name: "API設計・OpenAPI",
        practice: null,
        mock: null,
        count: 0,
        practiceCount: {
          correct: 0,
          total: 0,
        },
        mockCount: {
          correct: 0,
          total: 0,
        },
      },
      {
        name: "導入・運用・バージョン管理",
        practice: 75,
        mock: 75,
        count: 4,
        practiceCount: {
          correct: 3,
          total: 4,
        },
        mockCount: {
          correct: 3,
          total: 4,
        },
      },
      {
        name: "プラグイン・可観測性",
        practice: 67,
        mock: 83,
        count: 6,
        practiceCount: {
          correct: 4,
          total: 6,
        },
        mockCount: {
          correct: 5,
          total: 6,
        },
      },
      {
        name: "トラブルシューティング",
        practice: 50,
        mock: 67,
        count: 6,
        practiceCount: {
          correct: 3,
          total: 6,
        },
        mockCount: {
          correct: 4,
          total: 6,
        },
      },
    ],
    history: [
      {
        date: "10月2日 19:42",
        mode: "演習",
        summary: "8 / 10問",
        rate: "80%",
        state: "完了",
        resultKey: "historyPractice80",
      },
      {
        date: "10月1日 20:10",
        mode: "模擬試験",
        summary: "17 / 20問",
        rate: "85%",
        state: "提出済み",
        resultKey: "historyMock85",
      },
      {
        date: "9月30日 18:35",
        mode: "演習",
        summary: "7 / 10問",
        rate: "70%",
        state: "完了",
        resultKey: "historyPractice70",
      },
      {
        date: "9月28日 21:15",
        mode: "模擬試験",
        summary: "14 / 20問",
        rate: "70%",
        state: "提出済み",
        resultKey: "historyMock70",
      },
    ],
  },
  certification: {
    id: "cert-demo-kgca",
    name: "Kong Gateway Certified Associate",
    description:
      "Gatewayの基本概念・設定・運用を、演習と模擬試験で確認します。",
    availableQuestionCount: 32,
    uniqueIdentityExample: {
      questionId: "Q-demo-current-01",
      revisions: ["QR-demo-current-01-r1", "QR-demo-current-01-r2"],
      count: 1,
    },
  },
  modes: {
    practice: {
      label: "演習",
      total: 10,
    },
    mock: {
      label: "模擬試験",
      total: 20,
    },
  },
};
