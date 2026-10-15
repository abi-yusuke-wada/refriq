# Issue #10 実行計画

対象: [Reviewer UIと受験Feedback入力を設計する](https://github.com/abi-yusuke-wada/refriq/issues/10)。調査基点はmain `9874feb`。実装開始前にこの計画をIssueコメントとして記録する。

## 調査結果

### 現在状態

- 元worktreeは`feature/9-learner-ui-wireframes`。`README.md`に未コミット変更、`docs/ux/`に未追跡のLearner文書・Layout C成果物がある。
- 元Repositoryの`.git`は読み取り専用でworktree登録が失敗した。このためmainのGit履歴のみを`/tmp/refriq-issue10-git`へbare cloneし、`/tmp/refriq-issue10`に`feature/10-reviewer-ui-feedback` worktreeを作成した。元worktreeの未コミット内容はコピーしていない。
- #6・#7・#8はClosedでmainに反映済み。DomainのSource / Publish Gate、Applicationの4 Stage契約、Fake Provider、Pipeline Fixtureがある。
- `apps/api`・`apps/web`・`packages/contracts`は空の入口。Reviewer UI、ExamFeedbackのRuntime型・保存処理、Domain Revision作成Use Caseはない。独立した`tests/`はなく、Testは各Packageの`*.test.ts`にある。
- Issue #10はUX設計Issue。Production Application実装は要求していない。

### 再利用する契約

| 根拠 | 利用する契約 |
| --- | --- |
| #6、ADR-0004、Domain用語集・Lifecycle | Questionは同じ学習意図のstable identity。QuestionRevision Contentはimmutable。Human QuestionReviewはRevisionを対象とする最大1件の決定記録。`APPROVE / REQUEST_CHANGES / REJECT`。ApproveとPublishは同じ遷移で、`APPROVED`状態は作らない。 |
| #7、ADR-0005、Sourceガバナンス | 取得時Snapshotと現在Policyは別。現在`TRUSTED`、各KnowledgePointのQuestionSource、同一RevisionへのHuman ApprovalがPublishに必要。SourceReviewはQuestionReviewと別。禁止本文はFixture・Logにも入れない。 |
| #8、ADR-0006、Application Stage契約 | Candidate ID / KnowledgePoint Candidate IDはRun内のID。`PASS / REVISE / REJECT`と`ELIGIBLE_FOR_HUMAN_REVIEW / REVISION_REQUIRED / REJECTED_BY_EVALUATION`はHuman decisionではない。Checks、Findings、Intent、Grounding、Stage metadataを受け取る。 |
| #9 | LearnerはPublish Boundaryの後でPublished Revisionを利用する。Candidate / Human Review内部情報をLearnerへ渡す仕様は作らない。 |

### 既存成果物

`fixtures/pipeline/`のKnowledge Extraction、Planning、Generation、Evaluation Fixtureと、`apps/pipeline/src/index.test.ts`の架空Source Metadataを再利用する。Reviewer / Human Review HTML、reviewer-ui.md、ExamFeedback Fixture、Question Author出力はRepositoryにない。Issue #8コメントのSkill名はRuntime依存を意味しない。

Issue #9の未マージ成果物は境界・Visual Toneを読み取り確認するだけで、コピー・import・merge・cherry-pickしない。配色は紫と白を参考にするが、Reviewerの比較・根拠確認に適した独立した配置にする。

### 依存と独立して進められる作業

#6 / #7 / #8のマージ済みContractだけで、Review画面・差分・Human判断・編集候補・Feedback入力 / 閲覧を設計できる。Issue #9完了を待つ必要はない。LearnerからのFeedback導線は後続接続用の入口名を示すだけで、Learnerファイルは編集しない。

### 競合とリスク

共有README、package manifest / lock、Domain / Application、Issue #9の`docs/ux/learner-ui.md`、`issue-9-plan.md`、`mockups/selected/`、比較成果物、Layout C assetsを変更しない。追加先はIssue #10専用パスに限る。

### 不明点と後続判断

Candidateからstable KnowledgePoint / Question / QuestionRevision / QuestionSourceを作成するUse Case、同時Review・Policy変更時の整合性、永続化、Review権限、再送の重複防止、違反Inputの運用・Retentionは未実装。UX上の必要条件を文書化し、今回方式を決めない。MVP ScopeはRatingの詳細選択肢を後続UI設計へ委ねているため、今回Mock用の選択肢を定義する。API / Domain enumを先行追加しない。実装方向を妨げる新しいHuman Product判断は現時点でない。

## 1. 目標

Reviewerが問題・正答・解説・KnowledgePoint・公式Source URL・生成意図・前Revision差分を一つのReview体験で確認できるUXを作る。受験後Feedbackを抽象化された選択だけで入力し、Reviewerが改善Signalとして閲覧できるようにする。

## 2. 現在の実装

既存Domain Gate・Pipeline契約を参照し、ProductionのDomain CRUD / API / Backendを追加しない。Issue #8本文の対象範囲には省略表記が残るため、詳細コメントとマージ済みArchitecture / Contractを併せて読む。Issue #8コメントのAccept / Revise等の概念例は最新Domainのdecision名へ対応させる。

## 3. 依存

#6のIdentity / Immutable Revision、#7のProvenance / 現在Policy、#8のCandidate / Evaluationを利用する。#9とはPublished QuestionRevisionの境界だけを共有する。

## 4. Reviewerの責務

内容、全選択肢の正誤理由、意図、KnowledgePoint、Sourceの該当箇所、評価指摘、差分を確認する。Human decisionは特定Domain Revisionへ記録する。Editは新しい作業候補を作り、再Validation / Evaluation / Human Reviewを要求する。Source Snapshot / Policy / AI評価 / 過去Reviewを書き換える操作は置かない。

## 5. Reviewerのフロー

1. Queueで対象Candidate / Domain Revision、Evaluation、Human Review、Source Policyを区別する。
2. 詳細で内容、KnowledgePoint / Intent、Source / Grounding、評価、前Revision差分を確認する。
3. Application Candidateに対する確認と、Domain RevisionへのHuman decisionを区別する。Domain Identity未解決のCandidateはApproveできない。
4. Review待ちのDomain Revisionへ`APPROVE`、`REQUEST_CHANGES`、`REJECT`を確認画面経由で記録する。
5. ApproveはPublish Gateを再検査して`PUBLISHED`へ進む一つの操作。失敗なら成功表示・Current Published Revision切替を行わない。
6. Editは別候補を作り、元Revision・Evaluation・Review・公開参照を維持する。変更した候補の評価は無効化し再評価待ちとする。

## 6. ExamFeedbackのフロー

実試験受験後、資格と抽象的なTopic / Style / Difficulty / Scenario比率 / 実機重要度 / refriqとの差 / 不足Topicを選ぶ。確認、送信中、失敗・再試行、成功、Reviewer閲覧を再生する。FeedbackはCertification / ExamTopicへ関連づけ、個別問題・QuestionRevision・Sourceへ関連づけない。問題本文・選択肢・自由記述・添付・URL入力は用意しない。

## 7. 画面

Review Queue、Question Review（内容・根拠・評価・差分）、新しい編集候補、Human判断確認 / 結果、受験Feedback入力 / 確認 / 結果、Reviewer Feedback一覧 / 詳細。独立したSource登録・SourceReview決定画面は作らず、現在Policyと既存SourceReviewの閲覧を扱う。

## 8. 状態

取得中、正常な空、取得失敗 / 再試行、Review待ち、Review完了、初版で差分なし、Domain Identity未解決、Source未確認 / 禁止、編集後再評価待ち、入力不備、保存 / 送信中、保存 / 送信失敗、成功。設計レビュー用の状態切替はProduct操作と区別する。

## 9. 必要データ

各画面の既存Contract参照をUX文書に表で記載する。Pipeline CandidateとDomain Revision / Human Review / Current Published Revision / 現在Policyの読取投影を区別する。Fixture内の仮のstable IDは作成Use Case実装を意味しない。API Schemaは作らない。

## 10. SourceとProvenance

SourceDocument / SourceRevision ID、取得時URL / 時刻 / Fingerprint、Kind / Purpose、取得時Policyと現在Policy、Terms確認者・日時・参照、SourceReview参照、KnowledgePoint / 正答 / 解説との関係、Locator / 使用した短いGroundingを表示する。公式URL欄は架空の公式相当Source URLで確認する。禁止例は現在Policyの拒否Metadataのみを使用し、禁止本文を作らない。

## 11. 判断境界

`PASS`はHuman ApprovalでもPublishでもない。`REVISE / REJECT`は技術的失敗ではなく評価結果。Human decisionは`APPROVE / REQUEST_CHANGES / REJECT`。Source利用承認もQuestion公開承認を代替しない。`APPROVED`状態や別Publishボタンを作らない。

## 12. FixtureとMock

`docs/ux/mockups/reviewer/`に依存追加なしのHTML / CSS / JavaScriptとFixtureを置く。既存Pipeline Fixtureの内容・形を再利用し、日本語の表示と架空の前Revision・Human Record・Feedbackを足す。Backend保存はせずメモリ上の状態だけで操作する。Reloadで初期化する。PASS / REVISE / REJECT、初版、Source Policy変更、Review完了、複数選択、長文を確認可能にする。

## 13. 文書

本計画、`docs/ux/reviewer-ui.md`、Mock内`validation.md`を追加する。UX文書に操作・状態・変更可能 / 閲覧専用情報、画面別必要データ、受入条件対応、後続引き継ぎを記載する。

## 14. 検証

IssueのReviewシナリオをブラウザで再生する。差分、Editによるimmutable保持、評価とHuman判断、Approve確認 / Source blocking / Review完了、Feedbackの全項目、自由記述なしと未知Field / 値の拒否、保存失敗・再試行を確認する。PCで長文・複数選択と表示を確認する。`git diff --check`、`make check`を実行し、元Issue #9成果物のHash / statusを照合する。

## 15. 対象外

Production React、API Schema、DB / Persistence、Authentication / Authorization、Production LLM / Kong AI、Source / Pipeline再設計、Domain Aggregate / enum追加、Learner再設計、共通Design System、Issue #9変更、commit / push / PR作成。

## 16. 後続への引き継ぎ

Frontendへ画面・操作・状態とFixture、ApplicationへCandidate materialization / 編集再評価 / Human Review / Gate再確認の必要条件、#11 / #12等へ読取・保存・整合性の要求、Issue #9へFeedback入口の接続先を渡す。これらの実装方式や権限は今回確定しない。

## Human承認済みの独立レビュー指摘対応

現在の未コミット・未追跡成果物をbaselineとして、I-01〜I-06のみを反映する。

1. 最新Issue本文・コメント、Domain / Source契約、実装、RV資料を再読し、修正前ファイルをHash / Archiveへ記録。
2. exact Revisionの凍結Contentを表示正本にし、Candidate不一致Fixtureを追加。
3. Diffをimmutable Content / Intent全体へ拡張し、現在Policyを分離。
4. 確定失敗と結果不明、照合後だけのRetryをReview / Edit / Feedbackへ適用。
5. Similarityのnot_usedとunknownを分離。全SourceのPolicy投影を既存Domain Gateと照合。
6. 入力ErrorのField association / Focus / ARIAを実装し、unit・Browser・make checkを実行。
7. UX文書、画面・PDF、RV Context / 全文TXT / ZIP、検証記録を更新し、Human再レビュー待ちで停止。

Domain / ADR / API / DB / Issue #9 / Issue #12は変更しない。commit / push / PRは行わない。
