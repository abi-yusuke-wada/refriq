-- Issue #12: U03/U04の選択に依存しないSession Snapshot参照境界。
-- 部分定義。learning_sessions(session_id)を含む完成Schema / Migrationではない。
-- 接続でFKを有効化し、既存Transaction外で強制状態を確認すること。
-- JSON配列の内容・選択肢の有効性はApplication Boundaryで検証する。

CREATE TABLE session_questions (
  session_id TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal > 0 AND ordinal = CAST(ordinal AS INTEGER)),
  question_id TEXT NOT NULL CHECK (length(question_id) > 0),
  question_revision_id TEXT NOT NULL CHECK (length(question_revision_id) > 0),
  PRIMARY KEY (session_id, ordinal),
  UNIQUE (session_id, question_id),
  FOREIGN KEY (session_id) REFERENCES learning_sessions(session_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
);

CREATE TABLE session_question_topics (
  session_id TEXT NOT NULL,
  ordinal INTEGER NOT NULL,
  exam_topic_id TEXT NOT NULL CHECK (length(exam_topic_id) > 0),
  PRIMARY KEY (session_id, ordinal, exam_topic_id),
  FOREIGN KEY (session_id, ordinal) REFERENCES session_questions(session_id, ordinal)
    ON UPDATE RESTRICT ON DELETE RESTRICT
);
CREATE INDEX session_question_topics_by_topic
  ON session_question_topics(exam_topic_id, session_id, ordinal);

CREATE TABLE session_answer_drafts (
  session_id TEXT NOT NULL,
  ordinal INTEGER NOT NULL,
  selected_option_ids_json TEXT NOT NULL,
  saved_version INTEGER NOT NULL CHECK (saved_version >= 0),
  PRIMARY KEY (session_id, ordinal),
  FOREIGN KEY (session_id, ordinal) REFERENCES session_questions(session_id, ordinal)
    ON UPDATE RESTRICT ON DELETE RESTRICT
);

CREATE TABLE user_answers (
  user_answer_id TEXT NOT NULL PRIMARY KEY CHECK (length(user_answer_id) > 0),
  session_id TEXT NOT NULL,
  ordinal INTEGER NOT NULL,
  selected_option_ids_json TEXT NOT NULL,
  correctness INTEGER NOT NULL CHECK (correctness IN (0, 1)),
  submitted_at TEXT NOT NULL,
  UNIQUE (session_id, ordinal),
  FOREIGN KEY (session_id, ordinal) REFERENCES session_questions(session_id, ordinal)
    ON UPDATE RESTRICT ON DELETE RESTRICT
);

-- PKのFKだけでは、親のRevision非Key列の更新を防げない。不変性もDBで維持する。
CREATE TRIGGER session_questions_immutable
BEFORE UPDATE ON session_questions
BEGIN
  SELECT RAISE(ABORT, 'Session Snapshot is immutable');
END;

CREATE TRIGGER session_question_topics_immutable
BEFORE UPDATE ON session_question_topics
BEGIN
  SELECT RAISE(ABORT, 'Session Topic Snapshot is immutable');
END;

CREATE TRIGGER user_answers_immutable
BEFORE UPDATE ON user_answers
BEGIN
  SELECT RAISE(ABORT, 'Confirmed UserAnswer is immutable');
END;

-- DELETEを公開するPortはない。Retention / Archiveの削除順はU07で別途設計する。
-- Session所有者、Mode、active / submitted、version条件、Draft digestの検査と
-- Answer / Session / operation receiptの原子的commitは完成Schema / Adapterで実現する。
