// UX読取投影 / Mock保存状態。Domain enum、API Schema、Backend Gateではない。
(() => {
  const contentFields = [
    ["type", "形式"],
    ["stem", "問題文"],
    ["options", "選択肢"],
    ["correctOptionIds", "正答候補"],
    ["explanation", "解説"],
    ["optionExplanations", "選択肢ごとの説明"],
    ["language", "言語"],
    ["difficulty", "難易度"],
    ["knowledgePointIds", "KnowledgePoint関係（stable ID）"],
    ["questionSources", "QuestionSource関係・取得時Provenance"],
    ["questionIntent", "凍結時の学習意図"],
  ];
  const reviewContent = (record) => {
    if (
      record.revision &&
      (!record.reviewTargetRevision ||
        record.reviewTargetRevision.questionRevisionId !==
          record.revision.questionRevisionId ||
        record.reviewTargetRevision.questionId !== record.questionId)
    )
      throw new Error("exact Review targetが一致しません。");
    return record.reviewTargetRevision ?? record.candidate.question;
  };
  // Application referenceKeyと同じ規約。file://のclassic scriptではTSをimportできないため、
  // Unitで既存helperとの一致を検証する。HTML valueはNULを含めず可逆encodeする。
  const referenceKey = (reference) =>
    `${reference.sourceRevisionId}\u0000${reference.locator}`;
  const referenceValue = (reference) =>
    encodeURIComponent(referenceKey(reference));
  function resolveReferences(allowed, values) {
    const selected = new Set(values);
    return {
      valid:
        selected.size === values.length &&
        values.every((value) =>
          allowed.some((ref) => referenceValue(ref) === value),
        ),
      sourceReferences: allowed
        .filter((ref) => selected.has(referenceValue(ref)))
        .map((ref) => structuredClone(ref)),
    };
  }
  const stableJson = (value) =>
    JSON.stringify(value, (_key, item) =>
      item && typeof item === "object" && !Array.isArray(item)
        ? Object.fromEntries(
            Object.entries(item).sort(([a], [b]) =>
              a < b ? -1 : a > b ? 1 : 0,
            ),
          )
        : item,
    );
  function canonicalContentField(key, value) {
    if (key === "questionSources")
      return value
        .map(({ questionRevisionId: _id, ...relation }) => stableJson(relation))
        .sort();
    if (key === "knowledgePointIds" || key === "correctOptionIds")
      return [...value].sort();
    if (key === "questionIntent")
      return {
        ...value,
        knowledgePointIds: [...value.knowledgePointIds].sort(),
      };
    return value;
  }
  const diff = (previous, current) =>
    contentFields.map(([key, label]) => ({
      key,
      label,
      previous: previous[key],
      current: current[key],
      changed:
        stableJson(canonicalContentField(key, previous[key])) !==
        stableJson(canonicalContentField(key, current[key])),
    }));
  // Reviewer / Application readinessの読取投影。Domain Publish Gateではない。
  // IDだけでなく評価時のimmutable Content snapshotを照合し、Candidate PASSへfallbackしない。
  function evaluationReadiness(record) {
    const target = record.reviewTargetRevision;
    const evaluation = record.reviewEvaluation;
    const result = (matches, eligible, message) => ({
      matches,
      eligible,
      message,
      evaluation,
    });
    if (!target || !evaluation)
      return result(
        false,
        false,
        "Evaluation未確認: exact QuestionRevisionに対応する評価がありません。",
      );
    reviewContent(record);
    const evaluated = evaluation.evaluatedContent;
    if (
      evaluation.targetKind !== "QuestionRevision" ||
      evaluation.candidateId !== record.candidate.candidateId ||
      evaluation.questionRevisionId !== target.questionRevisionId ||
      !evaluated ||
      evaluated.questionRevisionId !== target.questionRevisionId ||
      evaluated.questionId !== target.questionId ||
      !contentFields.every(([key]) => Object.hasOwn(evaluated, key)) ||
      evaluated.questionSources.some(
        (source) => source.questionRevisionId !== target.questionRevisionId,
      ) ||
      diff(evaluated, target).some((row) => row.changed)
    )
      return result(
        false,
        false,
        "対象不一致: このEvaluationは現在Review中のexact QuestionRevisionには適用されません。",
      );
    const eligible =
      evaluation.result.decision === "PASS" &&
      evaluation.reviewEligibility === "ELIGIBLE_FOR_HUMAN_REVIEW";
    return result(
      true,
      eligible,
      eligible
        ? "Content一致: 確認済み。Human判断は未記録です。"
        : "Content一致: 確認済み。この対象には修正・再評価が必要です。",
    );
  }
  function sourceRows(record) {
    const sources =
      record.reviewTargetRevision?.questionSources ??
      record.candidate.question.sourceReferences.map((ref) => ({
        ...ref,
        usagePurpose: record.candidate.sourceRevision.usagePurposeAtUse,
      }));
    return sources.map((source) => {
      const snapshots = record.sourceRevisionSnapshots.filter(
        (s) => s.sourceRevisionId === source.sourceRevisionId,
      );
      const snapshot = snapshots.length === 1 ? snapshots[0] : null;
      const policies = snapshot
        ? record.currentPolicyDecisions.filter(
            (p) =>
              p.sourceDocumentId === snapshot.sourceDocumentId &&
              p.usagePurpose === source.usagePurpose,
          )
        : [];
      return { source, snapshot, policies };
    });
  }
  function sourceSummary(record) {
    const rows = sourceRows(record);
    if (
      !rows.length ||
      rows.some((row) => !row.snapshot || row.policies.length !== 1)
    )
      return "Policy不整合あり";
    if (
      rows.some((row) =>
        row.policies.some((p) => p.classification === "PROHIBITED"),
      )
    )
      return "PROHIBITEDあり";
    if (
      rows.some((row) =>
        row.policies.some((p) => p.classification === "REVIEW_REQUIRED"),
      )
    )
      return "REVIEW_REQUIREDあり";
    return record.sourcePolicyGate.eligible
      ? "全Source TRUSTED"
      : "Policy不整合あり";
  }
  // GateはApplicationの読取投影を使う。ここでは全Sourceの次の行動だけを説明する。
  function sourceRemediation(record) {
    if (record.sourcePolicyGate.eligible) return [];
    const seen = new Set();
    const messages = sourceRows(record).flatMap(
      ({ source, snapshot, policies }) => {
        const key = `${source.sourceRevisionId}/${source.usagePurpose}`;
        if (seen.has(key)) return [];
        seen.add(key);
        let label, message;
        if (!snapshot || policies.length === 0) {
          label = "現在Policy未確認";
          message =
            "現在の利用判断を確認できません。Source Policyを確認・解決してからReview対象を再取得してください。";
        } else if (policies.length > 1) {
          label = "現在Policyが複数";
          message =
            "現在Policyを一意に判定できません。Source Policy状態を解消してからReview対象を再取得してください。";
        } else if (policies[0].classification === "PROHIBITED") {
          label = "PROHIBITED";
          message =
            "現在Sourceは利用禁止です。このRevisionのContentをEditで流用できません。TRUSTED Sourceを用いた再生成 / 再提案が必要です。";
        } else if (policies[0].classification === "REVIEW_REQUIRED") {
          label = "REVIEW_REQUIRED";
          message =
            "現在Sourceの利用可否が未確定です。Source Review等によるPolicy解決を待ち、完了後にReview対象を再取得してください。";
        } else return [];
        return [
          {
            sourceRevisionId: source.sourceRevisionId,
            usagePurpose: source.usagePurpose,
            label,
            message,
          },
        ];
      },
    );
    return messages.length
      ? messages
      : [
          {
            label: "Source条件未解決",
            message:
              "Source Policy / Provenance条件を確認・解決してからReview対象を再取得してください。Question ReviewではSource利用可否を変更しません。",
          },
        ];
  }
  // 保存済みか不明の間は再送不可。照合は再保存を行わない。
  function createSaveAttempt(persist) {
    let phase = "saving",
      persisted = false,
      accepted = false;
    return {
      get phase() {
        return phase;
      },
      get canRetry() {
        return phase === "confirmed-failure";
      },
      settle(outcome) {
        if (phase !== "saving") throw new Error("同じ操作を再送できません。");
        if (outcome === "confirmed-failure") {
          phase = outcome;
          return phase;
        }
        if (outcome === "success" || outcome === "unknown-saved") {
          accepted = persist() !== false;
          persisted = accepted;
        }
        phase = outcome.startsWith("unknown-")
          ? "result-unknown"
          : accepted
            ? "success"
            : "confirmed-failure";
        return phase;
      },
      reconcile() {
        if (phase !== "result-unknown")
          throw new Error("結果不明の操作だけを照合します。");
        phase = persisted ? "success" : "confirmed-failure";
        return phase;
      },
    };
  }
  function validateEdit(draft, record) {
    if (!record.sourcePolicyGate.eligible)
      return [
        {
          field: "source",
          message:
            "Source Policy blockerがあるため、このRevisionから新Candidateを作成できません。 " +
            sourceRemediation(record)
              .map((item) => item.message)
              .join(" "),
        },
      ];
    const errors = [];
    const required = (field, value) => {
      if (typeof value !== "string" || !value.trim())
        errors.push({ field, message: "この項目を入力してください。" });
    };
    required("stem", draft.stem);
    required("explanation", draft.explanation);
    for (const option of draft.options) {
      required(`option-${option.id}`, option.text);
      required(`explanation-${option.id}`, draft.optionExplanations[option.id]);
    }
    if (
      !draft.correctOptionIds.length ||
      (draft.type === "single_choice" && draft.correctOptionIds.length !== 1) ||
      draft.correctOptionIds.some(
        (id) => !draft.options.some((o) => o.id === id),
      )
    )
      errors.push({
        field: "correct",
        message:
          draft.type === "single_choice"
            ? "正答候補を1件だけ選んでください。"
            : "正答候補を1件以上選んでください。",
      });
    if (
      !draft.knowledgePointCandidateIds.length ||
      draft.knowledgePointCandidateIds.some(
        (id) =>
          !record.candidate.knowledgePoints.some((p) => p.candidateId === id),
      )
    )
      errors.push({
        field: "knowledge",
        message: "利用可能なKnowledgePointを選んでください。",
      });
    if (
      !draft.sourceReferences.length ||
      draft.sourceReferences.some(
        (ref) =>
          !record.editSourceReferences.some(
            (r) => referenceKey(r) === referenceKey(ref),
          ),
      )
    )
      errors.push({
        field: "source",
        message: "利用可能なSource参照を選んでください。",
      });
    return errors;
  }
  globalThis.reviewerReviewModel = {
    contentFields,
    reviewContent,
    diff,
    evaluationReadiness,
    referenceKey,
    referenceValue,
    resolveReferences,
    sourceRows,
    sourceSummary,
    sourceRemediation,
    createSaveAttempt,
    validateEdit,
  };
})();
