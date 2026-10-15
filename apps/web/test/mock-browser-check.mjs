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
