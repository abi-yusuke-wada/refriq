import { describe, expect, it } from "vitest";
import "./feedback.js";

const { validate, example, examples, choices, multiple, similarityFields } =
  globalThis.reviewerFeedbackContract;

describe("受験Feedback Mockの選択データ境界", () => {
  it("要求された全項目を選択データとして受け付ける", () => {
    expect(validate(structuredClone(example))).toBe(true);
  });
  it.each([
    "stem",
    "options",
    "question",
    "answerKey",
    "comment",
    "screenshot",
    "attachment",
    "file",
    "explanation",
    "url",
    "questionRevisionId",
    "sourceRevisionId",
  ])("余分な%s項目を拒否する", (field) => {
    expect(validate({ ...example, [field]: "synthetic-forbidden-field" })).toBe(
      false,
    );
  });
  it.each(Object.keys(choices))(
    "%sの自由文字列・Object・未入力を拒否する",
    (field) => {
      for (const value of [
        "synthetic-unlisted-text",
        { nested: "synthetic-unlisted-text" },
        null,
        undefined,
      ]) {
        const payload = {
          ...example,
          [field]: multiple.includes(field) ? [value] : value,
        };
        expect(validate(payload)).toBe(false);
      }
      const missing = { ...example };
      delete missing[field];
      expect(validate(missing)).toBe(false);
    },
  );
  it.each(multiple)("%sの空・重複・不明と具体値の併用を拒否する", (field) => {
    const valid = example[field][0];
    for (const selected of [
      [],
      [valid, valid],
      [valid, "unknown"],
      [valid, "none"],
    ]) {
      expect(validate({ ...example, [field]: selected })).toBe(false);
    }
  });
  it("全ての定義済み選択肢を受け付け、Ratingの範囲外と文字列数値を拒否する", () => {
    for (const [field, options] of Object.entries(choices)) {
      for (const [id] of options) {
        expect(
          validate({
            ...(id === "not_used" ? examples.allNotUsed : example),
            [field]: multiple.includes(field) ? [id] : id,
          }),
        ).toBe(true);
      }
    }
    for (const difficulty of [0, 6, "4"])
      expect(validate({ ...example, difficulty })).toBe(false);
  });
  it.each(["similarityConcept", "similarityJudgment", "similarityDifficulty"])(
    "%sのnot_usedとunknownを別Signalとして保持する",
    (field) => {
      const a = { ...examples.allNotUsed };
      const b = { ...example, [field]: "unknown" };
      expect(validate(a)).toBe(true);
      expect(validate(b)).toBe(true);
      expect(JSON.parse(JSON.stringify(a))[field]).not.toEqual(
        JSON.parse(JSON.stringify(b))[field],
      );
    },
  );
  it.each([
    ["allNotUsed", true],
    ["independentUnknown", true],
    ["mixedNotUsedRating", false],
    ["mixedNotUsedUnknown", false],
  ])("%sのSimilarity項目間制約を検証する", (key, valid) => {
    expect(validate(examples[key])).toBe(valid);
    if (!valid)
      expect(
        globalThis.reviewerFeedbackContract
          .errors(examples[key])
          .map((error) => error.field),
      ).toEqual(similarityFields);
  });
  it("エラーの原因を該当Fieldへ返し、違反Contentを含めない", () => {
    const payload = { ...example, examTopicIds: ["unknown", "topic-routing"] };
    expect(globalThis.reviewerFeedbackContract.errors(payload)).toEqual([
      {
        field: "examTopicIds",
        message:
          "不明・不足なしは他の選択と併用できません。単独で選んでください。",
      },
    ]);
    expect(
      JSON.stringify(
        globalThis.reviewerFeedbackContract.errors({
          ...example,
          url: "https://synthetic.invalid",
        }),
      ),
    ).not.toContain("synthetic.invalid");
  });
  it("PayloadとしてObject以外を拒否する", () => {
    for (const payload of [null, [], "synthetic-text", 1])
      expect(validate(payload)).toBe(false);
  });
});
