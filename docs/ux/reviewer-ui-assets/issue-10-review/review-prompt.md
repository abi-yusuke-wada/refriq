# Issue 10 Reviewer画面と受験Feedbackのレビュー依頼

Humanが承認したI-01〜I-06とR-01〜R-04を反映した成果物の再レビューです。`review-findings.md`の対応表と最新コード・画面・検証を照合し、修正内容が指摘を解消しているかを確認してください。

以下の添付資料を根拠に、refriq Issue #10のUX設計とStatic Mockを独立した立場でレビューしてください。事前のチャット履歴は前提にせず、受入条件・既存Domain・実際の画面・コードの対応を確認してください。

## 依頼の対象

Issue #10は「Reviewer UIと受験Feedback入力を設計する」です。今回の成果物は日本語UX文書、Static HTML / CSS / JavaScript Mock、架空Fixture、入力制約、検証記録です。Production React、API、DB、認証、LLM接続は対象外です。

Review対象のファイル一覧、画面と操作の対応、検証結果、未実装範囲は`review-context.md`と`screen-flow.md`にまとめています。本文・コード・既存契約の全文は`review-context-complete.txt`にも含めています。画面は`screens.pdf`または`screens/`を確認してください。

画面画像は表示Snapshotです。クリック操作や実保存を画像だけから検証済みと判断しないでください。コードを実行できない場合は、その制限と未検証箇所を明記してください。

## 今回の再RVで優先する確認

1. R-01: 評価時Content・対象IDとexact Revisionの一致を保証するか。不一致PASS / missingでAPPROVE readinessを満たさず、Domain Gateは変更していないか。
2. R-02: 同Locatorの別SourceRevisionをAだけ / Bだけ / A+Bで一意に選択・完全SourceReferenceへ保存するか。
3. R-03: not_usedはSimilarity全体のN/Aで、混在PayloadをUI同期・項目間Validationで拒否するか。unknownは観点別に使えるか。
4. R-04: unordered関係はcanonical比較し、Options等のordered Contentの変更を検出するか。Immutable配列を書き換えないか。
5. I-01〜I-06のexact Content / Human Review / Source / Save結果不明 / Feedback禁止入力 / inline error・Focusが維持されるか。

対応表の完了記載を結論として受け取らず、最新コード・Contract・Evidenceで独立に確認してください。

## 受入条件の確認

1. 生成問題、正答候補、全選択肢の説明、学習用解説、元KnowledgePoint、Source URL、生成意図、前Revision差分を一つのReview体験で辿れるか。
2. 現在対象のCandidate / Domain Revision、Human Review状態、現在公開中Revisionを取り違えないか。
3. LLM EvaluationとHuman Review、QuestionReviewとSourceReview、QuestionReviewとExamFeedbackを区別できるか。
4. `PASS`がHuman Approvalや公開済みと誤解されないか。既存Domainの`APPROVE / REQUEST_CHANGES / REJECT`とLifecycleに一致するか。
5. Editが元Revisionを上書きせず、新候補・再評価・新RevisionへのReviewを必要とすることが明確か。
6. 取得時Source Snapshotと現在Policyを区別し、現在`REVIEW_REQUIRED / PROHIBITED`を過去のTrustやHuman判断で迂回しないか。
7. Human decisionの確認、キャンセル、保存中、失敗、Retry、完了後の操作に曖昧さや誤操作がないか。
8. Feedbackの対象7項目が選択入力で表現され、問題文・選択肢・解答・自由記述・添付・URLを入力できないか。
9. FeedbackのRating方向、「不明」「未利用」「不足なし」、必須項目と複数選択の制約が理解できるか。
10. 文書が約束する状態や操作と、Mockが実際に再生できる範囲に差がないか。

## 固定している契約

- Questionはstable identity、QuestionRevision Contentはimmutable。
- PipelineのCandidate ID / KnowledgePoint Candidate IDはDomainのstable IDではない。
- QuestionReviewのHuman decisionは`APPROVE / REQUEST_CHANGES / REJECT`。1 Revisionへの決定的記録は最大1件。
- MVPではApproveとPublishは同じDomain遷移。独立した`APPROVED`状態や別Publish操作はない。
- Publishには同じRevisionへのHuman Approval、各KnowledgePointのQuestionSource、取得時Provenance、現在`TRUSTED`なSource Policyが必要。
- ExamFeedbackは抽象的な改善Signal。QuestionSource、SourceRevision、正答のNormative Sourceにしない。
- Issue #9のLearnerはPublish Boundaryの後のPublished Revisionを扱う。今回Learner画面を再設計しない。

既存ADRに疑義がある場合は、今回のUX不具合とADR変更提案を別に記載してください。レビューの中で新しいDomain enum・Publish条件・Feedbackの意味を既成事実として追加しないでください。

## 根拠の扱い

実装者の「テスト通過」「整合している」という説明は結論として採用せず、資料に含まれるコード・既存契約・画面を照合してください。自動検証は部分的なEvidenceであり、UXの採用承認ではありません。

架空Source URL、架空ID、Mock専用Timer、メモリ内保存は今回の設計検証手段です。Production接続がないこと自体をIssue #10の不合格理由にしないでください。一方、Mockの省略によってユーザーに誤解を与える点、必要な設計を確認できない点、後続実装への仕様誤伝達は指摘してください。

Review対象に残る差分・Validation表示・編集範囲等の制約は`review-context.md`の「現在のMockの限界と重点確認」に明記しています。記載済みでも、Issue #10の受入条件を満たせない制約であれば指摘してください。

## 回答形式

日本語で、次の順に回答してください。

1. **総合判断:** UX設計として後続実装へ渡せるか、修正してから渡すべきか、Product判断が必要か。理由を簡潔に示す。
2. **受入条件の確認:** 条件ごとに満たす / 一部不足 / 満たさない / 未検証を示し、根拠を添える。
3. **指摘一覧:** 次の表形式を使用する。

| ID | 重大度 | 分類 | 対象画面と操作 | 問題と影響 | 根拠のファイルと行または画面番号 | 最小修正案 | Human判断の要否 |
| --- | --- | --- | --- | --- | --- | --- | --- |

重大度は「重大」「主要」「軽微」。分類は「既存契約との矛盾」「UX」「状態と操作」「文書とMockの差」「検証不足」「後続実装への引き継ぎ」を使う。指摘には可能な限り具体的なTrigger、期待結果、実際の結果を記載する。

4. **Human判断が必要な事項:** 実装ミスで解決できる事項と分け、選択肢・影響・推奨理由を示す。
5. **今回直す項目と後続へ残す項目:** Issue #10の範囲で最小変更を優先する。対象外のProduction機能を混ぜない。
6. **未検証事項:** 操作実行、Keyboard、実Backend、保存結果不明等について、確認できたことと確認できないことを分ける。

根拠のない指摘を件数合わせで追加しないでください。問題が見つからない観点も、その確認範囲を示してください。コードの修正やGitHubへの投稿は行わず、レビュー結果だけを返してください。
