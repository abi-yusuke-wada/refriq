import { describe, expect, it, vi } from "vitest";
import { referenceKey as applicationReferenceKey } from "../../../../packages/application/src/pipeline/index.ts";
import "./fixtures.js";
import "./review-model.js";
const model = globalThis.reviewerReviewModel;
const records = globalThis.reviewerFixtures;
const ready = records.find((r) => r.key === "ready");
describe("exact Revision / Diff / Sourceの読取投影", () => {
  it("Fixture間でRevision Identityを共有せず、各targetとSourceの対象IDが一致する", () => {
    const resolved = records.filter((r) => r.reviewTargetRevision);
    expect(
      new Set(resolved.map((r) => r.reviewTargetRevision.questionRevisionId))
        .size,
    ).toBe(resolved.length);
    for (const record of resolved)
      expect(
        record.reviewTargetRevision.questionSources.every(
          (source) =>
            source.questionRevisionId ===
            record.reviewTargetRevision.questionRevisionId,
        ),
      ).toBe(true);
  });
  it("Candidateが異なっても凍結Revisionを正本にし、Candidate内容を混入させない", () => {
    const record = records.find((r) => r.key === "content-mismatch");
    expect(record.candidate.question.stem).not.toEqual(
      record.reviewTargetRevision.stem,
    );
    expect(model.reviewContent(record)).toBe(record.reviewTargetRevision);
    expect(model.reviewContent(record).options).not.toEqual(
      record.candidate.question.options,
    );
    expect(Object.isFrozen(record.reviewTargetRevision.options)).toBe(true);
    expect(model.reviewContent(record).questionRevisionId).toBe(
      record.revision.questionRevisionId,
    );
  });
  it("未materialize候補はRevision IDを持たず、解決済みの対象欠落・不一致は拒否する", () => {
    const candidate = records.find((r) => r.key === "candidate");
    expect(model.reviewContent(candidate)).toBe(candidate.candidate.question);
    expect(candidate.reviewTargetRevision).toBeNull();
    expect(() =>
      model.reviewContent({ ...ready, reviewTargetRevision: null }),
    ).toThrow();
    expect(() =>
      model.reviewContent({
        ...ready,
        reviewTargetRevision: {
          ...ready.reviewTargetRevision,
          questionRevisionId: "other",
        },
      }),
    ).toThrow();
  });
  it.each(model.contentFields)(
    "%sの変更をimmutable Diffに表示する",
    (field) => {
      const previous = structuredClone(ready.reviewTargetRevision),
        current = structuredClone(previous);
      if (field === "questionSources")
        current[field][0].sourceRevisionId = "changed-source";
      else if (field === "knowledgePointIds")
        current[field] = ["changed-knowledge"];
      else if (field === "options") current[field][0].text = "changed-option";
      else if (field === "correctOptionIds") current[field] = ["B"];
      else if (field === "optionExplanations")
        current[field].A = "changed-explanation";
      else if (field === "questionIntent")
        current[field].constraints.push("changed constraint");
      else current[field] = "changed";
      expect(
        model.diff(previous, current).find((row) => row.key === field).changed,
      ).toBe(true);
    },
  );
  it("現在Policy・Terms・Lifecycleや所属Revision IDだけをContent差分に混入しない", () => {
    const previous = structuredClone(ready.reviewTargetRevision),
      current = structuredClone(previous);
    current.currentPolicy = "PROHIBITED";
    current.currentTerms = "PROHIBITED";
    current.state = "PUBLISHED";
    current.questionSources.forEach((s) => {
      s.questionRevisionId = "successor";
    });
    expect(model.diff(previous, current).every((row) => !row.changed)).toBe(
      true,
    );
  });
  it("QuestionSourceとKnowledgePointの同集合・順序違いはDiffにしない", () => {
    const record = records.find((r) => r.key === "diff-reordered");
    expect(
      model
        .diff(
          record.previousRevision.frozenContent,
          record.reviewTargetRevision,
        )
        .every((row) => !row.changed),
    ).toBe(true);
    const previous = structuredClone(ready.reviewTargetRevision);
    previous.knowledgePointIds.push("synthetic-second-point");
    previous.questionIntent.knowledgePointIds.push("synthetic-second-point");
    const current = structuredClone(previous);
    current.knowledgePointIds.reverse();
    current.questionIntent.knowledgePointIds.reverse();
    expect(model.diff(previous, current).every((row) => !row.changed)).toBe(
      true,
    );
    expect(previous.knowledgePointIds[0]).toBe("synthetic-knowledge-routing");
  });
  it("QuestionSourceの実変更はDiffにし、元の凍結配列をsortしない", () => {
    const record = records.find((r) => r.key === "sources-trusted");
    expect(
      model
        .diff(
          record.previousRevision.frozenContent,
          record.reviewTargetRevision,
        )
        .find((r) => r.key === "questionSources").changed,
    ).toBe(true);
    const previous = structuredClone(record.reviewTargetRevision);
    const current = structuredClone(previous);
    current.questionSources[1].relation = "SUPPORTS_EXPLANATION";
    expect(
      model.diff(previous, current).find((r) => r.key === "questionSources")
        .changed,
    ).toBe(true);
    const before = JSON.stringify(record.reviewTargetRevision);
    model.diff(
      record.previousRevision.frozenContent,
      record.reviewTargetRevision,
    );
    expect(JSON.stringify(record.reviewTargetRevision)).toBe(before);
  });
  it("Multiple Select正答IDは集合、Options表示順はordered Contentとして比較する", () => {
    const previous = structuredClone(
      records.find((r) => r.key === "multiple").reviewTargetRevision,
    );
    const current = structuredClone(previous);
    current.correctOptionIds.reverse();
    expect(
      model.diff(previous, current).find((r) => r.key === "correctOptionIds")
        .changed,
    ).toBe(false);
    current.options.reverse();
    expect(
      model.diff(previous, current).find((r) => r.key === "options").changed,
    ).toBe(true);
    current.questionIntent.constraints.reverse();
    expect(
      model.diff(previous, current).find((r) => r.key === "questionIntent")
        .changed,
    ).toBe(true);
  });
  it.each([
    ["ready", true, true],
    ["content-mismatch", false, false],
    ["evaluation-missing", false, false],
    ["candidate", false, false],
    ["revise", true, false],
    ["reject", true, false],
  ])(
    "%sのEvaluation対象一致とreadinessをCandidate PASSから分離する",
    (key, matches, eligible) => {
      const record = records.find((r) => r.key === key);
      expect(model.evaluationReadiness(record)).toMatchObject({
        matches,
        eligible,
      });
      if (
        key === "ready" ||
        key === "content-mismatch" ||
        key === "evaluation-missing"
      ) {
        expect(record.candidate.evaluation.decision).toBe("PASS");
        expect(record.humanReview).toBeNull();
        expect(record.revision.state).toBe("REVIEW_REQUIRED");
      }
    },
  );
  it.each([
    "candidateId",
    "questionRevisionId",
    "evaluatedContent",
    "unresolved",
  ])("Evaluationの%s不一致をRevision readinessへ流用しない", (field) => {
    const record = structuredClone(ready);
    if (field === "evaluatedContent")
      record.reviewEvaluation.evaluatedContent.stem =
        "different evaluated content";
    else if (field === "unresolved")
      record.reviewEvaluation.evaluatedContent = null;
    else record.reviewEvaluation[field] = "different target";
    expect(model.evaluationReadiness(record).eligible).toBe(false);
  });
  it.each(model.contentFields)("評価時%sの相違を見逃さない", (field) => {
    const record = structuredClone(ready);
    delete record.reviewEvaluation.evaluatedContent[field];
    expect(model.evaluationReadiness(record).eligible).toBe(false);
  });
  it("same locatorのSourceReferenceを既存helper規約に合わせ、A / B / A+Bを完全復元する", () => {
    const refs = records.find(
      (r) => r.key === "same-locator",
    ).editSourceReferences;
    expect(refs[0].locator).toBe(refs[1].locator);
    expect(refs[0].sourceRevisionId).not.toBe(refs[1].sourceRevisionId);
    for (const ref of refs) {
      expect(model.referenceKey(ref)).toBe(applicationReferenceKey(ref));
      expect(decodeURIComponent(model.referenceValue(ref))).toBe(
        applicationReferenceKey(ref),
      );
    }
    expect(model.referenceValue(refs[0])).not.toBe(
      model.referenceValue(refs[1]),
    );
    for (const selection of [[refs[0]], [refs[1]], refs]) {
      expect(
        model.resolveReferences(refs, selection.map(model.referenceValue)),
      ).toEqual({ valid: true, sourceReferences: selection });
    }
    expect(model.resolveReferences(refs, [refs[0].locator]).valid).toBe(false);
    expect(
      model.resolveReferences(refs, [
        model.referenceValue(refs[0]),
        model.referenceValue(refs[0]),
      ]).valid,
    ).toBe(false);
  });
  it.each([
    ["sources-trusted", "全Source TRUSTED"],
    ["sources-review", "REVIEW_REQUIREDあり"],
    ["sources-prohibited", "PROHIBITEDあり"],
    ["sources-ambiguous", "Policy不整合あり"],
    ["sources-missing", "Policy不整合あり"],
  ])("%sは全Source / Purposeを関連づけて集約する", (key, label) => {
    const record = records.find((r) => r.key === key);
    expect(model.sourceSummary(record)).toBe(label);
    const second = model
      .sourceRows(record)
      .find(
        (row) => row.source.sourceRevisionId === "source-revision-routing-02",
      );
    expect(second.snapshot.sourceDocumentId).toBe("source-document-routing-02");
    expect(second.policies).toHaveLength(
      key === "sources-ambiguous" ? 2 : key === "sources-missing" ? 0 : 1,
    );
  });
  it("正答数・本文・参照のInput Errorを該当項目へ紐付ける", () => {
    const draft = {
      ...structuredClone(ready.candidate.question),
      stem: "",
      correctOptionIds: ["A", "B"],
      knowledgePointCandidateIds: [],
      sourceReferences: [],
    };
    expect(model.validateEdit(draft, ready).map((e) => e.field)).toEqual([
      "stem",
      "correct",
      "knowledge",
      "source",
    ]);
  });
  it.each([
    ["sources-trusted", null],
    ["sources-review", "Source Review"],
    ["sources-prohibited", "TRUSTED Sourceを用いた再生成 / 再提案"],
    ["sources-ambiguous", "Source Policy状態を解消"],
    ["sources-missing", "Source Policyを確認・解決"],
  ])("%sでは元RevisionのSource条件をEditで迂回しない", (key, nextAction) => {
    const record = records.find((item) => item.key === key);
    const before = JSON.stringify(record);
    const draft = {
      ...structuredClone(model.reviewContent(record)),
      knowledgePointCandidateIds: record.candidate.knowledgePoints.map(
        (point) => point.candidateId,
      ),
      // 2件目のSourceを除去しても、元Review対象のblockerは解除されない。
      sourceReferences: record.editSourceReferences.filter(
        (ref) => ref.sourceRevisionId === "source-revision-routing-01",
      ),
    };
    const errors = model.validateEdit(draft, record);
    if (nextAction) {
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe("source");
      expect(errors[0].message).toContain(
        "このRevisionから新Candidateを作成できません",
      );
      expect(errors[0].message).toContain(nextAction);
      expect(model.sourceRemediation(record)).toHaveLength(1);
      expect(model.sourceRemediation(record)[0].sourceRevisionId).toBe(
        "source-revision-routing-02",
      );
    } else {
      expect(errors).toEqual([]);
      expect(model.sourceRemediation(record)).toEqual([]);
    }
    expect(record.editedCandidate).toBeUndefined();
    expect(JSON.stringify(record)).toBe(before);
  });
  it("Source Review後の新しい読取投影を使い、取得時SnapshotやContentを変えずにEditへ復帰する", () => {
    const record = records.find((item) => item.key === "sources-review");
    const read = record.sourcePolicyRefresh;
    const refreshed = { ...record, ...read };
    expect(read.questionRevisionId).toBe(
      record.reviewTargetRevision.questionRevisionId,
    );
    expect(refreshed.reviewTargetRevision).toEqual(record.reviewTargetRevision);
    expect(refreshed.sourceRevisionSnapshots).toBe(
      record.sourceRevisionSnapshots,
    );
    expect(refreshed.reviewEvaluation).toBe(record.reviewEvaluation);
    expect(model.sourceRemediation(record)).not.toEqual([]);
    expect(model.sourceRemediation(refreshed)).toEqual([]);
    expect(model.sourceSummary(refreshed)).toBe("全Source TRUSTED");
    expect(model.evaluationReadiness(refreshed).eligible).toBe(true);
    expect(refreshed.humanReview).toBeNull();
    expect(refreshed.revision.state).toBe("REVIEW_REQUIRED");
  });
});
describe("保存の確定失敗 / 結果不明の模擬遷移", () => {
  it("確定失敗は保存せずRetryを許す", () => {
    const persist = vi.fn();
    const op = model.createSaveAttempt(persist);
    expect(op.settle("confirmed-failure")).toBe("confirmed-failure");
    expect(persist).not.toHaveBeenCalled();
    expect(op.canRetry).toBe(true);
  });
  it("保存済み結果不明は照合のみで成功し、二度目の保存をしない", () => {
    const persist = vi.fn(() => true);
    const op = model.createSaveAttempt(persist);
    expect(op.settle("unknown-saved")).toBe("result-unknown");
    expect(op.canRetry).toBe(false);
    expect(() => op.settle("success")).toThrow();
    expect(op.reconcile()).toBe("success");
    expect(persist).toHaveBeenCalledTimes(1);
    expect(() => op.reconcile()).toThrow();
    expect(op.canRetry).toBe(false);
  });
  it("結果不明は照合で未保存が確定した後だけ新しいRetryへ進める", () => {
    const persist = vi.fn(() => true);
    const op = model.createSaveAttempt(persist);
    op.settle("unknown-unsaved");
    expect(op.canRetry).toBe(false);
    expect(op.reconcile()).toBe("confirmed-failure");
    expect(op.canRetry).toBe(true);
    expect(persist).not.toHaveBeenCalled();
    model.createSaveAttempt(persist).settle("success");
    expect(persist).toHaveBeenCalledTimes(1);
  });
});
