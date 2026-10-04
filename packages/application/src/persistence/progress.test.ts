import { describe, expect, it } from "vitest";
import type { HumanQuestionReview } from "@refriq/domain";
import type {
  ConfirmedRevisionTarget,
  ConfirmedUserAnswer,
  LearningMode,
  LearningSessionDocument,
  ProgressScope,
} from "./contracts.js";
import { rebuildLearningProgress } from "./progress.js";
import {
  assertAnswerSnapshot,
  assertHumanReviewTarget,
  assertSessionSnapshot,
} from "./validation.js";

const scope: ProgressScope = {
  userId: "synthetic-user",
  certificationId: "synthetic-cert",
  mode: "mock",
};

function session(
  mode: LearningMode = "mock",
  sessionId = "s1",
): LearningSessionDocument {
  return {
    ...scope,
    mode,
    sessionId,
    version: 1,
    startedAt: "2026-10-04T00:00:00Z",
    ...(mode === "mock" ? { submittedAt: "2026-10-04T01:00:00Z" } : {}),
    questions: Array.from(
      { length: mode === "mock" ? 20 : 10 },
      (_, index) => ({
        ordinal: index + 1,
        questionId: `q${index + 1}`,
        questionRevisionId: `qr${index + 1}`,
        examTopicIds:
          index % 2 === 0 ? ["routing", "fundamentals"] : ["routing"],
      }),
    ),
  };
}

function answer(
  document: LearningSessionDocument,
  ordinal: number,
  correctness = true,
): ConfirmedUserAnswer {
  const snapshot = document.questions[ordinal - 1];
  if (!snapshot) throw new Error("Invalid test ordinal");
  return {
    userAnswerId: `${document.sessionId}-answer-${ordinal}`,
    sessionId: document.sessionId,
    userId: document.userId,
    ordinal,
    questionId: snapshot.questionId,
    questionRevisionId: snapshot.questionRevisionId,
    selectedOptionIds: ["A"],
    correctness,
    submittedAt: "2026-10-04T01:00:00Z",
  };
}

describe("LearningProgressの確定事実からの再構築", () => {
  it("18実回答・2未回答の提出済みMockを18/20とし、偽UserAnswerを作らない", () => {
    const mock = session();
    const answers = Array.from({ length: 18 }, (_, index) =>
      answer(mock, index + 1),
    );
    const facts = [{ session: mock, answers }];
    const before = structuredClone(facts);
    const progress = rebuildLearningProgress(scope, facts);

    expect(progress.overall).toEqual({ correctCount: 18, denominator: 20 });
    expect(progress.topics).toEqual([
      { examTopicId: "routing", correctCount: 18, denominator: 20 },
      { examTopicId: "fundamentals", correctCount: 9, denominator: 10 },
    ]);
    expect(answers).toHaveLength(18);
    expect(facts).toEqual(before);
  });

  it("未回答だけの提出済みMockも0/20を再現する", () => {
    expect(
      rebuildLearningProgress(scope, [{ session: session(), answers: [] }])
        .overall,
    ).toEqual({ correctCount: 0, denominator: 20 });
  });

  it("未提出Mockの途中回答はProgressへ含めない", () => {
    const { submittedAt: _, ...mock } = session();
    expect(
      rebuildLearningProgress(scope, [
        { session: mock, answers: [answer(mock, 1)] },
      ]),
    ).toEqual({
      scope,
      overall: { correctCount: 0, denominator: 0 },
      topics: [],
    });
  });

  it("Practiceの確定回答だけを、中断・終了後も集計する", () => {
    const practice = {
      ...session("practice"),
      endedAt: "2026-10-04T01:00:00Z",
    };
    expect(
      rebuildLearningProgress({ ...scope, mode: "practice" }, [
        {
          session: practice,
          answers: [
            answer(practice, 1),
            answer(practice, 2),
            answer(practice, 3, false),
          ],
        },
      ]).overall,
    ).toEqual({ correctCount: 2, denominator: 3 });
  });

  it("別Sessionでの同Question再回答を新しい確定事実として累積する", () => {
    const facts = [session("mock", "s1"), session("mock", "s2")].map(
      (mock) => ({
        session: mock,
        answers: Array.from({ length: 18 }, (_, index) =>
          answer(mock, index + 1),
        ),
      }),
    );
    expect(rebuildLearningProgress(scope, facts).overall).toEqual({
      correctCount: 36,
      denominator: 40,
    });
  });

  it("User・資格・Modeが違う事実を混ぜない", () => {
    const mocks = [
      { ...session(), userId: "other-user" },
      { ...session(), certificationId: "other-cert" },
      session("practice"),
    ];
    expect(
      rebuildLearningProgress(
        scope,
        mocks.map((mock) => ({
          session: mock,
          answers: [answer(mock, 1)],
        })),
      ).overall,
    ).toEqual({ correctCount: 0, denominator: 0 });
  });

  it("同Session事実の重複入力による二重計上を拒否する", () => {
    const facts = { session: session(), answers: [] };
    expect(() => rebuildLearningProgress(scope, [facts, facts])).toThrow(
      /Repeated Session/,
    );
  });

  it("同Session / ordinalの確定回答重複を拒否する", () => {
    const mock = session();
    const first = answer(mock, 1);
    expect(() =>
      rebuildLearningProgress(scope, [
        {
          session: mock,
          answers: [first, { ...first, userAnswerId: "another-answer" }],
        },
      ]),
    ).toThrow(/repeated confirmed Answer/);
  });
});

describe("固定SnapshotとHuman Review対象", () => {
  it.each([
    { ordinal: 21 },
    { sessionId: "different-session" },
    { userId: "different-user" },
    { questionId: "different-question" },
    { questionRevisionId: "current-published-qr2" },
    { selectedOptionIds: [] },
    { selectedOptionIds: ["A", "A"] },
  ])("出題または実回答に一致しないAnswerを拒否する: %j", (change) => {
    const mock = session();
    expect(() =>
      assertAnswerSnapshot(mock, { ...answer(mock, 1), ...change }),
    ).toThrow();
  });

  it("固定qr1への回答は現在公開Revisionを使わず照合する", () => {
    const mock = session();
    expect(() => assertAnswerSnapshot(mock, answer(mock, 1))).not.toThrow();
    expect(answer(mock, 1).questionRevisionId).toBe("qr1");
  });

  it("固定数・順序・Question一意性・Topic一意性を維持する", () => {
    const mock = session();
    expect(() => assertSessionSnapshot(mock)).not.toThrow();
    expect(() =>
      assertSessionSnapshot({
        ...mock,
        questions: mock.questions.slice(0, 18),
      }),
    ).toThrow();
    expect(() =>
      assertSessionSnapshot({
        ...mock,
        questions: [...mock.questions].reverse(),
      }),
    ).toThrow();
    expect(() =>
      assertSessionSnapshot({
        ...mock,
        questions: mock.questions.map((q) => ({ ...q, questionId: "q1" })),
      }),
    ).toThrow();
    expect(() =>
      assertSessionSnapshot({
        ...mock,
        questions: mock.questions.map((q) => ({
          ...q,
          examTopicIds: ["routing", "routing"],
        })),
      }),
    ).toThrow();
  });

  const target: ConfirmedRevisionTarget = {
    kind: "QUESTION_REVISION",
    questionId: "q1",
    questionRevisionId: "qr1",
    expectedQuestionVersion: 5,
    expectedRevisionVersion: 0,
  };
  const review: HumanQuestionReview = {
    questionReviewId: "review1",
    questionRevisionId: "qr1",
    reviewerId: "synthetic-reviewer",
    decision: "APPROVE",
    reviewedAt: "2026-10-04T00:00:00Z",
  };

  it.each(["APPROVE", "REQUEST_CHANGES", "REJECT"] as const)(
    "exact Domain Revisionの%sを受理する",
    (decision) => {
      expect(() =>
        assertHumanReviewTarget(target, { ...review, decision }),
      ).not.toThrow();
    },
  );

  it("同じ文字列IDでもCandidate TargetへHuman decisionを記録させない", () => {
    const candidate: unknown = { ...target, kind: "CANDIDATE" };
    expect(() =>
      assertHumanReviewTarget(candidate as ConfirmedRevisionTarget, review),
    ).toThrow();
  });

  it("確認したRevisionと別のReview対象へのcommitを拒否する", () => {
    expect(() =>
      assertHumanReviewTarget(target, { ...review, questionRevisionId: "qr2" }),
    ).toThrow();
  });
});
