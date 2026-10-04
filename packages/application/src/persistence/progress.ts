import { ContractValidationError } from "../pipeline/validation.js";
import type {
  ConfirmedUserAnswer,
  LearningSessionDocument,
  ProgressProjection,
  ProgressScope,
} from "./contracts.js";
import { assertAnswerSnapshot, assertSessionSnapshot } from "./validation.js";

/** Adapterが確定事実を復元した後の入力。新Domain Aggregate / SQL行型ではない。 */
export interface SessionProgressFacts {
  readonly session: LearningSessionDocument;
  readonly answers: readonly ConfirmedUserAnswer[];
}

/**
 * #9の累積規則を適用する純粋なProjection。
 * Session提出事実の物理表現とTopic解決時点は選ばない。
 * Client JSONを直接渡さず、Schema検証・所有者照合済み事実から呼ぶ。
 */
export function rebuildLearningProgress(
  scope: ProgressScope,
  facts: readonly SessionProgressFacts[],
): ProgressProjection {
  let denominator = 0;
  let correctCount = 0;
  const topics = new Map<
    string,
    { correctCount: number; denominator: number }
  >();
  const sessionIds = new Set<string>();
  for (const { session, answers } of facts) {
    if (
      session.userId !== scope.userId ||
      session.certificationId !== scope.certificationId ||
      session.mode !== scope.mode
    )
      continue;
    if (sessionIds.has(session.sessionId))
      throw new ContractValidationError(
        "Repeated Session facts would double-count Progress",
      );
    sessionIds.add(session.sessionId);
    assertSessionSnapshot(session);
    // 未提出MockのDraft / 回答を集計しない。提出済みという確定事実は必須。
    if (session.mode === "mock" && !session.submittedAt) continue;
    const byOrdinal = new Map<number, ConfirmedUserAnswer>();
    for (const answer of answers) {
      assertAnswerSnapshot(session, answer);
      if (
        byOrdinal.has(answer.ordinal) ||
        typeof answer.correctness !== "boolean"
      )
        throw new ContractValidationError(
          "Invalid or repeated confirmed Answer facts",
        );
      byOrdinal.set(answer.ordinal, answer);
    }
    for (const snapshot of session.questions) {
      const answer = byOrdinal.get(snapshot.ordinal);
      // Practiceは確定回答だけ。Mockは未回答も全固定出題の分母に残す。
      if (session.mode === "practice" && !answer) continue;
      const correct = answer?.correctness === true ? 1 : 0;
      denominator += 1;
      correctCount += correct;
      for (const examTopicId of new Set(snapshot.examTopicIds)) {
        const counts = topics.get(examTopicId) ?? {
          correctCount: 0,
          denominator: 0,
        };
        counts.correctCount += correct;
        counts.denominator += 1;
        topics.set(examTopicId, counts);
      }
    }
  }
  return {
    scope,
    overall: { correctCount, denominator },
    topics: [...topics.entries()].map(([examTopicId, counts]) => ({
      examTopicId,
      ...counts,
    })),
  };
}
