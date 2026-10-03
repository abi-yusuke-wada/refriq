(() => {
  const params = new URLSearchParams(location.search);
  const definitions = {
    home: {
      title: "ホーム",
      subtitle: "今日の学習を、自分のペースで。",
      states: ["normal", "loading", "empty", "fetch-error"],
    },
    certification: {
      title: "資格詳細",
      subtitle: "学ぶ範囲と、学習の始め方を確認。",
      states: ["normal", "loading", "empty", "fetch-error"],
    },
    "practice-start": {
      title: "10問演習を始める",
      subtitle: "1問ごとに理解を確かめます。",
      states: ["normal", "existing", "unavailable", "starting"],
    },
    "mock-start": {
      title: "20問の模擬試験を始める",
      subtitle: "時間を気にせず、最後にまとめて振り返ります。",
      states: ["normal", "existing", "unavailable", "starting"],
    },
    practice: {
      title: "10問演習",
      subtitle: "問題を読み、選択してから回答を確定。",
      states: [
        "normal",
        "unanswered",
        "save-in-progress",
        "save-failed",
        "save-succeeded",
        "result-fetch-failed",
        "paused",
      ],
    },
    mock: {
      title: "模擬試験",
      subtitle: "提出までは回答を変更できます。時間制限はありません。",
      states: [
        "normal",
        "unanswered",
        "unsaved",
        "intermediate-save-in-progress",
        "intermediate-save-failed",
        "stale",
        "final-save-in-progress",
        "final-save-failed",
        "submitted",
        "result-fetch-failed",
        "paused",
      ],
    },
    explanation: {
      title: "回答と解説",
      subtitle: "確定済み回答の理由を、問題と一緒に確認。",
      states: ["normal", "loading", "result-fetch-failed"],
    },
    result: {
      title: "学習結果",
      subtitle: "結果を振り返り、次の学習につなげます。",
      states: [
        "normal",
        "submitted",
        "all-correct",
        "loading",
        "empty",
        "fetch-error",
        "result-fetch-failed",
      ],
    },
    incorrect: {
      title: "誤答一覧",
      subtitle: "この回の誤答・未回答を確認します。",
      states: ["normal", "loading", "empty", "fetch-error"],
    },
    "incorrect-detail": {
      title: "誤答の振り返り",
      subtitle: "回答時点の問題・解説・出典を確認。",
      states: ["normal", "unanswered", "loading", "empty", "fetch-error"],
    },
    topics: {
      title: "分野別正答率",
      subtitle: "分野ごとの学習状況を確認。",
      states: ["normal", "loading", "empty", "fetch-error"],
    },
    progress: {
      title: "Learning Progress",
      subtitle: "演習と模擬試験を分けて、学びの積み重ねを見る。",
      states: ["normal", "loading", "empty", "fetch-error"],
    },
  };
  const stateNames = {
    normal: "通常",
    loading: "Loading",
    empty: "Empty（正常なデータなし）",
    "fetch-error": "Fetch Error",
    existing: "進行中Sessionあり",
    unavailable: "一意Question数が不足",
    starting: "開始条件確認・Snapshot固定",
    unanswered: "未回答",
    "save-in-progress": "回答保存中",
    "save-failed": "回答保存失敗",
    "save-succeeded": "回答保存成功・結果取得中",
    "result-fetch-failed": "保存/提出成功・結果取得失敗",
    unsaved: "最新回答が未保存",
    "intermediate-save-in-progress": "途中保存中（編集可能）",
    "intermediate-save-failed": "途中保存失敗（編集可能）",
    stale: "古い保存成功・最新回答は未保存",
    "final-save-in-progress": "最終提出保存中",
    "final-save-failed": "最終提出失敗・未提出",
    submitted: "提出成功",
    "all-correct": "全問正解の結果例",
    paused: "中断済み・再開例",
  };
  const screen = Object.hasOwn(definitions, params.get("screen"))
    ? params.get("screen")
    : "home";
  const definition = definitions[screen];
  const mode = ["mock", "mock-start"].includes(screen)
    ? "mock"
    : ["practice", "practice-start"].includes(screen)
      ? "practice"
      : params.get("mode") === "mock"
        ? "mock"
        : "practice";
  const allowedStates = definition.states.filter(
    (s) =>
      !(
        screen === "incorrect-detail" &&
        mode === "practice" &&
        s === "unanswered"
      ),
  );
  const state = allowedStates.includes(params.get("state"))
    ? params.get("state")
    : "normal";
  const navigationState = [
    "intermediate-save-in-progress",
    "intermediate-save-failed",
    "stale",
    "unsaved",
  ].includes(state)
    ? state
    : "normal";
  const total = mode === "mock" ? 20 : 10;
  const qNumber = Math.min(
    total,
    Math.max(
      1,
      Math.floor(Number(params.get("q"))) ||
        (screen === "incorrect-detail"
          ? mode === "mock" && state === "unanswered"
            ? 20
            : 4
          : 3),
    ),
  );
  const modeLabel = mode === "mock" ? "模擬試験" : "演習";
  const readState = [
    "loading",
    "empty",
    "fetch-error",
    "result-fetch-failed",
  ].includes(state);
  const resultKeys = [
    "currentPractice",
    "currentMock",
    "historyPractice80",
    "historyPractice70",
    "historyMock85",
    "historyMock70",
  ];
  const requestedResult = params.get("result");
  const resultKey =
    resultKeys.includes(requestedResult) &&
    requestedResult.toLowerCase().includes(mode)
      ? requestedResult
      : mode === "mock"
        ? "currentMock"
        : "currentPractice";
  const resultVariant =
    state === "all-correct" || params.get("resultVariant") === "all-correct"
      ? "all-correct"
      : "normal";
  let fixture;
  if (
    ["practice", "mock"].includes(screen) ||
    (readState &&
      ["explanation", "result", "incorrect", "incorrect-detail"].includes(
        screen,
      ))
  )
    fixture = "session-before";
  else if (screen === "explanation") fixture = "answer-after";
  else if (
    ["result", "incorrect", "incorrect-detail"].includes(screen) ||
    (screen === "topics" && params.get("scope") === "session")
  )
    fixture = readState ? "session-before" : "result-after";
  else fixture = "catalog";
  const fixturePath =
    fixture === "answer-after"
      ? `answer-after/${mode}-${String(qNumber).padStart(2, "0")}`
      : fixture === "result-after"
        ? `result-after/${resultKey}${params.get("session") === "new" && resultKey.startsWith("current") ? "-new" : ""}${resultVariant === "all-correct" ? "-all-correct" : ""}`
        : fixture;
  let drafts = {};
  try {
    const value = JSON.parse(params.get("draft") || "{}");
    if (value && typeof value === "object" && !Array.isArray(value))
      drafts = value;
  } catch {
    drafts = {};
  }
  let dirty =
    params.get("unsaved") === "1" ||
    [
      "unsaved",
      "intermediate-save-in-progress",
      "intermediate-save-failed",
      "stale",
    ].includes(state);
  // Review-only markers for the latest own answers; not a persistence model.
  const positions = (value) =>
    new Set(
      (value || "")
        .split(",")
        .map(Number)
        .filter((n) => n >= 1 && n <= total),
    );
  const pendingPositions = positions(params.get("pending"));
  if (mode === "mock" && dirty && !pendingPositions.size)
    pendingPositions.add(qNumber);
  if (!dirty) pendingPositions.clear();
  const failedPositions = positions(
    params.has("failed")
      ? params.get("failed")
      : [...pendingPositions].join(","),
  );
  let currentQuestion;
  let currentSession;
  // Review-only URL state carries saved own answers; there is no persistence.
  let suspended = {};
  try {
    const value = JSON.parse(params.get("resume") || "{}");
    if (value && typeof value === "object" && !Array.isArray(value))
      suspended = value;
  } catch {
    suspended = {};
  }
  let confirmedPositions = new Set(
    (params.get("confirmed") || "")
      .split(",")
      .map(Number)
      .filter((n) => n >= 1 && n <= total),
  );
  const busy =
    mode === "practice"
      ? state === "save-in-progress"
      : state === "final-save-in-progress";
  const locked =
    mode === "practice"
      ? [
          "save-in-progress",
          "save-failed",
          "save-succeeded",
          "result-fetch-failed",
        ].includes(state)
      : [
          "final-save-in-progress",
          "final-save-failed",
          "submitted",
          "result-fetch-failed",
        ].includes(state);
  const app = document.getElementById("app");
  const toolbar = document.getElementById("review-toolbar");
  function esc(value) {
    return String(value).replace(
      /[&<>"']/g,
      (char) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[char],
    );
  }
  function url(nextScreen = screen, extras = {}) {
    const query = new URLSearchParams({
      screen: nextScreen,
      mode,
      result: resultKey,
      ...extras,
    });
    const sameResult =
      (extras.mode || mode) === mode &&
      (extras.result || resultKey) === resultKey;
    const resultView =
      ["result", "incorrect", "incorrect-detail"].includes(nextScreen) ||
      (nextScreen === "topics" &&
        (extras.scope || params.get("scope")) === "session");
    if (nextScreen === "topics" && !Object.hasOwn(extras, "scope"))
      query.set("scope", params.get("scope") || "cumulative");
    if (
      sameResult &&
      resultView &&
      (extras.resultVariant || resultVariant) === "all-correct"
    ) {
      query.set("resultVariant", "all-correct");
      if (
        nextScreen === "result" &&
        (!extras.state || extras.state === "normal")
      )
        query.set("state", "all-correct");
    }
    if (["practice", "mock", "explanation"].includes(nextScreen)) {
      if (!Object.hasOwn(extras, "q")) query.set("q", String(qNumber));
      if (Object.keys(drafts).length && !Object.hasOwn(extras, "draft"))
        query.set("draft", JSON.stringify(drafts));
      if (dirty && !Object.hasOwn(extras, "unsaved")) query.set("unsaved", "1");
      if (mode === "mock") {
        query.set(
          "pending",
          extras.unsaved === "0" ? "" : [...pendingPositions].join(","),
        );
        query.set(
          "failed",
          extras.unsaved === "0"
            ? ""
            : [
                ...(extras.state === "intermediate-save-failed" &&
                state !== "intermediate-save-failed"
                  ? pendingPositions
                  : failedPositions),
              ].join(","),
        );
      }
      if (mode === "practice" && !Object.hasOwn(extras, "confirmed"))
        query.set("confirmed", [...confirmedPositions].join(","));
    }
    if (Object.keys(suspended).length && !Object.hasOwn(extras, "resume"))
      query.set("resume", JSON.stringify(suspended));
    if (params.get("session") === "new" && !Object.hasOwn(extras, "session"))
      query.set("session", "new");
    if (extras.session === "new" && state === "starting") {
      query.delete("draft");
      query.set("confirmed", "");
      query.set("unsaved", "0");
      query.delete("pending");
      query.delete("failed");
      const remaining = { ...suspended };
      delete remaining[mode];
      query.set("resume", JSON.stringify(remaining));
    }
    return `view.html?${query}`;
  }
  function link(text, target, primary = false, extras = {}) {
    return `<a class="button${primary ? " primary" : ""}" href="${esc(url(target, extras))}" data-route="${esc(target)}" data-extras="${esc(JSON.stringify(extras))}">${esc(text)}</a>`;
  }
  function resumeExtras(target, position) {
    const saved = suspended[target];
    return {
      mode: target,
      q: saved?.q || position,
      state: "normal",
      unsaved: "0",
      session: saved?.session || "existing",
      ...(saved
        ? { draft: JSON.stringify(saved.draft), confirmed: saved.confirmed }
        : {}),
    };
  }
  function activeLearning() {
    if (screen === "explanation") return mode === "practice" && qNumber < 10;
    return (
      ["practice", "mock"].includes(screen) &&
      state !== "paused" &&
      !(mode === "mock" && ["submitted", "result-fetch-failed"].includes(state))
    );
  }
  function leaveLearning(target, extras = {}) {
    const pending =
      mode === "mock"
        ? dirty
        : currentQuestion &&
          !currentQuestion.confirmed &&
          userAnswers(currentQuestion).length > 0;
    if (
      pending ||
      busy ||
      ["save-failed", "final-save-failed"].includes(state)
    ) {
      decision(
        "まだ移動できません",
        "最新の回答がまだ保存されていません。保存完了後に移動してください。回答は保持しています。",
        null,
        {},
        "",
        "学習を続ける",
      );
      return;
    }
    const nextSuspended = {
      ...suspended,
      [mode]: {
        q: qNumber,
        session: params.get("session") === "new" ? "new" : "existing",
        draft: drafts,
        confirmed: [...confirmedPositions].join(","),
      },
    };
    decision(
      "学習を中断して移動しますか？",
      "学習を中断して移動します。保存済みの状態から後で再開できます。",
      target,
      { ...extras, resume: JSON.stringify(nextSuspended) },
      "中断して移動",
      "学習を続ける",
    );
  }
  function panel(title, body, className = "") {
    return `<section class="panel ${className}"><h2>${title}</h2>${body}</section>`;
  }
  function notice(title, text, kind = "", actions = "") {
    return `<div class="notice ${kind}" role="${kind === "error" ? "alert" : "status"}"><strong>${esc(title)}</strong><p>${esc(text)}</p>${actions ? `<div class="button-row">${actions}</div>` : ""}</div>`;
  }
  function badge(text, kind = "") {
    return `<span class="badge ${kind}">${esc(text)}</span>`;
  }
  function track(value) {
    return `<div class="progress-track" aria-hidden="true"><span style="width:${value}%"></span></div>`;
  }
  function stat(label, value, detail) {
    return `<div class="stat"><span class="small muted">${esc(label)}</span><strong>${value}</strong><span class="small muted">${esc(detail)}</span></div>`;
  }
  function shell(content) {
    const nav = [
      ["home", "ホーム"],
      ["certification", "学習する"],
      ["progress", "学習進捗"],
    ]
      .map(([target, label]) => {
        const active =
          screen === target ||
          (target === "certification" &&
            [
              "practice-start",
              "mock-start",
              "practice",
              "mock",
              "explanation",
            ].includes(screen));
        return `<a href="${esc(url(target))}" data-leave${active ? ' aria-current="page"' : ""}>${label}</a>`;
      })
      .join("");
    return `<header class="app-header"><a class="wordmark" href="${url("home")}" data-leave>refriq</a><nav aria-label="メインNavigation">${nav}</nav>${badge("Learner · KGCA")}</header><main class="page ${["practice", "mock", "explanation", "incorrect-detail"].includes(screen) ? "question-page" : ""}"><header class="page-heading"><div class="breadcrumbs"><a href="${url("home")}" data-leave>ホーム</a> / ${esc(definition.title)}</div><p class="eyebrow">KONG GATEWAY CERTIFIED ASSOCIATE</p><h1>${esc(definition.title)}</h1><p>${esc(definition.subtitle)}</p></header><div class="content-grid"><div class="main-pane">${content.main}</div><aside class="support-pane" aria-label="Supporting information">${content.support}</aside></div></main><dialog id="decision-dialog" aria-labelledby="dialog-title"><h2 id="dialog-title"></h2><p id="dialog-copy"></p><div class="button-row"><button class="button" id="dialog-cancel" type="button">戻る</button><a class="button primary" id="dialog-confirm" href="#">続ける</a></div></dialog>`;
  }
  function userAnswers(q) {
    const supplied = drafts[q.questionId];
    if (Array.isArray(supplied))
      return supplied.filter((id) => q.options.some((o) => o.id === id));
    if (state === "unanswered" && q.order === qNumber) return [];
    if (mode === "practice" && locked && q.order === qNumber)
      return q.pendingOptionIds || q.userOptionIds;
    return q.userOptionIds;
  }
  function history(overview) {
    return panel(
      "最近の学習履歴",
      overview.history
        .slice(0, 3)
        .map(
          (item) =>
            `<div class="history-row"><a href="${esc(url("result", { mode: item.mode === "模擬試験" ? "mock" : "practice", result: item.resultKey }))}">${esc(item.date)} · ${esc(item.mode)}</a><p>${esc(item.summary)} 正解 / ${esc(item.rate)}<br>${esc(item.state)}</p></div>`,
        )
        .join(""),
    );
  }
  function continuation(overview) {
    return panel(
      "続きから学習する",
      overview.active
        .map((item) => {
          const target = item.mode === "演習" ? "practice" : "mock";
          const extras = resumeExtras(target, item.position);
          return `<div class="resume-row"><strong>${esc(item.mode)}</strong><p>${suspended[target] ? `問題${extras.q}から再開できます。` : esc(item.text)}</p>${track(((extras.q - 1) / item.total) * 100)}<p><a href="${esc(url(target, extras))}">前回と同じ問題・同じ順番で再開 →</a></p></div>`;
        })
        .join(""),
    );
  }
  function topicTable(topics, modeSpecific = false) {
    const rows = topics
      .map((topic) => {
        const count = modeSpecific ? topic[`${mode}Count`] : topic;
        const rate = modeSpecific ? topic[mode] : topic.percentage;
        return `<tr><td>${esc(topic.name)}</td><td>${count.total ? `${count.correct} / ${count.total}` : "—"}</td><td>${rate === null || !count.total ? '<span class="not-learned">未学習</span>' : `${rate}%${track(rate)}`}</td></tr>`;
      })
      .join("");
    return `<div class="table-wrap"><table><thead><tr><th scope="col">分野</th><th scope="col">正答 / 対象回答</th><th scope="col">正答率</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }
  function tabs() {
    return `<nav class="tabs" aria-label="集計モード">${["practice", "mock"].map((m) => `<a href="${esc(url(screen, { mode: m, scope: params.get("scope") || "cumulative" }))}"${m === mode ? ' aria-current="page"' : ""}>${m === "practice" ? "演習" : "模擬試験"}</a>`).join("")}</nav>`;
  }
  function home(data) {
    const o = data.overview;
    return {
      main:
        panel(
          "今日も、ひとつ理解を深めよう。",
          '<p>問題を解きながら理解する演習と、まとめて力を確かめる模擬試験。今日の学び方を選びましょう。</p><div class="button-row">' +
            link("10問の演習へ", "practice-start", true, {
              state: "existing",
            }) +
            link("20問の模擬試験へ", "mock-start", false, {
              state: "existing",
            }) +
            "</div>",
          "hero",
        ) +
        '<div class="stats">' +
        stat(
          "演習の累積正答率",
          `${o.practice.percentage}<span>%</span>`,
          `${o.practice.total}件の確定回答`,
        ) +
        stat(
          "模試の累積正答率",
          `${o.mock.percentage}<span>%</span>`,
          `${o.mock.sessions}回の提出済み試験`,
        ) +
        "</div>" +
        panel(
          "最近の学習概要",
          `<p>演習と模試の結果は別々に集計します。履歴から、その時に回答した問題と解説を確認できます。</p><div class="button-row">${link("Learning Progressを見る", "progress")}${link("資格と学習範囲", "certification")}</div>`,
        ),
      support:
        continuation(o) +
        history(o) +
        panel(
          "対象資格",
          `<p>${esc(o.certification)}</p><p class="small muted">8分野の基礎・構成・運用を学びます。</p>`,
        ),
    };
  }
  function certification(data) {
    return {
      main:
        panel(
          esc(data.certification.name),
          `<p>${esc(data.certification.description)}</p><dl class="definition"><dt>利用可能な問題数</dt><dd><strong>${data.certification.availableQuestionCount}問</strong></dd><dt>演習</dt><dd>10問 / 各問の確定後に解説</dd><dt>模擬試験</dt><dd>20問 / 時間制限なし / 提出後に解説</dd></dl><div class="button-row">${link("演習を始める", "practice-start", true, { state: "existing" })}${link("模擬試験を始める", "mock-start", false, { state: "existing" })}</div>`,
          "hero",
        ) +
        panel(
          "学習する分野",
          `<ul class="topic-list">${data.overview.topics.map((t) => `<li>${esc(t.name)}</li>`).join("")}</ul>`,
        ),
      support:
        continuation(data.overview) +
        panel(
          "学習状況",
          `<p>演習・模試別の分野の傾向を確認できます。</p>${link("学習進捗へ", "progress")}`,
        ),
    };
  }
  function start(data) {
    const insufficient = state === "unavailable";
    const available = insufficient
      ? total - 1
      : data.certification.availableQuestionCount;
    const startFlow =
      '<ol class="steps"><li>開始時に問題の内容と順序を固定します。</li><li>この回の中では同じ問題を重複して出題しません。</li><li>中断後も、同じ問題・同じ順序から再開します。</li></ol>';
    let actions;
    if (insufficient)
      actions = notice(
        "開始できません",
        `${total}問必要ですが、現在利用可能な問題は${available}問です。問題が追加されてから始められます。`,
        "warning",
      );
    else if (state === "existing")
      actions = notice(
        `進行中の${modeLabel}があります`,
        "続きから再開できます。新しく始める場合は、進行中の学習を終了するか確認します。",
        "",
        link("続きから再開", mode, true, resumeExtras(mode, 3)) +
          '<button class="button" id="new-session" type="button">終了して新しく始める</button>',
      );
    else if (state === "starting")
      actions =
        notice(
          "開始する問題を準備しています",
          "問題の内容と順序を確認しています。準備が整うまでお待ちください。",
        ) +
        '<button class="button primary" disabled type="button">開始準備中…</button>';
    else
      actions =
        '<div class="button-row">' +
        link(`${total}問の${modeLabel}を開始`, screen, true, {
          state: "starting",
        }) +
        link("資格詳細へ戻る", "certification") +
        "</div>";
    return {
      main:
        panel(
          `${modeLabel}の進め方`,
          `<dl class="definition"><dt>問題数</dt><dd>${total}問</dd><dt>対象</dt><dd>全分野の利用可能な問題</dd><dt>解説</dt><dd>${mode === "practice" ? "各問の回答確定・保存成功後" : "最終提出成功後"}</dd><dt>回答変更</dt><dd>${mode === "practice" ? "各問の確定前まで" : "最終提出前まで"}</dd>${mode === "mock" ? "<dt>制限時間</dt><dd>なし</dd>" : ""}</dl>${actions}`,
          "hero",
        ) +
        panel(
          "開始時に固定するもの",
          startFlow +
            '<p class="small muted">後から問題の内容が更新されても、開始済みの回では開始時点の問題を使います。</p>',
        ),
      support:
        panel(
          "開始条件",
          `<p>必要：${total}問<br>利用可能：${available}問</p><p>同じ問題の改訂版が複数あっても、利用できる問題数は1問として数えます。</p>`,
        ) +
        panel(
          "途中で中断できます",
          "<p>保存済みの回答を保ち、前回と同じ問題・同じ順番から再開します。</p>",
        ),
    };
  }
  function saveLabel() {
    if (state === "stale") return "⚠ 古い回答の保存は成功 / 最新回答は未保存";
    if (["save-in-progress", "intermediate-save-in-progress"].includes(state))
      return "… 保存中";
    if (["save-failed", "intermediate-save-failed"].includes(state))
      return "! 保存失敗・回答を保持";
    if (state === "final-save-in-progress") return "… 最終提出の保存中・未提出";
    if (state === "final-save-failed") return "! 最終提出失敗・未提出";
    if (["submitted", "result-fetch-failed"].includes(state) && mode === "mock")
      return "✓ 最終提出済み";
    if (
      ["save-succeeded", "result-fetch-failed"].includes(state) ||
      screen === "explanation"
    )
      return "✓ 回答確定・保存済み";
    return mode === "mock"
      ? dirty
        ? "⚠ 最新回答は未保存"
        : "✓ 最新の状態は保存済み"
      : "回答未確定";
  }
  function rail(session, q, readonly = false) {
    const answered = session.questions.filter(
      (item) => userAnswers(item).length,
    ).length;
    const confirmed = session.questions.filter((item) => item.confirmed).length;
    const navigation =
      mode === "mock"
        ? `<div class="navigation-grid" aria-label="問題Navigation">${session.questions
            .map((item) => {
              const supplied = userAnswers(item).length > 0;
              const pending = !readonly && pendingPositions.has(item.order);
              const failed =
                pending &&
                state === "intermediate-save-failed" &&
                failedPositions.has(item.order);
              const status = failed
                ? "failed"
                : pending
                  ? "unsaved"
                  : supplied
                    ? "saved"
                    : "unanswered";
              const label = failed
                ? "保存失敗"
                : pending
                  ? "未保存"
                  : supplied
                    ? "保存済み"
                    : "回答なし";
              const icon = failed ? "!" : pending ? "●" : supplied ? "✓" : "○";
              const answerLabel = supplied ? "回答あり" : "回答なし";
              return `<a class="${status}" data-save-state="${status}" href="${esc(url("mock", { q: item.order, state: readonly ? "submitted" : navigationState }))}" data-route="mock" data-extras="${esc(JSON.stringify({ q: item.order, state: readonly ? "submitted" : navigationState }))}"${item.order === q.order ? ' aria-current="step"' : ""}${locked && !readonly ? ' aria-disabled="true"' : ""} aria-label="問題${item.order}・${answerLabel}${supplied || pending ? `・${label}` : ""}${item.order === q.order ? "・現在の問題" : ""}" title="${answerLabel}${supplied || pending ? `・${label}` : ""}"><span>${item.order}</span><small aria-hidden="true">${!supplied && pending ? "○ " : ""}${icon}</small></a>`;
            })
            .join(
              "",
            )}</div><p class="navigation-legend"><span>○ 回答なし</span><span>✓ 回答あり・保存済み</span><span>● 最新の変更が未保存</span><span>! 途中保存に失敗</span><span>太枠：現在の問題</span></p>`
        : "";
    return panel(
      "現在の位置",
      `<div class="rail-counter">${q.order}<span> / ${total}問</span></div><p>${mode === "mock" ? `${answered}問に回答` : `${confirmed}問の回答を確定済み`}</p>${track(((mode === "mock" ? answered : confirmed) / total) * 100)}<div class="save-state" id="save-indicator" aria-live="polite">${esc(saveLabel())}</div>${navigation}`,
    );
  }
  function answerOptions(q, selected, disabled) {
    return `<fieldset><legend>${q.type === "multiple_select" ? "当てはまるものをすべて選んでください" : "選択肢を1つ選んでください"}</legend>${q.options.map((option) => `<label class="option"><input type="${q.type === "multiple_select" ? "checkbox" : "radio"}" name="answer" value="${esc(option.id)}"${selected.includes(option.id) ? " checked" : ""}${disabled ? " disabled" : ""}><strong>${option.id.toUpperCase()}</strong><span>${esc(option.text)}<span class="selected-label">✓ 選択中</span></span></label>`).join("")}</fieldset>`;
  }
  function questionBody(q, selected, disabled) {
    return `<div class="question-meta" data-question-id="${esc(q.questionId)}" data-revision-id="${esc(q.questionRevisionId)}" data-order="${q.order}"><strong>問題 ${q.order} / ${total}</strong>${badge(modeLabel)}${badge(q.type === "multiple_select" ? "複数選択" : "単一選択")}</div><p class="stem">${esc(q.stem)}</p><pre>${esc(q.code)}</pre>${answerOptions(q, selected, disabled)}<p class="small muted">開始時点の問題と順序で学習しています。</p>`;
  }
  function writeNotice() {
    if (state === "save-in-progress")
      return notice(
        "回答を保存しています",
        "回答編集・再確定・次問移動を止めています。保存成功前には正解・解説を取得しません。",
      );
    if (state === "save-failed")
      return notice(
        "回答を保存できませんでした",
        "回答内容は保持しています。同じ回答を再試行できます。次問への遷移はできません。",
        "error",
        link("同じ回答の保存を再試行", "practice", true, {
          state: "save-in-progress",
        }),
      );
    if (state === "save-succeeded")
      return notice(
        "回答保存は成功しました",
        "確定済み回答を保持して、採点・解説を取得しています。",
        "success",
      );
    if (state === "intermediate-save-in-progress")
      return notice(
        "模試の途中状態を保存しています",
        "回答編集と問題移動は続けられます。最新の変更は保存完了まで未保存として表示します。",
      );
    if (state === "intermediate-save-failed")
      return notice(
        "模試の途中状態の保存に失敗しています",
        "回答内容は保持しています。問題一覧の「! 保存失敗」は保存できなかった回答、「● 未保存」は最新の変更です。再試行は模試の最新の途中状態を対象にします。保存完了までは提出できません。",
        "error",
        link("模試の途中状態の保存を再試行", "mock", false, {
          state: "intermediate-save-in-progress",
        }),
      );
    if (state === "stale")
      return notice(
        "古い回答の保存は成功しました",
        "保存成功はその要求に含まれた回答だけです。現在の最新回答は未保存のままです。",
        "warning",
      );
    if (state === "final-save-in-progress")
      return notice(
        "最終提出を保存しています",
        "まだ提出済みではありません。回答編集・問題移動・再提出を止めています。",
      );
    if (state === "final-save-failed")
      return notice(
        "最終提出を保存できませんでした",
        "未提出のまま、回答を保持しています。回答変更を止めて同じ提出を再試行できます。",
        "error",
        link("同じ最終提出を再試行", "mock", true, {
          state: "final-save-in-progress",
          unsaved: "0",
        }),
      );
    if (state === "submitted")
      return notice(
        "最終提出が成功しました",
        "回答は変更できません。結果と解説を確認できます。",
        "success",
      );
    if (state === "result-fetch-failed")
      return notice(
        mode === "mock"
          ? "提出は成功しましたが、結果を取得できませんでした"
          : "回答保存は成功しましたが、解説を取得できませんでした",
        "確定・提出済み状態は維持します。回答の再保存・再提出ではなく、結果取得だけを再試行します。",
        "error",
        link(
          "結果取得だけ再試行",
          mode === "mock" ? "result" : "explanation",
          true,
          { state: "loading" },
        ),
      );
    return "";
  }
  function question(data) {
    currentSession = structuredClone(
      params.get("session") === "new"
        ? data.newSessions[mode]
        : data.sessions[mode],
    );
    if (mode === "practice")
      currentSession.questions.forEach((q) => {
        q.confirmed = confirmedPositions.has(q.order);
      });
    currentQuestion = currentSession.questions[qNumber - 1];
    const q = currentQuestion;
    if (state === "paused")
      return {
        main: panel(
          "学習を中断しています",
          `<p>保存済みの回答を保ち、前回と同じ問題・同じ順番から再開します。</p><dl class="definition"><dt>学習モード</dt><dd>${modeLabel}</dd><dt>再開位置</dt><dd>問題 ${q.order} / ${total}</dd></dl><div class="button-row">${link("学習を再開する", mode, true, { state: "normal", q: q.order, unsaved: "0" })}</div>`,
        ),
        support: panel(
          "再開のルール",
          "<p>問題の内容・順序・保存済み回答を維持します。別の問題へ選び直しません。</p>",
        ),
      };
    const confirmedPractice = mode === "practice" && q.confirmed && !locked;
    if (confirmedPractice)
      return {
        main:
          notice(
            "この問題の回答は確定済みです",
            "保存成功後の回答は変更できません。回答した時点の問題の解説を確認できます。",
            "success",
            link("確定済みの解説を確認", "explanation", true, { q: q.order }),
          ) + panel("回答した問題", questionBody(q, userAnswers(q), true)),
        support: rail(currentSession, q),
      };
    const selected = userAnswers(q);
    const previousPracticeAnswer =
      mode === "practice" && q.order > 1
        ? ["save-in-progress", "save-failed"].includes(state)
          ? '<button class="button" type="button" disabled aria-describedby="previous-answer-blocked">前の確定済み回答を確認</button><span id="previous-answer-blocked" class="small muted">保存成功後に確認できます。</span>'
          : link("前の確定済み回答を確認", "explanation", false, {
              q: q.order - 1,
            })
        : "";
    const submitted =
      mode === "mock" && ["submitted", "result-fetch-failed"].includes(state);
    let actions;
    if (mode === "practice") {
      actions = locked
        ? '<button class="button primary" disabled type="button">' +
          (busy
            ? "保存中…"
            : state === "save-failed"
              ? "保存成功を待っています"
              : "回答確定済み") +
          "</button>"
        : `<button class="button primary" id="confirm-answer" type="button"${selected.length ? "" : " disabled"}>回答を確定する →</button>`;
    } else if (submitted) actions = link("結果を見る →", "result", true);
    else
      actions = `<div class="button-row">${q.order > 1 && !locked ? link("← 前の問題", "mock", false, { q: q.order - 1, state: navigationState }) : ""}${q.order < total && !locked ? link("次の問題 →", "mock", false, { q: q.order + 1, state: navigationState }) : ""}</div><button class="button primary" id="final-submit" type="button"${dirty || locked ? " disabled" : ""}>${state === "final-save-in-progress" ? "提出を保存中…" : state === "final-save-failed" ? "最終提出の再試行を待っています" : "最終提出する"}</button>`;
    const primary = panel(
      "問題に取り組む",
      questionBody(q, selected, locked) +
        `<p id="answer-status" class="small muted" aria-live="polite">${mode === "practice" ? (locked ? "回答は保持しています。変更できません。" : "選択内容を確認してから確定してください。") : dirty ? "最新回答が未保存の間は最終提出できません。" : "最新回答の保存済み状態を確認してから提出します。"}</p><div class="question-actions">${actions}</div>`,
    );
    return {
      main:
        writeNotice() +
        primary +
        `<div class="button-row">${submitted ? "" : `<button class="button" id="pause-session" type="button"${busy ? " disabled" : ""}>学習を中断してホームへ</button>`}${previousPracticeAnswer}${mode === "mock" && !locked ? '<button class="button" id="clear-answer" type="button">この問題を未回答にする</button>' : ""}</div>`,
      support: rail(currentSession, q, submitted),
    };
  }
  function explanation(q) {
    const unanswered = q.userOptionIds.length === 0;
    return (
      panel(
        "判定と正解",
        `<p>${badge(unanswered ? "○ 未回答・不正解" : q.correctness ? "✓ 正解" : "! 不正解", q.correctness ? "success" : "error")}</p><dl class="definition"><dt>自分の回答</dt><dd>${unanswered ? "未回答" : q.userOptionIds.map((id) => id.toUpperCase()).join("・")}</dd><dt>正解</dt><dd>${q.correctOptionIds.map((id) => id.toUpperCase()).join("・")}</dd><dt>採点</dt><dd>完全一致・部分点なし${unanswered ? "。模試の正答率の分母に含めます。" : ""}</dd></dl>`,
        "explanation",
      ) +
      panel(
        "解説",
        `<p class="stem">${esc(q.explanation)}</p><h3>各選択肢の理由</h3>${q.optionExplanation.map((reason, i) => `<p class="option-reason"><strong>${q.options[i].id.toUpperCase()}</strong>${esc(reason)}</p>`).join("")}<div class="source-box"><strong>出典</strong><a href="${esc(q.source.url)}" target="_blank" rel="noopener">${esc(q.source.title)} ↗</a><p>${esc(q.source.locator)}</p><p class="small muted">回答時点の出典 / 取得時点：${esc(q.source.fetchedAt)}</p><p class="small muted">${esc(q.source.note)}</p></div>`,
      )
    );
  }
  function completedSession(data) {
    return data.sessions[resultKey];
  }
  function answerReview(data) {
    const s =
      screen === "incorrect-detail"
        ? completedSession(data)
        : params.get("session") === "new"
          ? data.newSession
          : data.session;
    const q =
      screen === "incorrect-detail" ? s.questions[qNumber - 1] : data.question;
    currentSession = s;
    currentQuestion = q;
    const next =
      mode === "practice" && screen === "explanation"
        ? q.order === total
          ? link("演習の結果を見る", "result", true)
          : link("次の問題へ →", "practice", true, {
              q: q.order + 1,
              state: "normal",
              unsaved: "0",
            })
        : link("結果へ戻る", "result", true);
    const incorrectIndex =
      screen === "incorrect-detail"
        ? s.incorrect.findIndex((item) => item.order === q.order)
        : -1;
    const reviewNavigation =
      incorrectIndex < 0
        ? ""
        : panel(
            "誤答を続けて振り返る",
            `<nav aria-label="誤答の前後移動"><strong>${incorrectIndex + 1} / ${s.incorrect.length}問</strong><div class="button-row">${incorrectIndex > 0 ? link("前の誤答", "incorrect-detail", false, { q: s.incorrect[incorrectIndex - 1].order }) : '<button class="button" type="button" disabled>前の誤答</button>'}${incorrectIndex < s.incorrect.length - 1 ? link("次の誤答", "incorrect-detail", true, { q: s.incorrect[incorrectIndex + 1].order }) : '<button class="button primary" type="button" disabled>次の誤答</button>'}</div><p class="small muted">${incorrectIndex === 0 ? "最初の誤答です。" : ""}${incorrectIndex === s.incorrect.length - 1 ? "最後の誤答です。" : ""}この回の誤答・未回答の中を移動します。</p></nav>`,
          );
    return {
      main:
        reviewNavigation +
        notice(
          mode === "mock"
            ? "最終提出済みの回答を確認しています"
            : "確定済み回答を確認しています",
          "回答は変更できません。回答した時点の問題と出典を表示します。",
          "success",
          screen === "explanation" && mode === "practice"
            ? `${badge(q.correctness ? "✓ 正解" : "! 不正解", q.correctness ? "success" : "error")}<span>正解：${q.correctOptionIds.map((id) => id.toUpperCase()).join("・")}</span>${next}`
            : "",
        ) +
        panel("回答した問題", questionBody(q, q.userOptionIds, true)) +
        explanation(q) +
        reviewNavigation +
        `<div class="button-row">${screen === "incorrect-detail" ? `${link("誤答一覧へ戻る", "incorrect")}${link("結果へ戻る", "result")}` : next}</div>`,
      support: panel(
        "確認している回答",
        `<div class="rail-counter">${q.order}<span> / ${total}問</span></div><p>${modeLabel} / 回答確定済み</p><p>回答時点の問題を確認しています。</p><p>解説は主欄の下に表示します。</p>`,
      ),
    };
  }
  function result(data) {
    const s = completedSession(data);
    const hasIncorrect = s.incorrect.length > 0;
    return {
      main:
        panel(
          mode === "mock" ? "模擬試験を提出しました" : "演習が完了しました",
          `<p>${badge(mode === "mock" ? "✓ 最終提出済み" : "✓ 回答確定済み", "success")} ${badge(modeLabel)}</p><div class="result-score"><div class="score-ring"><strong>${s.score.percentage}%</strong><span>正答率</span></div><div><p class="big-number">${s.score.correct}<span> / ${s.score.total}問 正解</span></p><p class="muted">${esc(s.completedAt)}</p></div></div>${mode === "mock" ? `<p class="small muted">未回答 ${s.unansweredCount}問も不正解として20問の分母に含みます。</p>` : ""}<div class="button-row">${hasIncorrect ? link("誤答を振り返る", "incorrect", true) : ""}${link("次の学習へ", mode === "mock" ? "mock-start" : "practice-start", !hasIncorrect)}${link("Learning Progressを見る", "progress")}</div>`,
          "hero",
        ) +
        panel(
          "この回の分野別正答率",
          topicTable(s.topics) +
            `<div class="button-row">${link("分野別の詳細", "topics", false, { scope: "session" })}</div>`,
        ),
      support:
        panel(
          "振り返り",
          hasIncorrect
            ? `<p>間違えた問題と未回答を、回答時点の解説で確認しましょう。</p><p>${s.incorrect.length}問の誤答・未回答</p>${link("誤答一覧を見る", "incorrect")}`
            : `<p>全問正解です。次の学習へ進むか、これまでの学習状況を確認できます。</p>${link("Learning Progressを見る", "progress")}`,
        ) +
        (hasIncorrect
          ? panel(
              "確認したい問題",
              `<p>各問題の正解と出典は、回答・提出後の詳細画面で確認できます。</p>${link("問題4の解説へ", "incorrect-detail", false, { q: 4 })}`,
            )
          : ""),
    };
  }
  function incorrect(data) {
    const s = completedSession(data);
    return {
      main: panel(
        "この回の誤答・未回答",
        `<p>${modeLabel} / ${s.score.correct} / ${s.score.total}問 正解</p>${s.incorrect.map((item) => `<div class="incorrect-row"><span class="question-number">${item.order}</span><div><strong>${esc(item.title)}</strong><p class="small muted">${esc(item.topic)} / ${item.unanswered ? "○ 未回答" : "! 不正解"}</p><p class="small muted">回答時点の問題</p></div>${link("詳細を見る", "incorrect-detail", false, { q: item.order })}</div>`).join("")}`,
      ),
      support: panel(
        "振り返りの対象",
        "<p>この回の誤答と未回答を表示します。過去回答を新しい版の問題へ置き換えません。</p>" +
          link("結果へ戻る", "result"),
      ),
    };
  }
  function topics(data) {
    const sessionScope = fixture === "result-after";
    const list = sessionScope
      ? completedSession(data).topics
      : data.overview.topics;
    return {
      main:
        (sessionScope ? "" : tabs()) +
        panel(
          sessionScope
            ? "この回の分野別正答率"
            : `${modeLabel}の累積分野別正答率`,
          topicTable(list, !sessionScope) +
            '<p class="small muted">1回答を同じ分野に重複計上しません。複数分野に関連する回答があるため、分野別件数の合計は全体件数を超える場合があります。</p>',
        ),
      support: panel(
        "集計について",
        `<p>${sessionScope ? "この回の確定済み回答・提出結果です。" : mode === "practice" ? "中断した回を含め、保存成功した確定回答を集計します。" : "最終提出済みの模試だけを集計します。途中保存は含みません。"}</p><p>回答のない分野は「未学習」です。</p>${link(sessionScope ? "結果へ戻る" : "学習進捗へ", sessionScope ? "result" : "progress")}`,
      ),
    };
  }
  function progress(data) {
    const o = data.overview,
      stats = o[mode];
    const filtered = {
      ...o,
      history: o.history.filter((item) => item.mode === modeLabel),
    };
    return {
      main:
        tabs() +
        '<div class="stats">' +
        stat(
          "累積正答率",
          `${stats.percentage}<span>%</span>`,
          `${stats.correct}件の正答`,
        ) +
        stat(
          "対象回答数",
          `${stats.total}<span>件</span>`,
          mode === "mock"
            ? "最終提出済みの模試のみ"
            : "中断した回の確定回答も含む",
        ) +
        "</div>" +
        panel(
          "分野別の学習状況",
          topicTable(o.topics, true) +
            '<p class="small muted">未回答の分野は「未学習」。別の回の回答は新しい回答として累積します。</p><div class="button-row">' +
            link("分野別の詳細を見る", "topics", false, {
              scope: "cumulative",
            }) +
            "</div>",
        ),
      support:
        history(filtered) +
        continuation(o) +
        panel(
          "集計の対象",
          `<p>${mode === "mock" ? "未提出の模試の途中回答は集計しません。" : "演習の保存成功後の確定回答を集計します。"}</p><p>1つの回答は全体件数で1回だけ数えます。</p>`,
        ),
    };
  }
  function readFailure() {
    const confirmed = state === "result-fetch-failed";
    const title =
      state === "loading"
        ? "データを取得しています"
        : state === "empty"
          ? screen === "incorrect"
            ? "誤答はありません"
            : screen === "topics"
              ? "まだ学習した分野がありません"
              : screen === "progress" || screen === "home"
                ? "まだ学習履歴がありません"
                : screen === "certification"
                  ? "表示できる資格情報がありません"
                  : "表示するデータがありません"
          : confirmed
            ? "保存・提出は成功しましたが、結果を取得できませんでした"
            : screen === "progress"
              ? "学習進捗を読み込めませんでした"
              : "データを読み込めませんでした";
    const copy =
      state === "loading"
        ? "データ取得中です。"
        : state === "empty"
          ? screen === "progress" || screen === "home" || screen === "topics"
            ? "学習を始めると、ここに進捗が表示されます。"
            : screen === "incorrect"
              ? "振り返る問題はありません。次の学習へ進めます。"
              : "表示できる情報はまだありません。"
          : confirmed
            ? "確定済み・提出済みの状態は維持します。回答の再保存・再提出は行わず、結果取得だけを再試行します。"
            : "時間をおいて、もう一度お試しください。";
    return {
      main:
        (confirmed
          ? notice(
              mode === "mock" ? "✓ 最終提出済み" : "✓ 回答保存成功済み",
              "成功済み状態を維持しています。",
              "success",
            )
          : "") +
        panel(
          title,
          `<span class="state-icon" aria-hidden="true">${state === "loading" ? "…" : state === "empty" ? "○" : "!"}</span><p>${esc(copy)}</p>${screen === "progress" && state === "empty" ? `<div class="button-row">${link("学習を始める", "certification", true)}</div>` : ""}${["fetch-error", "result-fetch-failed"].includes(state) ? `<div class="button-row">${link(confirmed ? "結果取得だけ再試行" : "再取得する", screen, true, { state: "loading", scope: params.get("scope") || "cumulative" })}</div>` : ""}`,
          `state-panel ${["fetch-error", "result-fetch-failed"].includes(state) ? "error" : ""}`,
        ),
      support: panel(
        "学習について",
        "<p>演習と模擬試験を、自分のペースで進められます。</p>",
      ),
    };
  }
  function renderToolbar() {
    toolbar.innerHTML = `<a href="index.html">← 12画面一覧</a><strong>Layout C · 採用確定</strong><label>画面<select id="screen-picker">${Object.entries(
      definitions,
    )
      .map(
        ([id, d]) =>
          `<option value="${id}"${id === screen ? " selected" : ""}>${esc(d.title)}</option>`,
      )
      .join(
        "",
      )}</select></label><label>状態<select id="state-picker">${allowedStates.map((s) => `<option value="${s}"${s === state ? " selected" : ""}>${esc(stateNames[s])}</option>`).join("")}</select></label>${!["practice", "mock", "practice-start", "mock-start"].includes(screen) ? `<label>モード<select id="mode-picker"><option value="practice"${mode === "practice" ? " selected" : ""}>演習</option><option value="mock"${mode === "mock" ? " selected" : ""}>模擬試験</option></select></label>` : ""}<span>保存・採点・APIなし</span><div class="review-description">Fixture表示の切替です。選択変更は保存失敗時の保持確認に使い、保存・結果成功例は固定回答のFixtureへ切り替えます。${["practice", "mock", "explanation", "incorrect-detail"].includes(screen) ? `<a href="${esc(url(screen, { q: 4, state: "normal" }))}">複数選択の問題4を見る</a>` : ""}</div>`;
    const step =
      screen === "practice" &&
      ["save-in-progress", "save-succeeded"].includes(state)
        ? link("固定の保存・解説取得成功例へ", "explanation", false, {
            state: "normal",
            unsaved: "0",
          })
        : screen === "mock" &&
            [
              "intermediate-save-in-progress",
              "intermediate-save-failed",
              "stale",
              "unsaved",
            ].includes(state)
          ? link("最新回答の保存成功例を表示", "mock", false, {
              state: "normal",
              unsaved: "0",
            }) +
            link("古い保存成功例を表示", "mock", false, {
              state: "stale",
              unsaved: "1",
            })
          : screen === "mock" && state === "final-save-in-progress"
            ? link("固定の提出成功例を表示", "mock", false, {
                state: "submitted",
                unsaved: "0",
              })
            : ["practice-start", "mock-start"].includes(screen) &&
                state === "starting"
              ? link("固定Snapshotでの開始例へ", mode, false, {
                  q: 1,
                  state: "normal",
                  session: "new",
                  unsaved: "0",
                })
              : state === "loading"
                ? link("取得成功例を表示", screen, false, {
                    state: "normal",
                    scope: params.get("scope") || "cumulative",
                  })
                : "";
    if (step)
      toolbar.insertAdjacentHTML(
        "beforeend",
        `<div class="review-description">レビュー用の状態遷移：${step}</div>`,
      );
  }
  function decision(
    title,
    copy,
    target,
    extras,
    confirmLabel,
    cancelLabel = "戻る",
  ) {
    document.getElementById("dialog-title").textContent = title;
    document.getElementById("dialog-copy").textContent = copy;
    document.getElementById("dialog-cancel").textContent = cancelLabel;
    const confirm = document.getElementById("dialog-confirm");
    confirm.hidden = !target;
    if (target) {
      confirm.href = url(target, extras);
      confirm.textContent = confirmLabel;
    }
    document.getElementById("decision-dialog").showModal();
  }
  function bindRoutes(scope = document) {
    scope.querySelectorAll("[data-route]").forEach((a) => {
      a.addEventListener("click", (e) => {
        if (a.getAttribute("aria-disabled") === "true") {
          e.preventDefault();
          return;
        }
        e.preventDefault();
        const extras = JSON.parse(a.dataset.extras);
        if (
          activeLearning() &&
          !["practice", "mock", "explanation"].includes(a.dataset.route)
        )
          leaveLearning(a.dataset.route, extras);
        else location.href = url(a.dataset.route, extras);
      });
    });
  }
  function bind() {
    document.getElementById("screen-picker").addEventListener("change", (e) => {
      location.href = url(e.target.value, { state: "normal" });
    });
    document.getElementById("state-picker").addEventListener("change", (e) => {
      location.href = url(screen, {
        state: e.target.value,
        ...(screen === "result" &&
        ["normal", "all-correct"].includes(e.target.value)
          ? { resultVariant: e.target.value }
          : {}),
      });
    });
    document.getElementById("mode-picker")?.addEventListener("change", (e) => {
      location.href = url(screen, { mode: e.target.value, state: "normal" });
    });
    document
      .getElementById("dialog-cancel")
      .addEventListener("click", () =>
        document.getElementById("decision-dialog").close(),
      );
    bindRoutes();
    document.querySelectorAll("[data-leave]").forEach((a) => {
      a.addEventListener("click", (e) => {
        if (activeLearning()) {
          e.preventDefault();
          const target = new URL(a.href).searchParams.get("screen") || "home";
          leaveLearning(target);
        }
      });
    });
    function edited() {
      drafts[currentQuestion.questionId] = [
        ...document.querySelectorAll('input[name="answer"]:checked'),
      ].map((input) => input.value);
      dirty = true;
      if (mode === "mock") {
        pendingPositions.add(currentQuestion.order);
        failedPositions.delete(currentQuestion.order);
        const support = document.querySelector(".support-pane");
        support.innerHTML = rail(currentSession, currentQuestion);
        bindRoutes(support);
      }
      document
        .getElementById("confirm-answer")
        ?.toggleAttribute(
          "disabled",
          drafts[currentQuestion.questionId].length === 0,
        );
      const submit = document.getElementById("final-submit");
      if (submit) submit.disabled = true;
      document.getElementById("save-indicator").textContent =
        mode === "mock" ? "⚠ 最新回答は未保存" : "回答未確定";
      document.getElementById("answer-status").textContent =
        mode === "mock"
          ? "最新回答が未保存の間は最終提出できません。"
          : "選択内容を確認してから確定してください。";
    }
    document.querySelectorAll('input[name="answer"]').forEach((input) => {
      input.addEventListener("change", edited);
    });
    document.getElementById("clear-answer")?.addEventListener("click", () => {
      document.querySelectorAll('input[name="answer"]').forEach((input) => {
        input.checked = false;
      });
      edited();
    });
    document.getElementById("confirm-answer")?.addEventListener("click", () => {
      location.href = url("practice", { state: "save-in-progress" });
    });
    document.getElementById("final-submit")?.addEventListener("click", () => {
      if (dirty || locked) return;
      const unanswered = currentSession.questions.filter(
        (q) => userAnswers(q).length === 0,
      ).length;
      if (unanswered)
        decision(
          "未回答の問題があります",
          `${unanswered}問が未回答です。未回答は不正解として20問の分母に含めます。このまま最終提出しますか？`,
          "mock",
          { state: "final-save-in-progress", unsaved: "0" },
          "未回答を含めて提出する",
        );
      else
        location.href = url("mock", {
          state: "final-save-in-progress",
          unsaved: "0",
        });
    });
    document.getElementById("pause-session")?.addEventListener("click", () => {
      leaveLearning("home");
    });
    document
      .getElementById("new-session")
      ?.addEventListener("click", () =>
        decision(
          "進行中の学習を終了しますか？",
          mode === "practice"
            ? "演習の確定済み回答は履歴に残ります。終了確認後に新しい学習へ進みます。"
            : "この未提出の模試は採点しません。終了確認後に新しい学習へ進みます。",
          screen,
          { state: "starting" },
          "終了して新しく始める",
        ),
      );
  }
  const script = document.createElement("script");
  script.src = `fixtures/${fixturePath}.js`;
  script.onload = () => {
    const data =
      fixture === "session-before"
        ? window.refriqSelectedBefore
        : fixture === "answer-after"
          ? window.refriqSelectedAfter
          : fixture === "result-after"
            ? window.refriqSelectedResult
            : window.refriqSelectedCatalog;
    if (["practice", "mock"].includes(screen) && state === "unanswered") {
      const session =
        params.get("session") === "new"
          ? data.newSessions[mode]
          : data.sessions[mode];
      drafts[session.questions[qNumber - 1].questionId] = [];
    }
    if (mode === "practice" && !params.has("confirmed")) {
      const base =
        fixture === "session-before"
          ? params.get("session") === "new"
            ? data.newSessions.practice
            : data.sessions.practice
          : null;
      confirmedPositions = new Set(
        base
          ? base.questions.filter((q) => q.confirmed).map((q) => q.order)
          : params.get("session") === "new"
            ? []
            : [1, 2],
      );
    }
    if (fixture === "answer-after" && mode === "practice") {
      confirmedPositions.add(data.question.order);
      drafts[data.question.questionId] = data.question.userOptionIds;
      dirty = false;
    }
    if (
      screen === "practice" &&
      ["save-succeeded", "result-fetch-failed"].includes(state)
    )
      confirmedPositions.add(qNumber);
    renderToolbar();
    const renderer = {
      home,
      certification,
      "practice-start": start,
      "mock-start": start,
      practice: question,
      mock: question,
      explanation: answerReview,
      result,
      incorrect,
      "incorrect-detail": answerReview,
      topics,
      progress,
    }[screen];
    // Question result-fetch failure keeps the saved answer; it is not a generic Empty.
    const content =
      readState && !["practice", "mock"].includes(screen)
        ? readFailure()
        : renderer(data);
    app.innerHTML = shell(content);
    if (currentSession) {
      toolbar.insertAdjacentHTML(
        "beforeend",
        `<details class="review-description"><summary>設計検証用metadata</summary><p class="code-meta">Session: ${esc(currentSession.id)} / Snapshot: ${esc(currentSession.snapshotId)} / Question: ${esc(currentQuestion.questionId)} / Revision: ${esc(currentQuestion.questionRevisionId)} / 順序 ${currentQuestion.order}${currentQuestion.source ? ` / SourceRevision: ${esc(currentQuestion.source.revision)}` : ""}</p></details>`,
      );
    }
    document.body.dataset.screen = screen;
    document.body.dataset.state = state;
    document.body.dataset.mode = mode;
    document.body.dataset.fixture = fixture;
    bind();
  };
  script.onerror = () => {
    app.textContent =
      "表示Fixtureを読み込めませんでした。Static files一式が同じディレクトリにあることを確認してください。";
  };
  document.head.appendChild(script);
})();
