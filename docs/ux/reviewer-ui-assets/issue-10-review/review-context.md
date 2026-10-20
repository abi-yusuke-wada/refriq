# Issue 10 Reviewer画面と受験Feedbackのレビュー資料

この資料は、事前会話を知らないGPTが、Issue #10の要求・既存契約・成果物・画面・検証の対応を確認するための引き継ぎである。レビュー依頼者はRepositoryのHuman、成果物作成者はCodex、レビュー対象はUX設計とStatic Mock。Humanが承認したI-01〜I-06、R-01〜R-04、N-01を反映した再レビュー資料。[指摘対応](review-findings.md)で変更・根拠を確認する。採用承認やProduction実装の完了は主張しない。

## 最新のSource blocker契約（N-01）

全QuestionSourceのcurrent Policyを確認し、REVIEW_REQUIRED / PROHIBITED / ambiguous / missingがあればAPPROVEとEditは不可。SourceReferenceを外すだけで現在RevisionのContentを新Candidateへコピーする経路は作らない。Question ReviewでSource Policyを変更しない。未判断のexact RevisionへのREQUEST_CHANGES / REJECTは既存の意味で利用できる。

REVIEW_REQUIREDはSource Review等によるPolicy解決待ち、PROHIBITEDはTRUSTED Sourceからの独立した再生成 / 再提案、ambiguousはPolicyの一意な解決、missingは現在利用判断の確認を案内する。理由と次の行動はdisabled操作の近くとSourceに表示する。直接Edit route / submitでも保存・Candidate作成を拒否する。

外部でSource問題解消後、Review対象・current Policyを再取得し、古い画面状態を置き換える。`sources-review.sourcePolicyRefresh`はその設計用読取例であり、Source ReviewやPolicy編集の実装ではない。exact Content・取得時Snapshot・Human decisionを変えない。matching Evaluationを再確認する。PROHIBITED中は本文を表示・再取得・再利用せず、Source ID・取得時状態・current Policy・Candidate由来Locator metadataを証跡として表示する。

最新main `e65e97a`（Issue #9のPR #27マージ）をfetchして比較した。Domain / Pipeline / Source Governance / ADR / 検証設定に差分なし。Issue #10 worktreeは`9874feb`を保持し、mergeしていない。Issue #9 / #11 / #12へ書き込まず、未コミット・未追跡80ファイルのbaselineを保持している。

## 最初に確認する資料

以下は現在Repositoryに収録されている資料への入口である。以降の設計段階の記録と、本実装・接続境界の現状は[実装引き継ぎ](../../reviewer-implementation.md)で区別する。

| 順序 | 資料 | 読む目的 |
| --- | --- | --- |
| 1 | [レビュー依頼文](review-prompt.md) | レビュー範囲・優先観点・回答形式。GPTへ貼り付ける。 |
| 2 | [Issue #10](https://github.com/abi-yusuke-wada/refriq/issues/10)と[確定UX契約](../../reviewer-ui.md) | Issue本文・コメントとReviewer / Feedbackの条件。 |
| 3 | 本資料 | 既存契約、今回のUX選択、実装範囲、制約の区別。 |
| 4 | [実装引き継ぎ](../../reviewer-implementation.md)と[操作Mock](../../mockups/reviewer/index.html) | 画面・操作・Application境界と再生手順。 |
| 5 | [本実装の検証記録](../production/validation.md)と[画像Manifest](../production/manifest.json) | 収録済みPNG 3枚、Browser結果と検証の限界。 |
| 6 | [Applicationコード](../../../../packages/application/src/reviewer/)、[Webコード](../../../../apps/web/src/reviewer.ts)、[Domain](../../../domain/)、[ADR](../../../adr/) | 現在の実装と既存契約の照合。 |
| 7 | [Mock検証記録](../../mockups/reviewer/validation.md)、[本実装Test](../../../../apps/api/src/reviewer.test.ts)、[Browser Test](../../../../apps/web/test/browser-check.mjs) | UX・状態遷移・Input境界の検証。 |

過去のZIP / PDF / 全Snapshot / 全文TXTはこのbranchには収録されていない。上記の現行コード・文書・PNG・JSONを参照する。HTMLやBrowser Testを実行できない場合は、操作確認を未検証と記載する。

## Task Contractと今回の到達点

Issueは[Reviewer UIと受験Feedback入力を設計する](https://github.com/abi-yusuke-wada/refriq/issues/10)。目的はHuman Reviewと実試験後Feedbackの安全な入力・確認UXを定義すること。

Reviewerの対象はQueue、Question Review、Source / Knowledge確認、Revision差分、Approve、Edit、Reject、Automated Validation結果。Feedbackの対象は出題分野、問題形式、難易度、シナリオ比率、実機操作の重要度、模擬試験とのギャップ、不足分野である。

受入条件は、生成問題・正解・解説・元KnowledgePoint・公式Source URL・生成意図・前Revision差分を一つのReview体験で確認できること、Feedbackが抽象化された選択式データのみを受け付けること。本文・選択肢・Exam Dump・自由記述による再現・自動Approveは対象外。

今回追加したのは、UX文書とHTML / CSS / JavaScript Mock、架空Fixture、Feedback入力制約、Test、検証記録。Production UI / API / DB / Authentication / LLMは作っていない。実際のQuestionやSourceを公開・保存していない。

## Repositoryと並行作業

| 項目 | 状態 |
| --- | --- |
| 調査と実装の基点 | main `9874feb3043d9eff5d7fb69d73a0c220f84fa6e9`。#6 / #7 / #8はマージ済み。 |
| Issue #10 branch | `feature/10-reviewer-ui-feedback` |
| Issue #10 worktree | `/tmp/refriq-issue10` |
| Git管理領域 | 元`.git`が読み取り専用のため、main履歴のみを複製した`/tmp/refriq-issue10-git`。元Repositoryに登録されたworktreeではなく、独立管理領域のworktree。 |
| Issue #9 | 元Repositoryの`feature/9-learner-ui-wireframes`で並行作業中。未コミット成果物をコピー・import・merge・cherry-pickしていない。 |
| Issueコメント | [実装前Plan](https://github.com/abi-yusuke-wada/refriq/issues/10#issuecomment-5970085479)を投稿し、再取得して内容一致を確認。 |
| Git操作 | commit / push / PR作成なし。追加成果物は未追跡。 |

Issue #9の未マージLayout Cは境界と配色を読み取り確認しただけ。Reviewer Mockは独立したファイル・Token・情報配置で、共通Design Systemを新設していない。元側では開始時100ファイルのHashを記録し、実装検証時37ファイルの変化を検出したため、全ファイル不変とは報告していない。本作業から元側へ書き込まず、並行変更の復元も行っていない。

## 証拠と設計上の選択を区別する

| 区分 | このレビューでの扱い |
| --- | --- |
| 既存のAccepted契約 | #6 / #7 / #8、ADR-0004 / 0005 / 0006、Domain文書、実装済みGate / Validator。今回のUI都合で意味を変えない。 |
| 今回のUX上の選択 | 情報の配置、同じ詳細ページの各パネル、確認操作、Feedbackの尺度・不明選択。今回レビューする設計。 |
| Mockの表示例 | 仮のstable ID、前Revision、Human Record、架空Source URL、UI用選択値、保存Timer。実際のDB RecordやProduction API Schemaではない。 |
| 実施済み検証 | 自動Testとブラウザの具体的な確認。通過数だけでUXの妥当性を証明しない。 |
| 未実装・未決 | ID解決、永続化、排他、認可、Backend Validation、違反Input運用等。後続要件として読む。 |

## 再利用したDomainとPipeline

### QuestionとQuestionRevision

Questionは同じ学習意図を表すstable identity。本文・選択肢・Explanationの訂正は同じQuestionに新Revisionを追加する。学習意図そのものが変わる場合は別Question。

QuestionRevisionはIdentity付与時点からContentがimmutable。DRAFTでも既存Contentを更新しない。Review / PublicationのLifecycleは別の状態情報。元Revisionを新候補や後続Revisionで上書きしない。UserAnswerは回答時に表示された正確なRevisionを維持する。

### Pipeline Candidate

PipelineはKnowledge Extraction → Question Planning → Question Generation → Question Evaluationの4 Stageを持つ。出力はApplicationのQuestionRevisionCandidateであり、Domain Revisionではない。KnowledgePoint Candidate IDとQuestion Candidate IDはRun内だけのIdentity。

Reviewerが受け取る既存情報はCertification / ExamTopic、KnowledgePoint候補、QuestionIntent、問題内容、SourceRevision Snapshot、SourceReference / Grounding Segment、Evaluation、reviewEligibility、Pipeline / Stage metadataである。

### Evaluation対象一致（R-01）

`QuestionEvaluationInput.question`と既存Candidate IDを使い、評価時Input / Contextとmaterialization時のID解決を対応づけるReviewer読取契約を追加した。`reviewEvaluation`にはtargetKind、candidateId、questionRevisionId、評価時の`evaluatedContent`、既存Result / reviewEligibilityを保持する。exact targetとID・immutable全11項目が一致した評価だけをreadinessへ利用する。別Candidate / 別Content / 未解決・missingはAPPROVE不可。Candidate Contentへ表示を戻さない。

Pipelineの既存`immutableInputFingerprint`はSource入力のFingerprintであり、Question Contentを識別しないため流用しない。新Hash方式を実装せず評価時Snapshot比較を使う。Fixtureは接続後の架空投影。現在targetを後付けコピーして旧PASSと結ぶProduction実装は不可で、検証済みInputと凍結時対応による実保証を後続Applicationへ渡す。

この条件はReviewer / Application readinessで、Domain Gate / enum / Lifecycleの変更ではない。一致PASSはHuman Approvalを作らない。生成元Candidate Groundingにはその由来を明記し、exact Revisionの検証済み根拠へ読み替えない。

### EvaluationとHuman Review

| 軸 | 既存の値 | 意味 |
| --- | --- | --- |
| AI Evaluation decision | `PASS / REVISE / REJECT` | Semantic品質結果。Human判断ではない。 |
| Criterionの結果 | `PASS / CONCERN / FAIL` | Checksの結果。FAILがあればREJECT、CONCERNのみならREVISE、全PASSならPASS。 |
| Finding severity | `info / warning / error` | 指摘の重要度。Human decisionではない。 |
| reviewEligibility | `ELIGIBLE_FOR_HUMAN_REVIEW / REVISION_REQUIRED / REJECTED_BY_EVALUATION` | Pipeline候補の扱い。DomainのPublication Stateではない。 |
| Human QuestionReview | `APPROVE / REQUEST_CHANGES / REJECT` | 正確なDomain RevisionへのHuman判断。 |
| SourceReview outcome | `APPROVED_FOR_USE / REJECTED / NEEDS_MORE_INFORMATION` | Source利用適格性のHuman判断。QuestionReviewとは別。 |

1つのRevisionへの決定的QuestionReviewは最大1件。Reviewer・対象Revision・日時・Decisionを記録し、過去のReviewを書き換えない。

### Publish

MVPではHuman `APPROVE`とPublishは同じDomain遷移。独立した`APPROVED`状態・別Publishボタン・公開予約を作らない。

公開には同一RevisionへのHuman `APPROVE`、KnowledgePoint、各KnowledgePointからQuestionSourceへの対応、固定SourceRevisionの取得時Provenance、現在の用途別Source PolicyがTRUSTEDであることが必要。Gate関数はPolicy / Provenance / Human Recordを検査し、Lifecycle全体や保存Transactionの実装を担うものではない。

新RevisionのReview中は従来の公開Revisionを維持し、成功時だけ現在の公開参照を切り替える。既存回答の参照先は変更しない。

### Source

取得時SourceRevision Snapshotと現在Policy Decisionは別。取得時TRUSTEDでも現在REVIEW_REQUIRED / PROHIBITEDなら公開不可。公式HostやSourceReviewだけでQuestionを公開しない。

Sourceパネルには取得時URL、取得時刻、Fingerprint、Document / Revision / Decision ID、Kind / Purpose、Owner / Origin / Access、自動取得状態、Terms確認、Allowlist、SourceReview参照、QuestionSourceの関係、Locatorと使用した短いGroundingを表示する。実Sourceの本文・ライセンス判断はこのMockで追加していない。

### ExamFeedback

実試験後のLearnerの抽象的な体験Signal。Certification / ExamTopic等に関連づけ、個別Question / RevisionやSourceへ関連づけない。Normative Technical Grounding、QuestionReview、Revision Requestへ変換しない。提出済み内容はimmutableで、訂正・再提出は新Record。

## 画面とReviewerの操作

Review Queueは17の架空例を持つ。通常公開候補、Domain ID未解決、Evaluation REVISE、Evaluation REJECT、現在Source再確認待ち、現在Source禁止、Human Review完了、長文・Multiple Selectに加え、Candidate Content不一致と複数Sourceの全許可・再確認待ち・禁止・重複・欠落、matching Evaluation欠落、同Locatorの別SourceRevision、同集合の順序違いDiffを含む。

詳細の正本はexact `reviewTargetRevision`。Question / Revision IDと凍結Content、Language / Difficulty、stable KnowledgePoint / QuestionSource関係、Intentを保持する。Candidateは生成経路metadataで、Contentが異なっても表示正本に戻さない。

詳細では問題内容とKnowledge / Intentを並べ、同じページにSource、Evaluation、前Revision差分、Human判断を置く。QueueのAI評価・Human判断・現在Source Policyは別列。対象Revisionと現在公開中Revisionを別表示する。

Human三決定は対象Revisionと結果を確認するDialogを経由する。保存中は重複操作・画面移動・Dialogキャンセルを抑止。確定失敗では未保存と明示してRetryできる。結果不明では再送・離脱を止め、状態再取得 / 保存結果照合だけを許可する。保存済みなら既存結果を表示し、未保存確定後だけRetry可能。Human / Edit / Feedbackへ共通適用。完了済みRevisionへの二度目のHuman判断を無効化する。

EditはStem、既存OptionsのText、正答候補、学習用Explanation、全Option Explanationを編集する。同じIntentに属するKnowledgePoint / Source参照を選ぶUIを持つが、KnowledgePointは1組、Source参照は複数・同Locatorの別Revision例を含む。TopicはKnowledgePointから読む。Question Type / Difficulty / Intent / Source Policyは閲覧専用。

編集後は別Candidate ID、差分、再評価待ちを表示する。旧評価のPASSを引き継がず、新候補をDomain Revisionとして承認しない。元Content、Human Review、Source Snapshot、公開参照は維持する。SourceReferenceは`sourceRevisionId + locator`の組で選択・復元する。既存Application referenceKeyと同じNUL区切り規約をHTML value向けに可逆encodeし、互換helperをUnitで照合する。same-locator例でAだけ / Bだけ / A+Bを保存する。未保存の離脱・破棄を確認する。

## 受験Feedbackの入力データ

Issueの7対象項目を、資格を含む10の入力項目へ展開している。ギャップを論点・判断方法・難易度に分けたため項目数が増える。

| Mock内Field | 表示と入力 | 型と注意 |
| --- | --- | --- |
| certificationId | 対象資格1件 | 固定の架空ID。ProductionはMVP資格を供給する。 |
| examTopicIds | 出題が多かった分野 | 既存Topic相当の複数選択。不明は単独。 |
| questionStyles | 知識 / シナリオ / 設定の読み取り / トラブルシューティング / 実機Lab形式 | 複数選択。不明は単独。 |
| difficulty | 1 易しい ～ 5 難しい | 数値1〜5、または不明。 |
| scenarioRatio | ほとんどなし / 少なめ / 半分程度 / 多め | 印象の選択。不明あり。公式比率を推定しない。 |
| practicalImportance | 1 ほぼ不要 ～ 5 とても重要 | 数値1〜5、または不明。 |
| similarityConcept | refriqとの論点の近さ | 数値1〜5、または`not_used`（refriq未利用）/ `unknown`（利用したが判断できない）。 |
| similarityJudgment | refriqとの判断方法の近さ | 数値1〜5、または`not_used`（refriq未利用）/ `unknown`（利用したが判断できない）。 |
| similarityDifficulty | 実試験の方が易しい / 同程度 / 難しい | `not_used` / `unknown`を別選択・別値で保存。 |
| missingTopicIds | refriqで不足していた分野 | 複数選択。不足なし / 不明はそれぞれ単独。 |

上記Fieldと選択値はMock専用で、Production API / Domain enumではない。`unknown` / `none`をDomainのExamTopic IDとして扱わない。Production Payloadでの表現は後続に残す。

`not_used`はSimilarity全体のN/Aで、3項目すべて未利用とする。1項目の未利用選択は残りへ同期し、利用済みの選択へ戻すと残りを選び直す。Validatorもall-or-noneを確認し、not_usedとRating / unknownの混在を該当Fieldのinline errorへ返す。`unknown`は利用済みの観点別判断不能で、unknown / 4 / similarは許可する。

全項目を選んでから確認へ進む。不明・未利用で回答できる。自由文字列、本文、選択肢、解答、URL、File、Screenshot、contenteditableの入口は置かない。許可Field / 値の照合で余分なField、未知値、Object、空、重複、矛盾する不明選択を拒否する。数値Ratingの文字列数値も純粋なValidationでは拒否し、フォームでは選択肢の定義済み型へ変換する。

入力 → Field別Validation → 確認 → 送信中 → 確定失敗 / Retry、結果不明 / 再取得・照合、または成功 → Reviewerの一覧 / 詳細。確認・提出済み閲覧は読取専用。ID・利用者・日時のProduction付与方式は未決。Feedbackから自動生成・公開を起動しない。

## 受入条件とEvidence

| 受入条件 | 文書・コード | 画面で確認するもの |
| --- | --- | --- |
| 生成問題・正解・解説 | UX文書、view.jsのquestionView | 問題・正答候補・全Option Explanation・学習用解説。 |
| 元KnowledgePoint | Pipeline Contract、fixtures.js、reviewView | Candidate / stable IDの区別、Topic、要約、SourceReference。 |
| 公式Source URL | Source Snapshot Contract、sourceView | 取得時URL欄。Fixtureは架空の公式相当URL。 |
| 生成意図 | QuestionIntent Contract、reviewView | 学習目標・Target Concept・形式・難易度・制約。 |
| 前Revision差分 | Domain Lifecycle、diffView | 固定Domain Revision同士のContent / Intent 11項目比較。QuestionSource / KnowledgePoint IDs / 正答IDsはcanonicalな集合比較、Options順は変更。現在Policy / Termsは除外。 |
| 一つのReview体験 | UX Flow、reviewView、Human操作 | Queueから各パネルと判断へ自然に辿れるか。 |
| 抽象化選択のみのFeedback | feedback.js / feedback.test.js、入力 / 確認View | 全項目、Rating方向、不明、本文入口なし。 |
| Reviewシナリオ再生 | view.js、検証記録 | 確認・保存・失敗・Retry・Edit・Gate拒否。 |

## 実施済み検証とその限界

- 今回再実行した`make fmt`、`make check`成功。5 Test Files / 187 Tests、全6 Workspace Typecheck、Formatting / Lint、x86_64 Nix check。
- Mockは119 Tests。凍結Content、11項目Diff、既存Domain Gate投影、保存状態、Signalの別値、Field別Error、禁止入力を確認。既存Domain / Pipelineは68 Tests。
- Browserは242項目成功、未処理JavaScript Error 0件。Human三判断、確定失敗 / Retry、結果不明 / 照合の両結果、Edit、Source全状態、Signal、Focus / ARIAを確認。
- 1280px / 1440pxの6画面ずつ、12条件でページ横溢れなし。
- 旧94項目と旧12条件は過去Evidence。今回の242項目へ加算しない。
- Snapshotは58枚へ更新。PDFは長い画面を分割する。画像から操作や保存成功を推測しない。

Nixはx86_64-linuxのみで、他ArchitectureのBuildを検証していない。実Backend、Persistence、保存結果再取得API、ネットワーク再送、認可、実LLM、Production Gate接続は未検証。Keyboard全操作・Contrastの包括的Audit、Humanによる再レビュー採用承認は未実施。

## 現在のMockの限界と重点確認

以下はレビューの結論ではなく、コードと資料から確認できる制約である。受入条件への影響は独立したReviewerが判断する。

| 制約 | GPTに確認してほしい点 |
| --- | --- |
| Source / PublishのUI可否はDomain Gate結果に照合したRead Modelの模擬表示。 | Backend GateとLifecycleの確定時検査は後続Use Caseへ要求する。 |
| 仮のstable ID・前Revision・QuestionSource・固定ContentはFixtureの読取投影。 | 実materialization / 読取Schemaを今回追加したとは扱わない。 |
| Revision DiffはContent / Intentの11項目。所有Revision IDは表示し、QuestionSourceの変更判定だけから除外。 | 他のimmutable情報が今後Domainに追加される場合はこの投影も更新する。 |
| Automated Validationは検証済みStage出力の表示例。個別の決定論的Validation Recordは表示しない。 | AI評価とは区別した既存のMock制約として後続へ残す。 |
| EditのType / Difficulty / Intentは閲覧専用、Option IDと個数は固定。参照候補は同一IntentのFixtureに限定。 | Production編集UIや新規Source登録へ拡張しない。 |
| SourceReviewは参照欄だけ。現FixtureはSourceReview未経由。 | Source利用判断とQuestionReviewを混在させない。 |
| 取得失敗は画面全体の設計状態。パネルだけの取得失敗は独立再生しない。 | 既存の制約として後続へ渡す。 |
| Field別のinline ErrorとFocusを追加したが、実Screen Readerの音声・包括的Keyboard Auditは未実施。 | ARIA / FocusのDOM検証と実支援技術の確認を分ける。 |
| 結果不明は再取得後に保存済み / 未保存確定へ進む2例。再取得しても不明の例は未再生。 | 未保存確定まで再送禁止を維持する契約を文書に残す。 |
| メモリ保存でReload初期化、並行Review・Production idempotency / transactionは未実装。 | UI状態をDomain Lifecycleや実Persistenceと取り違えない。 |
| SnapshotはPC1440px中心。保存中の画像31・34のみ650ms Timerを一時停止。 | 画像は表示Evidenceで、実通信・時間挙動の証明ではない。 |

## 後続実装へ残す事項

Frontendへ画面・操作・状態、ApplicationへCandidate materialization、stable ID解決、QuestionSource作成、編集後再評価、前Revision読取、Human decision確定時Gate再検査を渡す。

Persistence / SecurityへImmutable Record保存、Reviewと公開参照の整合性、並行ReviewとPolicy変更、重複送信・結果不明時の再取得、Reviewer権限、Backend Feedback allowlist、違反Input運用・Retentionを残す。具体的方式は今回決めていない。

Issue #9との接続は、Learnerから「実試験受験後のFeedback」入口を開くことと、Published QuestionRevisionを渡す境界のみ。Learner UI、共通Design System、Domain Aggregate、DB Schema、API詳細、Source / Pipeline再設計は今回のレビュー修正へ混ぜない。

## レビュー結果で分けたい判断

既存契約への違反、Reviewerが誤判断するUX、必要状態の欠落、文書とMockの差は、今回修正すべき可能性がある。表現上の軽微な改善、Fixture拡張、Productionの未実装は影響とScopeを確認して分ける。

Humanは前回I-01〜I-06と今回R-01〜R-04を全件承認した。`not_used != unknown`はその判断に従う。別の新しいProduct判断が必要なら、何が既存契約で決まっておらず、どの選択肢が何に影響するかを明示する。自動Test通過をHuman採用承認に置き換えず、レビュー結果だけを返す。

## 再RVで追加した検証と停止点

R-01: 一致PASS / Candidate不一致PASS / exact評価欠落。R-02: 同Locatorの別SourceRevision A / B / A+Bの完全Payload。R-03: 全not_used / 観点別unknown / Rating、混在拒否、UI同期、inline validation。R-04: QuestionSource同集合の順序違い / 実変更、KnowledgePoint集合、Multiple Select正答集合、Options順序変更。既存I-01〜I-06のDomain / Source / Save / Feedback / ARIA / Focus確認も維持する。

Snapshot04を一致評価として更新し、54〜58に不一致 / 欠落評価、複合参照、Feedback項目間Error、canonical Diffを追加した。Unitは純粋な入力・比較・状態の契約、Browserは実操作・disabled・Payload・Focusの証拠、Snapshotは表示Evidenceとして役割を分ける。新規指摘は今回の確認ではなし。Human最終再RVを待ち、commit / push / PR / Production / Domain変更へ進まない。
