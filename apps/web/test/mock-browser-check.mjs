import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require(
  process.env.REFRIQ_PLAYWRIGHT_MODULE || "playwright",
);
const base =
  process.env.REFRIQ_MOCK_URL ||
  "http://127.0.0.1:4174/docs/ux/mockups/reviewer/index.html";
const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
let checks = 0;
const passed = [];
page.on("pageerror", (e) => errors.push(e.message));
page.setDefaultTimeout(5000);
async function check(name, fn) {
  await fn();
  checks++;
  passed.push(name);
  console.log(`PASS ${name}`);
}
async function review(key) {
  await page.goto(`${base}?case=${crypto.randomUUID()}#review/${key}`);
  await page.locator("#human").waitFor();
}
try {
  await check(
    "unresolved Candidate blocks Edit button, direct route and forged submit",
    async () => {
      await review("candidate");
      assert.equal(
        await page.locator('[data-action="edit"]').isDisabled(),
        true,
      );
      await page.goto(`${base}?case=${crypto.randomUUID()}#edit/candidate`);
      await page
        .getByRole("heading", { name: "Editを利用できません" })
        .waitFor();
      assert.equal(await page.locator("#edit-form").count(), 0);
      assert.match(
        await page.locator("#app").innerText(),
        /QuestionRevision未作成/,
      );
      await page.evaluate(() => {
        const form = document.createElement("form");
        form.id = "edit-form";
        document.querySelector("#app").append(form);
        form.dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true }),
        );
      });
      assert.equal(await page.locator("#edit-form").count(), 0);
      await page.evaluate(() => {
        location.hash = "draft/candidate";
      });
      await page.getByText("編集候補はありません。", { exact: true }).waitFor();
    },
  );
  for (const [key, blocked] of [
    ["sources-trusted", false],
    ["sources-review", true],
    ["sources-prohibited", true],
    ["sources-ambiguous", true],
    ["sources-missing", true],
  ])
    await check(`approved Mock ${key} gates`, async () => {
      await review(key);
      assert.equal(
        await page.locator('[data-action="approve"]').isDisabled(),
        blocked,
      );
      assert.equal(
        await page.locator('[data-action="edit"]').isDisabled(),
        blocked,
      );
      assert.equal(
        await page.locator('[data-action="reject"]').isEnabled(),
        true,
      );
    });
  for (const key of ["sources-review", "sources-prohibited"])
    await check(`approved Mock ${key} direct Edit blocked`, async () => {
      await page.goto(`${base}?case=${crypto.randomUUID()}#edit/${key}`);
      await page.locator("#edit-blocked").waitFor();
      assert.match(
        await page.locator("#edit-blocked").innerText(),
        /Source|Policy/,
      );
    });
  await check(
    "approved Mock policy refresh restores Review / Edit",
    async () => {
      await review("sources-review");
      await page.locator('[data-action="refresh-source"]').click();
      await page.waitForFunction(
        () => !document.querySelector('[data-action="approve"]').disabled,
      );
      assert.equal(
        await page.locator('[data-action="approve"]').isEnabled(),
        true,
      );
      assert.equal(
        await page.locator('[data-action="edit"]').isEnabled(),
        true,
      );
    },
  );
  for (const key of ["content-mismatch", "evaluation-missing"])
    await check(
      `approved Mock ${key} allows negative decisions only`,
      async () => {
        await review(key);
        assert.equal(
          await page.locator('[data-action="approve"]').isDisabled(),
          true,
        );
        assert.equal(
          await page.locator('[data-action="request-changes"]').isEnabled(),
          true,
        );
        assert.equal(
          await page.locator('[data-action="reject"]').isEnabled(),
          true,
        );
      },
    );
  await check(
    "Policy gate rejection closes confirmation without retry or repeated Decision IDs",
    async () => {
      await review("ready");
      const historical = await page
        .locator("#source dt")
        .filter({ hasText: "取得時Policy（不変）" })
        .evaluateAll((items) =>
          items.map((item) => item.nextElementSibling.textContent),
        );
      await page.locator("#state").selectOption("policy-changed");
      let firstSourceState;
      for (let attempt = 0; attempt < 2; attempt++) {
        // 2回目はstaleな操作を再現し、UIのdisabledを迂回してもPolicyを再変更しないことを検証。
        if (attempt)
          await page.locator('[data-action="approve"]').evaluate((button) => {
            button.disabled = false;
          });
        await page.locator('[data-action="approve"]').click();
        await page.locator('[data-action="commit-dialog"]').click();
        await page.getByRole("dialog").waitFor({ state: "hidden" });
        assert.match(
          await page.locator("#app").innerText(),
          /判断条件が変わったため.*記録していません/,
        );
        assert.equal(
          await page.locator('[data-action="retry-save"]').count(),
          0,
        );
        assert.equal(
          await page.locator('[data-action="approve"]').isDisabled(),
          true,
        );
        assert.equal(
          await page.locator('[data-action="edit"]').isDisabled(),
          true,
        );
        assert.equal(
          await page.locator('[data-action="request-changes"]').isEnabled(),
          true,
        );
        assert.equal(
          await page.locator('[data-action="reject"]').isEnabled(),
          true,
        );
        const source = await page.locator("#source").innerText();
        assert.match(source, /REVIEW_REQUIRED/);
        assert.match(source, /:changed/);
        assert.doesNotMatch(source, /:changed:changed/);
        if (attempt) assert.equal(source, firstSourceState);
        else firstSourceState = source;
        assert.deepEqual(
          await page
            .locator("#source dt")
            .filter({ hasText: "取得時Policy（不変）" })
            .evaluateAll((items) =>
              items.map((item) => item.nextElementSibling.textContent),
            ),
          historical,
        );
      }
      await page.locator('[data-action="reject"]').click();
      await page.locator('[data-action="commit-dialog"]').click();
      await page.getByRole("dialog").waitFor({ state: "hidden" });
      assert.match(
        await page.locator("#human").innerText(),
        /記録済み:.*REJECT/,
      );
    },
  );
  await check(
    "approved Mock confirmed failure / result unknown remain separate",
    async () => {
      await review("ready");
      await page.locator("#state").selectOption("save-error");
      await page.locator('[data-action="approve"]').click();
      await page.locator('[data-action="commit-dialog"]').click();
      await page.waitForTimeout(800);
      assert.match(
        await page.locator("#decision-status").innerText(),
        /保存されていません|保存できません/,
      );
      await page.locator('[data-action="cancel-dialog"]').click();
      await page.locator("#state").selectOption("save-unknown-saved");
      await page.locator('[data-action="approve"]').click();
      await page.locator('[data-action="commit-dialog"]').click();
      await page.waitForTimeout(800);
      assert.match(
        await page.locator("#decision-status").innerText(),
        /確認できません|結果不明/,
      );
    },
  );
  await check("approved Mock Feedback not_used all-or-none", async () => {
    await page.goto(`${base}?case=${crypto.randomUUID()}#feedback`);
    await page.locator('[name="similarityConcept"]').selectOption("not_used");
    for (const f of [
      "similarityConcept",
      "similarityJudgment",
      "similarityDifficulty",
    ])
      assert.equal(
        await page.locator(`[name="${f}"]`).inputValue(),
        "not_used",
      );
  });
  assert.deepEqual(errors, []);
  await fs.writeFile(
    new URL(
      "../../../docs/ux/reviewer-ui-assets/production/mock-browser-results.json",
      import.meta.url,
    ),
    `${JSON.stringify({ checks, javaScriptErrors: errors.length, passed }, null, 2)}\n`,
  );
  console.log(JSON.stringify({ checks, javaScriptErrors: errors.length }));
} finally {
  await browser.close();
}
