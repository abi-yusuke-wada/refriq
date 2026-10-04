(() => {
  const params = new URLSearchParams(window.location.search);
  const layout = ["A", "B", "C"].includes(params.get("layout"))
    ? params.get("layout")
    : "A";
  const screen = ["home", "question", "result", "progress"].includes(
    params.get("screen"),
  )
    ? params.get("screen")
    : "home";
  const mode = params.get("mode") === "mock" ? "mock" : "practice";
  const type = params.get("type") === "multiple" ? "multiple" : "single";
  const state = ["after", "loading", "empty", "error"].includes(
    params.get("state"),
  )
    ? params.get("state")
    : "normal";
  const after = screen === "question" && state === "after";
  const labels = {
    home: "Home",
    question: "問題回答",
    result: "結果",
    progress: "Learning Progress",
  };
  const fixture =
    screen === "question"
      ? after
        ? "question-after"
        : "question-before"
      : screen === "result"
        ? "result-after"
        : "overview";
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
      layout,
      screen: nextScreen,
      mode,
      type,
      ...extras,
    });
    return `view.html?${query.toString()}`;
  }
  function link(text, nextScreen, primary = false, extras = {}) {
    return (
      '<a class="button' +
      (primary ? " primary" : "") +
      '" href="' +
      url(nextScreen, extras) +
      '">' +
      esc(text) +
      "</a>"
    );
  }
  function panel(title, body, className = "") {
    return (
      '<section class="panel ' +
      className +
      '"><h2>' +
      title +
      "</h2>" +
      body +
      "</section>"
    );
  }
  function track(value) {
    return (
      '<div class="progress-track" aria-hidden="true"><span style="width:' +
      value +
      '%"></span></div>'
    );
  }
  function stat(label, value, description) {
    return (
      '<div class="stat"><div class="label">' +
      esc(label) +
      '</div><div class="big-number">' +
      value +
      '</div><span class="small muted">' +
      esc(description) +
      "</span></div>"
    );
  }
  function nav(vertical = false) {
    return (
      '<nav aria-label="メインNavigation" class="' +
      (vertical ? "side-nav" : "app-nav") +
      '">' +
      [
        ["home", "ホーム"],
        ["question", "学習する"],
        ["progress", "学習進捗"],
      ]
        .map(
          ([key, name]) =>
            '<a href="' +
            url(key) +
            '" class="' +
            (screen === key ? "active" : "") +
            '"' +
            (screen === key ? ' aria-current="page"' : "") +
            ">" +
            name +
            "</a>",
        )
        .join("") +
      "</nav>"
    );
  }
  function shell(main, support, title, subtitle) {
    const content =
      '<main class="page"><header class="page-title"><p class="eyebrow">KONG GATEWAY CERTIFIED ASSOCIATE</p><h1>' +
      title +
      "</h1><p>" +
      subtitle +
      '</p></header><div class="content-grid"><div class="main-pane">' +
      main +
      '</div><aside class="support-pane" aria-label="補助情報">' +
      support +
      "</aside></div></main>";
    if (layout === "B") {
      return (
        '<div class="layout-b"><aside class="sidebar"><a class="wordmark" href="' +
        url("home") +
        '">refriq<span>学びを、次の一歩へ。</span></a>' +
        nav(true) +
        '<div class="sidebar-note">対象資格<br>Kong Gateway<br>Certified Associate</div></aside><div><header class="b-header"><span>学習スペース / ' +
        labels[screen] +
        '</span><span class="user-label">Learner</span></header>' +
        content +
        "</div></div>"
      );
    }
    return (
      '<div class="layout-' +
      layout.toLowerCase() +
      '"><header class="app-header"><a class="wordmark" href="' +
      url("home") +
      '">refriq</a>' +
      nav() +
      '<span class="user-label">Learner</span></header>' +
      content +
      "</div>"
    );
  }
  function source(data) {
    return (
      '<div class="source-box"><strong>出典</strong><a href="' +
      esc(data.url) +
      '" target="_blank" rel="noopener">' +
      esc(data.title) +
      " ↗</a><p>" +
      esc(data.locator) +
      " · " +
      esc(data.revision) +
      '</p><p class="small">' +
      esc(data.note) +
      "</p></div>"
    );
  }
  function resume(data) {
    return panel(
      "続きから学習する",
      data.active
        .map(
          (item) =>
            '<div class="resume-row"><div class="row-between"><strong>' +
            esc(item.mode) +
            '</strong><span class="small">' +
            item.position +
            " / " +
            item.total +
            "問</span></div>" +
            track(((item.position - 1) / item.total) * 100) +
            "<p>" +
            esc(item.text) +
            "</p>" +
            link("再開する →", "question", false, {
              mode: item.mode === "演習" ? "practice" : "mock",
            }) +
            "</div>",
        )
        .join(""),
    );
  }
  function topicList(topics, key = "percentage") {
    return (
      '<ul class="topic-list">' +
      topics
        .map(
          (topic) =>
            '<li><div class="row-between"><span>' +
            esc(topic.name) +
            '</span><span class="topic-rate' +
            (topic[key] === null ? " not-learned" : "") +
            '">' +
            (topic[key] === null ? "未学習" : `${topic[key]}%`) +
            "</span></div>" +
            (topic[key] === null ? "" : track(topic[key])) +
            "</li>",
        )
        .join("") +
      "</ul>"
    );
  }
  function home(data) {
    const main =
      panel(
        data.greeting,
        '<p class="muted">学習を始めるなら10問の演習。まとめて確かめるなら20問の模擬試験。</p><p class="small muted">' +
          esc(data.certification) +
          '</p><div class="button-row">' +
          link("10問演習を始める →", "question", true) +
          link("20問模擬試験", "question", false, { mode: "mock" }) +
          "</div>",
        "hero",
      ) +
      '<div class="learning-cards">' +
      panel(
        '<span class="mode">PRACTICE</span><br>演習の学習記録',
        '<div class="big-number">' +
          data.practice.percentage +
          '<span>% 正答率</span></div><p class="small muted">' +
          data.practice.total +
          "件の確定回答</p>" +
          link("演習の進捗を見る", "progress"),
      ) +
      panel(
        '<span class="mode">MOCK EXAM</span><br>模擬試験の学習記録',
        '<div class="big-number">' +
          data.mock.percentage +
          '<span>% 正答率</span></div><p class="small muted">' +
          data.mock.sessions +
          "回の提出済み試験</p>" +
          link("模試の進捗を見る", "progress", false, { mode: "mock" }),
      ) +
      "</div>" +
      panel(
        "最近の学習",
        '<div class="row-between"><div><strong>最近の演習</strong><p class="muted">' +
          esc(data.history[0].summary) +
          "正解 · " +
          esc(data.history[0].rate) +
          "</p></div>" +
          link("結果を見る", "result") +
          "</div>",
      );
    return {
      main,
      support:
        resume(data) +
        panel(
          "資格と学習範囲",
          '<p class="small muted">8つの分野を対象に学習します。</p><ul class="topic-list"><li>基本概念・リクエストの流れ</li><li>構成・主要エンティティ</li><li>トラフィックの振り分け</li></ul>' +
            link("学習進捗を開く →", "progress"),
        ),
      title: "ホーム",
      subtitle: "演習と模擬試験、自分のペースで。",
    };
  }
  function question(data) {
    const q = data[type];
    const total = mode === "mock" ? 20 : 10;
    const number = 3;
    const modeLabel = mode === "mock" ? "模擬試験" : "10問演習";
    const options = q.options
      .map(
        (option) =>
          '<label class="option"><input type="' +
          (type === "multiple" ? "checkbox" : "radio") +
          '" name="answer" value="' +
          esc(option.id) +
          '"' +
          (q.userOptionIds.includes(option.id) ? " checked" : "") +
          (after ? " disabled" : "") +
          '><span class="option-letter">' +
          option.id.toUpperCase() +
          "</span><span>" +
          esc(option.text) +
          "</span></label>",
      )
      .join("");
    const actions = after
      ? mode === "mock"
        ? link("結果を見る →", "result", true)
        : link("次の問題へ →", "question", true)
      : mode === "practice"
        ? '<button class="button primary" id="confirm-answer" type="button">回答を確定する →</button>'
        : '<div class="button-row"><a class="button" href="#question-content">← 前の問題</a><a class="button" href="#question-content">次の問題 →</a></div>';
    const main =
      '<section class="panel" id="question-content"><div class="question-meta"><strong>問題 ' +
      number +
      " / " +
      total +
      "</strong><span>" +
      modeLabel +
      '</span><span class="pill">' +
      (type === "multiple" ? "複数選択" : "単一選択") +
      '</span></div><p class="stem">' +
      esc(q.stem) +
      "</p><pre>" +
      esc(q.code) +
      "</pre><fieldset><legend>" +
      (type === "multiple"
        ? "当てはまるものをすべて選んでください"
        : "選択肢を1つ選んでください") +
      "</legend>" +
      options +
      '</fieldset><div id="answer-status" class="answer-status">' +
      (after
        ? "回答確定済み · 回答は変更できません"
        : mode === "mock"
          ? "最新の回答状態：保存済み"
          : "選択内容を確認して、回答を確定してください") +
      '</div><div class="question-actions"><span class="small muted">' +
      (mode === "mock" ? "時間制限なし" : "確定後に採点と解説を表示") +
      "</span>" +
      actions +
      "</div></section>";
    let support = panel(
      mode === "mock" ? "回答状況" : "演習の進み具合",
      '<div class="row-between"><strong>' +
        number +
        " / " +
        total +
        '問</strong><span class="small muted">' +
        (mode === "mock" && !after
          ? `${data.answeredCount}問に回答`
          : mode === "mock"
            ? "最終提出済み"
            : after
              ? "3問確定"
              : "2問確定") +
        "</span></div>" +
        track(
          mode === "mock" && after
            ? 100
            : ((mode === "mock" ? data.answeredCount : after ? 3 : 2) / total) *
                100,
        ) +
        (mode === "mock" && !after
          ? '<div class="answer-grid">' +
            data.mockNavigation
              .map(
                (status, index) =>
                  '<a href="#question-content" class="' +
                  status +
                  '" aria-label="問題' +
                  (index + 1) +
                  (status === "saved"
                    ? " 回答保存済み"
                    : status === "current"
                      ? " 現在位置"
                      : " 未回答") +
                  '"' +
                  (status === "current" ? ' aria-current="step"' : "") +
                  ">" +
                  (index + 1) +
                  "</a>",
              )
              .join("") +
            '</div><p class="small muted">薄緑：回答保存済み / 枠：現在位置 / 白：未回答</p><div class="status-line"><span class="status-dot"></span><span id="save-indicator">最新回答は保存済み</span></div><button class="button" id="mock-submit" type="button">最終提出へ</button><p class="small muted">未回答がある場合は提出前に確認します。</p>'
          : '<p class="muted">1問ずつ理解を確かめます。</p><p class="small muted">同じ問題・同じ順序で再開できます。</p>'),
    );
    if (after) {
      if (mode === "mock")
        support = panel(
          "最終提出済み",
          '<p>提出後の回答確認です。</p><p class="small muted">確定した回答は変更できません。正解・解説・出典を確認できます。</p>',
        );
      const explanation = panel(
        '<span class="status-label">✓ 正解</span><br>解説',
        "<p>正解：" +
          q.correctOptionIds.map((id) => id.toUpperCase()).join("・") +
          "</p><p>" +
          esc(q.explanation) +
          "</p><details><summary>各選択肢の理由</summary>" +
          q.optionExplanation
            .map(
              (text, index) =>
                '<p class="option-reason"><strong>' +
                q.options[index].id.toUpperCase() +
                "</strong> " +
                esc(text) +
                "</p>",
            )
            .join("") +
          "</details>" +
          source(data.source),
        "explanation",
      );
      return {
        main: main + (layout === "C" ? "" : explanation),
        support: support + (layout === "C" ? explanation : ""),
        title: modeLabel,
        subtitle:
          mode === "mock"
            ? "最終提出成功後の回答確認例。"
            : "保存成功後、その問題の理解を確認。",
      };
    }
    return {
      main,
      support,
      title: modeLabel,
      subtitle:
        mode === "mock"
          ? "提出まで回答を変更できます。正解・解説は提出後に。"
          : "1問ずつ回答を確定し、解説を確認。",
    };
  }
  function result(data) {
    const score = data[mode];
    const main =
      panel(
        mode === "mock" ? "模擬試験を提出しました" : "演習が完了しました",
        '<div class="result-score"><div class="score-ring"><strong>' +
          score.percentage +
          '%</strong><span>正答率</span></div><div><p class="big-number">' +
          score.correct +
          "<span> / " +
          score.total +
          '問 正解</span></p><p class="muted">' +
          esc(data.finishedAt) +
          '</p><span class="pill">' +
          (mode === "mock" ? "最終提出済み" : "回答確定済み") +
          '</span></div></div><div class="button-row">' +
          link("もう一度学習する", "question", true) +
          link("学習進捗を見る", "progress") +
          "</div>",
        "hero",
      ) +
      panel("この回の分野別正答率", topicList(data.topics)) +
      panel(
        "間違えた問題",
        data.incorrect
          .map(
            (item) =>
              '<div class="incorrect-row"><span class="question-number">' +
              item.number +
              "</span><div><strong>" +
              esc(item.title) +
              "</strong><p>" +
              esc(item.topic) +
              " · " +
              esc(item.label) +
              '</p></div><a class="button quiet" href="#result-explanation">解説 ↓</a></div>',
          )
          .join(""),
      );
    const support =
      panel(
        "振り返り",
        '<p>正解した理由も、もう一度確認しましょう。</p><p class="small muted">回答時点の問題・解説・出典を表示します。</p>',
      ) +
      '<div id="result-explanation">' +
      panel(
        "問題9 · 解説",
        '<p class="small">あなたの回答：' +
          data.userOptionIds.map((id) => id.toUpperCase()).join("・") +
          " / 正解：" +
          data.correctOptionIds.map((id) => id.toUpperCase()).join("・") +
          "</p><p>" +
          esc(data.explanation) +
          "</p><details><summary>選択肢の理由</summary><p>" +
          esc(data.optionExplanation) +
          "</p></details>" +
          source(data.source),
        "explanation",
      ) +
      "</div>";
    return {
      main,
      support,
      title: "学習結果",
      subtitle: "完了した回の結果と、次に確かめたい分野。",
    };
  }
  function progress(data) {
    const stats = data[mode];
    const tabs =
      '<nav class="tabs" aria-label="集計モード"><a class="' +
      (mode === "practice" ? "active" : "") +
      '" href="' +
      url("progress", { mode: "practice" }) +
      '">演習</a><a class="' +
      (mode === "mock" ? "active" : "") +
      '" href="' +
      url("progress", { mode: "mock" }) +
      '">模擬試験</a></nav>';
    const rows = data.topics
      .map(
        (topic) =>
          "<tr><td>" +
          esc(topic.name) +
          '</td><td class="topic-rate">' +
          (topic[mode] === null
            ? '<span class="not-learned">未学習</span>'
            : `${topic[mode]}%${track(topic[mode])}`) +
          "</td></tr>",
      )
      .join("");
    const history =
      '<div class="table-wrap"><table><thead><tr><th>日時</th><th>正答数</th><th>正答率</th></tr></thead><tbody>' +
      data.history
        .filter(
          (item) => item.mode === (mode === "practice" ? "演習" : "模擬試験"),
        )
        .map(
          (item) =>
            '<tr><td><a href="' +
            url("result") +
            '">' +
            esc(item.date) +
            '</a><br><span class="small muted">' +
            esc(item.state) +
            "</span></td><td>" +
            esc(item.summary) +
            "</td><td>" +
            esc(item.rate) +
            "</td></tr>",
        )
        .join("") +
      "</tbody></table></div>";
    return {
      main:
        tabs +
        '<div class="stats">' +
        stat(
          "累積正答率",
          `${stats.percentage}<span>%</span>`,
          "確定済みの回答のみ集計",
        ) +
        stat(
          "対象回答数",
          `${stats.total}<span>件</span>`,
          mode === "mock" ? "提出済みの試験のみ" : "中断した回の確定回答を含む",
        ) +
        "</div>" +
        panel(
          "分野別の学習状況",
          '<div class="table-wrap"><table><thead><tr><th>分野</th><th>正答率</th></tr></thead><tbody>' +
            rows +
            '</tbody></table></div><p class="small muted">回答のない分野は「未学習」です。1回答を同じ分野に重複して数えません。</p>',
        ),
      support: panel("学習履歴", history) + resume(data),
      title: "学習進捗",
      subtitle: "演習と模擬試験を分けて、積み重ねを振り返る。",
    };
  }
  function readState() {
    const copy =
      state === "loading"
        ? {
            icon: "…",
            title: "データを取得しています",
            text: "しばらくお待ちください。",
          }
        : state === "empty"
          ? {
              icon: "○",
              title:
                screen === "result"
                  ? "表示する結果がありません"
                  : "まだ学習履歴がありません",
              text: "学習を始めると、ここに記録が表示されます。",
            }
          : {
              icon: "!",
              title: "データを取得できませんでした",
              text: "履歴がない状態とは異なります。再取得してください。",
            };
    return panel(
      copy.title,
      '<div class="state-icon" aria-hidden="true">' +
        copy.icon +
        "</div><p>" +
        copy.text +
        "</p>" +
        (state === "loading"
          ? '<div class="skeleton"></div><div class="skeleton"></div>'
          : state === "error"
            ? link("再取得する", screen, true, { state: "loading" })
            : link("演習を始める", "question", true)),
      "state-panel",
    );
  }
  function render() {
    const data =
      screen === "question"
        ? after
          ? window.refriqQuestionAfter
          : window.refriqQuestionBefore
        : screen === "result"
          ? window.refriqResultAfter
          : window.refriqOverview;
    let content =
      screen === "question"
        ? question(data)
        : screen === "result"
          ? result(data)
          : screen === "progress"
            ? progress(data)
            : home(data);
    if (
      screen !== "question" &&
      ["loading", "empty", "error"].includes(state)
    ) {
      content = {
        main: readState(),
        support: panel(
          "表示状態",
          "<p>取得中・正常なデータなし・取得失敗を区別します。</p>",
        ),
        title: content.title,
        subtitle: content.subtitle,
      };
    }
    app.innerHTML = shell(
      content.main,
      content.support,
      content.title,
      content.subtitle,
    );
    document.body.dataset.layout = layout;
    document.body.dataset.screen = screen;
    document.body.dataset.fixture = fixture;
    document.body.dataset.state = state;
    document.title = `Layout ${layout} · ${labels[screen]} | refriq`;
    if (screen === "question" && !after) {
      const confirm = document.getElementById("confirm-answer");
      const update = () => {
        const checked = document.querySelectorAll(
          'input[name="answer"]:checked',
        ).length;
        if (confirm) confirm.disabled = checked === 0;
        if (mode === "mock") {
          document.getElementById("answer-status").textContent =
            "最新の回答状態：未保存";
          document.getElementById("save-indicator").textContent =
            "未保存の変更あり";
          document.getElementById("mock-submit").disabled = true;
        }
      };
      for (const input of document.querySelectorAll('input[name="answer"]'))
        input.addEventListener("change", update);
      if (confirm)
        confirm.addEventListener("click", () => {
          window.location.href = url("question", { state: "after" });
        });
      const submit = document.getElementById("mock-submit");
      if (submit)
        submit.addEventListener("click", () => {
          window.confirm(
            "未回答が" +
              data.unansweredCount +
              "問あります。未回答は不正解として提出しますか？",
          );
        });
    }
  }
  if (params.get("preview") === "1")
    document.body.classList.add("preview-mode");
  toolbar.innerHTML =
    '<a href="index.html">← 比較へ</a><strong>Layout ' +
    layout +
    " · " +
    labels[screen] +
    "</strong><span>固定Fixture / 保存・採点なし</span>" +
    '<label>モード<select id="review-mode"><option value="practice">演習</option><option value="mock">模擬試験</option></select></label>' +
    (screen === "question"
      ? '<label>形式<select id="review-type"><option value="single">単一選択</option><option value="multiple">複数選択</option></select></label>' +
        '<label>状態<select id="review-state"><option value="normal">回答前</option><option value="after">保存成功後 / 提出成功後</option></select></label>'
      : '<label>状態<select id="review-state"><option value="normal">通常</option><option value="loading">Loading</option><option value="empty">Empty</option><option value="error">Fetch Error</option></select></label>');
  document.getElementById("review-mode").value = mode;
  const typeControl = document.getElementById("review-type");
  if (typeControl) typeControl.value = type;
  document.getElementById("review-state").value = state;
  for (const control of toolbar.querySelectorAll("select"))
    control.addEventListener("change", () => {
      window.location.href = url(screen, {
        mode: document.getElementById("review-mode").value,
        type: typeControl ? typeControl.value : type,
        state: document.getElementById("review-state").value,
      });
    });
  const script = document.createElement("script");
  script.src = `fixtures/${fixture}.js`;
  script.onload = render;
  script.onerror = () => {
    app.innerHTML =
      '<main class="page"><h1>Fixtureを読み込めませんでした</h1><p>ファイル一式が同じフォルダにあるか確認してください。</p><button class="button" id="reload" type="button">再取得する</button></main>';
    document
      .getElementById("reload")
      .addEventListener("click", () => window.location.reload());
  };
  document.head.append(script);
})();
