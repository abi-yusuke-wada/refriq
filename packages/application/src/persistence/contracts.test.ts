import { describe, expectTypeOf, it } from "vitest";
import type { HumanQuestionReview } from "@refriq/domain";
import type {
  AnswerSelection,
  ConfirmedRevisionTarget,
  LearningSessionResume,
  QuestionRevisionReviewDetail,
  RepositoryResult,
  ReviewTarget,
} from "./contracts.js";
import type { LearningSessionRepository, QuestionRepository } from "./ports.js";

describe("永続化Portの読取契約", () => {
  it("Resumeは固定Sessionと保存済み回答・同じ保存版のDraft / digestを取得できる", () => {
    expectTypeOf<
      Awaited<ReturnType<LearningSessionRepository["resume"]>>
    >().toEqualTypeOf<RepositoryResult<LearningSessionResume>>();
    expectTypeOf<
      NonNullable<LearningSessionResume["savedMockDrafts"]>["selections"]
    >().toEqualTypeOf<readonly AnswerSelection[]>();
    expectTypeOf<
      NonNullable<LearningSessionResume["savedMockDrafts"]>["savedVersion"]
    >().toEqualTypeOf<number>();
    expectTypeOf<
      NonNullable<LearningSessionResume["savedMockDrafts"]>["draftDigest"]
    >().toEqualTypeOf<string>();
  });

  it("Reviewer詳細はReview / Evaluationと別々の親・Revision versionを返す", () => {
    expectTypeOf<
      Awaited<ReturnType<QuestionRepository["getReviewDetail"]>>
    >().toEqualTypeOf<RepositoryResult<QuestionRevisionReviewDetail>>();
    expectTypeOf<
      Extract<ReviewTarget, { kind: "QUESTION_REVISION" }>["detail"]
    >().toEqualTypeOf<QuestionRevisionReviewDetail>();
    expectTypeOf<
      QuestionRevisionReviewDetail["questionVersion"]
    >().toEqualTypeOf<number>();
    expectTypeOf<
      QuestionRevisionReviewDetail["revisionVersion"]
    >().toEqualTypeOf<number>();
    expectTypeOf<
      QuestionRevisionReviewDetail["review"]
    >().toEqualTypeOf<HumanQuestionReview | null>();
    expectTypeOf<
      QuestionRevisionReviewDetail["evaluations"][number]["questionRevisionId"]
    >().toEqualTypeOf<string>();
  });

  it("Human commandはCandidate共通IDを受けず、両versionを条件として受ける", () => {
    expectTypeOf<
      ConfirmedRevisionTarget["kind"]
    >().toEqualTypeOf<"QUESTION_REVISION">();
    expectTypeOf<
      Parameters<QuestionRepository["commitHumanDecision"]>[0]["target"]
    >().toEqualTypeOf<ConfirmedRevisionTarget>();
    expectTypeOf<
      ConfirmedRevisionTarget["expectedQuestionVersion"]
    >().toEqualTypeOf<number>();
    expectTypeOf<
      ConfirmedRevisionTarget["expectedRevisionVersion"]
    >().toEqualTypeOf<number>();
  });
});
