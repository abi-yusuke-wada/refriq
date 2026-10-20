import {
  FEEDBACK_CONTRACT_VERSION,
  canonicalEditCommand,
  humanDecisionIdentity,
  FEEDBACK_LABELS,
  FEEDBACK_MULTIPLE_FIELDS,
  SIMILARITY_FIELDS,
  feedbackChoices,
  referenceValue,
  selectSourceReferences,
  stableJson,
  validateFeedback,
  type Catalog,
  type CommandValue,
  type EditCommand,
  type EditDraft,
  type FeedbackCommand,
  type FeedbackField,
  type FieldError,
  type HumanDecisionCommand,
  type Operation,
  type Result,
  type ReviewDetail,
  type ReviewerClient,
  type SaveResult,
} from "@refriq/contracts";

const esc = (value: unknown): string =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ] ?? char,
  );
const pretty = (value: unknown) => esc(JSON.stringify(value, null, 2));
const safeUrl = (value: string): string | null => {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
};
const routeLink = (id: string) => `#review/${encodeURIComponent(id)}`;
type Pending = {
  operation: Omit<Operation, "actorId">;
  run: () => Promise<SaveResult<CommandValue>>;
  phase:
    | "confirm"
    | "saving"
    | "confirmed-failure"
    | "result-unknown"
    | "reconciling"
    | "complete";
  after: (value: CommandValue) => Promise<void>;
};

/** Semantic HTML / keyboard / focusを持つWeb UI。Domain判定・保存はClientの先へ委ねる。 */
export function mountReviewerApp(
  root: HTMLElement,
  client: ReviewerClient,
): () => void {
  root.innerHTML = `<header><a href="#queue" class="brand">refriq · Reviewer</a><nav aria-label="主な画面"><a href="#queue">Review Queue</a><a href="#feedback">受験Feedback入力</a><a href="#feedback-list">Feedback確認</a></nav></header><main id="reviewer-main" tabindex="-1" aria-live="polite"></main><dialog aria-labelledby="dialog-title" aria-describedby="dialog-description"></dialog>`;
  const main = root.querySelector<HTMLElement>("main");
  const dialog = root.querySelector<HTMLDialogElement>("dialog");
  if (!main || !dialog) throw new Error("reviewer root missing");
  const page = main;
  const modal = dialog;
  let catalog: Catalog | null = null;
  let detail: ReviewDetail | null = null;
  let pending: Pending | null = null;
  let renderSequence = 0;
  let currentRoute = location.hash || "#queue";
  let cursor: string | undefined;
  let feedbackDraft: Record<string, unknown> = {};
  let editDraft: EditDraft | null = null;
  let editId = "";
  let dirty = false;
  const focusHeading = () => {
    const heading = page.querySelector<HTMLElement>("h1");
    if (heading) {
      heading.tabIndex = -1;
      heading.focus();
    }
  };
  const note = (message: string) =>
    `<p class="notice" role="status">${esc(message)}</p>`;
  function error(result: Result<unknown>) {
    if (!result.ok)
      page.innerHTML = `<h1>処理を確認できません</h1><p role="alert">${esc(result.error.code)} · ${esc(result.error.message)}</p><button data-action="refresh">再取得</button>`;
  }
  function sourceSection(value: ReviewDetail): string {
    return `<section id="source"><h2>Source / Provenance</h2>${value.sources
      .map((row, index) => {
        const url = row.snapshot
          ? safeUrl(row.snapshot.sourceUrlAtRetrieval)
          : null;
        const prohibited = row.decisions.some(
          (p) => p.classification === "PROHIBITED",
        );
        return `<article class="source-entry"><h3>${esc(row.source.sourceRevisionId)} · ${esc(row.label)}</h3><p>KnowledgePoint: ${esc(row.source.knowledgePointId)} · ${esc(row.source.relation)} · ${esc(row.source.usagePurpose)}</p><dl><dt>取得時Policy</dt><dd>${esc(row.snapshot?.classificationAtUse ?? "未確認")} · Decision ${esc(row.source.sourcePolicyDecisionId)}</dd><dt>取得時刻</dt><dd>${esc(row.snapshot?.retrievedAt)}</dd><dt>取得時URL</dt><dd>${url && !prohibited ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(url)}</a>` : esc(row.snapshot?.sourceUrlAtRetrieval ?? "未確認")}</dd><dt>Fingerprint</dt><dd>${esc(row.snapshot?.contentFingerprint)}</dd><dt>現在Policy</dt><dd>${row.decisions.map((p) => `${esc(p.classification)} · ${esc(p.sourcePolicyDecisionId)} · ${esc(p.evaluatedAt)} · SourceReview ${esc(p.sourceReviewId ?? "なし")}`).join("<br>") || "missing"}</dd></dl><details><summary>取得時Terms / 現在Decisionの証跡</summary><pre>${pretty({ historical: row.snapshot?.termsMetadataSnapshot, current: row.decisions })}</pre></details>${row.remediation ? `<p id="source-reason-${index}" class="notice" role="status">${esc(row.remediation)}</p>` : ""}</article>`;
      })
      .join(
        "",
      )}<h3>生成元Candidateが使用したGrounding</h3><p>exact Revisionの現在有効なNormative Sourceへ読み替えません。</p>${value.record.context.groundingSegments.map((g) => `<p>${esc(g.sourceRevisionId)} · ${esc(g.locator)}</p>${g.text ? `<blockquote>${esc(g.text)}</blockquote>` : note("現在Policyが一意なTRUSTEDと確認できないSource本文は表示・再取得・再利用しません。参照metadataを保持します。")}`).join("")}</section>`;
  }
  function review(value: ReviewDetail): string {
    const record = value.record;
    const revision = record.revision;
    if (!revision)
      return `<h1>exact Revision未確認</h1>${note("Candidate ContentへFallbackしません。Human decisionはできません。")}`;
    const common = record.state === "REVIEW_REQUIRED" && !record.review;
    return `<a href="#queue">← Review Queue</a><h1>QuestionRevision Review</h1><p class="identity">Question: ${esc(record.questionId)}<br>exact QuestionRevision: <strong>${esc(record.questionRevisionId)}</strong><br>${esc(record.state)} · 現在公開中: ${esc(record.currentPublishedRevisionId ?? "なし")}</p><p>生成元Candidate（経路metadata）: ${esc(record.candidate?.candidateId ?? "なし")} · Run ${esc(record.candidate?.pipelineRunId ?? "なし")}</p><p>表示とHuman Reviewの正本はexact QuestionRevisionの凍結Contentです。</p><nav aria-label="Review内の項目">${[
      ["content", "内容"],
      ["context", "Knowledge / Intent"],
      ["source", "Source"],
      ["evaluation", "Evaluation"],
      ["diff", "差分"],
      ["human", "Human判断"],
    ]
      .map(
        ([id, label]) => `<a href="#${id}" data-section="${id}">${label}</a>`,
      )
      .join(
        "",
      )}</nav><section id="content"><h2>問題・正答・解説</h2><p>${esc(revision.type)} · ${esc(revision.language)} · ${esc(revision.difficulty)}</p><p class="stem">${esc(revision.stem)}</p><ol>${revision.options.map((option) => `<li><strong>${esc(option.id)} ${revision.correctOptionIds.includes(option.id) ? "（正答）" : ""}</strong> ${esc(option.text)}<p>${esc(revision.optionExplanations[option.id])}</p></li>`).join("")}</ol><h3>解説</h3><p>${esc(revision.explanation)}</p></section><section id="context"><h2>KnowledgePointと学習意図</h2>${record.context.knowledgePoints
      .filter((point) =>
        revision.knowledgePointIds.includes(point.knowledgePointId),
      )
      .map(
        (point) =>
          `<h3>${esc(point.title)}</h3><p>${esc(point.knowledgePointId)} · ${esc(point.examTopicId)}</p><p>${esc(point.summary)}</p>`,
      )
      .join(
        "",
      )}<dl><dt>学習目標</dt><dd>${esc(revision.questionIntent.learningObjective)}</dd><dt>測るConcept</dt><dd>${esc(revision.questionIntent.targetConcept)}</dd><dt>制約</dt><dd>${revision.questionIntent.constraints.map(esc).join("<br>")}</dd></dl></section>${sourceSection(value)}<section id="evaluation"><h2>AI Evaluation</h2><p>対象: ${esc(record.evaluation?.questionRevisionId ?? "未確認 / Candidate")}</p>${note(value.evaluationState.ok ? "Content / Context一致: 確認済み" : value.evaluationState.error.message)}<p>${esc(record.evaluation?.result.decision ?? "Evaluation missing")} · ${esc(record.evaluation?.reviewEligibility ?? "未確認")}</p><p>LLM PASSだけではHuman APPROVEでもPublishedでもありません。</p><dl>${Object.entries(
      record.evaluation?.result.checks ?? {},
    )
      .map(([key, status]) => `<dt>${esc(key)}</dt><dd>${esc(status)}</dd>`)
      .join(
        "",
      )}</dl>${record.evaluation?.result.findings.map((f) => `<p>${esc(f.severity)} · ${esc(f.code)} · ${esc(f.message)}</p>`).join("") ?? ""}<h3>曖昧さ・前提</h3><ul>${[...(record.evaluation?.result.ambiguityNotes ?? []), ...(record.evaluation?.result.assumptions ?? [])].map((message) => `<li>${esc(message)}</li>`).join("")}</ul></section><section id="diff"><h2>前Revisionとの差分</h2>${value.diff ? `<p>${esc(record.previousRevision?.questionRevisionId)} → ${esc(record.questionRevisionId)}</p>${value.diff.map((row) => `<details><summary>${esc(row.label)}: ${row.changed ? "変更あり" : "変更なし"}</summary><div class="diff-columns"><pre>${pretty(row.previous)}</pre><pre>${pretty(row.current)}</pre></div></details>`).join("")}` : "<p>初版: 前Revisionなし</p>"}</section><section id="human"><h2>Human Review</h2>${record.review ? note(`記録済み: ${record.review.decision} · ${record.review.questionRevisionId} · ${record.review.reviewerId} · ${record.review.reviewedAt}`) : note("Human decision未記録。最大1件の決定をこのexact Revisionへ記録します。")}<div id="human-reasons" role="status">${!value.approve.ok ? `<p>APPROVE不可: ${esc(value.approve.error.code)} · ${esc(value.approve.error.message)}</p>` : ""}${!value.edit.ok ? `<p>Edit不可: ${esc(value.edit.error.message)}</p>` : ""}${value.sources
      .filter((s) => s.remediation)
      .map((s) => `<p>${esc(s.label)}: ${esc(s.remediation)}</p>`)
      .join(
        "",
      )}<p>Evaluation missing / mismatchだけではREQUEST_CHANGES・REJECTを禁止しません。Question ReviewではSource Policyを変更しません。</p></div><div class="actions"><button data-action="approve" aria-describedby="human-reasons" ${value.approve.ok ? "" : "disabled"}>承認して公開 · APPROVE</button><button data-action="request-changes" ${common ? "" : "disabled"}>修正を依頼 · REQUEST_CHANGES</button><button data-action="reject" ${common ? "" : "disabled"}>却下 · REJECT</button><button data-action="edit" aria-describedby="human-reasons" ${value.edit.ok ? "" : "disabled"}>Edit · 新しい候補</button><button data-action="refresh">現在Policy / Reviewを再取得</button></div></section>`;
  }
  function fieldError(field: string): string {
    return `<p id="error-${field}" class="inline-error" hidden></p>`;
  }
  function renderEdit(value: ReviewDetail): string {
    const r = value.record.revision;
    if (!r || !value.edit.ok)
      return `<h1>Editできません</h1><div role="alert">${esc(!value.edit.ok ? value.edit.error.message : "exact Revision未確認")}</div>${sourceSection(value)}<button data-action="refresh">現在Policyを再取得</button>`;
    if (!editDraft || editId !== r.questionRevisionId) {
      editId = r.questionRevisionId;
      editDraft = {
        type: r.type,
        stem: r.stem,
        options: structuredClone(r.options),
        correctOptionIds: [...r.correctOptionIds],
        explanation: r.explanation,
        optionExplanations: { ...r.optionExplanations },
        sourceReferences: structuredClone(value.record.editSourceReferences),
        language: r.language,
        difficulty: r.difficulty,
        knowledgePointIds: [...r.knowledgePointIds],
      };
    }
    const draft = editDraft;
    return `<h1>新しい編集候補</h1><p>base exact Revision: ${esc(r.questionRevisionId)}。元Revision・Human Review・公開参照は変更しません。</p><p id="edit-context-note">形式・言語・難易度は現在の学習意図として閲覧専用です。方式変更をこの編集へ追加しません。</p><form id="edit-form" novalidate><div id="error-summary" role="alert" tabindex="-1"></div><label>形式<select name="type" disabled aria-describedby="edit-context-note"><option value="single_choice" ${draft.type === "single_choice" ? "selected" : ""}>Single Choice</option><option value="multiple_select" ${draft.type === "multiple_select" ? "selected" : ""}>Multiple Select</option></select></label>${fieldError("type")}<label>問題文<textarea name="stem" aria-describedby="error-stem">${esc(draft.stem)}</textarea></label>${fieldError("stem")}<fieldset data-field="options"><legend>選択肢</legend>${draft.options.map((option, i) => `<label>${esc(option.id)}<textarea name="option-${i}" data-field="options" aria-describedby="error-options">${esc(option.text)}</textarea></label>`).join("")}${fieldError("options")}</fieldset><fieldset data-field="correctOptionIds"><legend>正答候補</legend>${draft.options.map((option, i) => `<label><input type="checkbox" name="correctOptionIds" value="${esc(option.id)}" aria-describedby="error-correctOptionIds" ${draft.correctOptionIds.includes(option.id) ? "checked" : ""}>${esc(option.id)} · ${i + 1}</label>`).join("")}${fieldError("correctOptionIds")}</fieldset><label>解説<textarea name="explanation" aria-describedby="error-explanation">${esc(draft.explanation)}</textarea></label>${fieldError("explanation")}<fieldset data-field="optionExplanations"><legend>選択肢ごとの説明</legend>${draft.options.map((option, i) => `<label>${esc(option.id)}<textarea name="option-explanation-${i}" data-field="optionExplanations" aria-describedby="error-optionExplanations">${esc(draft.optionExplanations[option.id])}</textarea></label>`).join("")}${fieldError("optionExplanations")}</fieldset><label>言語<input name="language" readonly aria-describedby="error-language edit-context-note" value="${esc(draft.language)}"></label>${fieldError("language")}<label>難易度<select name="difficulty" disabled aria-describedby="edit-context-note"><option value="beginner" ${draft.difficulty === "beginner" ? "selected" : ""}>Beginner</option><option value="intermediate" ${draft.difficulty === "intermediate" ? "selected" : ""}>Intermediate</option><option value="advanced" ${draft.difficulty === "advanced" ? "selected" : ""}>Advanced</option></select></label>${fieldError("difficulty")}<fieldset data-field="knowledgePointIds"><legend>同じIntentのKnowledgePoint</legend>${r.knowledgePointIds.map((id) => `<label><input type="checkbox" name="knowledgePointIds" value="${esc(id)}" aria-describedby="error-knowledgePointIds" ${draft.knowledgePointIds.includes(id) ? "checked" : ""}>${esc(id)}</label>`).join("")}${fieldError("knowledgePointIds")}</fieldset><fieldset data-field="sourceReferences"><legend>SourceReference · SourceRevision + Locator</legend>${value.record.editSourceReferences.map((ref) => `<label><input type="checkbox" name="sourceReferences" value="${esc(referenceValue(ref))}" aria-describedby="error-sourceReferences" ${draft.sourceReferences.some((rf) => referenceValue(rf) === referenceValue(ref)) ? "checked" : ""}>${esc(ref.sourceRevisionId)} · ${esc(ref.locator)}</label>`).join("")}${fieldError("sourceReferences")}</fieldset><p>Source blockerを外すためのEditはできません。変更したContentには新Validation / Evaluationが必要です。</p><button type="submit">新Candidateを確認</button><button type="button" data-action="discard-edit">編集を破棄して戻る</button></form>`;
  }
  function renderFeedback(): string {
    if (!catalog) return "";
    const choices = feedbackChoices(catalog);
    return `<h1>実試験受験後のFeedback</h1><p>抽象的な選択式Signalのみを受け付けます。問題本文・選択肢・正答・自由記述・URL・添付は入力できません。</p><form id="feedback-form" novalidate><div id="error-summary" role="alert" tabindex="-1"></div>${(
      Object.keys(choices) as FeedbackField[]
    )
      .map((field) => {
        const multiple = (
          FEEDBACK_MULTIPLE_FIELDS as readonly string[]
        ).includes(field);
        return `<fieldset data-field="${field}"><legend>${esc(FEEDBACK_LABELS[field])}</legend>${multiple ? choices[field].map(([id, label]) => `<label><input type="checkbox" name="${field}" value="${esc(id)}" aria-describedby="error-${field}" ${Array.isArray(feedbackDraft[field]) && (feedbackDraft[field] as unknown[]).includes(id) ? "checked" : ""}>${esc(label)}</label>`).join("") : `<select name="${field}" aria-label="${esc(FEEDBACK_LABELS[field])}" aria-describedby="error-${field}"><option value="">選択してください</option>${choices[field].map(([id, label]) => `<option value="${esc(id)}" ${feedbackDraft[field] === id ? "selected" : ""}>${esc(label)}</option>`).join("")}</select>`}${fieldError(field)}</fieldset>`;
      })
      .join(
        "",
      )}<p>refriq未利用は比較3項目すべてに適用します。「利用したが判断できない」は各観点で選べます。</p><button type="submit">Feedbackを確認</button></form>`;
  }
  function associateErrors(
    form: HTMLFormElement,
    errors: readonly FieldError[],
  ) {
    form.querySelectorAll<HTMLElement>("[aria-invalid]").forEach((element) => {
      element.removeAttribute("aria-invalid");
    });
    form.querySelectorAll<HTMLElement>(".inline-error").forEach((element) => {
      element.hidden = true;
      element.textContent = "";
    });
    const summary = form.querySelector<HTMLElement>("#error-summary");
    if (summary)
      summary.innerHTML = `<p>入力内容を修正してください。</p><ul>${errors.map((error) => `<li>${esc(error.message)}</li>`).join("")}</ul>`;
    let first: HTMLElement | null = null;
    for (const item of errors) {
      const controls = form.querySelectorAll<HTMLElement>(
        `[name="${CSS.escape(item.field)}"],[data-field="${CSS.escape(item.field)}"] textarea,[data-field="${CSS.escape(item.field)}"] input`,
      );
      const message = form.querySelector<HTMLElement>(
        `#error-${CSS.escape(item.field)}`,
      );
      if (message) {
        message.hidden = false;
        message.textContent = item.message;
      }
      for (const control of controls) {
        control.setAttribute("aria-invalid", "true");
        if (message) control.setAttribute("aria-describedby", message.id);
        first ??= control;
      }
    }
    (first ?? summary)?.focus();
  }
  function operationRef(
    kind: Operation["kind"],
    operationId: string,
    targetId: string,
    input: unknown,
  ) {
    return { kind, operationId, targetId, inputIdentity: stableJson(input) };
  }
  function confirmation(
    title: string,
    description: string,
    operation: Omit<Operation, "actorId">,
    run: Pending["run"],
    after: Pending["after"],
  ) {
    if (pending) return;
    pending = { operation, run, after, phase: "confirm" };
    modal.innerHTML = `<h2 id="dialog-title">${esc(title)}</h2><div id="dialog-description">${description}</div><div id="save-status" role="status" aria-live="polite"></div><div class="actions"><button data-dialog="save">確定する</button><button data-dialog="cancel">キャンセル</button><button data-dialog="retry" hidden>同じ操作を再試行</button><button data-dialog="reconcile" hidden>同じ操作の保存結果を照合</button><button data-dialog="done" hidden>結果を確認して閉じる</button></div>`;
    modal.showModal();
    modal.querySelector<HTMLButtonElement>("[data-dialog=save]")?.focus();
  }
  function phase(message: string) {
    const status = modal.querySelector<HTMLElement>("#save-status");
    if (status) status.textContent = message;
    modal.querySelectorAll<HTMLButtonElement>("button").forEach((button) => {
      const action = button.dataset.dialog;
      button.hidden =
        action === "save"
          ? pending?.phase !== "confirm"
          : action === "retry"
            ? pending?.phase !== "confirmed-failure"
            : action === "reconcile"
              ? pending?.phase !== "result-unknown"
              : action === "done"
                ? pending?.phase !== "complete"
                : false;
      button.disabled =
        ["saving", "result-unknown", "reconciling"].includes(
          pending?.phase ?? "",
        ) && action !== "reconcile";
    });
    modal.setAttribute(
      "aria-busy",
      String(pending?.phase === "saving" || pending?.phase === "reconciling"),
    );
  }
  async function save() {
    const attempt = pending;
    if (!attempt || !["confirm", "confirmed-failure"].includes(attempt.phase))
      return;
    attempt.phase = "saving";
    phase("保存中です。処理を重複して送信しないでください。");
    let result: SaveResult<CommandValue>;
    try {
      result = await attempt.run();
    } catch {
      result = {
        ok: false,
        unknown: true,
        message: "保存結果を確認できません。同じ操作を照合してください。",
      };
    }
    if (result.ok) {
      attempt.phase = "complete";
      phase("保存を確認しました。");
      dirty = false;
      editDraft = null;
      feedbackDraft = {};
      await attempt.after(result.value);
      return;
    }
    if ("unknown" in result) {
      attempt.phase = "result-unknown";
      phase(
        result.message +
          " 未保存と確認できるまでRetry・別Decision・画面移動はできません。",
      );
      modal
        .querySelector<HTMLButtonElement>("[data-dialog=reconcile]")
        ?.focus();
      return;
    }
    if (result.error.code === "CONFIRMED_FAILURE") {
      attempt.phase = "confirmed-failure";
      phase(result.error.message);
      return;
    }
    const form = page.querySelector<HTMLFormElement>("form");
    if (form && result.error.fields.length) {
      pending = null;
      modal.close();
      associateErrors(form, result.error.fields);
      return;
    }
    attempt.phase = "complete";
    phase(
      `${result.error.code} · ${result.error.message} 現在状態を再取得してください。`,
    );
  }
  async function reconcile() {
    const attempt = pending;
    if (attempt?.phase !== "result-unknown") return;
    attempt.phase = "reconciling";
    phase("同じ操作の保存結果を照合しています。再送はしていません。");
    const result = await client.reconcile(attempt.operation).catch(() => null);
    if (!result?.ok || result.value.state === "still-unknown") {
      attempt.phase = "result-unknown";
      phase("保存結果は引き続き不明です。同じ操作の照合を続けてください。");
      return;
    }
    if (result.value.state === "definitely-not-committed") {
      attempt.phase = "confirmed-failure";
      phase(
        "照合により、この操作が保存されていないことを確認しました。同じ操作を再試行できます。",
      );
      return;
    }
    attempt.phase = "complete";
    phase("同じ操作の保存済み結果を確認しました。再保存はしていません。");
    dirty = false;
    editDraft = null;
    feedbackDraft = {};
    await attempt.after(result.value.value);
  }
  async function render() {
    const sequence = ++renderSequence;
    page.innerHTML = `<h1>取得中</h1><p role="status">読み込んでいます。</p>`;
    page.setAttribute("aria-busy", "true");
    try {
      if (!catalog) {
        const result = await client.catalog();
        if (sequence !== renderSequence) return;
        if (sequence !== renderSequence) return;
        if (!result.ok) {
          error(result);
          return;
        }
        catalog = result.value;
      }
      const route = (location.hash || "#queue").slice(1);
      currentRoute = location.hash || "#queue";
      if (route.startsWith("review/") || route.startsWith("edit/")) {
        const id = decodeURIComponent(route.slice(route.indexOf("/") + 1));
        const result = await client.detail(id);
        if (sequence !== renderSequence) return;
        if (sequence !== renderSequence) return;
        if (!result.ok) {
          error(result);
          return;
        }
        detail = result.value;
        page.innerHTML = route.startsWith("edit/")
          ? renderEdit(detail)
          : review(detail);
      } else if (route === "feedback") page.innerHTML = renderFeedback();
      else if (route.startsWith("feedback-detail/")) {
        const result = await client.feedback(
          decodeURIComponent(route.slice("feedback-detail/".length)),
        );
        if (sequence !== renderSequence) return;
        if (!result.ok) {
          error(result);
          return;
        }
        page.innerHTML = `<h1>Feedback詳細</h1><p>${esc(result.value.examFeedbackId)} · ${esc(result.value.submittedAt)} · ${esc(result.value.feedbackContractVersion)}</p><pre>${pretty(result.value.selection)}</pre><p>immutable原本です。再提出は新Recordになります。QuestionReview・Sourceへ変換しません。</p>`;
      } else if (route === "feedback-list") {
        const result = await client.feedbacks({
          certificationId: catalog.certificationId,
          limit: 20,
          ...(cursor ? { cursor } : {}),
        });
        if (sequence !== renderSequence) return;
        if (!result.ok) {
          error(result);
          return;
        }
        page.innerHTML = `<h1>Feedback確認</h1>${result.value.items.length ? `<ul>${result.value.items.map((f) => `<li><a href="#feedback-detail/${encodeURIComponent(f.examFeedbackId)}">${esc(f.submittedAt)} · ${esc(f.examFeedbackId)}</a></li>`).join("")}</ul>` : note("Feedbackはまだありません。")}<button data-action="next" ${result.value.nextCursor ? "" : "disabled"}>次のページ</button>`;
        page
          .querySelector<HTMLButtonElement>("[data-action=next]")
          ?.addEventListener("click", () => {
            cursor = result.value.nextCursor ?? undefined;
            void render();
          });
      } else {
        const result = await client.queue({
          certificationId: catalog.certificationId,
          limit: 20,
          ...(cursor ? { cursor } : {}),
        });
        if (sequence !== renderSequence) return;
        if (!result.ok) {
          error(result);
          return;
        }
        page.innerHTML = `<h1>Review Queue</h1><p>exact Revisionと生成元Candidate・AI評価・Human判断・現在Policyを区別します。</p>${result.value.items.length ? `<div class="table-scroll"><table><thead><tr><th>exact対象 / Candidate metadata</th><th>Evaluation</th><th>Human / Lifecycle</th><th>全Source現在Policy</th></tr></thead><tbody>${result.value.items.map((item) => `<tr><td>${item.questionRevisionId ? `<a href="${routeLink(item.questionRevisionId)}">${esc(item.questionRevisionId)}</a>` : `<details><summary>Application Candidate · Domain Identity未解決</summary><p>Candidate内容の閲覧です。exact QuestionRevisionの代用ではありません。全Human decision・Editは不可です。</p><pre>${pretty(item.pendingCandidate ? { question: item.pendingCandidate.question, questionIntent: item.pendingCandidate.questionIntent, knowledgePoints: item.pendingCandidate.knowledgePoints.map((p) => ({ candidateId: p.candidateId, title: p.title })), evaluation: item.pendingCandidate.evaluation, source: { sourceRevisionId: item.pendingCandidate.sourceRevision.sourceRevisionId, retrievedAt: item.pendingCandidate.sourceRevision.retrievedAt, classificationAtUse: item.pendingCandidate.sourceRevision.classificationAtUse } } : {})}</pre><p>取得時Policyは現在の利用許可ではありません。本文のGroundingを再取得・再利用しません。</p></details>`}<p>${esc(item.stem)}</p><small>生成元Candidate: ${esc(item.candidate?.candidateId ?? "なし")}</small></td><td>${esc(item.evaluationDecision ?? "missing")} · ${item.evaluationMatches ? "対象一致" : "不一致 / 未確認"}</td><td>${esc(item.humanDecision ?? "未判断")} · ${esc(item.state)}</td><td>${esc(item.sourceSummary)}</td></tr>`).join("")}</tbody></table></div>` : note("Review待ちの対象はありません。")}<button data-action="next" ${result.value.nextCursor ? "" : "disabled"}>次のページ</button><button data-action="refresh">再取得</button>`;
        page
          .querySelector<HTMLButtonElement>("[data-action=next]")
          ?.addEventListener("click", () => {
            cursor = result.value.nextCursor ?? undefined;
            void render();
          });
      }
    } catch {
      if (sequence !== renderSequence) return;
      page.innerHTML = `<h1>処理を確認できません</h1><p role="alert">予期しない取得エラーです。別のRevisionへ置換していません。</p><button data-action="refresh">再取得</button>`;
    } finally {
      if (sequence === renderSequence) {
        page.setAttribute("aria-busy", "false");
        focusHeading();
      }
    }
  }
  async function afterDecision() {
    if (detail) {
      const result = await client.detail(detail.record.questionRevisionId);
      if (result.ok) {
        detail = result.value;
        page.innerHTML = review(detail);
      } else error(result);
    }
  }
  function changed(event: Event) {
    const control = event.target;
    if (!(control instanceof HTMLSelectElement)) return;
    if ((SIMILARITY_FIELDS as readonly string[]).includes(control.name)) {
      const form = control.form;
      if (!form) return;
      for (const field of SIMILARITY_FIELDS) {
        const other = form.elements.namedItem(field);
        if (!(other instanceof HTMLSelectElement)) continue;
        if (control.value === "not_used") other.value = "not_used";
        else if (other !== control && other.value === "not_used")
          other.value = "";
      }
    }
  }
  function submit(event: SubmitEvent) {
    event.preventDefault();
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || pending || !catalog) return;
    const data = new FormData(form);
    const operationId = crypto.randomUUID();
    if (form.id === "feedback-form") {
      const choices = feedbackChoices(catalog);
      feedbackDraft = {};
      for (const field of Object.keys(choices) as FeedbackField[]) {
        const decode = (value: FormDataEntryValue) =>
          choices[field].find(([id]) => String(id) === value)?.[0] ?? value;
        feedbackDraft[field] = (
          FEEDBACK_MULTIPLE_FIELDS as readonly string[]
        ).includes(field)
          ? data.getAll(field).map(decode)
          : decode(data.get(field) ?? "");
      }
      const validated = validateFeedback(feedbackDraft, catalog);
      if (!validated.ok) {
        associateErrors(form, validated.error.fields);
        return;
      }
      const command: FeedbackCommand = {
        operationId,
        feedbackContractVersion: FEEDBACK_CONTRACT_VERSION,
        selection: validated.value,
      };
      confirmation(
        "Feedbackを送信しますか",
        `<p>抽象的な選択Signalを新しいimmutable Recordとして送信します。</p><pre>${pretty(command.selection)}</pre>`,
        operationRef("feedback", operationId, catalog.certificationId, {
          feedbackContractVersion: FEEDBACK_CONTRACT_VERSION,
          selection: command.selection,
        }),
        () => client.submitFeedback(command),
        async (value) => {
          if ("examFeedbackId" in value)
            page.innerHTML = `<h1>Feedback送信完了</h1>${note(`保存確認済み: ${value.examFeedbackId}`)}<p>再提出は新Recordです。既存原本は上書きしません。</p><a href="#feedback">新しいFeedbackを入力</a>`;
        },
      );
      return;
    }
    if (form.id === "edit-form" && detail?.record.revision && editDraft) {
      const r = detail.record.revision;
      const refs = selectSourceReferences(
        detail.record.editSourceReferences,
        data.getAll("sourceReferences").map(String),
      );
      if (!refs) {
        associateErrors(form, [
          {
            field: "sourceReferences",
            message: "SourceRevisionとLocatorの組を確認してください。",
          },
        ]);
        return;
      }
      editDraft = {
        type: r.type,
        stem: String(data.get("stem") ?? ""),
        options: r.options.map((option, i) => ({
          id: option.id,
          text: String(data.get(`option-${i}`) ?? ""),
        })),
        correctOptionIds: data.getAll("correctOptionIds").map(String),
        explanation: String(data.get("explanation") ?? ""),
        optionExplanations: Object.fromEntries(
          r.options.map((o, i) => [
            o.id,
            String(data.get(`option-explanation-${i}`) ?? ""),
          ]),
        ),
        language: String(data.get("language") ?? ""),
        difficulty: r.difficulty,
        knowledgePointIds: data.getAll("knowledgePointIds").map(String),
        sourceReferences: refs,
      };
      const command: EditCommand = {
        operationId,
        questionRevisionId: r.questionRevisionId,
        expectedRevisionVersion: detail.record.revisionVersion,
        expectedPolicyDecisionIds: detail.sources
          .flatMap((s) => s.decisions.map((p) => p.sourcePolicyDecisionId))
          .sort(),
        draft: editDraft,
      };
      confirmation(
        "新Candidateを作成しますか",
        `<p>base: ${esc(r.questionRevisionId)}。元Contentを上書きせず、新Validation / Evaluationへ戻します。</p>`,
        operationRef(
          "edit",
          operationId,
          r.questionRevisionId,
          canonicalEditCommand(command),
        ),
        () => client.edit(command),
        async (value) => {
          if ("candidateId" in value)
            page.innerHTML = `<h1>新Candidateを作成しました</h1><p>Candidate: ${esc(value.candidateId)}</p><p>base Revision: ${esc(value.baseQuestionRevisionId)}</p>${note("新Validation / Evaluation待ちです。旧Evaluationは引き継いでいません。Domain Revision・Human Review・公開参照は変更していません。")}<a href="${routeLink(value.baseQuestionRevisionId)}">exact base Revisionへ戻る</a>`;
        },
      );
    }
  }
  function click(event: MouseEvent) {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest<HTMLElement>(
      "[data-action],[data-dialog],[data-section]",
    );
    if (!button) return;
    if (button.dataset.section) {
      event.preventDefault();
      const section = page.querySelector<HTMLElement>(
        `#${CSS.escape(button.dataset.section)}`,
      );
      if (section) {
        section.tabIndex = -1;
        section.focus();
        section.scrollIntoView();
      }
      return;
    }
    const action = button.dataset.dialog ?? button.dataset.action;
    if (action === "save" || action === "retry") {
      void save();
      return;
    }
    if (action === "reconcile") {
      void reconcile();
      return;
    }
    if (action === "cancel" || action === "done") {
      if (
        pending &&
        !["saving", "result-unknown", "reconciling"].includes(pending.phase)
      ) {
        pending = null;
        modal.close();
        if (action === "done") focusHeading();
      }
      return;
    }
    if (pending) return;
    if (action === "refresh") {
      cursor = undefined;
      void render();
      return;
    }
    if (action === "edit" && detail?.edit.ok) {
      location.hash = `edit/${encodeURIComponent(detail.record.questionRevisionId)}`;
      return;
    }
    if (action === "discard-edit" && detail) {
      if (
        window.confirm(
          "入力した編集を破棄しますか。元Revisionは変更されません。",
        )
      ) {
        editDraft = null;
        dirty = false;
        location.hash = routeLink(detail.record.questionRevisionId);
      }
      return;
    }
    const decisions = {
      approve: "APPROVE",
      "request-changes": "REQUEST_CHANGES",
      reject: "REJECT",
    } as const;
    if (action && Object.hasOwn(decisions, action) && detail) {
      const decision = decisions[action as keyof typeof decisions];
      const record = detail.record;
      if (
        record.state !== "REVIEW_REQUIRED" ||
        record.review ||
        !record.revision ||
        (decision === "APPROVE" && !detail.approve.ok)
      )
        return;
      const command: HumanDecisionCommand = {
        operationId: crypto.randomUUID(),
        questionId: record.questionId,
        questionRevisionId: record.questionRevisionId,
        expectedQuestionVersion: record.questionVersion,
        expectedRevisionVersion: record.revisionVersion,
        decision,
        expectedEvaluationId: record.evaluation?.evaluationId ?? null,
        expectedPolicyDecisionIds: detail.sources
          .flatMap((s) => s.decisions.map((p) => p.sourcePolicyDecisionId))
          .sort(),
      };
      confirmation(
        `${decision}を記録しますか`,
        `<p>exact QuestionRevision: <strong>${esc(record.questionRevisionId)}</strong></p><p>${esc(record.revision.stem)}</p><p>${decision === "APPROVE" ? "同じRevisionを公開し、現在公開参照を切り替えます。" : "同じRevisionへのHuman判断を記録します。公開参照は維持します。"} 記録後の上書き・二度目の決定はできません。</p>`,
        operationRef(
          "human-decision",
          command.operationId,
          record.questionRevisionId,
          humanDecisionIdentity(command),
        ),
        () => client.decide(command),
        afterDecision,
      );
    }
  }
  function captureDraft(event: Event) {
    const control = event.target;
    if (
      !(
        control instanceof HTMLInputElement ||
        control instanceof HTMLSelectElement ||
        control instanceof HTMLTextAreaElement
      )
    )
      return;
    const form = control.form;
    if (!form || pending) return;
    dirty = true;
    if (form.id === "edit-form" && detail?.record.revision) {
      const r = detail.record.revision;
      const data = new FormData(form);
      const refs = selectSourceReferences(
        detail.record.editSourceReferences,
        data.getAll("sourceReferences").map(String),
      );
      if (refs)
        editDraft = {
          type: r.type,
          stem: String(data.get("stem") ?? ""),
          options: r.options.map((option, i) => ({
            id: option.id,
            text: String(data.get(`option-${i}`) ?? ""),
          })),
          correctOptionIds: data.getAll("correctOptionIds").map(String),
          explanation: String(data.get("explanation") ?? ""),
          optionExplanations: Object.fromEntries(
            r.options.map((o, i) => [
              o.id,
              String(data.get(`option-explanation-${i}`) ?? ""),
            ]),
          ),
          language: String(data.get("language") ?? ""),
          difficulty: r.difficulty,
          knowledgePointIds: data.getAll("knowledgePointIds").map(String),
          sourceReferences: refs,
        };
    }
    if (form.id === "feedback-form" && catalog) {
      const data = new FormData(form);
      const choices = feedbackChoices(catalog);
      for (const field of Object.keys(choices) as FeedbackField[]) {
        const decode = (value: FormDataEntryValue) =>
          choices[field].find(([id]) => String(id) === value)?.[0] ?? value;
        feedbackDraft[field] = (
          FEEDBACK_MULTIPLE_FIELDS as readonly string[]
        ).includes(field)
          ? data.getAll(field).map(decode)
          : decode(data.get(field) ?? "");
      }
    }
  }
  function beforeUnload(event: BeforeUnloadEvent) {
    if (
      dirty ||
      (pending &&
        ["saving", "result-unknown", "reconciling"].includes(pending.phase))
    )
      event.preventDefault();
  }
  function hashChanged() {
    if (
      pending &&
      ["saving", "result-unknown", "reconciling"].includes(pending.phase)
    ) {
      history.replaceState(null, "", currentRoute);
      return;
    }
    if (dirty && (location.hash || "#queue") !== currentRoute) {
      if (!window.confirm("未保存の入力を破棄して移動しますか。")) {
        history.replaceState(null, "", currentRoute);
        return;
      }
      dirty = false;
      editDraft = null;
      feedbackDraft = {};
    }
    if (pending) {
      pending = null;
      modal.close();
    }
    cursor = undefined;
    void render();
  }
  const cancel = (event: Event) => {
    if (
      pending &&
      ["saving", "result-unknown", "reconciling"].includes(pending.phase)
    )
      event.preventDefault();
    else pending = null;
  };
  root.addEventListener("click", click);
  root.addEventListener("submit", submit);
  root.addEventListener("change", changed);
  root.addEventListener("change", captureDraft);
  root.addEventListener("input", captureDraft);
  window.addEventListener("beforeunload", beforeUnload);
  modal.addEventListener("cancel", cancel);
  window.addEventListener("hashchange", hashChanged);
  void render();
  return () => {
    root.removeEventListener("click", click);
    root.removeEventListener("submit", submit);
    root.removeEventListener("change", changed);
    root.removeEventListener("change", captureDraft);
    root.removeEventListener("input", captureDraft);
    window.removeEventListener("beforeunload", beforeUnload);
    modal.removeEventListener("cancel", cancel);
    window.removeEventListener("hashchange", hashChanged);
    root.replaceChildren();
  };
}
