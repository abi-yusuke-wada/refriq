import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { validateDynamoItem } from "./validation.js";
import items from "../../../fixtures/persistence/dynamodb-items.json" with {
  type: "json",
};

const schema = readFileSync(
  new URL("../schema/session-snapshot.sql", import.meta.url),
  "utf8",
);
let db;

describe("Session Snapshotの部分DDL（SQLiteメモリDB）", () => {
  beforeEach(() => {
    db = new DatabaseSync(":memory:");
    db.exec("PRAGMA foreign_keys = ON");
    expect(db.prepare("PRAGMA foreign_keys").get().foreign_keys).toBe(1);
    // 未確定の完成Session Schemaを仮実装せず、FKの親Keyだけを用意する。
    db.exec(
      "CREATE TABLE learning_sessions (session_id TEXT NOT NULL PRIMARY KEY)",
    );
    db.exec(schema);
    db.prepare("INSERT INTO learning_sessions VALUES (?)").run("s1");
    const insert = db.prepare(
      "INSERT INTO session_questions VALUES (?, ?, ?, ?)",
    );
    for (let ordinal = 1; ordinal <= 20; ordinal++)
      insert.run(
        "s1",
        ordinal,
        `synthetic-q${ordinal}`,
        `synthetic-qr${ordinal}`,
      );
  });

  afterEach(() => db.close());

  function insertAnswer(
    ordinal = 1,
    answerId = `answer-${ordinal}`,
    sessionId = "s1",
  ) {
    db.prepare("INSERT INTO user_answers VALUES (?, ?, ?, ?, ?, ?)").run(
      answerId,
      sessionId,
      ordinal,
      '["A"]',
      1,
      "2026-10-04T00:00:00Z",
    );
  }

  function insertDraft(ordinal = 1, sessionId = "s1") {
    db.prepare("INSERT INTO session_answer_drafts VALUES (?, ?, ?, ?)").run(
      sessionId,
      ordinal,
      '["A"]',
      1,
    );
  }

  it("Answer / Draftの2列FKは同じ出題Snapshotのexact qr1へ到達する", () => {
    insertAnswer();
    insertDraft();
    for (const table of ["user_answers", "session_answer_drafts"]) {
      expect(
        db
          .prepare(`
        SELECT q.question_id, q.question_revision_id FROM ${table} a
        JOIN session_questions q ON q.session_id = a.session_id AND q.ordinal = a.ordinal
      `)
          .get(),
      ).toMatchObject({
        question_id: "synthetic-q1",
        question_revision_id: "synthetic-qr1",
      });
    }
    expect(db.prepare("PRAGMA foreign_key_check").all()).toEqual([]);
  });

  it("Current Publishedがqr2になってもSnapshotから復元したAnswerはqr1を参照する", () => {
    // DynamoDBとTursoの接続検証ではなく、両保存形の参照境界のRegression。
    const head = structuredClone(
      items.find((entry) => entry.kind === "QUESTION_HEAD"),
    );
    head.payload.currentPublishedRevisionId = "synthetic-qr2";
    expect(validateDynamoItem(head).payload.currentPublishedRevisionId).toBe(
      "synthetic-qr2",
    );
    insertAnswer();
    expect(
      db
        .prepare(`
      SELECT q.question_id, q.question_revision_id FROM user_answers a
      JOIN session_questions q ON q.session_id = a.session_id AND q.ordinal = a.ordinal
      WHERE a.user_answer_id = ?
    `)
        .get("answer-1"),
    ).toMatchObject({
      question_id: head.payload.questionId,
      question_revision_id: "synthetic-qr1",
    });
  });

  it.each([
    ["answer", "s1", 21],
    ["answer", "missing-session", 1],
    ["draft", "s1", 21],
    ["draft", "missing-session", 1],
  ])(
    "Snapshotにない%s (%s, %i)をDB制約で拒否する",
    (kind, sessionId, ordinal) => {
      expect(() =>
        kind === "answer"
          ? insertAnswer(ordinal, "answer", sessionId)
          : insertDraft(ordinal, sessionId),
      ).toThrow(/FOREIGN KEY constraint failed/);
    },
  );

  it("同Session / ordinalへの2件目の確定Answerを拒否する", () => {
    insertAnswer();
    expect(() => insertAnswer(1, "another-answer")).toThrow(
      /UNIQUE constraint failed/,
    );
    expect(
      db.prepare("SELECT COUNT(*) AS count FROM user_answers").get().count,
    ).toBe(1);
  });

  it.each([
    "UPDATE session_questions SET question_revision_id = 'qr2' WHERE ordinal = 1",
    "UPDATE session_questions SET ordinal = 21 WHERE ordinal = 1",
    "UPDATE user_answers SET correctness = 0 WHERE ordinal = 1",
    "UPDATE session_question_topics SET exam_topic_id = 'other-topic' WHERE ordinal = 1",
  ])("不変行の更新を拒否する: %s", (update) => {
    insertAnswer();
    db.prepare("INSERT INTO session_question_topics VALUES (?, ?, ?)").run(
      "s1",
      1,
      "routing",
    );
    expect(() => db.exec(update)).toThrow(/immutable/);
  });

  it("参照中Snapshotの削除とnull ordinalを拒否する", () => {
    insertAnswer();
    expect(() =>
      db.exec("DELETE FROM session_questions WHERE ordinal = 1"),
    ).toThrow(/FOREIGN KEY constraint failed/);
    expect(() => insertAnswer(null, "null-answer")).toThrow(
      /NOT NULL constraint failed/,
    );
  });

  it("固定20問を起点に18実回答・未回答2件を失わず復元する", () => {
    for (let ordinal = 1; ordinal <= 18; ordinal++) insertAnswer(ordinal);
    expect(
      db
        .prepare(`
      SELECT COUNT(*) AS denominator, COUNT(a.user_answer_id) AS answered,
        SUM(COALESCE(a.correctness, 0)) AS correct
      FROM session_questions q LEFT JOIN user_answers a
        ON a.session_id = q.session_id AND a.ordinal = q.ordinal
      WHERE q.session_id = ?
    `)
        .get("s1"),
    ).toMatchObject({ denominator: 20, answered: 18, correct: 18 });
    expect(
      db.prepare("SELECT COUNT(*) AS count FROM user_answers").get().count,
    ).toBe(18);
  });
});
