(() => {
  const layouts = [
    {
      id: "A",
      name: "シンプル縦配置",
      note: "上部Navigationと、読み進める中央Content。",
    },
    {
      id: "B",
      name: "ダッシュボード配置",
      note: "左Navigationと、見渡しやすいCard / List。",
    },
    {
      id: "C",
      name: "2ペイン配置",
      note: "主コンテンツと補助情報を、隣り合わせに。",
    },
  ];
  const screens = [
    { id: "home", name: "Home" },
    { id: "question", name: "問題回答" },
    { id: "result", name: "結果" },
    { id: "progress", name: "Learning Progress" },
  ];
  const grid = document.getElementById("comparison-grid");
  function resizePreviews() {
    for (const viewport of grid.querySelectorAll(".preview-viewport")) {
      const scale = viewport.clientWidth / Number(viewport.dataset.width);
      viewport.querySelector("iframe").style.transform = `scale(${scale})`;
      viewport.style.height = `${880 * scale}px`;
    }
  }
  function render() {
    const width = Number(document.getElementById("pc-width").value);
    const filter = document.getElementById("screen-filter").value;
    grid.innerHTML = layouts
      .map(
        (layout) =>
          '<section class="candidate"><header class="candidate-header"><span class="layout-letter">' +
          layout.id +
          "</span><div><h2>" +
          layout.name +
          "</h2><p>" +
          layout.note +
          "</p></div></header>" +
          screens
            .filter((screen) => filter === "all" || filter === screen.id)
            .map((screen) => {
              const url = `view.html?layout=${layout.id}&screen=${screen.id}`;
              return (
                '<article class="preview-card"><div class="preview-heading"><h3>' +
                screen.name +
                '</h3><a href="' +
                url +
                '" target="_blank" rel="noopener">PC表示 ↗</a></div>' +
                '<div class="preview-viewport" data-width="' +
                width +
                '"><iframe title="Layout ' +
                layout.id +
                " · " +
                screen.name +
                '" src="' +
                url +
                '&preview=1" width="' +
                width +
                '" height="880"></iframe></div></article>'
              );
            })
            .join("") +
          "</section>",
      )
      .join("");
    resizePreviews();
  }
  document.getElementById("screen-filter").addEventListener("change", render);
  document.getElementById("pc-width").addEventListener("change", render);
  window.addEventListener("resize", resizePreviews);
  render();
})();
