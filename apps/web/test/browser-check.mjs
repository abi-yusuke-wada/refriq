import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const require = createRequire(import.meta.url);
const { chromium } = require(
  process.env.REFRIQ_PLAYWRIGHT_MODULE || "playwright",
);
const base = process.env.REFRIQ_WEB_URL || "http://127.0.0.1:4173";
const output = new URL(
  "../../../docs/ux/reviewer-ui-assets/production/",
  import.meta.url,
);
let checks = 0;
const passed = [];
const errors = [];
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
page.setDefaultTimeout(6000);
page.on("dialog", (dialog) => dialog.accept());
const control = async (action, input = {}) =>
  (
    await page.request.post(`${base}/__reviewer_test`, {
      data: { action, ...input },
    })
  ).json();
const rpc = async (operation, input) =>
  (
    await page.request.post(`${base}/api/reviewer`, {
      data: { operation, input },
    })
  ).json();
async function reset(scenario = "ready", route = "review") {
  const state = await control("reset", { scenario });
  const id = state.record.value.questionRevisionId;
  await page.goto(
    `${base}/?case=${crypto.randomUUID()}#${route}/${encodeURIComponent(id)}`,
  );
  await page
    .getByRole("heading", {
      level: 1,
      name:
        route === "edit"
          ? /新しい編集候補|Editできません/
          : "QuestionRevision Review",
    })
    .waitFor();
  return state.record.value;
}
async function check(name, fn) {
  await fn();
  checks++;
  passed.push(name);
  console.log(`PASS ${name}`);
}
const action = (name) => page.locator(`[data-action="${name}"]`);
const dialogAction = (name) => page.locator(`[data-dialog="${name}"]`);
async function confirm(actionName) {
  await action(actionName).click();
  await page.getByRole("dialog").waitFor();
  await dialogAction("save").click();
}
async function done() {
  await dialogAction("done").waitFor({ state: "visible" });
  await dialogAction("done").click();
}
async function fillFeedback(values = {}) {
  await page.goto(`${base}/?case=${crypto.randomUUID()}#feedback`);
  await page.locator("#feedback-form").waitFor();
  for (const [name, value] of Object.entries({
    certificationId: "synthetic-cloud-associate",
    examTopicIds: ["topic-routing"],
    questionStyles: ["scenario"],
    difficulty: "4",
    scenarioRatio: "many",
    practicalImportance: "4",
    similarityConcept: "4",
    similarityJudgment: "3",
    similarityDifficulty: "harder",
    missingTopicIds: ["none"],
    ...values,
  })) {
    if (Array.isArray(value)) {
      for (const v of value)
        await page.locator(`input[name="${name}"][value="${v}"]`).check();
    } else await page.locator(`select[name="${name}"]`).selectOption(value);
  }
}
try {
  await check(
    "Queue → exact Revision; Candidate metadata separated; matching Evaluation",
    async () => {
      await control("reset");
      await page.goto(base);
      await page
        .getByRole("heading", { level: 1, name: "Review Queue" })
        .waitFor();
      await page.locator("tbody a").first().click();
      await page
        .getByRole("heading", { level: 1, name: "QuestionRevision Review" })
        .waitFor();
      assert.match(
        await page.locator("#evaluation").innerText(),
        /Content \/ Context一致: 確認済み/,
      );
      assert.equal(await action("approve").isEnabled(), true);
      for (const section of [
        "content",
        "context",
        "source",
        "evaluation",
        "diff",
        "human",
      ]) {
        await page.locator(`[data-section="${section}"]`).click();
        assert.equal(
          await page.evaluate(() => document.activeElement.id),
          section,
        );
      }
      await page.screenshot({
        path: fileURLToPath(new URL("evaluation-match.png", output)),
        fullPage: true,
      });
    },
  );
  await check(
    "APPROVE confirmation cancel / keyboard Escape restores operation",
    async () => {
      await action("approve").click();
      await page.keyboard.press("Escape");
      assert.equal(await page.getByRole("dialog").isVisible(), false);
      assert.equal(await action("approve").isEnabled(), true);
    },
  );
  await check(
    "APPROVE commits exact Revision, Published state and max1 decision",
    async () => {
      const before = await control("state");
      await confirm("approve");
      await done();
      const after = await control("state");
      assert.equal(after.record.value.state, "PUBLISHED");
      assert.equal(
        after.record.value.review.questionRevisionId,
        before.record.value.questionRevisionId,
      );
      assert.equal(await action("reject").isDisabled(), true);
    },
  );
  for (const scenario of ["content-mismatch", "evaluation-missing"]) {
    await check(
      `${scenario}: APPROVE disabled; exact Content; Edit allowed`,
      async () => {
        const r = await reset(scenario);
        assert.equal(await action("approve").isDisabled(), true);
        assert.equal(await action("edit").isEnabled(), true);
        assert.equal(await page.locator(".stem").innerText(), r.revision.stem);
        assert.match(
          await page.locator("#evaluation").innerText(),
          /適用されません|未確認/,
        );
      },
    );
    for (const [button, decision] of [
      ["request-changes", "REQUEST_CHANGES"],
      ["reject", "REJECT"],
    ])
      await check(
        `${scenario}: ${decision} commits without matching Evaluation`,
        async () => {
          const r = await reset(scenario);
          await confirm(button);
          await done();
          const after = await control("state");
          assert.equal(after.record.value.review.decision, decision);
          assert.equal(
            after.record.value.review.questionRevisionId,
            r.questionRevisionId,
          );
        },
      );
  }
  for (const [scenario, label, remediation] of [
    ["sources-trusted", "TRUSTED", null],
    ["sources-review", "REVIEW_REQUIRED", "Source Review"],
    ["sources-prohibited", "PROHIBITED", "再生成"],
    ["sources-ambiguous", "ambiguous", "一意"],
    ["sources-missing", "missing", "確認・解決"],
  ]) {
    await check(
      `${scenario}: all Source current Policies / disabled reasons / remediation`,
      async () => {
        await reset(scenario);
        const blocked = !!remediation;
        assert.equal(await action("approve").isDisabled(), blocked);
        assert.equal(await action("edit").isDisabled(), blocked);
        assert.equal(await action("reject").isEnabled(), true);
        assert.match(
          await page.locator("#source").innerText(),
          new RegExp(label),
        );
        if (blocked) {
          assert.match(
            await page.locator("#human-reasons").innerText(),
            new RegExp(remediation),
          );
          assert.equal(
            await action("edit").getAttribute("aria-describedby"),
            "human-reasons",
          );
        }
      },
    );
    if (remediation)
      await check(
        `${scenario}: direct Edit and Source-removal bypass create no Candidate`,
        async () => {
          const r = await reset(scenario, "edit");
          assert.equal(await page.locator("#edit-form").count(), 0);
          assert.match(
            await page.locator("main").innerText(),
            new RegExp(remediation),
          );
          const d = r.revision;
          const draft = {
            type: d.type,
            stem: d.stem,
            options: d.options,
            correctOptionIds: d.correctOptionIds,
            explanation: d.explanation,
            optionExplanations: d.optionExplanations,
            language: d.language,
            difficulty: d.difficulty,
            knowledgePointIds: d.knowledgePointIds,
            sourceReferences: r.editSourceReferences.slice(0, 1),
          };
          const result = await rpc("edit", {
            operationId: crypto.randomUUID(),
            questionRevisionId: r.questionRevisionId,
            expectedRevisionVersion: r.revisionVersion,
            expectedPolicyDecisionIds: r.currentPolicyDecisions.map(
              (p) => p.sourcePolicyDecisionId,
            ),
            draft,
          });
          assert.equal(result.error.code, "SOURCE_BLOCKER");
          assert.equal((await control("state")).candidates.length, 0);
          if (scenario === "sources-prohibited")
            await page.screenshot({
              path: fileURLToPath(new URL("source-remediation.png", output)),
              fullPage: true,
            });
        },
      );
  }
  await check(
    "Policy refresh preserves historical Snapshot and restores Review / Edit",
    async () => {
      const r = await reset("sources-review");
      await control("refresh");
      await action("refresh").click();
      await page
        .getByRole("heading", { level: 1, name: "QuestionRevision Review" })
        .waitFor();
      assert.equal(await action("approve").isEnabled(), true);
      assert.equal(await action("edit").isEnabled(), true);
      const after = await control("state");
      assert.deepEqual(
        after.record.value.sourceRevisionSnapshots,
        r.sourceRevisionSnapshots,
      );
      assert.deepEqual(
        after.record.value.revision.questionSources,
        r.revision.questionSources,
      );
    },
  );
  for (const selection of [[0], [1], [0, 1]])
    await check(
      `SourceReference same locator / different Revision selection ${selection}`,
      async () => {
        const r = await reset("same-locator", "edit");
        const refs = page.locator('input[name="sourceReferences"]');
        assert.equal(await refs.count(), 2);
        const vals = await refs.evaluateAll((es) => es.map((e) => e.value));
        assert.notEqual(vals[0], vals[1]);
        for (let i = 0; i < (await refs.count()); i++)
          await refs.nth(i).uncheck();
        for (const i of selection) await refs.nth(i).check();
        await page.getByRole("button", { name: "新Candidateを確認" }).click();
        await dialogAction("save").click();
        await done();
        const state = await control("state");
        assert.deepEqual(
          state.candidates[0].draft.sourceReferences,
          r.editSourceReferences.filter((_, i) => selection.includes(i)),
        );
        assert.equal(state.candidates[0].evaluation, null);
        assert.equal(state.candidates[0].requiresEvaluation, true);
        assert.deepEqual(state.record.value.revision, r.revision);
      },
    );
  await check(
    "Edit inline validation associated with first invalid control and focus",
    async () => {
      await reset("ready", "edit");
      await page.locator('textarea[name="stem"]').fill("");
      await page.getByRole("button", { name: "新Candidateを確認" }).click();
      await dialogAction("save").click();
      await page
        .locator('textarea[name="stem"][aria-invalid="true"]')
        .waitFor();
      assert.equal(
        await page.evaluate(() => document.activeElement.name),
        "stem",
      );
      assert.equal(
        await page
          .locator('textarea[name="stem"]')
          .getAttribute("aria-describedby"),
        "error-stem",
      );
    },
  );
  await check("Canonical Diff ignores relation set reorder", async () => {
    await reset("diff-reordered");
    assert.match(
      await page.locator("#diff").innerText(),
      /QuestionSource.*変更なし/,
    );
    assert.match(await page.locator("#diff").innerText(), /正答.*変更なし/);
  });
  await check(
    "Confirmed save failure permits same operation retry",
    async () => {
      await reset();
      await control("fault", { fault: "confirmed-failure" });
      await confirm("approve");
      await dialogAction("retry").waitFor({ state: "visible" });
      assert.match(
        await page.locator("#save-status").innerText(),
        /保存されていません|保存できません/,
      );
      assert.equal((await control("state")).record.value.review, null);
      await dialogAction("retry").click();
      await done();
      assert.equal(
        (await control("state")).record.value.review.decision,
        "APPROVE",
      );
    },
  );
  await check(
    "Result unknown committed: no blind retry / cancel / navigation; reconcile success",
    async () => {
      await reset();
      await control("fault", { fault: "unknown-committed" });
      await confirm("approve");
      await dialogAction("reconcile").waitFor({ state: "visible" });
      assert.equal(await dialogAction("cancel").isDisabled(), true);
      assert.equal(await dialogAction("retry").isVisible(), false);
      await page.keyboard.press("Escape");
      assert.equal(await page.getByRole("dialog").isVisible(), true);
      await page.evaluate(() => (location.hash = "feedback"));
      await page.waitForTimeout(80);
      assert.match(await page.evaluate(() => location.hash), /^#review\//);
      await dialogAction("reconcile").click();
      await done();
      assert.equal(
        (await control("state")).record.value.review.decision,
        "APPROVE",
      );
    },
  );
  await check(
    "Result unknown uncommitted: still-unknown before proof; retry only after reconciliation",
    async () => {
      let operationId;
      const listener = (req) => {
        if (req.url().endsWith("/api/reviewer")) {
          const body = req.postDataJSON();
          if (body.operation === "decide") operationId = body.input.operationId;
        }
      };
      page.on("request", listener);
      await reset();
      await control("fault", { fault: "unknown-uncommitted" });
      await confirm("reject");
      await dialogAction("reconcile").waitFor({ state: "visible" });
      await dialogAction("reconcile").click();
      await page.waitForTimeout(80);
      assert.match(
        await page.locator("#save-status").innerText(),
        /引き続き不明/,
      );
      assert.equal(await dialogAction("retry").isVisible(), false);
      await control("abort", { operationId });
      await dialogAction("reconcile").click();
      await dialogAction("retry").waitFor({ state: "visible" });
      await dialogAction("retry").click();
      await done();
      assert.equal(
        (await control("state")).record.value.review.decision,
        "REJECT",
      );
      page.off("request", listener);
    },
  );
  await check(
    "Feedback normal / immutable resubmit without free text inputs",
    async () => {
      await fillFeedback();
      assert.equal(
        await page
          .locator(
            "#feedback-form textarea,#feedback-form input[type=file],#feedback-form input[type=url]",
          )
          .count(),
        0,
      );
      await page.getByRole("button", { name: "Feedbackを確認" }).click();
      await dialogAction("save").click();
      await done();
      assert.match(await page.locator("main").innerText(), /Feedback送信完了/);
    },
  );
  await check(
    "Feedback not_used synchronizes all three; unknown remains independent",
    async () => {
      await fillFeedback();
      await page
        .locator('select[name="similarityConcept"]')
        .selectOption("not_used");
      for (const f of [
        "similarityConcept",
        "similarityJudgment",
        "similarityDifficulty",
      ])
        assert.equal(
          await page.locator(`[name="${f}"]`).inputValue(),
          "not_used",
        );
      await page.getByRole("button", { name: "Feedbackを確認" }).click();
      assert.match(
        await page.locator("#dialog-description").innerText(),
        /not_used/,
      );
      await dialogAction("cancel").click();
      await page
        .locator('select[name="similarityConcept"]')
        .selectOption("unknown");
      await page.locator('select[name="similarityJudgment"]').selectOption("4");
      await page
        .locator('select[name="similarityDifficulty"]')
        .selectOption("similar");
      await page.getByRole("button", { name: "Feedbackを確認" }).click();
      await dialogAction("save").click();
      await done();
      assert.match(await page.locator("main").innerText(), /Feedback送信完了/);
    },
  );
  await check(
    "Feedback mixed not_used is rejected with inline error / focus",
    async () => {
      await fillFeedback();
      await page.locator('select[name="similarityConcept"]').evaluate((e) => {
        e.value = "not_used";
      });
      await page.getByRole("button", { name: "Feedbackを確認" }).click();
      await page
        .locator('[name="similarityConcept"][aria-invalid="true"]')
        .waitFor();
      assert.equal(
        await page.evaluate(() => document.activeElement.name),
        "similarityConcept",
      );
      assert.match(
        await page.locator("#error-similarityConcept").innerText(),
        /すべて|全|3/,
      );
      await page.screenshot({
        path: fileURLToPath(new URL("feedback-validation.png", output)),
        fullPage: true,
      });
    },
  );
  await check(
    "Feedback multiple-selection error is associated with its fieldset",
    async () => {
      await fillFeedback();
      await page.locator('input[name="examTopicIds"][value="unknown"]').check();
      await page.getByRole("button", { name: "Feedbackを確認" }).click();
      assert.equal(
        (await page
          .locator('input[name="examTopicIds"][aria-invalid="true"]')
          .count()) > 0,
        true,
      );
      assert.match(
        await page.locator("#error-examTopicIds").innerText(),
        /単独|併用|同時/,
      );
    },
  );
  await check(
    "Feedback confirmed failure preserves values and retries same operation",
    async () => {
      await fillFeedback();
      await control("fault", { fault: "confirmed-failure" });
      await page.getByRole("button", { name: "Feedbackを確認" }).click();
      await dialogAction("save").click();
      await dialogAction("retry").waitFor({ state: "visible" });
      await dialogAction("retry").click();
      await done();
      assert.match(await page.locator("main").innerText(), /Feedback送信完了/);
    },
  );
  await check(
    "Responsive layout has no page overflow at 1280 / 1440",
    async () => {
      await reset();
      for (const width of [1280, 1440]) {
        await page.setViewportSize({ width, height: 1000 });
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          true,
        );
      }
    },
  );
  await check(
    "Feedback all not_used persists as three distinct N/A signals",
    async () => {
      await fillFeedback();
      await page.locator('[name="similarityConcept"]').selectOption("not_used");
      await page.getByRole("button", { name: "Feedbackを確認" }).click();
      await dialogAction("save").click();
      await done();
      const result = await rpc("feedbacks", {
        certificationId: "synthetic-cloud-associate",
        limit: 20,
      });
      const item = result.value.items[0];
      for (const field of [
        "similarityConcept",
        "similarityJudgment",
        "similarityDifficulty",
      ])
        assert.equal(item.selection[field], "not_used");
    },
  );
  await check("Unsaved Edit survives current-state refresh", async () => {
    await reset("ready", "edit");
    await page.locator('[name="stem"]').fill("保存前の編集内容");
    await page.evaluate(() =>
      window.dispatchEvent(new HashChangeEvent("hashchange")),
    );
    await page
      .getByRole("heading", { level: 1, name: "新しい編集候補" })
      .waitFor();
    assert.equal(
      await page.locator('[name="stem"]').inputValue(),
      "保存前の編集内容",
    );
  });
  await check(
    "Unresolved Candidate queue preview is separate from Human Review",
    async () => {
      await control("reset", { scenario: "unresolved" });
      await page.goto(`${base}/?case=${crypto.randomUUID()}#queue`);
      await page
        .getByRole("heading", { level: 1, name: "Review Queue" })
        .waitFor();
      await page
        .getByText("Application Candidate · Domain Identity未解決", {
          exact: true,
        })
        .click();
      assert.match(
        await page.locator("tbody").innerText(),
        /全Human decision・Editは不可/,
      );
      assert.equal(await action("approve").count(), 0);
      assert.equal(await page.locator('tbody a[href^="#review/"]').count(), 0);
    },
  );
  await check(
    "Edit preserves readonly type / language / difficulty",
    async () => {
      await reset("ready", "edit");
      assert.equal(await page.locator('[name="type"]').isDisabled(), true);
      assert.equal(
        await page.locator('[name="difficulty"]').isDisabled(),
        true,
      );
      assert.equal(
        await page.locator('[name="language"]').getAttribute("readonly"),
        "",
      );
    },
  );
  assert.deepEqual(errors, []);
  await fs.writeFile(
    new URL("browser-results.json", output),
    `${JSON.stringify({ checks, javaScriptErrors: errors.length, passed }, null, 2)}\n`,
  );
  console.log(JSON.stringify({ checks, javaScriptErrors: errors.length }));
} finally {
  await browser.close();
}
