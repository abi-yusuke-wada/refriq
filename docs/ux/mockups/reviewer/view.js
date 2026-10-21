(() => {
  const app = document.querySelector("#app");
  const dialog = document.querySelector("#confirm");
  const feedback = globalThis.reviewerFeedbackContract;
  const model = globalThis.reviewerReviewModel;
  let pendingSave = null;
  let records = structuredClone(globalThis.reviewerFixtures);
  let feedbackRecords = [
    {
      examFeedbackId: "synthetic-feedback-01",
      submittedAt: "2026-10-03T00:00:00.000Z",
      payload: structuredClone(feedback.example),
    },
  ];
  let state = "normal";
  let failNext = false;
  let busy = false;
  let editDraft = null;
  let feedbackDraft = null;
  let savedMessage = "";
  let rejectionMessage = "";
  let lastHash = location.hash || "#queue";
  const esc = (value) =>
    String(value ?? "—").replace(
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
  const badge = (value) => `<span class="badge">${esc(value)}</span>`;
  const notice = (text, kind = "") =>
    `<div class="notice ${kind}" role="status">${esc(text)}</div>`;
  const button = (
    label,
    action,
    style = "",
    disabled = false,
    describedBy = "",
  ) =>
    `<button type="button" data-action="${action}" class="${style}" ${disabled ? "disabled" : ""} ${describedBy ? `aria-describedby="${esc(describedBy)}"` : ""}>${label}</button>`;
  const link = (label, route) => `<a href="#${route}">${label}</a>`;
  const getRecord = (key) => records.find((record) => record.key === key);
  function sourceRemediationView(record, id) {
    const blocked = !record.sourcePolicyGate.eligible;
    return `<div class="notice ${blocked ? "error" : ""}" id="${id}" role="status"><h3>${blocked ? "Source問題の解消が必要です" : "Source条件は確認済みです"}</h3><p>${blocked ? "APPROVEとEditは利用できません。Sourceだけを外して、このRevisionのContentから新Candidateを作ることもできません。" : "全参照Sourceの現在PolicyはTRUSTEDです。Editは新Candidateを作る操作です。APPROVEには別途matching Evaluationと未決のHuman Review等を確認します。"}</p>${
      blocked
        ? `<ul>${model
            .sourceRemediation(record)
            .map(
              (item) =>
                `<li>${item.sourceRevisionId ? `<code>${esc(item.sourceRevisionId)}</code> · ${esc(item.usagePurpose)} · ` : ""}<strong>${esc(item.label)}</strong><br>${esc(item.message)}</li>`,
            )
            .join(
              "",
            )}</ul><p>未判断のexact RevisionへのREQUEST_CHANGES / REJECTは可能です。Question ReviewではSource Policyを変更しません。再生成 / 再提案のPipeline操作はこのMockの対象外です。</p>`
        : ""
    }</div>`;
  }
  function blockedEditView(record) {
    editDraft = null;
    return `${link("← 元のReviewへ", `review/${record.key}`)}<h1>Editを利用できません</h1><section class="card" id="edit-blocked" tabindex="-1"><p role="alert">Source Policy blockerがあるため、このRevisionから新Candidateを作成できません。候補は保存していません。</p>${sourceRemediationView(record, "edit-source-remediation")}<div class="actions">${button("新しい候補を保存できません", "blocked-edit", "primary", true, "edit-source-remediation")}${link("ReviewでSource証跡を確認", `review/${record.key}`)}</div></section>`;
  }
  function sourceBlockers(record) {
    return record.sourcePolicyGate.eligible
      ? []
      : record.sourcePolicyGate.blockers.map(
          (reason) => `Source条件を満たしません: ${reason}`,
        );
  }
  function approvalBlockers(record) {
    return [
      ...(!record.reviewTargetRevision
        ? [
            "Domain QuestionRevision IDとKnowledgePoint / QuestionSourceの解決が必要です。",
          ]
        : []),
      ...(record.humanReview ||
      (record.revision && record.revision.state !== "REVIEW_REQUIRED")
        ? ["このRevisionのHuman Reviewは完了しています。"]
        : []),
      ...(!model.evaluationReadiness(record).eligible
        ? [model.evaluationReadiness(record).message]
        : []),
      ...sourceBlockers(record),
    ];
  }
  function questionView(question) {
    return `<p>${badge(question.type)} · 正答候補 ${esc(question.correctOptionIds.join(", "))}</p><p class="stem">${esc(question.stem)}</p><ul class="options">${question.options.map((option) => `<li class="${question.correctOptionIds.includes(option.id) ? "correct" : ""}"><strong>${esc(option.id)} · ${esc(option.text)}</strong>${question.correctOptionIds.includes(option.id) ? ` ${badge("正答候補")}` : ""}<p>${esc(question.optionExplanations[option.id])}</p></li>`).join("")}</ul><h3>学習用の解説</h3><p>${esc(question.explanation)}</p>`;
  }
  function queueView() {
    return `<h1>Review Queue</h1><p>評価結果とHuman Reviewを別々に確認し、対象の内容・根拠を開きます。</p><div class="card table-scroll"><table><thead><tr><th>対象</th><th>Domain Revision / 現在公開中</th><th>AI評価</th><th>Human Review</th><th>現在Source Policy</th></tr></thead><tbody>${records.map((record) => `<tr><td>${link(esc(record.label), `review/${record.key}`)}<br><small>${esc(record.candidate.candidateId)}</small>${record.editedCandidate ? `<p>${link("新しい編集候補を確認", `draft/${record.key}`)}</p>` : ""}</td><td>${esc(record.revision?.questionRevisionId ?? "未作成")}<br><small>現在公開中: ${esc(record.currentPublishedRevisionId ?? "なし")}</small></td><td>${badge(record.reviewEvaluation?.result.decision ?? "Evaluation未確認")}<br><small>${esc(model.evaluationReadiness(record).message)}</small></td><td>${badge(record.humanReview?.decision ?? "未判断")}<br><small>${esc(record.revision?.state ?? "Application Candidate")}</small></td><td>${badge(model.sourceSummary(record))}</td></tr>`).join("")}</tbody></table></div>`;
  }
  function sourceView(record) {
    const rows = model.sourceRows(record);
    const groups = [
      ...new Set(
        rows.map(
          (row) => `${row.source.sourceRevisionId}/${row.source.usagePurpose}`,
        ),
      ),
    ].map((key) =>
      rows.filter(
        (row) =>
          `${row.source.sourceRevisionId}/${row.source.usagePurpose}` === key,
      ),
    );
    return `<section class="card" id="source"><h2>SourceとGrounding</h2><p>全Sourceの概要: ${badge(model.sourceSummary(record))}</p>${sourceRemediationView(record, "source-remediation")}${record.sourcePolicyRefresh && !record.sourcePolicyGate.eligible ? `<div class="design"><p>設計検証用: Source Review等が外部で完了した後の再取得例です。この操作でSource ReviewやPolicy変更は行いません。</p>${button("Source Review完了後を再取得（設計例）", "refresh-source")}<div id="source-refresh-status" role="status"></div></div>` : ""}${sourceBlockers(
      record,
    )
      .map((reason) => notice(reason, "error"))
      .join("")}${groups
      .map((group) => {
        const { snapshot, policies, source } = group[0];
        if (!snapshot)
          return notice(
            `固定Snapshotが一意に取得できません: ${source.sourceRevisionId}`,
            "error",
          );
        return `<article class="source-entry" data-source-revision="${esc(snapshot.sourceRevisionId)}"><h3>${esc(snapshot.sourceRevisionId)}</h3><dl><dt>公式Source URL（架空の公式相当URL）</dt><dd><a href="${esc(snapshot.sourceUrlAtRetrieval)}" target="_blank" rel="noopener noreferrer">${esc(snapshot.sourceUrlAtRetrieval)}</a></dd><dt>SourceDocument / SourceRevision</dt><dd>${esc(snapshot.sourceDocumentId)} / ${esc(snapshot.sourceRevisionId)}</dd><dt>取得時刻 / Fingerprint</dt><dd>${esc(snapshot.retrievedAt)} / ${esc(snapshot.contentFingerprint)}</dd><dt>Kind / Purpose</dt><dd>${esc(snapshot.sourceKindAtUse)} / ${esc(source.usagePurpose)}</dd><dt>取得時Policy（不変）</dt><dd>${badge(snapshot.classificationAtUse)} ${esc(snapshot.sourcePolicyDecisionId)}</dd><dt>現在Policy（このSource / Purposeに完全一致）</dt><dd>${policies.length !== 1 ? notice(`現在Decisionは${policies.length}件です。一意に解決できず公開不可。`, "error") : ""}${policies.map((policy) => `${badge(policy.classification)} ${esc(policy.sourcePolicyDecisionId)}<br>対象: ${esc(policy.sourceDocumentId)} / ${esc(policy.usagePurpose)}<br>${esc(policy.evaluatedAt)} · SourceReview: ${esc(policy.sourceReviewId ?? "この架空例では未経由")} · 理由: ${esc(policy.reasonCodes.join(" / ") || "確認済み")}<br>現在Terms: ${esc(policy.termsMetadataSnapshot.reviewStatus)} · ${esc(policy.termsMetadataSnapshot.checkedBy)} · ${esc(policy.termsMetadataSnapshot.checkedAt)}`).join("<hr>")}</dd><dt>利用時のTerms確認</dt><dd>${esc(snapshot.termsMetadataSnapshot.reviewStatus)} · ${esc(snapshot.termsMetadataSnapshot.checkedBy)} · ${esc(snapshot.termsMetadataSnapshot.checkedAt)}<br><a href="${esc(snapshot.termsMetadataSnapshot.termsUrl)}" target="_blank" rel="noopener noreferrer">利用条件の参照</a></dd><dt>Owner / Origin / Access / 自動取得</dt><dd>${esc(snapshot.sourceMetadataSnapshot.sourceOwner)} / ${esc(snapshot.sourceMetadataSnapshot.originStatus)} / ${esc(snapshot.sourceMetadataSnapshot.accessClassification)} / ${esc(snapshot.sourceMetadataSnapshot.automatedAccess)}</dd><dt>Allowlist / SourceReview参照</dt><dd>${esc(snapshot.matchedAllowRuleSnapshot?.id)} / ${esc(snapshot.sourceReviewId ?? "この架空例では未経由")}</dd><dt>exact RevisionのQuestionSource関連</dt><dd>${group.map((row) => `${esc(row.source.knowledgePointId ?? "Candidate（stable ID未解決）")} → ${esc(row.source.relation ?? "Candidate SourceReference")} → ${esc(row.source.sourceRevisionId)} · 取得時Decision ${esc(row.source.sourcePolicyDecisionId ?? "未解決")}`).join("<br>")}</dd></dl><h3>生成元Candidateが使用したGrounding</h3><p class="muted">Candidateの生成経路情報です。exact Revisionの検証済みGroundingとは読み替えません。</p>${record.candidate.groundingSegments
          .filter(
            (segment) => segment.sourceRevisionId === snapshot.sourceRevisionId,
          )
          .map(
            (segment) =>
              `<p><code>${esc(segment.sourceRevisionId)} · ${esc(segment.locator)}</code></p>`,
          )
          .join("")}${
          policies.some((policy) => policy.classification === "PROHIBITED")
            ? notice(
                "現在利用禁止のため抜粋は表示しません。禁止Contentは収集していません。",
                "error",
              )
            : record.candidate.groundingSegments
                .filter(
                  (segment) =>
                    segment.sourceRevisionId === snapshot.sourceRevisionId,
                )
                .map(
                  (segment) => `<blockquote>${esc(segment.text)}</blockquote>`,
                )
                .join("") ||
              "<p>抜粋を収録していません。固定Source関係を上で確認してください。</p>"
        }</article>`;
      })
      .join(
        "",
      )}<p class="muted">取得時Provenanceと現在Policyは別です。Source全文をコピーせず、SourceReviewはQuestionReviewと分離します。</p></section>`;
  }
  function evaluationView(record) {
    const candidate = record.candidate;
    const readiness = model.evaluationReadiness(record);
    const result = record.reviewEvaluation?.result;
    const targetLabel =
      record.reviewEvaluation?.targetKind === "QuestionRevision"
        ? `QuestionRevision ${record.reviewEvaluation.questionRevisionId}`
        : `生成元Candidate ${record.reviewEvaluation?.candidateId ?? candidate.candidateId}`;
    const header = `<section class="card" id="evaluation"><h2>Automated ValidationとAI評価</h2><p>評価対象: ${esc(targetLabel)}</p>${notice(readiness.message, readiness.matches ? "" : "warning")}${notice("LLM EvaluationはHuman Reviewの判断材料です。PASSだけでは公開されません。")}`;
    if (!result)
      return `${header}<p>exact対象のEvaluationは未確認です。生成元Candidateの${esc(candidate.evaluation.decision)}は現在Revisionのreadinessへ流用しません。</p></section>`;
    return `${header}${!readiness.matches ? "<p>このEvaluationは生成元Candidateに対する結果です。現在Review中のQuestionRevisionには適用されません。</p>" : ""}<p>Schema / 決定論的Validation: 検証済みStage出力の表示例</p><p>AI評価: ${badge(result.decision)} · ${badge(record.reviewEvaluation.reviewEligibility)}</p><table><thead><tr><th>検査項目</th><th>結果</th></tr></thead><tbody>${Object.entries(
      result.checks,
    )
      .map(
        ([criterion, result]) =>
          `<tr><td>${esc(criterion)}</td><td>${badge(result)}</td></tr>`,
      )
      .join(
        "",
      )}</tbody></table><h3>Findings</h3>${result.findings.length ? result.findings.map((finding) => `<div class="notice ${finding.severity === "error" ? "error" : "warning"}"><strong>${esc(finding.code)} · ${esc(finding.severity)}</strong><p>${esc(finding.message)}</p><small>${finding.sourceReferences.map((ref) => `${esc(ref.sourceRevisionId)} · ${esc(ref.locator)}`).join("<br>") || "参照なし"}</small></div>`).join("") : "<p>指摘なし</p>"}<h3>曖昧さ / 前提</h3><p>${esc(result.ambiguityNotes.join(" / ") || "曖昧さの記録なし")}</p><p>${esc(result.assumptions.join(" / ") || "前提の記録なし")}</p><details><summary>生成の記録</summary><p>Pipeline Run: ${esc(candidate.pipelineRunId)}</p>${candidate.stageRuns.map((stage) => `<p>${esc(stage.stage)} · ${esc(stage.status)} · attempt ${stage.attempt}<br><small>${esc(stage.startedAt)} → ${esc(stage.completedAt)}<br>${esc(stage.generationMetadata?.providerId)} / ${esc(stage.generationMetadata?.modelId)} / ${esc(stage.generationMetadata?.promptVersion)} / ${esc(stage.generationMetadata?.requestId)}</small></p>`).join("")}</details></section>`;
  }
  function diffView(record) {
    const previous = record.previousRevision;
    if (!previous)
      return `<section class="card" id="diff"><h2>前Revisionとの差分</h2>${notice("初版のため前Revisionはありません。差分の取得失敗とは区別します。")}</section>`;
    const current = record.reviewTargetRevision;
    const format = (value) =>
      typeof value === "object"
        ? JSON.stringify(value, null, 2)
        : String(value);
    return `<section class="card" id="diff"><h2>前Revisionとの差分（immutable Content全体）</h2><p>比較元 Domain Revision ${esc(previous.frozenContent.questionRevisionId)} → exact target ${esc(current.questionRevisionId)}</p><p>QuestionSource関係、KnowledgePoint ID（凍結Intent内も含む）、正答IDは集合として順序を除いて比較します。Optionsの表示順は比較します。現在Policy / 現在Terms / Lifecycleは比較しません。QuestionSourceの所属Revision IDは各欄に表示し、変更判定からのみ除外します。</p><div class="table-scroll"><table><thead><tr><th>項目</th><th>前Revision（不変）</th><th>Review対象Revision（不変）</th></tr></thead><tbody>${model
      .diff(previous.frozenContent, current)
      .map(
        (row) =>
          `<tr data-diff-field="${row.key}"><th>${row.label}<br>${badge(row.changed ? "変更あり" : "変更なし")}</th><td><pre>${esc(format(row.previous))}</pre></td><td><pre>${esc(format(row.current))}</pre></td></tr>`,
      )
      .join("")}</tbody></table></div></section>`;
  }
  function reviewView(record) {
    const candidate = record.candidate;
    const content = model.reviewContent(record);
    const points = record.reviewTargetRevision
      ? record.knowledgePoints.filter((point) =>
          record.reviewTargetRevision.knowledgePointIds.includes(
            point.knowledgePointId,
          ),
        )
      : candidate.knowledgePoints;
    const intent =
      record.reviewTargetRevision?.questionIntent ?? candidate.questionIntent;
    const blockers = approvalBlockers(record);
    return `${link("← Review Queue", "queue")}<h1>${esc(record.label)}</h1><div class="identity"><span>Question: <code>${esc(record.questionId ?? "未解決")}</code></span><span>対象Revision: <code>${esc(record.revision?.questionRevisionId ?? "Application Candidateのみ")}</code></span><span>${badge(record.revision?.state ?? "Application Candidate")}</span><span>現在公開中: <code>${esc(record.currentPublishedRevisionId ?? "なし")}</code></span></div><p class="wrap">生成元Candidate（経路metadata）: ${esc(candidate.candidateId)}</p>${record.reviewTargetRevision ? notice("表示・Human Reviewの正本は上記exact QuestionRevisionの凍結Contentです。Candidate Contentへ読み替えません。") : notice("Application Candidateのみです。Domain Revision未作成のため全Human decision・Editを許可しません。", "warning")}<details id="candidate-metadata"><summary>生成元Candidate Content（Reviewの正本ではありません）</summary><p>${esc(candidate.question.stem)}</p></details>${savedMessage ? notice(savedMessage, "success") : ""}${rejectionMessage ? notice(rejectionMessage, "warning") : ""}<div class="tabs"><a href="#content" data-section="content">問題・正答・解説</a><a href="#context" data-section="context">Knowledgeと意図</a><a href="#source" data-section="source">Source</a><a href="#evaluation" data-section="evaluation">評価</a><a href="#diff" data-section="diff">差分</a><a href="#human" data-section="human">Human判断</a></div><div class="grid"><section class="card" id="content"><h2>問題・正答候補・解説</h2><p>言語: ${esc(content.language ?? "候補未確定")} · 難易度: ${esc(content.difficulty ?? candidate.questionIntent.difficulty)}</p>${questionView(content)}</section><section class="card" id="context"><h2>KnowledgePointと生成意図</h2>${points.map((point) => `<h3>${esc(point.title)}</h3><p>${esc(point.summary)}</p><p><small>Candidate ID: ${esc(point.candidateId)}<br>Domain ID: ${esc(point.knowledgePointId ?? "未解決")}<br>分野: ${esc(candidate.examTopics.find((topic) => topic.examTopicId === point.examTopicId)?.name)}<br>${point.sourceReferences.map((ref) => `${esc(ref.sourceRevisionId)} · ${esc(ref.locator)}`).join("<br>")}</small></p>`).join("")}<dl><dt>学習目標</dt><dd>${esc(intent.learningObjective)}</dd><dt>測るConcept</dt><dd>${esc(intent.targetConcept)}</dd><dt>形式 / 難易度</dt><dd>${esc(intent.questionType)} / ${esc(intent.format)} / ${esc(intent.difficulty)}</dd><dt>生成の制約</dt><dd>${intent.constraints.map(esc).join("<br>")}</dd></dl></section></div>${sourceView(record)}${evaluationView(record)}${diffView(record)}<section class="card" id="human"><h2>Human Review</h2>${record.humanReview ? notice(`記録済み: ${record.humanReview.questionRevisionId} · ${record.humanReview.decision} · ${record.humanReview.reviewerId} · ${record.humanReview.reviewedAt} · ${record.humanReview.questionReviewId}`, "success") : notice("Human decisionは未記録です。AI評価とは別に、対象Revisionの内容と根拠を確認してください。")}${blockers.map((reason) => notice(reason, "warning")).join("")}${sourceRemediationView(record, "human-source-remediation")}<div class="actions">${button("承認して公開 · APPROVE", "approve", "primary", blockers.length > 0, "human-source-remediation")}${button("修正を依頼 · REQUEST_CHANGES", "request-changes", "", !record.reviewTargetRevision || Boolean(record.humanReview))}${button("却下 · REJECT", "reject", "danger", !record.reviewTargetRevision || Boolean(record.humanReview))}${button("Edit · 新しい候補を作る", "edit", "", !record.reviewTargetRevision || !record.sourcePolicyGate.eligible, "human-source-remediation")}</div>${record.editedCandidate ? `<p>${link("保存した編集候補を確認", `draft/${record.key}`)}</p>` : ""}<p class="muted">承認は公開を伴います。確認後もGateに失敗した場合は公開されません。記録済みReviewの変更や同じRevisionへの再判断は行いません。</p></section>`;
  }
  function editView(record) {
    if (!record.reviewTargetRevision) {
      editDraft = null;
      return `${link("← 元のReviewへ", `review/${record.key}`)}<h1>Editを利用できません</h1>${notice("Domain QuestionRevision未作成のため、このCandidateからEditできません。exact Revisionの解決が必要です。候補は保存していません。", "warning")}`;
    }
    if (!record.sourcePolicyGate.eligible) return blockedEditView(record);
    editDraft ??= {
      ...structuredClone(model.reviewContent(record)),
      knowledgePointCandidateIds: record.candidate.knowledgePoints
        .filter(
          (point) =>
            !record.reviewTargetRevision ||
            record.knowledgePoints.some(
              (stable) =>
                stable.candidateId === point.candidateId &&
                record.reviewTargetRevision.knowledgePointIds.includes(
                  stable.knowledgePointId,
                ),
            ),
        )
        .map((point) => point.candidateId),
      sourceReferences: record.editSourceReferences.filter(
        (ref) =>
          !record.reviewTargetRevision ||
          record.reviewTargetRevision.questionSources.some(
            (source) => source.sourceRevisionId === ref.sourceRevisionId,
          ),
      ),
    };
    return `${link("← 元のReviewへ", `review/${record.key}`)}<h1>Edit · 新しい作業候補</h1>${notice("現在のSource条件を満たすRevisionだけを編集します。Source blockerの除去には使いません。元Revisionは変更せず、内容変更後は再Validation / 再Evaluation / 新RevisionへのHuman Reviewが必要です。", "warning")}<form id="edit-form" class="card" novalidate><p>形式: ${esc(editDraft.type)} · ${editDraft.type === "single_choice" ? "正答候補は1件" : "正答候補は1件以上"}</p><label data-field="stem" id="field-stem">問題文<textarea name="stem" aria-describedby="error-stem" required>${esc(editDraft.stem)}</textarea><span class="inline-error" id="error-stem" hidden></span></label><fieldset data-field="correct" id="field-correct"><legend>選択肢と正答候補</legend><p class="inline-error" id="error-correct" hidden></p>${editDraft.options.map((option) => `<label data-field="option-${esc(option.id)}" id="field-option-${esc(option.id)}">${esc(option.id)} · 選択肢<textarea name="option-${esc(option.id)}" aria-describedby="error-option-${esc(option.id)}" required>${esc(option.text)}</textarea><span class="inline-error" id="error-option-${esc(option.id)}" hidden></span></label><label><input type="checkbox" name="correct" aria-describedby="error-correct" value="${esc(option.id)}" ${editDraft.correctOptionIds.includes(option.id) ? "checked" : ""} />${esc(option.id)}を正答候補にする</label><label data-field="explanation-${esc(option.id)}" id="field-explanation-${esc(option.id)}">${esc(option.id)} · 説明<textarea name="explanation-${esc(option.id)}" aria-describedby="error-explanation-${esc(option.id)}" required>${esc(editDraft.optionExplanations[option.id])}</textarea><span class="inline-error" id="error-explanation-${esc(option.id)}" hidden></span></label>`).join("")}</fieldset><label data-field="explanation" id="field-explanation">学習用解説<textarea name="explanation" aria-describedby="error-explanation" required>${esc(editDraft.explanation)}</textarea><span class="inline-error" id="error-explanation" hidden></span></label><fieldset data-field="knowledge" id="field-knowledge"><legend>参照するKnowledgePoint・分野</legend><p>このMockには同じ学習意図に属する利用可能な組合せが1件あります。TopicはKnowledgePointの参照から表示します。</p>${record.candidate.knowledgePoints.map((point) => `<label><input type="checkbox" name="knowledge" aria-describedby="error-knowledge" value="${esc(point.candidateId)}" ${editDraft.knowledgePointCandidateIds.includes(point.candidateId) ? "checked" : ""} />${esc(point.title)} · ${esc(point.examTopicId)}</label>`).join("")}<p class="inline-error" id="error-knowledge" hidden></p></fieldset><fieldset data-field="source" id="field-source"><legend>参照するSource</legend><p>SourceRevisionとLocatorの組で選びます。同じLocatorでも別のSourceRevisionは独立した参照です。</p>${record.editSourceReferences.map((ref) => `<label><input type="checkbox" name="source" aria-describedby="error-source" value="${esc(model.referenceValue(ref))}" ${editDraft.sourceReferences.some((selected) => model.referenceKey(selected) === model.referenceKey(ref)) ? "checked" : ""} />${esc(ref.sourceRevisionId)} · ${esc(ref.locator)}</label>`).join("")}<p class="inline-error" id="error-source" hidden></p><p class="muted">Source本文・取得時Snapshot・Policy・学習意図・既存KnowledgePointの定義は閲覧専用です。別の学習意図は別Questionとして扱います。</p></fieldset><div id="edit-error" role="alert" tabindex="-1"></div><div class="actions"><button class="primary" type="submit">新しい候補を保存（Mock）</button>${button("編集を破棄", "discard-edit", "danger")}</div></form>`;
  }
  function draftView(record) {
    if (!record.editedCandidate) return notice("編集候補はありません。");
    const current = record.editedCandidate;
    const original = model.reviewContent(record);
    const fields = [
      "type",
      "stem",
      "options",
      "correctOptionIds",
      "explanation",
      "optionExplanations",
      "knowledgePointCandidateIds",
      "sourceReferences",
    ];
    return `${link("← 元のReviewへ", `review/${record.key}`)}<h1>新しい編集候補</h1>${notice("候補保存成功（Mock）。再Validation / 再評価待ち。Domain Revisionは未作成で公開できません。", "warning")}<p>新Candidate: ${esc(current.candidateId)} · 元exact Revision: ${esc(record.reviewTargetRevision?.questionRevisionId ?? "未作成")}</p><section class="card">${questionView(current)}</section><section class="card" id="diff"><h2>新Candidateとの差分（Domain Revision間のDiffではありません）</h2><p>元exact Revision ${esc(original.questionRevisionId ?? "未作成Candidate")} → 新Candidate ${esc(current.candidateId)}</p>${fields.map((field) => `<h3>${esc(field)}</h3><p>元: ${esc(JSON.stringify(original[field] ?? null))}</p><p>新候補: ${esc(JSON.stringify(current[field]))}</p>`).join("")}</section><p>Edit → New Candidate → Validation / Evaluation → 新QuestionRevision → 新Human Review。元Revision・Review・公開参照は維持します。</p>`;
  }
  function feedbackFields(payload = {}) {
    return Object.entries(feedback.choices)
      .map(
        ([key, options]) =>
          `<fieldset data-field="${key}" id="field-${key}"><legend>${feedback.labels[key]}</legend>${feedback.multiple.includes(key) ? options.map(([value, label]) => `<label><input type="checkbox" name="${key}" aria-describedby="error-${key}" value="${esc(value)}" ${(payload[key] ?? []).includes(value) ? "checked" : ""} />${esc(label)}</label>`).join("") : `<label>${feedback.labels[key]}<select name="${key}" aria-describedby="error-${key}" required><option value="">選んでください</option>${options.map(([value, label]) => `<option value="${esc(value)}" ${payload[key] === value ? "selected" : ""}>${esc(label)}</option>`).join("")}</select></label>`}<p class="inline-error" id="error-${key}" hidden></p></fieldset>`,
      )
      .join("");
  }
  function feedbackSummary(payload) {
    return `<dl>${Object.entries(feedback.choices)
      .map(
        ([key, options]) =>
          `<dt>${feedback.labels[key]}</dt><dd>${(feedback.multiple.includes(key) ? payload[key] : [payload[key]]).map((value) => esc(options.find(([id]) => id === value)?.[1] ?? "未選択")).join(" / ")}</dd>`,
      )
      .join("")}</dl>`;
  }
  function feedbackView() {
    return `<h1>実試験受験後のFeedback</h1><p>学習内容の改善のため、受験体験の印象を選んでください。実試験問題の再現は受け付けません。</p>${notice("問題文・選択肢・解答・Screenshot・URL・自由記述の入力欄はありません。判断できない項目は「判断できない」を選べます。", "warning")}<form id="feedback-form" class="card" novalidate><p>全項目を選択してください。refriq未利用を選ぶと比較の3項目すべてが未利用になります。利用済みのRating / 判断できないへ戻すと、残りの比較項目を選び直します。複数選択では「判断できない」「不足を感じなかった」を他の選択と併用できません。</p><div class="form-grid">${feedbackFields(feedbackDraft ?? {})}</div><div id="feedback-error" role="alert" tabindex="-1"></div><button class="primary" type="submit">選択内容を確認する</button></form>`;
  }
  function feedbackConfirmView() {
    if (!feedback.validate(feedbackDraft))
      return `${notice("入力内容がありません。")}${link("Feedbackを入力", "feedback")}`;
    return `<h1>受験Feedbackの確認</h1>${notice("資格・分野の改善Signalとして送信します。QuestionReviewや正答の技術的根拠にはなりません。")}<section class="card">${feedbackSummary(feedbackDraft)}<div id="feedback-send-status" role="status"></div><div class="actions">${button("この内容を送信（Mock）", "send-feedback", "primary")}${link("入力へ戻る", "feedback")}</div><details><summary>設計検証用の選択データ</summary><pre>${esc(JSON.stringify(feedbackDraft, null, 2))}</pre><p>UX Mock内のデータです。Production API Schemaは確定していません。利用者ID・提出時刻は将来のApplicationが付与します。</p></details></section>`;
  }
  function feedbackListView() {
    return `<h1>受験Feedbackの確認</h1>${notice("受験体験の改善Signalです。個別問題のReview、修正依頼、Source利用判断とは分けて確認します。")}<div class="card"><table><thead><tr><th>提出</th><th>資格</th><th>出題分野・難易度</th><th>確認</th></tr></thead><tbody>${feedbackRecords.map((record, index) => `<tr><td>${esc(record.examFeedbackId)}<br>${esc(record.submittedAt)}</td><td>${esc(feedback.choices.certificationId.find(([id]) => id === record.payload.certificationId)?.[1])}</td><td>${esc(record.payload.examTopicIds.join(" / "))}<br>難易度 ${esc(record.payload.difficulty)}</td><td>${link("選択内容を開く", `feedback-detail/${index}`)}</td></tr>`).join("")}</tbody></table></div>`;
  }
  function feedbackDetailView(index) {
    const record = feedbackRecords[index];
    if (!record) return notice("対象Feedbackがありません。");
    return `${link("← Feedback一覧", "feedback-list")}<h1>受験Feedbackの詳細</h1><p>${esc(record.examFeedbackId)} · ${esc(record.submittedAt)}</p><section class="card">${feedbackSummary(record.payload)}</section>${notice("選択データを読み取り専用で確認します。改善判断はHumanが行い、このFeedbackから問題を自動生成・公開しません。")}<p>技術的な改善案は公式Sourceで別途確認します。提出内容は不変で、訂正する場合は新しいFeedbackを提出します。</p>`;
  }
  function route() {
    const [screen = "queue", key] = location.hash.slice(1).split("/");
    return { screen: screen || "queue", key };
  }
  function render() {
    const { screen, key } = route();
    const record = getRecord(key);
    if (state === "loading")
      app.innerHTML = `<div class="card loading" role="status"><h1>取得中</h1><p>内容を取得しています。取得成功・失敗は別の状態です。</p>${button("取得成功の例へ", "normal")}</div>`;
    else if (state === "fetch-error")
      app.innerHTML = `<div class="card"><h1>取得できませんでした</h1>${notice("読取に失敗しました。空の一覧とは区別します。", "error")}${button("再試行", "retry-read", "primary")}</div>`;
    else if (state === "empty")
      app.innerHTML = `<div class="card"><h1>${screen.startsWith("feedback") ? "Feedbackはありません" : "Review対象はありません"}</h1><p>取得には成功しています。表示できる対象がありません。</p>${link("Review Queueへ", "queue")}</div>`;
    else if (screen === "queue") app.innerHTML = queueView();
    else if (screen === "review" && record) app.innerHTML = reviewView(record);
    else if (screen === "edit" && record) app.innerHTML = editView(record);
    else if (screen === "draft" && record) app.innerHTML = draftView(record);
    else if (screen === "feedback") app.innerHTML = feedbackView();
    else if (screen === "feedback-confirm")
      app.innerHTML = feedbackConfirmView();
    else if (screen === "feedback-list") app.innerHTML = feedbackListView();
    else if (screen === "feedback-detail")
      app.innerHTML = feedbackDetailView(Number(key));
    else if (screen === "feedback-success")
      app.innerHTML = `<h1>受験Feedbackを送信しました（Mock）</h1>${notice("選択データを記録しました。ReviewerのFeedback一覧で確認できます。", "success")}<p>${link("Reviewerが内容を確認", `feedback-detail/${feedbackRecords.length - 1}`)}</p><p>${link("Feedback一覧へ", "feedback-list")}</p>`;
    else
      app.innerHTML = `${notice("対象の画面がありません。")}${link("Review Queueへ", "queue")}`;
  }
  function showDialog(title, body, label, perform) {
    dialog.innerHTML = `<h2 id="confirm-title">${esc(title)}</h2>${body}<div class="actions">${button("キャンセル", "cancel-dialog")}${button(label, "commit-dialog", "primary")}</div>`;
    dialog.querySelector('[data-action="cancel-dialog"]').onclick = () =>
      dialog.close();
    dialog.querySelector('[data-action="commit-dialog"]').onclick = perform;
    dialog.showModal();
  }
  function validation(form, errors, summaryId) {
    for (const element of form.querySelectorAll("[aria-invalid]"))
      element.removeAttribute("aria-invalid");
    for (const message of form.querySelectorAll(".inline-error")) {
      message.hidden = true;
      message.textContent = "";
    }
    const summary = form.querySelector(`#${summaryId}`);
    summary.innerHTML = "";
    if (!errors.length) return;
    summary.innerHTML = `<div class="notice error"><strong>入力内容を修正してください。</strong><ul>${errors.map((error) => `<li>${error.field === "_form" ? esc(error.message) : `<a href="#field-${esc(error.field)}" data-error-field="${esc(error.field)}">${esc(error.message)}</a>`}</li>`).join("")}</ul></div>`;
    for (const error of errors) {
      const group = form.querySelector(`[data-field="${error.field}"]`);
      if (!group) continue;
      group.setAttribute("aria-invalid", "true");
      group.querySelectorAll(`[name="${error.field}"]`).forEach((control) => {
        control.setAttribute("aria-invalid", "true");
      });
      const message = form.querySelector(`#error-${error.field}`);
      if (message) {
        message.hidden = false;
        message.textContent = error.message;
      }
    }
    const first = form.querySelector(
      `[name="${errors.find((error) => error.field !== "_form")?.field}"]`,
    );
    (first ?? summary).focus();
  }
  async function save(
    statusElement,
    persist,
    retry,
    complete = () => {},
    rejected = () => false,
  ) {
    if (busy || pendingSave) return;
    busy = true;
    statusElement.innerHTML = notice(
      "保存・送信中…確定するまで操作できません。",
    );
    const controls = [
      ...app.querySelectorAll("button,input,select,textarea"),
      ...dialog.querySelectorAll("button"),
    ];
    const disabled = controls.map((item) => item.disabled);
    controls.forEach((item) => {
      item.disabled = true;
    });
    const restore = () =>
      controls.forEach((item, index) => {
        item.disabled = disabled[index];
      });
    const operation = model.createSaveAttempt(persist);
    await new Promise((resolve) => setTimeout(resolve, 650));
    busy = false;
    const outcome = failNext
      ? "confirmed-failure"
      : state === "save-unknown-saved"
        ? "unknown-saved"
        : state === "save-unknown-unsaved"
          ? "unknown-unsaved"
          : "success";
    failNext = false;
    operation.settle(outcome);
    if (rejected()) {
      restore();
      return;
    }
    const confirmedFailure = () => {
      restore();
      // 元の確定ボタンは抑止し、確定未保存のRetryだけを案内する。
      const submit =
        dialog.querySelector('[data-action="commit-dialog"]') ??
        app.querySelector('[data-action="send-feedback"]');
      if (submit) submit.disabled = true;
      statusElement.innerHTML =
        notice(
          "保存できませんでした。この操作は保存されていません。入力を保持しています。",
          "error",
        ) + button("保存を再試行", "retry-save", "primary");
      statusElement.querySelector("button").onclick = retry;
    };
    if (operation.phase === "result-unknown") {
      pendingSave = operation;
      statusElement.innerHTML =
        notice(
          "保存結果を確認できません。再送せず、状態を再取得して保存結果を照合してください。",
          "warning",
        ) + button("状態を再取得・保存結果を照合", "reconcile-save", "primary");
      statusElement.querySelector("button").onclick = async () => {
        if (busy) return;
        busy = true;
        statusElement.innerHTML = notice(
          "状態を再取得・照合中…再送はしていません。",
        );
        await new Promise((resolve) => setTimeout(resolve, 350));
        const result = operation.reconcile();
        busy = false;
        pendingSave = null;
        state = "normal";
        document.querySelector("#state").value = state;
        if (result === "success") {
          restore();
          complete();
        } else confirmedFailure();
      };
      return;
    }
    restore();
    if (operation.phase === "confirmed-failure") {
      confirmedFailure();
      return;
    }
    complete();
  }
  function humanDecision(record, decision) {
    const target = model.reviewContent(record);
    if (
      !record.reviewTargetRevision ||
      record.humanReview ||
      record.revision.state !== "REVIEW_REQUIRED"
    )
      return;
    const targetId = target.questionRevisionId;
    const label = {
      APPROVE: "承認して公開",
      REQUEST_CHANGES: "修正を依頼",
      REJECT: "却下",
    }[decision];
    showDialog(
      `${label}しますか`,
      `<p>対象exact QuestionRevision: <strong>${esc(targetId)}</strong></p><p>凍結Content: ${esc(target.stem)}</p><p>${decision === "APPROVE" ? "同じRevisionを公開し、現在公開参照を切り替えます。既存回答の参照は維持します。" : "同じRevisionへHuman decisionを記録します。上書き・再判断はできません。"}</p><p>生成元Candidate: ${esc(record.candidate.candidateId)}（経路metadata）</p><p>Reviewer: synthetic-reviewer（架空）</p><div id="decision-status" role="status"></div>`,
      `${label}（Mock）`,
      () => {
        let gateRejected = false;
        const attempt = () =>
          save(
            dialog.querySelector("#decision-status"),
            () => {
              if (
                state === "policy-changed" &&
                decision === "APPROVE" &&
                record.sourcePolicyGate.eligible
              ) {
                const documentIds = record.sourceRevisionSnapshots.map(
                  (snapshot) => snapshot.sourceDocumentId,
                );
                record.currentPolicyDecisions =
                  record.currentPolicyDecisions.map((policy) =>
                    documentIds.includes(policy.sourceDocumentId) &&
                    policy.usagePurpose === "NORMATIVE_TECHNICAL"
                      ? {
                          ...policy,
                          classification: "REVIEW_REQUIRED",
                          reasonCodes: ["SOURCE_REVIEW_REQUIRED"],
                          sourcePolicyDecisionId: `${policy.sourcePolicyDecisionId}:changed`,
                          evaluatedAt: new Date().toISOString(),
                          sourceMetadataSnapshot: {
                            ...policy.sourceMetadataSnapshot,
                            terms: {
                              ...policy.termsMetadataSnapshot,
                              reviewStatus: "REQUIRES_REVIEW",
                            },
                          },
                          termsMetadataSnapshot: {
                            ...policy.termsMetadataSnapshot,
                            reviewStatus: "REQUIRES_REVIEW",
                          },
                        }
                      : policy,
                  );
                record.sourcePolicyGate = {
                  eligible: false,
                  blockers: [
                    "SOURCE_POLICY_NOT_TRUSTED",
                    "SOURCE_REVIEW_REQUIRED",
                  ],
                };
              }
              if (
                record.reviewTargetRevision.questionRevisionId !== targetId ||
                record.revision.state !== "REVIEW_REQUIRED" ||
                record.humanReview ||
                (decision === "APPROVE" && approvalBlockers(record).length)
              ) {
                gateRejected = true;
                return false;
              }
              record.humanReview = {
                questionReviewId: `synthetic-review-${record.key}`,
                questionRevisionId: targetId,
                reviewerId: "synthetic-reviewer",
                decision,
                reviewedAt: new Date().toISOString(),
              };
              record.revision.state = {
                APPROVE: "PUBLISHED",
                REQUEST_CHANGES: "CHANGES_REQUESTED",
                REJECT: "REJECTED",
              }[decision];
              if (decision === "APPROVE")
                record.currentPublishedRevisionId = targetId;
              return true;
            },
            attempt,
            () => {
              rejectionMessage = "";
              savedMessage = `Human ${decision}を記録しました（Mock）。${decision === "APPROVE" ? "同じ対象Revisionを公開しました。" : "公開参照は維持しました。"}`;
              dialog.close();
              render();
            },
            () => {
              if (!gateRejected) return false;
              savedMessage = "";
              rejectionMessage =
                "判断条件が変わったため、このHuman decisionを記録していません。Review対象と現在のblockerを確認してください。保存の再試行では解決しません。";
              dialog.close();
              render();
              return true;
            },
          );
        attempt();
      },
    );
  }
  app.addEventListener("click", (event) => {
    const errorLink = event.target.closest("[data-error-field]");
    if (errorLink) {
      event.preventDefault();
      app.querySelector(`[name="${errorLink.dataset.errorField}"]`)?.focus();
      return;
    }
    const section = event.target.closest("[data-section]");
    if (section) {
      event.preventDefault();
      const target = document.getElementById(section.dataset.section);
      if (target) {
        target.tabIndex = -1;
        target.focus({ preventScroll: true });
        target.scrollIntoView({ behavior: "smooth" });
      }
      return;
    }
    const action = event.target.closest("[data-action]")?.dataset.action;
    const record = getRecord(route().key);
    if (busy || pendingSave) return;
    if (action === "normal") {
      state = "normal";
      document.querySelector("#state").value = state;
      render();
    }
    if (action === "retry-read") {
      state = "loading";
      document.querySelector("#state").value = state;
      render();
    }
    if (action === "refresh-source" && record?.sourcePolicyRefresh) {
      const read = record.sourcePolicyRefresh;
      busy = true;
      app.setAttribute("aria-busy", "true");
      document.querySelector("#source-refresh-status").innerHTML = notice(
        "Review対象と現在Policyを再取得しています（設計例）。",
      );
      const controls = [...app.querySelectorAll("button")];
      controls.forEach((control) => {
        control.disabled = true;
      });
      setTimeout(() => {
        busy = false;
        app.removeAttribute("aria-busy");
        if (
          read.questionRevisionId !==
          record.reviewTargetRevision?.questionRevisionId
        ) {
          render();
          return;
        }
        record.reviewTargetRevision = structuredClone(
          read.reviewTargetRevision,
        );
        record.currentPolicyDecisions = structuredClone(
          read.currentPolicyDecisions,
        );
        record.sourcePolicyGate = structuredClone(read.sourcePolicyGate);
        rejectionMessage = "";
        savedMessage =
          "外部のSource Review等が完了した後のReview対象・現在Policyを再取得しました（設計例）。取得時Snapshot・Human判断は変更していません。";
        render();
        app.focus();
      }, 350);
    }
    if (action === "edit" && record) {
      editDraft = null;
      location.hash = `edit/${record.key}`;
    }
    if (action === "discard-edit" && record)
      showDialog(
        "編集を破棄しますか",
        "<p>保存していない作業候補を破棄します。元Revisionは維持します。</p>",
        "破棄する",
        () => {
          editDraft = null;
          dialog.close();
          location.hash = `review/${record.key}`;
        },
      );
    const decisions = {
      approve: "APPROVE",
      "request-changes": "REQUEST_CHANGES",
      reject: "REJECT",
    };
    if (decisions[action] && record) humanDecision(record, decisions[action]);
    if (action === "send-feedback" && feedback.validate(feedbackDraft)) {
      const payload = structuredClone(feedbackDraft);
      const attempt = () =>
        save(
          document.querySelector("#feedback-send-status"),
          () => {
            if (!feedback.validate(payload)) return;
            feedbackRecords.push({
              examFeedbackId: `synthetic-feedback-${feedbackRecords.length + 1}`,
              submittedAt: new Date().toISOString(),
              payload,
            });
            return true;
          },
          attempt,
          () => {
            feedbackDraft = null;
            location.hash = "feedback-success";
          },
        );
      attempt();
    }
  });
  app.addEventListener("submit", (event) => {
    event.preventDefault();
    if (busy || pendingSave) return;
    const data = new FormData(event.target);
    if (event.target.id === "feedback-form") {
      const payload = Object.fromEntries(
        Object.entries(feedback.choices).map(([key, options]) => {
          const selected = data
            .getAll(key)
            .map((value) => options.find(([id]) => String(id) === value)?.[0]);
          return [
            key,
            feedback.multiple.includes(key) ? selected : selected[0],
          ];
        }),
      );
      // DOMへ未知Fieldを追加した場合も、送信を拒否する。
      const hasUnknown = [...data.keys()].some(
        (key) => !Object.hasOwn(feedback.choices, key),
      );
      const errors = feedback.errors(payload);
      if (hasUnknown)
        errors.unshift({
          field: "_form",
          message: "許可されていない入力項目があります。",
        });
      validation(event.target, errors, "feedback-error");
      if (errors.length) return;
      feedbackDraft = payload;
      location.hash = "feedback-confirm";
    }
    if (event.target.id === "edit-form") {
      const record = getRecord(route().key);
      if (!record.reviewTargetRevision || !record.sourcePolicyGate.eligible) {
        render();
        app.querySelector("#edit-blocked")?.focus();
        return;
      }
      const draft = structuredClone(editDraft);
      draft.stem = String(data.get("stem")).trim();
      draft.explanation = String(data.get("explanation")).trim();
      draft.correctOptionIds = data.getAll("correct");
      draft.options = draft.options.map((option) => ({
        id: option.id,
        text: String(data.get(`option-${option.id}`)).trim(),
      }));
      draft.optionExplanations = Object.fromEntries(
        draft.options.map((option) => [
          option.id,
          String(data.get(`explanation-${option.id}`)).trim(),
        ]),
      );
      editDraft = draft;
      const refs = data.getAll("source");
      const knowledge = data.getAll("knowledge");
      draft.knowledgePointCandidateIds = knowledge;
      const selection = model.resolveReferences(
        record.editSourceReferences,
        refs,
      );
      draft.sourceReferences = selection.sourceReferences;
      // Unknown reference selections also fail, rather than silently disappear.
      const errors = model.validateEdit(draft, record);
      if (!selection.valid)
        errors.push({
          field: "source",
          message: "利用可能なSource参照を選んでください。",
        });
      validation(event.target, errors, "edit-error");
      if (errors.length) return;
      const attempt = () =>
        save(
          document.querySelector("#edit-error"),
          () => {
            if (!record.reviewTargetRevision) return false;
            if (!record.sourcePolicyGate.eligible) {
              const reason = document.createElement("section");
              reason.className = "card";
              reason.tabIndex = -1;
              reason.setAttribute("role", "alert");
              reason.innerHTML = `<p>Source Policy blockerがあるため、このRevisionから新Candidateを作成できません。候補は保存していません。</p>${sourceRemediationView(record, "edit-policy-remediation")}`;
              event.target.before(reason);
              reason.focus();
              return false;
            }
            record.editAttempt = (record.editAttempt ?? 0) + 1;
            const {
              questionRevisionId: _revision,
              questionId: _question,
              knowledgePointIds: _points,
              questionSources: _sources,
              questionIntent: _intent,
              ...candidateContent
            } = structuredClone(draft);
            record.editedCandidate = {
              ...candidateContent,
              candidateId: `${record.candidate.candidateId}:edit:${record.editAttempt}`,
              knowledgePointCandidateIds: knowledge,
              sourceReferences: structuredClone(draft.sourceReferences),
            };
            return true;
          },
          () => document.querySelector("#edit-form").requestSubmit(),
          () => {
            editDraft = null;
            location.hash = `draft/${record.key}`;
          },
        );
      attempt();
    }
  });
  app.addEventListener("input", (event) => {
    const form = event.target.closest("form");
    if (!form) return;
    if (
      form.id === "feedback-form" &&
      feedback.similarityFields.includes(event.target.name)
    ) {
      if (event.target.value === "not_used")
        for (const key of feedback.similarityFields)
          form.elements.namedItem(key).value = "not_used";
      else
        for (const key of feedback.similarityFields)
          if (
            key !== event.target.name &&
            form.elements.namedItem(key).value === "not_used"
          )
            form.elements.namedItem(key).value = "";
    }
    const data = new FormData(form);
    if (form.id === "feedback-form")
      feedbackDraft = Object.fromEntries(
        Object.entries(feedback.choices).map(([key, options]) => {
          const selected = data
            .getAll(key)
            .map((value) => options.find(([id]) => String(id) === value)?.[0]);
          return [
            key,
            feedback.multiple.includes(key) ? selected : selected[0],
          ];
        }),
      );
    if (form.id === "edit-form") {
      const record = getRecord(route().key);
      editDraft.knowledgePointCandidateIds = data.getAll("knowledge");
      editDraft.sourceReferences = model.resolveReferences(
        record.editSourceReferences,
        data.getAll("source"),
      ).sourceReferences;
      editDraft.stem = String(data.get("stem"));
      editDraft.explanation = String(data.get("explanation"));
      editDraft.correctOptionIds = data.getAll("correct");
      editDraft.options = editDraft.options.map((option) => ({
        id: option.id,
        text: String(data.get(`option-${option.id}`)),
      }));
      editDraft.optionExplanations = Object.fromEntries(
        editDraft.options.map((option) => [
          option.id,
          String(data.get(`explanation-${option.id}`)),
        ]),
      );
    }
  });
  document.querySelector("#state").addEventListener("change", (event) => {
    if (busy || pendingSave || dialog.open) {
      event.target.value = state;
      return;
    }
    state = event.target.value;
    failNext = state === "save-error";
    render();
  });
  document.querySelector("#reset").addEventListener("click", () => {
    if (busy || pendingSave) return;
    showDialog(
      "Mockを初期化しますか",
      "<p>このページ内の操作結果と入力を破棄します。実際の保存データはありません。</p>",
      "初期化する",
      () => {
        records = structuredClone(globalThis.reviewerFixtures);
        feedbackRecords = feedbackRecords.slice(0, 1);
        editDraft = null;
        feedbackDraft = null;
        state = "normal";
        failNext = false;
        savedMessage = "";
        rejectionMessage = "";
        document.querySelector("#state").value = state;
        dialog.close();
        location.hash = "queue";
        render();
      },
    );
  });
  document.addEventListener("click", (event) => {
    const anchor = event.target.closest("a[href^='#']");
    if (anchor && (busy || pendingSave || dialog.open)) event.preventDefault();
  });
  dialog.addEventListener("cancel", (event) => {
    if (busy || pendingSave) event.preventDefault();
  });
  window.addEventListener("hashchange", () => {
    if (busy || pendingSave) {
      location.hash = lastHash;
      return;
    }
    if (
      lastHash.startsWith("#edit/") &&
      !location.hash.startsWith("#edit/") &&
      editDraft
    ) {
      const destination = location.hash;
      location.hash = lastHash;
      showDialog(
        "未保存の編集を破棄しますか",
        "<p>この画面から離れると未保存の候補を破棄します。</p>",
        "破棄して移動",
        () => {
          editDraft = null;
          dialog.close();
          location.hash = destination;
        },
      );
      return;
    }
    lastHash = location.hash;
    savedMessage = "";
    rejectionMessage = "";
    render();
    if (!dialog.open) app.focus();
    window.scrollTo(0, 0);
  });
  window.addEventListener("beforeunload", (event) => {
    if (busy || pendingSave || editDraft || feedbackDraft) {
      event.preventDefault();
      event.returnValue = "";
    }
  });
  render();
})();
