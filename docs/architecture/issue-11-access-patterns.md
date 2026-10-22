# Issue #11 MVPのAccess Pattern

- 状態: F-01〜F-03 RESOLVED、H01〜H09 Human承認済み、Access Pattern Contract確定。#12 AP単位再照合待ち（REVALIDATION_REQUIRED）。
- 調査日: 2026-10-04（JST）
- 対象: [Issue #11](https://github.com/abi-yusuke-wada/refriq/issues/11)
- 基点: main `9874feb3043d9eff5d7fb69d73a0c220f84fa6e9`
- 今回再確認した最新main: `e65e97a65b0db54a9b985cafd3fa04257116d00f`（#9 PR #27マージ。契約の照合結果は第3節）
- 専用worktree: `/tmp/refriq-issue11`、branch: `feature/11-access-patterns`

## 1. 目的

Learner、Reviewer、Pipelineが必要とする読取・更新をApplicationの意味で定義し、#12がPersistenceの保証を検証するための確定Contractを渡す。画面配置、既存Store、DB行をUse Caseの根拠にしない。

```text
#6 / #7 Domain・Accepted ADR、#8 Pipeline、#9 / #10 Contract
    → #11 Access Pattern（H01〜H09 Human承認済み）
    → #12 PersistenceのAP単位再照合
    → 後続Application / API実装
```

正式APはQuery 21 / Command 15、計36件。原文14項目の直接詳細化20件（Q13 / C7）と、上流契約のGapからHumanが正式採用したSupplemental 16件（Q8 / C8）を分けて追跡する。旧Candidate lineage 31件はADOPTED 16 / INTERNALIZED 7 / OPEN_CANDIDATE 2 / DEFERRED 6。H01〜H09にHuman判断待ちはない。

**#11の確定は#12の全AP充足証明ではない。** Formal 36 + Internal Guarantee 7を基準とした#12実装再レビューを次フェーズとし、今回Code / Schema / Store配置は設計・変更しない。GitHub Issue自体の編集 / Closeも行わない。

## 2. 対象範囲とID規約

対象はActor、Query / Command、意味上の入出力、並び順、Filter、Pagination、Consistency、Idempotency、Concurrency、Atomicity、Failure、情報公開境界である。入力IdentifierはApplication / Domain上の参照でありStorage Keyではない。出力は論理DTOであり、API Payload Schemaは確定しない。

既存Repositoryには正式AP命名規約がない。Issue番号による設計文書の実績に合わせて本ファイルを置き、正式IDを`AP-<境界>-<3桁番号>`とする。境界は`CATALOG / SOURCE / PIPELINE / REVIEW / LEARNING / FEEDBACK`。番号は境界内の参照番号であり、画面、Actor、処理順の変更で振り直さない。廃止IDは再利用しない。

旧候補と後続候補の参照は`CAND-<境界>-<3桁番号>`とする。Human指定の空き正式IDを16件へ付与し、Candidate→Formal / 採否を第10節へ残した。既存正式20件のIDと番号は変更せず、間へ割り込ませない。`I11 / C11`は#12内だけの一時追跡IDであり、本書のIDではない。

F-02により、未承認のSourceRevision Diffを正式表からCAND-SOURCE-005へ移した。旧参照ID `AP-SOURCE-002` は現行正式APとして数えず、再利用しない。本文⑥の正式対象はAP-REVIEW-003のQuestionRevision Diffである。

## 3. 入力契約と参照版

判断優先順位は、#11 Task Contract → Accepted ADR → #6 / #7 Domain → #8 → #9最新版 → #10最新版 → #12 Plan 1 → 実装・Test・Fixtureとする。#12はConsumerとして照合し、Requirement Sourceにしない。

| 契約記号 | 参照した正本・版 | 利用する要求 |
| --- | --- | --- |
| I11 | [#11本文](https://github.com/abi-yusuke-wada/refriq/issues/11)、更新2026-08-28 09:32:40 UTC、コメント0件 | 14項目、matrix、並び順・Filter・Pagination、整合性、再送、競合、#12全件対応 |
| ADR | [ADR一覧・手順](../adr/README.md)、mainのADR-0001〜0006はAccepted | 特に[0004](../adr/0004-use-stable-domain-identities-and-immutable-revisions.md)のstable identity / immutable Revision / ApproveとPublish、[0005](../adr/0005-enforce-source-governance-gates.md)の現在Policy、[0006](../adr/0006-define-question-pipeline-stage-contracts.md)のStage / Candidate境界 |
| D6 | [#6](https://github.com/abi-yusuke-wada/refriq/issues/6)、CLOSED、コメント0件。mainの[Domain境界](../domain/README.md)、[用語集](../domain/glossary.md)、[Lifecycle](../domain/lifecycle.md) | Reviewはexact Revisionへ最大1件、UserAnswerは表示したRevisionへの不変事実、Progressは再構築可能 |
| D7 | [#7](https://github.com/abi-yusuke-wada/refriq/issues/7)、CLOSED、コメント0件。[Sourceガバナンス](../domain/source-governance.md) | 取得時Snapshotと現在用途別Decision、禁止Content、Provenance、Publish Gate |
| P8 | [#8](https://github.com/abi-yusuke-wada/refriq/issues/8)、CLOSED、更新2026-10-02 15:15:32 UTC。[詳細コメント1件](https://github.com/abi-yusuke-wada/refriq/issues/8#issuecomment-5811278720)、[Architecture](README.md)、[Stage契約](../../packages/application/src/pipeline/contracts.ts)、[実行・再開](../../packages/application/src/pipeline/question-pipeline.ts) | 4 Stage、Run / Attempt、検証済みArtifact、Failure / Resume、Run内Candidate ID。本文には実際の省略文字列が残るため詳細コメントとマージ済み契約で補完 |
| L9 | [#9](https://github.com/abi-yusuke-wada/refriq/issues/9)、最終確認CLOSED、コメント0件。[PR #27](https://github.com/abi-yusuke-wada/refriq/pull/27)は2026-10-04 01:18:34 UTCにマージ。最新main `e65e97a65b0db54a9b985cafd3fa04257116d00f`の[learner-ui.md](https://github.com/abi-yusuke-wada/refriq/blob/e65e97a65b0db54a9b985cafd3fa04257116d00f/docs/ux/learner-ui.md)を照合 | 調査開始時のPR HEAD `c2ca874a8f400f07eda4d4b12fca7427d1e9d789`と同じHuman承認済みBehavior。10 / 20問、Snapshot、Practice確定、Mock保存 / 提出、exact履歴、集計、回答前境界 |
| R10 | [#10](https://github.com/abi-yusuke-wada/refriq/issues/10)、OPEN、[コメント1件](https://github.com/abi-yusuke-wada/refriq/issues/10#issuecomment-5970085479)。`/tmp/refriq-issue10/docs/ux/reviewer-ui.md`最新版、Human承認I-01〜I-06、再レビューR-01〜R-04、N-01（Source blocker中はEdit禁止）反映版。N-02 / N-03の[指摘記録](https://github.com/abi-yusuke-wada/refriq/issues/10)と`/tmp/refriq-issue10/docs/ux/reviewer-ui-assets/issue-10-review/review-findings.md`も再読 | Candidateとexact Revisionの分離、対象Content一致Evaluation、全Source現在Policy、N-01の元Revision Source blockerによるAPPROVE / Edit禁止・迂回禁止・解消後再取得、集合のDiff、新候補Edit、三Human Decision、結果不明照合、選択式Feedbackの項目間制約 |
| P12 | [#12](https://github.com/abi-yusuke-wada/refriq/issues/12)、OPEN、コメント5件（[事前方針](https://github.com/abi-yusuke-wada/refriq/issues/12#issuecomment-5970601005)ほか）。`/tmp/refriq-issue-12/docs/architecture/issue-12-plan.md` Plan 1、全686行、HEAD `0669dffcc5a7d5ee40f37f0430a291f6ec726268`、[Draft PR #28](https://github.com/abi-yusuke-wada/refriq/pull/28)。Approved / Implementation In Progress。最新コメントの実装レビュー4件反映 / Draft継続と実装文書も読取確認 | I11-01〜14、C11-01〜09、U01〜10との照合だけ。Store配置・物理候補や実装進捗をAPの根拠にしない |
| F19 | [#19](https://github.com/abi-yusuke-wada/refriq/issues/19)、OPEN、コメント0件 | Feedback集計・Planning参照・識別情報最小化の未確定事項を把握する補助入力 |
| MVP | [MVP Scope](../mvp-scope.md)、[README](../../README.md)、[開発Rule](../../AGENTS.md) | 1資格・8分野、10 / 20問、Source利用、選択式Feedback、最小変更・検証 |

GitHub CLIで各Issue本文・コメントを取得した。初回調査では#8 / #9 / #10 / #11 / #12のコメントAPIの全ページも確認し、今回は#11の全コメント（0件）と#6 / #7 / #8 / #9 / #10 / #12の本文・コメントを再確認した。#10は専用worktreeの未コミット文書、#12は上記HEADのPlanを読み取り参照した。#9は現在mainの固定版、#10 / #12は上記読取所在で示す。並行branchの変更を本worktreeへ取り込まない。

main更新の連絡後、GitHubのmain参照・PR #27のマージ・#9 Closedを再確認し、基点から最新mainまでの全99ファイルの変更一覧を照合した。98件は`docs/ux/`、残り1件はREADMEのLearner文書リンク追加。Domain / ADR / Architecture / Application / Pipeline契約には変更がなく、mainのLearner文書Hashは下表の読取版と一致する。今回の再確認でもmainとLearner文書Hashは同じであり、このmain更新を理由としたAP内容変更はない。作業branchの基点は維持し、mainの変更は契約入力として読み取り確認した。

| 読取文書 | SHA-256 |
| --- | --- |
| #9 learner-ui.md | `05426e1a2cc7a7f25cf10b400490eead7db60df752ec85bcb38433e826ecae71` |
| #10 reviewer-ui.md（N-01反映・今回再確認版） | `7fa3bd8cdab753b09150de2577b0a72170ea6f5a370ac39fbc727178fcb286bf` |
| #12 issue-12-plan.md（今回再確認版） | `21e0401153d7c11e27ce056bb4b40446771b2c9702746bec3451d1ed9e7ebd9b` |

初回調査時の#10文書Hashは`f77c45a1330942e4bbe9a89d0e62a1d2ff222e8b5fcf3024cc941e6c85da448e`、#12 Planは`706225fa028e5a3cf5246fb5ed02ab47a975e60d6979e851fb29d93034391717`。その後の並行変更を再読し、今回の参照版は上表で固定した。#12の一時追跡ID・未確定事項はConsumer側に残るが、#11の正式Contractは今回確定する。これらの入力ファイルは本作業から編集していない。

今回のHuman指示でH01〜H09の採用内容とFormal IDを明示承認されたため、Contractを確定する。承認は本セッションのHuman指示に由来し、GitHubコメントを作成した扱いにはしない。F-01〜F-03 RESOLVEDとN-01を維持し、今回のH01〜H09をRequirementとして反映する。

最新版を再読した結果、main / L9とR10のHashは上表と同じ。#10 N-02はFixtureのcurrent Policy Decision IDを歴史Snapshotと分離し、同一IDの意味的一致を検証する修正である。reviewer-ui.mdはN-01反映版からHash不変、Reviewer Application Contract・Domain / Source Governance / Evaluation / Feedbackに変更なし。取得時Snapshot・QuestionSource / Human Review参照も維持される。N-02を理由に#11の意味を変更しない。

最終検証時にN-03反映版の指摘記録も再読した。変更は取得後Policy変更Fixtureのcurrent evaluatedAt時系列補正と関連Evidenceであり、reviewer-ui.mdのHash・Application Contractは引き続き不変。特定日時やすべてのcurrent Decisionが取得後評価であるという新条件を#11へ追加しない。

#12 PlanのHashは上表の再読版を維持し、686行。専用branchは`feature/12-persistence-model`、最新HEADは`0669dffcc5a7d5ee40f37f0430a291f6ec726268`、開始時statusは空。Issue commentsは5件で、[最新報告](https://github.com/abi-yusuke-wada/refriq/issues/12#issuecomment-5977781766)のResume・Reviewer詳細・Contract検証等4指摘反映とDraft継続を確認した。Plan / 実装文書のI11 / C11・U01〜10と正式AP未照合というConsumer側の記録は継続している。これは#11の確定を妨げず、今回のFormal 36 / 内部保証7への再照合が必要という入力である。既存Test / CI成功を今回の全AP証明へ流用しない。#12のPlan・Code・物理候補をRequirement Sourceにせず、本worktreeへ取り込まず編集もしない。

## 4. Actorの定義

| Actor | Use Caseを開始する主体 | 境界 |
| --- | --- | --- |
| Learner | 学習・回答・結果参照・受験後Feedback提出を開始する利用者 | 所有するSession / Answer / Resultだけを対象にする |
| Reviewer | 問題・根拠・評価を確認し、exact RevisionへのHuman判断やEditを開始する利用者 | Human QuestionReviewとSourceReviewを混同しない |
| Pipeline | Stage処理の読取・保存・再開を開始する実行主体 | Run内Candidate / Artifactを扱う。Humanの代わりに判断しない |
| Application / System（表ではSystem） | Catalog解決、状態照合などのApplication処理を開始する主体 | 新しい認証Role・Administratorを追加する意味ではない |
| Human Source Reviewer | 既存SourceReviewの利用判断を行うHumanという責務 | Source履歴Queryの候補Actor。新しい権限モデルやSourceReview Commandは定義しない |

Opaqueな利用者Identityと実行Contextは呼出元から得る前提。Client入力のuserId / roleを無条件に信用する要求ではない。Identity対応、Authentication、Authorization方式は後続Issueの責務とする。

## 5. Matrixの読み方と共通条件

横幅を抑えるため、各節の「入出力表」と「取得・更新条件表」をAP IDで結合した一つのmatrixとする。両表で、AP ID・Actor・用途・Q/C・入力・出力・並び順・Filter・Pagination・Consistency・Idempotency・Concurrency・Failure・根拠契約の全14項目を定義する。Queryは`Q`、Commandは`C`。

### 取得条件の記号

| 記号 | 意味 |
| --- | --- |
| E | Eventualを許容する一覧・概要。結果に算出 / 観測時点を示し、Emptyと取得失敗を分ける。具体時間上限は本Contractで固定しない |
| R | 同じ利用者 / Use Caseの成功後、確定済み状態を読み返せるRead-after-writeが必要 |
| C | 判断・更新時に現在状態を確認する必要がある。取得後の競合も確定時に検知する |
| I | exact IDでimmutable Contentを取得する。新しいCurrent Contentへ読み替えない。作成直後はRも必要 |
| P | cursorによるPagination必須。Filter適用後の件数・安定した全順序を扱う |
| B | Pagination不要。明記した件数上限または単一対象の範囲で返す |
| K | 同一Actor・操作種別・operationId・同一意味の入力の再送は同じ確定結果。別入力での同ID再利用はConflict |
| — | QueryのIdempotencyは副作用なし。再読取で現在状態が変わることはある。Sort不要は単一対象または作成後固定順序を意味する |

`C / R / I`は論理的な保証でありDBの読取オプションを指定しない。CommandのKと現在状態確認は第11〜13節を併読する。全15 CommandのAtomicityは第12節、全Query / CommandのData Boundaryとowner / Actor境界は第4 / 11節を結合したContractである。Queryは副作用を持たず、応答内の対象・分類・状態の一貫性を守る。

### Failureの記号

| 記号 | 意味 |
| --- | --- |
| N | Not Found。指定対象が存在しない、または呼出元が対象として参照できない。子参照欠損は正常Emptyにしない |
| S | Invalid State。既に確定 / 提出済み、Review不可、必要Artifact未成立など、操作の前提状態が不適切 |
| X | Conflict。期待状態と現在状態の不一致、同時更新、重複決定、異なる入力でのoperationId再利用 |
| V | Validation Failure。未知値・不正参照・所属不一致・不正cursor等。安全なField / Reasonだけを返す |
| D | Dependency unavailable。必要な読取・保存・評価依存を完了できない。成功・0件・未保存へ推測しない |
| G | Source / Publish Gate拒否。現在Policy未許可・取得時Provenance不足等。D7の既存Reasonで意味を示す |

全APの入力・復元DTOはApplication Boundaryで検証する。正常な一覧0件はNではない。HTTP status、Endpoint、Error PayloadのSchemaは確定しない。保存結果不明は単なるDによる「未保存確定」と区別する（第13節）。

### 並び順・Filter・Pagination

一覧入力の`cursor / limit`はApplication上のopaqueな参照と希望件数。最大件数・UIのページ表示方法は後続UX / APIへ延期する。順序の最後にstable IDを置き、複合対象では種別・Run IDも含めて同時刻の衝突を解消する。IDに時刻順性は仮定しない。

Filterを適用した結果に対してlimitを数える。途中の取得単位で候補が落ちても、limitに到達するか走査終了まで続ける。実行上限で短いページを返す場合は続きcursorを返し、正常終了・0件と区別する。全件からの件数を返す場合はページ件数を総件数と呼ばない。

変更されるQueue / Catalogは全ページが一時点のSnapshotであることを要求しない。各ページ内の重複は除き、同一一覧走査では不変の並び順値とcursorを使う。途中で集合へ出入りした対象の完全捕捉は再取得で行い、Commandで現状態を再確認する。History等の追記一覧は初回の対象化 / 観測上限と順序位置をcursorへ引き継ぎ、新規追加は次の走査にする。terminal HistoryではstartedAt順序とterminal対象化の観測上限を混同せず、途中で新たにterminalになったSessionは次の走査にする。後続Attempt履歴候補にも初回上限規則を適用する。Filter・利用者境界を変えたcursorはVとする。

## 6. CatalogとSourceの正式AP

| AP ID | Actor | 用途 | Q/C | 入力 | 出力 | 根拠契約 |
| --- | --- | --- | --- | --- | --- | --- |
| AP-CATALOG-001 | Learner / Reviewer / System | MVP資格一覧を取得する | Q | 呼出元Context | 対象資格ID・名称・概要。MVPは1件 | I11①、MVP、L9 Home |
| AP-CATALOG-002 | Learner / Reviewer / Pipeline | 資格詳細とExamTopicを取得する | Q | certificationId | 資格説明、所属Topic ID・名称・説明・表示順 | I11①、D6、L9、R10 |
| AP-SOURCE-001 | Reviewer / Pipeline | exact SourceRevisionのSnapshotと根拠を取得する | Q | sourceRevisionId、usagePurpose、必要なlocator | 取得時URL・日時・Fingerprint・Metadata / Terms / Policy Snapshotと現在用途別Policy参照、許可されるGrounding。禁止本文は返さず許可Metadata・exact参照を区別 | I11②、D7、P8、R10 N-01 / N-02、H01 / H05 Human承認 |

| AP ID | 並び順 | Filter | Pagination | Consistency | Idempotency | Concurrency | Failure |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AP-CATALOG-001 | certificationId asc | MVP対象の1資格 | B: 1件限定。資格追加時に再検討 | E | — | Catalog更新を途中混在させず一つの応答を組み立てる | V / D |
| AP-CATALOG-002 | Topic表示順 asc + examTopicId asc。未指定順はID順 | 指定資格所属Topic | B: MVP Scopeの8分野 | E。更新直後の同一操作はR | — | 所属関係を応答内で一致させる | N / V / D |
| AP-SOURCE-001 | 単一Revision。Segmentは指定locator順 | exact ID・Purpose・locator一致 | B: 単一Snapshot。本文全文の無制限返却は要求しない | I + 用途確認C | — | current Policyを取得時Snapshotで代替しない。取得中の禁止変更を検知。歴史Snapshot・Decision identityを改変せず許可Metadataと禁止本文を分離 | N / V / D / G（要求された本文 / 用途が未許可）。許可Metadataのみの応答は明示 |

AP-SOURCE-001はexact取得時Snapshotと現在用途Policyを分け、current確認を内部保証で満たす。取得元へHTTP再取得してexact Contentを再現した扱いにしない。利用不可時の禁止本文と許可MetadataはH05に従い、SourceRevision / Policy履歴一覧とSourceRevision DiffはDeferred。独立Policy Queryは作らない。

## 7. Learnerの正式AP

| AP ID | Actor | 用途 | Q/C | 入力 | 出力 | 根拠契約 |
| --- | --- | --- | --- | --- | --- | --- |
| AP-LEARNING-001 | Learner / System | Session選択用の公開Question候補を取得する | Q | certificationId、cursor / limit、必要なら一覧走査参照 | 一意Question ID、現在公開Revision参照、開始用件数・鮮度 / 完全性。Learner向けは安全な概要のみ | I11⑧、D6、L9、H02 Human承認 |
| AP-LEARNING-002 | Learner | Session内の回答前問題を取得する | Q | 所有者Context、sessionId、ordinal、questionRevisionId照合値 | exact固定Revisionのstem / type / options、Question ID、ordinal、本人保存状態。回答前Projection。利用不可時は許可Metadata・停止理由のみ | I11⑤ / ⑧、D6 / D7、L9、H05 Human承認 |
| AP-LEARNING-003 | Learner | 確定・提出後のexact問題と解説を取得する | Q | 所有者Context、sessionId、ordinal、必要ならuserAnswerId | 同じRevisionの許可本文、本人の確定回答 / 未回答・正誤・正答・解説・固定Source。利用不可本文は返さず許可されるAnswer / Result事実・exact参照を維持 | I11⑤ / ⑪、D6 / D7、L9、H05 Human承認 |
| AP-LEARNING-004 | Learner | 10問Practice Sessionを開始する | C | 所有者Context、certificationId、operationId | sessionId、Practice、10一意Question stable ID・exact Revision ID・ordinal・開始時Topic分類Identityの固定Snapshot、成功状態 | I11⑨、L9、D6、H02 / H03 Human承認 |
| AP-LEARNING-005 | Learner | Practiceの1問を確定する | C | 所有者Context、sessionId、ordinal、表示Revision照合値、selectedOptionIds、期待状態、operationId | immutable UserAnswer参照・対象Revision・確定時点、進行状態、対応する操作参照 | I11⑩、D6、L9 Practice確定 |
| AP-LEARNING-006 | Learner | Mockの保存済み最新状態を最終提出する | C | 所有者Context、sessionId、期待保存状態参照、提出対象の状態照合値、operationId | 提出済み状態・確定時点、実回答のimmutable参照、未回答を含む20問の確定結果参照 | I11⑩の回答確定詳細化、L9 Mock提出 |
| AP-LEARNING-007 | Learner | 確定したSession Resultを取得する | Q | 所有者Context、sessionId | モード、完了 / 提出時点、正答数・分母・率、各問exact参照・正誤 / 未回答、開始時固定分類によるTopic結果。禁止本文と許可Result事実を分離 | I11⑪、D6 / D7、L9、H03 / H05 / H09 Human承認 |
| AP-LEARNING-008 | Learner | Topic別正答率を取得する | Q | 所有者Context、certificationId、mode、対象sessionIdまたは累積対象 | 開始時固定Topic分類による正答数・対象件数・率 / 未学習、Mode・集計対象・観測位置・計算規則参照 | I11⑫、D6、L9、H03 Human承認 |
| AP-LEARNING-009 | Learner | Active Sessionを取得する | Q | 所有者Context、certificationId、mode | User×資格×ModeのActive Session参照・進行 / 保存状態・利用可否確認待ちの理由、または正常な不存在。採点情報なし | L9、H01 / H05 / H09 Human承認、旧CAND-LEARNING-001 |
| AP-LEARNING-010 | Learner | 固定Snapshotと保存済み状態でResumeする | Q | 所有者Context、sessionId | 固定Question / exact Revision / ordinal / Topic分類、Practice確定参照または保存済みMock Draft集合と対応保存状態、進行 / 停止理由。解禁範囲だけのProjection | L9、H01 / H03 / H05 Human承認、旧CAND-LEARNING-002 |
| AP-LEARNING-011 | Learner | 20問Mock Sessionを開始する | C | 所有者Context、certificationId、operationId | sessionId、Mock、20一意Question stable ID・exact Revision ID・ordinal・開始時Topic分類Identityの固定Snapshot | L9、H01 / H02 / H03 Human承認、旧CAND-LEARNING-003 |
| AP-LEARNING-012 | Learner | Mock Draftの変更・削除を保存する | C | 所有者Context、sessionId、選択状態または変更集合、期待保存状態、clientStateRef、operationId | 受理された状態参照・clientStateRef・操作参照・保存時点。採点情報なし | L9、H01 / H05 Human承認、旧CAND-LEARNING-004 |
| AP-LEARNING-013 | Learner | 既存Active Sessionを明示終了する | C | 所有者Context、sessionId、期待状態、operationId | 終了したSession参照・時点、保持されたPractice確定回答参照。未提出Mockは採点しない | L9、H01 / H05 / H09 Human承認、旧CAND-LEARNING-005 |
| AP-LEARNING-014 | Learner | 過去Session履歴を取得する | Q | 所有者Context、certificationId、mode、既存terminal状態条件、cursor / limit | terminal Session参照・startedAt / 完了 / 終了時点・既存状態、存在するResult参照またはResultなし、Practice確定回答 / exact Revision参照・開始時固定分類。利用許可に従うMetadata | L9、H01 / H03 / H05 / H09 Human承認、旧CAND-LEARNING-006 |
| AP-LEARNING-015 | Learner | モード別の累積LearningProgress概要を取得する | Q | 所有者Context、certificationId、mode | Mode別の累積正答数・対象件数・率 / 未学習、開始時固定分類のTopic概要またはAP-LEARNING-008参照、計算版・観測位置 | L9、H01 / H03 Human承認、旧CAND-LEARNING-007 |

| AP ID | 並び順 | Filter | Pagination | Consistency | Idempotency | Concurrency | Failure |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AP-LEARNING-001 | questionId asc | 指定資格・公開参照あり。一意Question単位で重複除去 | P: 件数に上限なし。30問は最低量であり上限ではない | 一覧E、各Questionのcurrent published reference / 適格性確認C。不足判定は完全な現在集合の一意数確認 | — | 選択対象の公開参照を現在確認しexact解決。全Question同一瞬間のCurrentは要求しない。Eventual / 途中ページ / freshness不明は不足確定に使わない | N / V / D（完全性 / freshness未確認もunresolved）。未確定件数を不足へ変換しない |
| AP-LEARNING-002 | ordinalを維持、OptionsはRevision内順 | 所有Session・Snapshot所属・exact Revision | B: 単一問題。Session内一覧も最大20件 | I + Session状態R / C、現在用途別Policy C | — | Snapshotと本人状態を対応づける。利用不可なら進行停止・状態保持、許可再確認後も同Snapshot。再抽選 / Current差替えなし | N / V / D / G（本文 / 進行が未許可）。許可Metadataを区別 |
| AP-LEARNING-003 | OptionsはRevision内順 | Practiceはその問の確定済み、MockはSession提出済み、所有者一致 | B: 単一問題 | I + 解禁状態C / R + 現在用途別Policy C | — | Practiceは当該確定問のみ、Mockは提出後のみ。禁止本文を非公開にし確定事実をCurrentで置換しない | N / S / V / D / G（本文 / 用途未許可）。許可確定事実と非表示部分を区別 |
| AP-LEARNING-004 | 作成時のordinal ascを固定 | 所有者・資格・対象Mode、current公開参照と適格性を確認した10一意Question。開始時Topic分類を解決 | B: 10件。抽選元一覧はAP-LEARNING-001 | 選択QuestionごとC、成功後R / I。全体同時logical timestampは不要 | K。成功後Retryで再抽選しない | User×資格×Modeの同時開始・公開参照 / 適格性の競合を検知。完全な現在集合による不足確認、Snapshot / 分類の部分成功を禁止 | N / S（完全な現在集合で確認した不足 / 不正状態）/ X / V / D / G |
| AP-LEARNING-005 | 単一対象、Session出題順を変更しない | 所有者・Practice・未確定ordinal・Snapshotの有効Options・進行可能な現在Policy | B: 1回答 | C + 成功後R / I。利用不可停止中は新規回答確定しない | K。同じ問の別操作による二重確定は拒否 | 同じ問の同時確定、Session終了、既確定回答変更を拒否 | N / S / X / V / D / G |
| AP-LEARNING-006 | Snapshot ordinal asc | 所有者・Mock・未提出・最新保存状態一致、進行可能な現在Policy。未回答を含む固定20問 | B: 20問の論理的一括確定 | C + 成功後R / I。利用不可停止中は新規提出しない | K。同じ提出結果。別操作の再提出は拒否 | Draft変更・削除、終了・別提出との競合。未送信Client編集はClientが提出を止める | N / S / X / V / D / G |
| AP-LEARNING-007 | 問題・誤答はordinal asc、TopicはCatalog表示順 + ID | 所有者・10問完了Practiceまたは提出済みMock。同Sessionの固定分類。終了Practiceの部分Result / 未提出Mock scoreを生成しない | B: Practice10 / Mock20問、Topic8分野 | R + I。提出済み結果に未反映の採点を成功Resultとして返さない | — | Current Revision / Current KnowledgePointで過去Resultを再分類しない。禁止本文は返さず許可確定事実を維持 | N / S（未完了）/ V / D |
| AP-LEARNING-008 | Topic表示順 asc + examTopicId asc | 所有者・資格・mode、対象Sessionまたは累積。Session開始時固定分類を利用、未提出Mock除外 | B: MVP8分野 | 指定回R、累積E可。観測位置と未反映を識別。分類はH03の固定Identity | — | Result / History / 累積に同じ固定分類。後日Catalog / KnowledgePoint変更で過去寄与を再分類せず、Topic内重複・二重計上・古い再構築の上書きを拒否 | N / S / V / D |
| AP-LEARNING-009 | 単一組合せ | 所有者・資格・mode、非terminalのActive。利用不可による進行停止中も同Sessionを返す | B: 最大1件。PracticeとMockは別Queryまたは最大2件の合成 | R / C | — | 同時開始・終了・提出後の現在Sessionを判別。Policy停止をterminalや不存在と誤認しない | V / D。不在は正常結果 |
| AP-LEARNING-010 | ordinal asc、OptionsはRevision内順 | 所有者・同じSession Snapshot | B: 最大20問 | Snapshot / 分類I + 保存集合 / 対応状態R、Resume可否・current Policy C | — | 同じ論理読取でSnapshot・確定参照 / Draft集合・対応保存状態を返す。再抽選なし。利用不可時は進行停止・状態保持、許可再確認後に同Snapshotを再開 | N / S / V / D / G（進行 / 本文が未許可）。許可Metadataと停止理由を区別 |
| AP-LEARNING-011 | 固定ordinal asc | 所有者・資格・対象Mode、current公開参照と適格性を確認した20一意Question。開始時Topic分類を解決 | B: 20件 | 選択QuestionごとC、成功後R / I。全体同時logical timestampは不要 | K。同じ再送は同じSnapshot | User×資格×Modeの同時開始・公開参照 / 適格性の競合を検知。完全な現在集合による不足確認、Snapshot / 分類の部分成功を禁止 | N / S（完全な現在集合で確認した不足 / 不正状態）/ X / V / D / G |
| AP-LEARNING-012 | 論理状態はordinal asc、選択集合は正規化 | 所有者・Mock・未提出・Snapshot内有効Options・進行可能な現在Policy。空選択は削除 | B: Session最大20問。物理保存単位は未指定 | C + 成功後R | K。同じ保存結果。別変更は新操作 | 古いwriteを拒否、応答Aを編集Bのackにしない。提出・終了と競合検知 | N / S / X / V / D / G |
| AP-LEARNING-013 | 単一対象 | 所有者・明示確認した非terminal Active。Policy停止中も終了可能。新開始とは別操作 | B: 1件 | C + 成功後R | K。別操作による既終了はS | 保存・回答確定・提出・同時終了を検知。Snapshot / 確定Practiceを保持、未提出Mockを採点しない | N / S / X / V / D |
| AP-LEARNING-014 | startedAt desc + sessionId desc | 所有者・資格・mode・既存状態モデルのterminal。完了 / 明示終了Practice、提出 / terminal Mock。ActiveはAP-LEARNING-009 | P: 履歴件数に上限なし。初回terminal対象の観測上限と順序位置を固定 | E、完了 / 終了直後の同操作はR、exact参照I | — | 初回terminal対象の観測上限を維持し、途中でterminalになったSessionは次回走査。終了Practiceの確定Answer・開始時分類を残す。未提出MockはResultなし、禁止本文を返さずCurrentへ置換しない | V / D |
| AP-LEARNING-015 | 単一概要、TopicはCatalog順 | User×資格×Mode、Practice確定と提出済みMockだけ | B: 1概要・8 Topic | E、計算版・観測位置付き。読取失敗を未学習 / 0件にしない | — | Practice確定・提出済みMockの確定事実と開始時分類から再構築。二重計上・Current自動再分類・古い位置による上書きを拒否 | N / V / D |

### Session開始・Snapshot・Resume

Practiceは10、Mockは20の異なるQuestion stable identityを選択し、選択Questionごとに公開中のexact Revisionを解決する。抽選・不足判定にRevision件数を使わない。出題比率・抽選アルゴリズム・重み付けは追加しない。

```text
公開Question候補を取得
  → 一意Questionの必要件数と現在公開参照を検証
  → exact Revision集合と出題順を解決
  → Sessionと固定Snapshotの作成を確定
  → 回答前Projectionだけを返す
```

Sessionと全Snapshot・開始時Topic分類が利用可能になって初めて開始成功を返す。部分Snapshot、欠損Revision、取得失敗を開始成功にしない。H02の承認どおりQuestionごとのcurrent公開参照 / 適格性確認とexact解決を行い、全Questionの一瞬の同時Snapshotは要求しない。不足は完全な現在Question集合でのみ確定する。

開始後の公開更新ではSnapshotを変更しない。通常Resumeは同じsessionId、Question / Revision / ordinal / 固定分類、確定回答・保存済みDraftを復元するAP-LEARNING-010であり、再抽選・Pipeline呼出しをしない。Active検索はAP-LEARNING-009、Mock開始はAP-LEARNING-011、明示終了はAP-LEARNING-013。中断の画面移動だけを新しいPersistence Commandにはしない。

AP-LEARNING-006は既存「UserAnswer保存」の確定処理の分割のまま。Mock開始・Draft保存は原文Scopeとは別のHuman承認Supplemental AP-LEARNING-011 / 012として正式化し、元14項目に書かれていた扱いにしない。

### 回答と結果の確定

Practiceは固定RevisionでOption集合を検証・採点し、immutable回答と進行状態を一貫して確定する。回答確定成功と解説Queryの成功は別であり、読取失敗では回答を再保存しない。10問完了時のResultは10問を分母にする。中断・明示終了したPracticeの部分Result UIは後続へ延期し、確定済み回答が累積進捗に残ることだけを要求する。

Mock DraftはUserAnswerではない。変更・選択削除を保存し、応答はその要求が保存した状態を識別する。Save A成功後にClientがBへ編集済みなら、Bを保存済みにしない。最終提出は要求された保存済み状態と現在状態を照合し、その集合から採点する。サーバーが未送信のBを知ることは保証できないため、Client側の未保存判定とApplication側の保存状態照合を両方要求する。

採点はSingle Choice / Multiple Selectとも正答集合との完全一致、部分点なし。提出済みMockは未回答も0点・分母20。UserAnswerは実際の回答事実であり、未回答を偽のUserAnswerとして作らない。ResultとTopic集計は、確定回答に加えて提出済みSession・固定20問Snapshot等の確定事実から未回答を再構築できる必要がある。この要求の根拠はD6の回答の意味とL9の未回答・分母であり、#12の物理案ではない。

### Topic AccuracyとLearningProgress

L9のApplication表示規則を使う。Practiceは1問の確定保存成功後から、Mockは最終提出成功後から反映する。Practice / Mockを分離し、別Sessionの再回答を新たな寄与として累積する。中断・終了したPracticeの確定回答を落とさない。

1出題は全体に1回、関連する各Topicに1回だけ寄与する。同じTopicへ複数KnowledgePointが結びついても重複させない。複数Topic件数の合計が全体件数を超えることはある。Mock未回答も各対象Topicに0点の1件として数え、未学習（分母0）を正答率0%へ変換しない。

Topic関係は開始成功時にexact Revisionが参照するKnowledgePointから解決し、分類Identityを固定する。KnowledgePointはmutableだが、同SessionのResult / History / 累積寄与を後日Currentで再分類しない。全体LearningProgressはAP-LEARNING-015として正式化し、Topic Accuracyを足して全体件数にしない。

## 8. Reviewerの正式AP

| AP ID | Actor | 用途 | Q/C | 入力 | 出力 | 根拠契約 |
| --- | --- | --- | --- | --- | --- | --- |
| AP-REVIEW-001 | Reviewer | 種別付きReview Queueを取得する | Q | certificationId、対象種別、状態 / Evaluation / Policy表示条件、cursor / limit | Candidate参照またはexact Revision参照、queuedAt、Evaluation・対象一致 / 未確認・Human Review・Lifecycle・全Source分類の別概要 | I11④、P8、R10 Queue |
| AP-REVIEW-002 | Reviewer | exact Domain QuestionRevisionを確認する | Q | questionRevisionId、必要ならquestionId照合値 | 凍結Content・Intent・Language / Difficulty・stable Knowledge関係・QuestionSource、Lifecycle、Human Record、生成元Candidate参照、評価時Content / Contextと対象一致状態、Evaluation・Source情報、previous exact Revision参照 / 初版、前版Human Record、成立済みCandidate→Domain対応 | I11⑤、D6 / D7、R10 N-01 / N-02、H01 / H04 Human承認 |
| AP-REVIEW-003 | Reviewer | 同じQuestionの固定Revision間差分を取得する | Q | fromQuestionRevisionId、toQuestionRevisionId。比較元はprevious exact参照から解決可能。初版だけfromなし | 比較ID、許可Content項目差分、比較規則参照。初版はfromなしと明示。禁止本文部分の非表示 / 比較不能を差分なしと区別。凍結QuestionIntent内SourceReferenceはsourceRevisionId + locatorの組で識別し、locator変更を含む差分を示す | I11⑥、D6 / D7、R10、H01 / H05 Human承認 |
| AP-REVIEW-004 | Reviewer | exact RevisionをAPPROVEして公開する | C | questionId、questionRevisionId、確認対象参照、期待Revision / Question状態、評価対象Content対応参照、確認した用途別Policy参照、operationId、Human Context | 同一RevisionのQuestionReview、PUBLISHED状態、切替済み公開参照、確定時点 | I11⑦、ADR-0004 / 0005、D6 / D7、R10 |
| AP-REVIEW-005 | Reviewer | exact RevisionをREJECTする | C | questionRevisionId、確認対象参照、期待状態、operationId、Human Context | 同一RevisionのQuestionReview REJECT、REJECTED状態、確定時点 | I11⑦、D6、R10 |
| AP-REVIEW-006 | Reviewer | exact Revisionを元に編集した新Candidateを作る | C | baseQuestionRevisionId、同一Intentの編集Content・参照、operationId、Human Context | 元Revision参照、新Candidateの識別参照、再Validation / Evaluation待ちの状態、作成時点 | I11⑦、D6、R10 Edit / N-01 |
| AP-REVIEW-007 | Reviewer / System | validated CandidateをDomainへmaterializeする | C | pipelineRunId、candidateId、exact validated Artifact参照、明示したstable Questionまたは別Intentの新規要求、検証可能なstable KnowledgePoint対応、operationId | stable Question / KnowledgePoint、新exact QuestionRevision順序・immutable QuestionSource / Provenance、元Run内Candidateとの一意materialization対応・確定時点。未公開 / Human判断なし | P8、D6 / D7、R10、H01 / H04 Human承認、旧CAND-REVIEW-002 |
| AP-REVIEW-008 | Reviewer | exact RevisionへREQUEST_CHANGESを記録する | C | questionRevisionId、確認対象参照、期待状態、Human Context、operationId | 同一RevisionのQuestionReview REQUEST_CHANGES、CHANGES_REQUESTED状態、確定時点 | D6 / R10、H01 Human承認。I11⑦の原文にはなくHuman承認Supplemental、旧CAND-REVIEW-003 |
| AP-REVIEW-009 | Reviewer / System | 編集候補の再Validation / Evaluationを要求する | C | 編集後exact Candidate Content / 参照、base Revision参照、許可Grounding・評価対象Context、operationId | 新Validation / Evaluation処理参照、編集後Content / Grounding対応・状態、元Revision / 編集候補と新処理の対応。評価成功 / materializationとは別 | R10、P8境界、H01 / H04 Human承認、旧CAND-REVIEW-004 |

| AP ID | 並び順 | Filter | Pagination | Consistency | Idempotency | Concurrency | Failure |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AP-REVIEW-001 | queuedAt asc + targetKind + targetRef（CandidateはRun IDを含む） | 資格・対象種別、Candidate Eligibility / EvaluationとDomain Lifecycle / Human判断を別条件、全Source分類の概要 | P: 件数に上限なし | E。詳細R、Human確定C | — | Queueに残った決定済み行は詳細で検知。CandidateをRevision扱いしない | V / D |
| AP-REVIEW-002 | Content内順、SourceはsourceRevisionId + KnowledgePoint ID + relation | exact Revision、関連Source / Knowledge。生成元情報は別対象として表示 | B: 単一Revision。大きい関連Artifactは概要＋参照 | I + Lifecycle / Human Record R、現在Policy C | — | Candidate ContentへのFallback禁止。欠損・対象Mismatchは確認不可。全Source現在Decisionを検査。previous exactを系列順で特定し取得失敗を初版にしない。Candidate mappingだけ成立しRevision欠損の状態を成功にしない | N / V / D / G（許可されない本文部分） |
| AP-REVIEW-003 | 定義済みContent項目順 + 項目識別子 | 同じQuestion、指定from / toのみ、現在用途で表示許可されるContent | B: 単一比較。大きい差分の返却上限は後続API | I + 本文表示 / Source用途のcurrent Policy C | — | 指定 / previous exactの比較元を解決し固定Contentを比較。current Policy / LifecycleはContent差分に混ぜず、禁止本文を返さない。前版読取失敗 / 表示不可を初版 / 差分なしにしない | N / V / D / G（禁止本文 / 用途）。許可参照・非表示部分を区別 |
| AP-REVIEW-004 | 単一対象 | exact Revision、REVIEW_REQUIRED、Human Recordなし、R10の対象一致PASS / Eligibility、全Source用途適格 | B: 1決定 | C + 成功後R | K。成功済み再送は当時の結果を返し公開参照を巻き戻さない | 同時Review、Question公開更新、全Source Policy変更、評価対象 / 確認対象Mismatchを確定時に検知 | N / S（評価未確認含む）/ X / V / D / G |
| AP-REVIEW-005 | 単一対象 | exact Revision、REVIEW_REQUIRED、Human Recordなし | B: 1決定 | C + 成功後R | K。別操作による2件目決定は拒否 | 同じRevisionの別Human決定との競合。旧公開Revisionは維持 | N / S / X / V / D |
| AP-REVIEW-006 | 元ContentのOptions順を維持、新候補内順を固定 | exact元Revision、同一学習意図、有効Knowledge / Source参照。base Revisionの全QuestionSourceのcurrent Policy / Gateが利用可能でSource条件充足。REVIEW_REQUIRED / PROHIBITED / ambiguous / missingはEdit不可 | B: 1候補 | I + 元Revisionの全Source current Policy / Gateと編集参照適格性C。Edit開始時・保存確定時に確認、成功後R | K。同じ保存の再送で新候補を増やさない。別操作は別候補 | 元Revisionの全Source Policyの取得後変更・blocker化を保存確定時に検知し保存拒否。元Revision / Review / 公開参照は不変、並行Editを無言で統合しない | N / V / X / D / G（元RevisionのSource Gate拒否） |
| AP-REVIEW-007 | 単一対象、Content / Source関係内順を保持 | exact Run内Candidate・validated Content、明示対象のIntent一致または別Intentの新Question、stable Knowledge / Source関係整合。新規materialization確定はcurrent Policy適格。既成立の同Target対応は許可Projectionで返す | B: 1候補 | C + 成功後R / I | K。同操作は同結果。別operationIdでも同Candidate・同Targetは既存対応、異なるTargetはX | 1 Candidate最大1 materialization。同時適用・Question系列順序・stable対応 / current Policy変更を検知。対応とRevision / QuestionSourceを一貫して成立させる | N / S / X / V / D / G |
| AP-REVIEW-008 | 単一対象 | exact Domain Revision・REVIEW_REQUIRED・Human Recordなし。Source blockerだけでは拒否しない | B: 1決定 | C + 成功後R | K。別操作の2件目決定は拒否 | APPROVE / REJECTとの同時決定を検知。元Content / 公開参照を変更しない | N / S / X / V / D |
| AP-REVIEW-009 | 単一編集候補 | 編集後exact新Candidateと許可Grounding。旧Candidate / PASS / Human Reviewを継承しない、current Source Gate確認 | B: 1要求 | 対象Content / validated依存I、current Gate / 処理開始C、成功後R | K。同じ評価要求の重複開始を防ぐ。意図的再評価は新操作 | 新評価処理と対象Content / Groundingを対応づける。古い評価を新Candidateへ接続せず、開始失敗でbase Revisionを変更しない | N / S / X / V / D / G |

### Target・評価・Human判断の境界

QueueのtargetRefは種類を判別できるApplication参照である。Candidateは`pipelineRunId + candidateId`、必要なら生成Attemptを照合する。Domain Revisionは`questionRevisionId`。Run内IDが同じでも別Runの候補を区別する。Candidateを開く操作は正式AP-PIPELINE-002へ対応する。

`queuedAt`は対象Candidate / Domain Revisionが初めてQueue対象となったApplication時点であり、一覧を観測した時刻ではない。同じ対象の再取得で並び順を変更しない。作成 / 提出時刻とこの時点の対応は#12が保存方法へ落とす。Pipelineの`waitingSince`もRun内Stageの初回待ち時点とし、同じ一覧走査中に観測時刻で並べ替えない。

```text
validated Candidate → AP-REVIEW-007のDomain materialization
  → exact QuestionRevisionの凍結Contentを取得・Humanが確認
  → 同じRevisionへのHuman Decision
  → APPROVEの場合だけPublish Gateを通り公開
```

Human QuestionReviewはCandidate IDへ保存しない。Evaluation PASSはHuman APPROVEでもPUBLISHEDでもない。MVPではHuman APPROVEとPublishを同じ遷移として確定し、独立APPROVED状態や別Publish Commandを作らない。

R10の最新版では、APPROVEのApplication readinessにexact Revisionと評価対象Content / Contextの一致、対応Evaluation PASS / ELIGIBLE_FOR_HUMAN_REVIEWを要求する。別Candidate・別Revision・Content不一致・matching Evaluation欠落は確認不能としてAPPROVEへ進めず、REQUEST_CHANGES / REJECTはexact対象の別Human判断として扱う。これはDomain Publish Gateへ新Invariantを追加する要求ではない。評価時のQuestionEvaluationInputとmaterialization対応から対象を追跡し、今のRevisionを後付けコピーして旧PASSへ接続しない。P8のimmutableInputFingerprintは生成入力の同一性であり、生成Question / RevisionのContent一致証明へ流用しない。

AP-REVIEW-004のAtomicityは、最大1件のHuman Record、対象Revisionの公開状態、Questionの現在公開参照、同じ操作の確定結果が一貫すること。全Sourceについて取得時Provenanceと確定時の現在用途別Policyを検査し、確認後の変更を検知する。Gate拒否・競合なら一部分だけを成功として残さない。旧公開Contentと既存Session / Answerは維持する。

AP-REVIEW-005（REJECT）とAP-REVIEW-008（REQUEST_CHANGES）はHuman Recordと対応Lifecycleを一貫して確定する。Decision・Reviewer・対象ID・確定時点は書き換えない。Editは元Revisionを更新せず新候補を作り、旧Evaluation PASS・旧Human APPROVEを引き継がない。Candidate-only Editは延期。stable ID解決・materializationと編集後新評価の成功保証はH04 / AP-REVIEW-007 / 009で確定し、具体ID形式・実行Adapterは後続で扱う。

### Source blockerとEditの固定条件（N-01 / F-01）

AP-REVIEW-006はbase QuestionRevision自身の全QuestionSourceについて、現在用途別Source Policy / Gateを確認する。少なくともREVIEW_REQUIRED、PROHIBITED、ambiguous current Policy、missing current Policyが一つでもあればAPPROVE・Editは不可。編集後のSourceReference集合だけが有効であることでは、元Revisionのblockerを解消した扱いにしない。これはR10 N-01の固定済みApplication Contractであり、新しいDomain Reason Code・enumは追加しない。Source Gate拒否は既存Gで示す。

例えばR1のSource AがTRUSTED、Source BがPROHIBITEDのとき、Bだけを外す / 差し替えるEditでR1のContentを流用した新Candidateを作らない。直接Commandを呼んでも同じ条件で拒否する。Edit開始後に元Revisionのcurrent Policyがblockerへ変わった場合も保存確定を拒否し、候補作成の部分成功を残さない。

RemediationはSource Review / Source Governanceによる利用可否・Terms / Policyの解決であり、Question ReviewはSource Policyを変更しない。PROHIBITEDな元Contentを使わず、TRUSTED Sourceを入力に独立した再生成 / 再提案を行うことはQuestion Revision Editと別Use Caseである。新生成はHuman承認済みAP-PIPELINE-004として扱うが、実装済みとはしない。

blocker解消後はReview対象とcurrent Policyの新しい読取投影を再取得し、全SourceのGateを再評価する。古いUI / Read Modelや取得時TRUSTEDを現在判断に使い続けない。APPROVEにはmatching Evaluation等の既存条件も引き続き必要である。

Source blockerだけを理由にREQUEST_CHANGES / REJECTを禁止しない。未判断の解決済みexact Domain QuestionRevisionへ既存Human decisionを記録する境界を維持し、未materialize Candidateや既判断Revisionへの記録は許さない。blocker解消によって過去Human decisionを削除したり、同じRevisionへ2件目を追加したりしない。

I11⑦の原文「Approve / Reject / Edit」は変更しない。D6 / R10が必要とする`REQUEST_CHANGES`は本文のGapとしてHuman承認されたSupplemental AP-REVIEW-008へ追跡する。

### Revision Diff

Question Diffはtype / format、stem、options、正答、解説、Option説明、language、difficulty、stable Knowledge関係、QuestionSource関係・取得時Decision、凍結Intentを比較する。所属Revision IDの当然の差をQuestionSourceの内容変更と誤認しない。QuestionSource、KnowledgePoint ID（Intent内も含む）、正答IDは集合として比較し、Options表示順とIntent constraints順は維持して順序変更も差分にする。QuestionSourceはSourceRevision / KnowledgePoint / Purpose / Relation / 取得時Decisionの全値で比較し、比較のために元Content配列を変更しない。現在Policy / 現在Terms / Lifecycleは別情報である。両Revisionの固定IDを出力し、旧版取得失敗を「差分なし」「初版」と扱わない。


RV-03は既存の凍結Intent比較の明確化であり、新しいDomain Field / APを追加しない。実定義の[SourceReference / QuestionIntent](../../packages/application/src/pipeline/contracts.ts)では`sourceRevisionId`と`locator`は必須のstringで、QuestionIntentは`sourceReferences: readonly SourceReference[]`を持つ。[referenceKey / referenceSet](../../packages/application/src/pipeline/validation.ts)の既存規約どおり、凍結Intent内の参照Identityは`sourceRevisionId + locator`の組として比較する。同じSourceRevisionでもlocator変更はIntent内SourceReferenceの変更であり、同じ組の集合を並べ替えただけなら変更なし。既存helperは両stringをそのまま使う。今回独自のtrim / URL変換 / 欠落locatorの補完等を定義せず、不正・欠損InputのValidationを集合比較で隠さない。

[Domain QuestionSource](../../packages/domain/src/source-governance.ts)は`questionRevisionId / sourceRevisionId / knowledgePointId / usagePurpose / relation / sourcePolicyDecisionId`のAssociationであり、locatorはない。QuestionSourceの全関係値比較と、凍結QuestionIntent内SourceReferenceの組比較を別に扱い、QuestionSourceへlocatorを追加しない。取得時immutable SourcePolicyDecision参照の比較を維持し、current PolicyはDiff対象へ混ぜない。#10 R-02の複合IdentityとR-04の集合 / ordered比較の承認記録を再照合した。現在は#10の一時worktreeが存在しないため、前回取得済み承認記録を再読し、現在Repositoryの上記実型・helper、Domainのimmutable Content定義と照合した。実定義との相違はない。

I11⑥の正式追跡はAP-REVIEW-003のQuestionRevision Diffに限る。SourceRevision DiffはDEFERREDのCAND-SOURCE-005として後続へ保持する。MVPのSource変更検知だけから、Reviewer / Pipeline向けの独立Diff Queryが正式要求であるとは推定しない。Normalization・Fingerprint・比較規則の採用、差分Artifact保存は後続判断であり、差分だけからRevisionを復元する要求ではない。

## 9. Pipeline・Feedbackの正式AP

### Pipeline

| AP ID | Actor | 用途 | Q/C | 入力 | 出力 | 根拠契約 |
| --- | --- | --- | --- | --- | --- | --- |
| AP-PIPELINE-001 | Pipeline / System / Reviewer | Pipelineの待ちStage状態を取得する | Q | certificationId、stage、対象status、cursor / limit | Run・Stage・現在Attempt・状態・待ちに入った時点、依存Stage / Artifact、Failure概要、実行可能性を判断する材料。Run状態・current Stage / retryableを内部解決し、validated依存の完全性を確認 | I11③、P8、H01 / H08 Human承認 |
| AP-PIPELINE-002 | Reviewer / Pipeline | Run内Candidate詳細を取得する | Q | pipelineRunId、candidateId、必要なら生成Attempt | Candidate Content、Knowledge候補、Intent、Source Snapshot / 実Grounding、Run / Stage参照・Eligibility、Evaluation参照、current Run / Stage / Failure概要。validated Artifactを内部復元・照合 | P8 / R10、H01 / H08 Human承認、旧CAND-PIPELINE-005 |
| AP-PIPELINE-003 | Reviewer / Pipeline | exact Candidateに対応するEvaluationを取得する | Q | pipelineRunId、candidateId、評価Attemptまたは評価Artifact参照 | 対象Candidate / Content参照、PASS / REVISE / REJECT、Checks / Findings・曖昧さ・前提、metadata | P8 / R10、H01 / H08 Human承認、旧CAND-PIPELINE-006 |
| AP-PIPELINE-004 | Pipeline / System | 新しい生成Runを開始する | C | P8 Pipeline Input、operationId | 新pipelineRunId、固定入力同一性・処理参照 | P8、H01 / H07 / H08 Human承認、旧CAND-PIPELINE-007 |
| AP-PIPELINE-005 | Pipeline / System | FAILED Runを同じ失敗StageからRetry / Resumeする | C | pipelineRunId、期待Run / Stage状態、P8再開Input、operationId | 同じRunの再開参照・FAILED Stage・新Attempt参照、成功済み前段validated Artifact保持・完全性。current Run / Stage / Failureを内部確認 | P8 resumeQuestionPipeline、H01 / H07 / H08 Human承認、旧CAND-PIPELINE-010 |

| AP ID | 並び順 | Filter | Pagination | Consistency | Idempotency | Concurrency | Failure |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AP-PIPELINE-001 | waitingSince asc + pipelineRunId + Stage契約順 | 資格・Stage・PENDING / FAILEDを区別。FAILEDは実行可能を意味しない | P: Run数に上限なし | E。実行 / resume確定時はC | — | Run / current Stage / Attempt / Failureを対応づける。過去Failureをcurrentへ混ぜない。Eventual行から実行成功を判断せず、RUNNING自動回復を要求しない | V / D |
| AP-PIPELINE-002 | Content内順、Knowledge / Sourceはstableな参照順 | Run内Candidate一致、許可Source用途 | B: P8は1 Run / 1 Question候補。履歴Artifact一覧ではない | I + 作成直後R、現在Policy C | — | Run内ID・生成Artifact・current Stage / Attemptを照合。旧Failureや別Runを混ぜず、欠損 / 未検証Artifactを成功にしない | N / V / D / G |
| AP-PIPELINE-003 | P8 Criterion順、Findingは検証済み出力内順 | exact Candidate / 評価対象Content・Attempt一致 | B: 1 Evaluation | I + 作成直後R、本文 / Grounding用途のcurrent Policy C | — | exact validated評価Artifactを復元し対象Content / Attemptを検証。禁止本文をFindings等へ混ぜず、別Candidate / RevisionへPASSを移さない | N / S / V / D / G |
| AP-PIPELINE-004 | 単一Run | P8 Schema / Source Gateに合うInput | B: 1 Run | C + 成功後R | K。意図的再生成は新操作・新Run。本文完全一致は不要 | 同じ操作の二重Run作成を防ぐ。別Run候補を既存Revisionへ自動上書きしない | V / X / D / G |
| AP-PIPELINE-005 | P8 Stage順、失敗位置から後続のみ | FAILED Run・失敗Stage、変更していないimmutable Input、現在Policy適格 | B: 1 Run再開 | C + 成功後R | K。新しい明示Retryは新操作・新Attempt。同じ再送は増やさない | current Run / Stage / Attempt / retryableとvalidated Artifactを照合。同時Resume・成功Run再実行・immutable Input変更を拒否。stale worker結果がcurrent Stage / Candidate / Evaluationを上書きしない。RUNNING crashの自動再実行なし | N / S / X / V / D / G |

P8の正本はKnowledge Extraction → Question Planning → Question Generation → Question Evaluationの4 Stage。Stageの既存PENDING / RUNNING / SUCCEEDED / FAILED、Runの既存SUCCEEDED / FAILEDを利用し、新しいState / Reasonを作らない。待ちStageは前段依存を待つPENDINGと明示Retry対象FAILEDを区別し、Evaluation REVISE / REJECTを技術Failure Queueへ混ぜない。dueAt / priority / leaseを必須にしない。

AP-PIPELINE-002 / 003でCandidate / matching Evaluationを取得し、validated Artifact・current Run / Stageを内部解決する。AP-PIPELINE-004は新生成、AP-PIPELINE-005はFAILED位置から再開する。前段validated Artifactを再利用し、FingerprintがあるRunのimmutable生成Input変更を拒否する。P8の検証前失敗でFingerprintも成功前段もない場合の入力修正は既存P8に従う。LLM本文一致を再送識別にしない。保存成功ではvalidated ArtifactとStage / Attempt・Candidate / Evaluation対応を一貫させ、古いworker結果を拒否する。

自動durable worker / crash回復はH08によりMVP対象外。RUNNING crashを自動FAILED化 / 再実行しない。claim / checkpointはOpen2、独立Attempt browseはDeferred、Raw Artifact browseは追加しない。manual recovery / operational interventionのResidual Riskを残すが、Artifact integrityとstale結果拒否は必須。

### Feedback

| AP ID | Actor | 用途 | Q/C | 入力 | 出力 | 根拠契約 |
| --- | --- | --- | --- | --- | --- | --- |
| AP-FEEDBACK-001 | Learner | 選択式ExamFeedbackを提出する | C | Learner Context、certificationId、feedbackContractVersion、R10の有限allowlistによる資格内Topic・形式・難易度・シナリオ比率・実機重要度・Similarity・不足分野の選択、operationId | immutable ExamFeedback参照、許可選択の受理結果、提出時点 | I11⑬、D6 / D7、R10、MVP、H06 / H07 Human承認 |
| AP-FEEDBACK-002 | Reviewer | 資格・Topic・facet別Feedback summaryを取得する | Q | certificationId、対象期間、許可Topic / facet Filter、必要な計算版参照 | 期間内最新1件 / Learnerによる抽象分布、facetごとのdenominator / count・unknown / not_used / unansweredの別、計算版・観測位置。Learner identityなし | I11⑭、R10、D6 / D7、H06 Human承認 |
| AP-FEEDBACK-003 | Reviewer | Feedback一覧を取得する | Q | certificationId、期間・Topic / facet条件、cursor / limit | feedback record reference、submittedAt、許可資格 / Topic Context、抽象選択の安全な概要。Learner identityなし | R10、H01 / H06 Human承認、旧CAND-FEEDBACK-001 |
| AP-FEEDBACK-004 | Reviewer | exact Feedback詳細を取得する | Q | examFeedbackId | exact Feedback参照・提出時点・許可Context・抽象選択・Contract版。Learner identity / Question本文等なし | R10、H01 / H06 Human承認、旧CAND-FEEDBACK-002 |

| AP ID | 並び順 | Filter | Pagination | Consistency | Idempotency | Concurrency | Failure |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AP-FEEDBACK-001 | 単一提出、選択集合を意味で正規化 | 承認版のfinite allowlist / 項目間制約。unknown / not_used区別、Similarity not_usedはall-or-none、本文 / 自由記述 / URL / 添付 / 未知Field禁止 | B: 1提出、Topic8分野と有限選択肢 | C（入力・参照検証）+ 成功後R | K。明示再提出は新operationId・新Record | 同じ操作の原本・選択・結果を一貫して確定。別操作の再提出は新Record、過去Recordを上書きしない。summaryは期間内最新1件へ | N / V / X / D |
| AP-FEEDBACK-002 | Topic / facet契約順 + 値識別。最新選定はsubmittedAt desc + examFeedbackId desc | 資格・対象期間内で各Learnerの最新1 Recordを先に選定し、その集合へ許可Topic / facet条件。再提出数を重みにしない | B: MVP8 Topicと承認版finite facet値の集計セルのみ。Feedback原本を無制限に返す用途ではない | E、計算版・観測位置と対象期間を示す | — | 同じ入力位置 / 版で最新Record選定・facet分母 / countを再現。原本は削除せず、古い計算が新観測位置を上書きしない。個人を返さない | N / V / D。未対応版 / 不完全依存を0件へ変換しない |
| AP-FEEDBACK-003 | submittedAt desc + examFeedbackId desc | 資格・対象期間 / Topic / facet、承認版allowlist。原本一覧であり最新寄与だけのsummaryとは別 | P: 提出数に上限なし | E + 提出直後の同一操作R | — | 追記初回上限固定、原本不変。Learner identity / 禁止ContentをProjectionへ混ぜない | N / V / D |
| AP-FEEDBACK-004 | facet契約順 + 値識別 | exact Feedback、承認版 / 許可表示範囲。Learner identityを返さない | B: 1提出・有限選択項目 | I + 作成直後R | — | 新提出で旧Recordを置換せず、Raw Input / 個人 / 禁止Contentを返さない | N / V / D |

Feedbackは実試験受験後の抽象Signalであり、個別Question不備報告 / QuestionReviewではない。H06でversioned finite allowlist・不明値 / all-or-none・再提出新Record・Reviewer privacy・期間内最新1件 / Learner集計を確定した。許可意味の正本はR10。未知Field / 値・自由記述・試験本文 / 選択肢・添付 / Screenshot / URLを受け付けず、違反Raw Inputを保存 / Error / Logへ出さない。

AP-FEEDBACK-003 / 004は原本一覧 / exact詳細、AP-FEEDBACK-002は最新寄与summaryであり別Query。ReviewerへLearner identityを返さず、集計処理内部だけで提出者を区別する。Similarity not_usedは三観点all-or-none、unknownは利用済みの観点別選択。「不明 / 不足なし」をExamTopic IDとして扱わない。wire enum、small-cell閾値 / UIは後続、Planning InputはDeferred。技術的正答Source / QuestionSource / SourceRevisionとして扱わず、自動Publishの許可にしない。

## 10. 旧Candidateの採否・内部保証・後続候補

Human承認により旧31 CandidateをADOPTED 16、INTERNALIZED 7、OPEN_CANDIDATE 2、DEFERRED 6へ確定した。正式表はAP IDを正本とし、旧Candidate IDはlineageとして残す。独立Formal APを作らない内部保証7件もMVPの必須Behaviorである。

### 31件のCandidate lineage

以下の「調査時の必要度」はF-03で評価した18 / 7 / 6の記録であり、最終採否とは別軸である。REQUIRED_BY_ACCEPTED_CONTRACTは上流End-to-Endの必要Behavior、REQUIRED_BEHAVIOR_SHAPE_TBDは当時必要Behaviorの独立AP形状が未決、OPTIONAL_OR_LATERは当時後続可能と評価したことを示す。Human H01 / H08により形とMVP範囲は解決し、当時のTBD表記を現在のHuman未決と読み替えない。claim / checkpointはMVP自動回復を外したfuture候補となる。

| 旧Candidate ID | 最終採否 | 正式AP / 保証先・後続 | 調査時の必要度 |
| --- | --- | --- | --- |
| CAND-LEARNING-001 | ADOPTED | AP-LEARNING-009 | REQUIRED_BY_ACCEPTED_CONTRACT |
| CAND-LEARNING-002 | ADOPTED | AP-LEARNING-010 | REQUIRED_BY_ACCEPTED_CONTRACT |
| CAND-LEARNING-003 | ADOPTED | AP-LEARNING-011 | REQUIRED_BY_ACCEPTED_CONTRACT |
| CAND-LEARNING-004 | ADOPTED | AP-LEARNING-012 | REQUIRED_BY_ACCEPTED_CONTRACT |
| CAND-LEARNING-005 | ADOPTED | AP-LEARNING-013 | REQUIRED_BEHAVIOR_SHAPE_TBD |
| CAND-LEARNING-006 | ADOPTED | AP-LEARNING-014 | REQUIRED_BY_ACCEPTED_CONTRACT |
| CAND-LEARNING-007 | ADOPTED | AP-LEARNING-015 | REQUIRED_BY_ACCEPTED_CONTRACT |
| CAND-REVIEW-001 | INTERNALIZED | AP-REVIEW-002、AP-REVIEW-003 | REQUIRED_BEHAVIOR_SHAPE_TBD |
| CAND-REVIEW-002 | ADOPTED | AP-REVIEW-007 | REQUIRED_BY_ACCEPTED_CONTRACT |
| CAND-REVIEW-003 | ADOPTED | AP-REVIEW-008 | REQUIRED_BY_ACCEPTED_CONTRACT |
| CAND-REVIEW-004 | ADOPTED | AP-REVIEW-009 | REQUIRED_BY_ACCEPTED_CONTRACT |
| CAND-PIPELINE-001 | INTERNALIZED | AP-PIPELINE-001、AP-PIPELINE-002、AP-PIPELINE-005 | REQUIRED_BY_ACCEPTED_CONTRACT |
| CAND-PIPELINE-002 | INTERNALIZED | AP-PIPELINE-001、AP-PIPELINE-002、AP-PIPELINE-005 | REQUIRED_BY_ACCEPTED_CONTRACT |
| CAND-PIPELINE-003 | DEFERRED | 後続Issue。現MVP正式要求から除外 | OPTIONAL_OR_LATER |
| CAND-PIPELINE-004 | INTERNALIZED | AP-PIPELINE-002、AP-PIPELINE-003、AP-PIPELINE-005、AP-REVIEW-007、AP-REVIEW-009 | REQUIRED_BY_ACCEPTED_CONTRACT |
| CAND-PIPELINE-005 | ADOPTED | AP-PIPELINE-002 | REQUIRED_BY_ACCEPTED_CONTRACT |
| CAND-PIPELINE-006 | ADOPTED | AP-PIPELINE-003 | REQUIRED_BY_ACCEPTED_CONTRACT |
| CAND-PIPELINE-007 | ADOPTED | AP-PIPELINE-004 | REQUIRED_BY_ACCEPTED_CONTRACT |
| CAND-PIPELINE-008 | OPEN_CANDIDATE | future durable execution。MVP自動crash回復対象外 | REQUIRED_BEHAVIOR_SHAPE_TBD |
| CAND-PIPELINE-009 | OPEN_CANDIDATE | future durable execution。MVP自動crash回復対象外 | REQUIRED_BEHAVIOR_SHAPE_TBD |
| CAND-PIPELINE-010 | ADOPTED | AP-PIPELINE-005 | REQUIRED_BY_ACCEPTED_CONTRACT |
| CAND-PIPELINE-011 | INTERNALIZED | AP-REVIEW-002、AP-REVIEW-007 | REQUIRED_BEHAVIOR_SHAPE_TBD |
| CAND-SOURCE-001 | INTERNALIZED | AP-SOURCE-001、AP-REVIEW-002、AP-REVIEW-004、AP-REVIEW-006、AP-REVIEW-007、AP-REVIEW-009、AP-PIPELINE-004、AP-PIPELINE-005 | REQUIRED_BEHAVIOR_SHAPE_TBD |
| CAND-SOURCE-002 | DEFERRED | 後続Issue。現MVP正式要求から除外 | OPTIONAL_OR_LATER |
| CAND-SOURCE-003 | DEFERRED | 後続Issue。現MVP正式要求から除外 | OPTIONAL_OR_LATER |
| CAND-SOURCE-004 | DEFERRED | 後続Issue。現MVP正式要求から除外 | OPTIONAL_OR_LATER |
| CAND-SOURCE-005 | DEFERRED | 後続Issue。現MVP正式要求から除外 | OPTIONAL_OR_LATER |
| CAND-FEEDBACK-001 | ADOPTED | AP-FEEDBACK-003 | REQUIRED_BY_ACCEPTED_CONTRACT |
| CAND-FEEDBACK-002 | ADOPTED | AP-FEEDBACK-004 | REQUIRED_BY_ACCEPTED_CONTRACT |
| CAND-FEEDBACK-003 | DEFERRED | 後続Issue。現MVP正式要求から除外 | OPTIONAL_OR_LATER |
| CAND-SYSTEM-001 | INTERNALIZED | 全15 Commandの共通K（第12 / 13節） | REQUIRED_BEHAVIOR_SHAPE_TBD |

正式化16件は第7〜9節と第14節のHuman承認Supplemental APで追跡する。独立Endpoint / Repository method数を指定する意味ではない。

### 内部保証7件

| 旧Candidate Behavior | 保証するFormal AP / 共通契約 | 必要な保証 |
| --- | --- | --- |
| CAND-REVIEW-001 | AP-REVIEW-002、AP-REVIEW-003 | previous exact Revision特定、Human Record確認、Diff比較元解決。前版欠損を初版 / 差分なしにしない。全Revision履歴Paginationは採用しない |
| CAND-PIPELINE-001 | AP-PIPELINE-001、AP-PIPELINE-002、AP-PIPELINE-005 | current RunとStage概要・入力同一性・Artifact参照を整合して内部解決。独立Run監視Queryなし |
| CAND-PIPELINE-002 | AP-PIPELINE-001、AP-PIPELINE-002、AP-PIPELINE-005 | current Stage / Attempt / Failure / retryableを内部解決。過去Failureを現在Attemptへ混ぜない |
| CAND-PIPELINE-004 | AP-PIPELINE-002、AP-PIPELINE-003、AP-PIPELINE-005、AP-REVIEW-007、AP-REVIEW-009 | exact Run / Stage / Attemptのvalidated Artifactを復元・対象 / Schema / 完全性照合。欠損 / 部分結果を成功にしない。Raw Artifact browseなし |
| CAND-PIPELINE-011 | AP-REVIEW-002、AP-REVIEW-007 | materialization成功結果とexact Revision詳細からCandidate→Domain対応を確認。対応だけ成立しRevision欠損を成功にしない |
| CAND-SOURCE-001 | AP-SOURCE-001、AP-REVIEW-002、AP-REVIEW-004、AP-REVIEW-006、AP-REVIEW-007、AP-REVIEW-009、AP-PIPELINE-004、AP-PIPELINE-005 | 全参照Sourceの用途別current Policyを内部解決し確定時再検査。取得時Snapshotで代替しない。N-02のDecision identityと歴史Snapshotを維持。独立Policy Queryなし |
| CAND-SYSTEM-001 | 全15 Commandの共通K（第12 / 13節） | 全15 CommandのK・結果不明照合。same Actor / kind / operationId / semantic inputはsame committed result、別入力はX。result not found != definitely not committed。独立Queryなし |

内部保証は用途に必要なQuery / Commandの論理的な入出力・現在確認・復元・成功境界に含む。独立Policy Query / Raw Artifact browse / 結果照合Endpointを追加しない。内部依存失敗を空・成功・未commitへ推測しない。

### Open Candidate 2件: future durable execution

以下の独立claim / checkpointは未採用のまま。自動durable worker recoveryをMVP Scopeから外すH08の承認によりMVP Blockerではない。候補表のK / Concurrencyは将来採用時の案であり、現MVPのlease / heartbeat / 自動回復要求ではない。

| 候補ID | Actor | 用途 | Q/C | 入力 | 出力 | 根拠契約 |
| --- | --- | --- | --- | --- | --- | --- |
| CAND-PIPELINE-008 | Pipeline | 実行可能Stageの実行権を取得する | C | pipelineRunId、stage、期待Stage / Attempt、実行主体参照、operationId | 今回の実行権参照・Attempt参照・現在状態 | P8 Stage重複、耐久実行の不足候補 |
| CAND-PIPELINE-009 | Pipeline | Stageの検証済み結果または安全なFailureをcheckpointする | C | Run / Stage / Attempt、実行権参照、期待状態、validated OutputまたはFailure metadata、operationId | 一貫したStage状態・Attempt履歴・Artifact参照、Candidate / Evaluation参照（該当Stage） | P8 保存 / 再開・Generated Boundary |

| 候補ID | 並び順 | Filter | Pagination | Consistency | Idempotency | Concurrency | Failure |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CAND-PIPELINE-008 | 単一Stage | 前段validated Artifactあり、実行対象の現在状態・Policy適格 | B: 1実行権 | C + 成功後R | K。同じ取得の再送は同じ権利参照 | 重複claim・旧実行主体の再使用を検知。期限 / 回復方式は後続durable採用時に判断 | N / S / X / V / D / G |
| CAND-PIPELINE-009 | 単一Attempt、Artifact内順 | 現在実行権とAttempt一致、Schema / Reference / Domain Validation済み | B: 1 Stage結果 | C + 成功後R / I | K。同じ結果は同じ参照、異なる結果で同IDはX | 古いworker結果が新Attemptを上書きしない。状態と検証済みArtifactを一貫して公開 | N / S / X / V / D |

後続で自動回復を採用する場合に2件を再レビューする。現MVPにも必要なvalidated結果とStage / Attempt対応、stale結果拒否は正式AP / 内部保証から削除しない。

### Deferred 6件: 後続検討の記録

以下は現在のMVP正式APから外し後続へ延期する。Input / Output等は設計候補の記録であり、#12の現MVP必須要求にしない。必要なAttempt証跡、Policy / SourceReview証跡、exact Source / Revision参照は維持する。

| 延期ID | Actor | 用途 | Q/C | 入力 | 出力 | 根拠契約 |
| --- | --- | --- | --- | --- | --- | --- |
| CAND-PIPELINE-003 | Pipeline / Reviewer | Stage Attempt履歴を取得する | Q | pipelineRunId、stage、cursor / limit | Attempt・開始 / 完了・Status・Failure・provider-neutral metadataの履歴 | P8 Attempt / diagnostics |
| CAND-SOURCE-002 | Reviewer / Pipeline | SourceRevision履歴を取得する | Q | sourceDocumentId、cursor / limit | Revision順・exact ID・取得時点・取得時Policy / Content概要 | D6 / D7、Source Diffの比較元発見 |
| CAND-SOURCE-003 | Reviewer / Human Source Reviewer | SourceReview / Policy履歴を取得する | Q | sourceDocumentId、usagePurpose、履歴種別、cursor / limit、必要ならrecordId | 追記Decision / SourceReview、Reviewer参照・時刻・取得時Decisionとの対応 | D7、R10 SourceReview参照 |
| CAND-SOURCE-004 | Reviewer / System | Source変更の影響先Questionを逆引きする | Q | sourceDocumentIdまたはsourceRevisionId、対象Lifecycle、cursor / limit | 根拠関係を持つQuestion / exact Revision・Knowledge参照、現在公開参照 | MVP Source更新、D6 / D7。I11本文に明示なし |
| CAND-SOURCE-005 | Reviewer / Pipeline | 固定SourceRevision間Diffを取得する | Q | fromSourceRevisionId、toSourceRevisionId、usagePurpose | 比較元・先ID、Content変更・差分、比較規則の識別 | MVP Source変更、D6 / D7。I11⑥の詳細化候補、Human正式採用前 |
| CAND-FEEDBACK-003 | Pipeline / System | Planning用Feedback summaryを取得する | Q | certificationId、期間・Topic / facet条件、集計契約参照 | AP-FEEDBACK-002相当の匿名summary、利用した条件・計算版・観測位置 | F19 Planning参照。P8 Inputには未導入 |

| 延期ID | 並び順 | Filter | Pagination | Consistency | Idempotency | Concurrency | Failure |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CAND-PIPELINE-003 | attempt asc + Attempt内記録順 | Run・Stage、必要ならStatus / Failure code | P: Retry回数に上限なし。初回上限位置固定 | E、完了したAttempt直後R | — | Attemptの開始・終端を区別。新Attemptを旧履歴へ置換しない | N / V / D |
| CAND-SOURCE-002 | Source内Revision順 desc + sourceRevisionId desc | 同じSourceDocument、必要な取得時Classification | P: Revision数に上限なし | E + 作成直後R、内容I | — | 初回上限外の新Revisionは次回走査。取得時Snapshotを変更しない | N / V / D |
| CAND-SOURCE-003 | 判断時刻 desc + record種別 + recordId desc | Source・Purpose・履歴種別。recordId指定なら単一記録 | P: 追記履歴。単一ID取得はB | E + 記録直後R / I | — | Current pointer変更で過去Recordを更新しない | N / V / D |
| CAND-SOURCE-004 | questionId asc + questionRevisionId asc | 指定Sourceへの関係・Lifecycle。複数Knowledge / Source関係の同じRevisionを重複除去 | P: 参照先数に上限なし | E、再評価 / 公開判断前C | — | 影響一覧を再評価が必要という確定判断にしない | N / V / D |
| CAND-SOURCE-005 | Source内Content位置順 + 項目識別子 | 同一SourceDocument・指定2 Revision | B: 1比較。大きい差分は概要と論理Artifact参照、上限は未決 | I + 用途確認C | — | 両方の固定Contentを比較。現在PolicyをContent Diffへ混ぜない | N / V / D / G |
| CAND-FEEDBACK-003 | Topic / facet契約順 + 値識別 | AP-FEEDBACK-002の承認済み集計条件を基準としPlanning用途は後続判断 | B候補: 有限集計セル、Planning利用範囲は後続 | E、計算版・観測位置固定 | — | Planning Runへ渡したsummaryを後から再解決しない。固定Input接続は後続Planning Issue | N / V / D |

CAND-SOURCE-005のSourceRevision Diffは正式に戻さない。I11⑥の正式対象はAP-REVIEW-003 QuestionRevision Diffのみ。Planning summaryは現P8 Inputに追加せず、技術的正答Source / QuestionSource / SourceRevisionに変換しない。Source登録 / 取得 / Normalization、KnowledgePoint管理、SourceReview Command等の別Use Caseも今回追加しない。

## 11. Consistencyと情報公開境界

### Consistencyの整理

| 対象 | 必要な保証 | 補足・後続境界 |
| --- | --- | --- |
| Catalog / Queue / 待ちStage / 累積概要 | Eventual可。Emptyと依存失敗を区別し観測時点を示す | 具体時間上限、UI refresh間隔は後続で扱う |
| exact Revision / Artifact / 確定Answer / Feedback | 指定IDの不変内容。作成成功後の同一操作はRead-after-write | 禁止本文 / 許可確定事実はH05、照合証拠の無自動TTLはH07 |
| Practice確定・Mock保存 / 提出・Human判断 | 確定時に現在状態確認、成功後の状態と結果参照のRead-after-write | 排他実装・保存粒度は#12、Product条件は承認済みH02〜H09 |
| Result | 確定した回答・提出状態に対応する完結した結果を取得する | 作成遅延中は未準備を識別し、部分結果を成功扱いしない |
| Published選択 | 選択した各Questionの公開Revisionを検証してSnapshotを固定する | 各Question現在確認、完全な現在集合だけで不足確定。全体同時点は不要（H02） |
| Publish / Stage Source Gate・Revision Edit | 取得時Snapshotと確定時の現在用途別Policyを検査する。Editはbase Revisionの全Source blockerを開始時・保存確定時に確認する | 物理的な読取・競合検知方法は#12。N-01のEdit禁止は未決ではない |

### LearnerとReviewerのProjection

| Projection | AP | 返せる情報 | 返してはならない情報 |
| --- | --- | --- | --- |
| Learner回答前 | AP-LEARNING-001 / 002 / 009 / 010 / 012 | 問題文・方式・Options、表示用metadata、固定Question / Revision / 順序、本人の選択・保存状態 | correct answer、correctOptionIds、correctness、score、explanation、Option説明、answer revealing source、生成 / 評価 / Human Review内部情報 |
| Learner回答後 | AP-LEARNING-003 / 007 | Practiceは対象問の確定後、Mockは最終提出後にexact問題・本人回答 / 未回答・正答・正誤・解説・許可される固定Source | 未確定Practiceの他の問題、未提出Mockの採点情報、他人の回答・Reviewer内部情報 |
| Reviewer | AP-REVIEW-002 / 003、AP-PIPELINE-002 / 003 | 確認するexact対象の許可正答・解説・Intent・Knowledge・Provenance・Diff・現在Policy・Human記録、別対象の生成metadata | Candidate ContentをDomain Revisionの確認正本として代用すること、禁止本文（Diff経由を含む）、Learner個別情報の無制限取得 |
| Feedback summary | AP-FEEDBACK-002（PlanningはDeferred） | 条件・件数・抽象分布、計算版・観測位置 | 実試験本文・選択肢、技術的正答根拠、個人の識別情報 |

境界はApplicationの出力で守る。Clientへ全Contentを渡して非表示にする方法は満たさない。Catalog件数・Draft保存ack・Command成功応答・照合結果・Error / Logにも未解禁の正答・解説・Sourceを混ぜない。Practiceの1問確定は他9問の解禁ではなく、Mockの途中保存は1問も解禁しない。

Projectionの違いはStorage Tableを分ける要求ではない。Source / Revision利用不可はH05に従いActive進行停止・保存状態保持、Historical許可確定事実とMetadataだけを返す。Question本文のPROHIBITEDは正答 / 解説 / Sourceも含む禁止部分のProjectionへ適用し、Error / Log・操作照合結果から漏らさない。Feedback原本一覧 / 詳細もLearner identityを返さず、集計の提出者対応を公開しない。

## 12. Idempotency・Concurrency・Atomicity

### 再送の共通保証

同じActor・操作種別・operationId・意味上同一の入力なら、確定済みの同じID・時点・状態参照を返す。選択集合は意味で比較し、異なる入力によるID再利用はX。同じ操作の既成功照合は、旧期待状態による競合判定より先に扱う。成功済みAPPROVEのRetryで、後に公開されたRevisionを古いRevisionへ戻さない。

新しい回答・再提出・再生成・明示Retryは別操作として区別する。Practiceの同じSession出題への2件目回答、同じRevisionへの2件目Human決定、Mockの別操作による再提出は拒否する。再生成は新Run / 新Candidateを作り得るため、LLM出力の一致を再送識別に使わない。operationIdの具体形式・保存方式は#12 / APIで扱う。H07によりMVPの操作結果照合証拠にTTLの自動期限を設けず、期間限定Kへ変更しない。Actor / kind / operationId / semantic input identity / committed result identityを再照合できる状態を保つ。

### 全15 CommandのConcurrencyとAtomicity

| AP ID | 検知する競合 | 論理的に一貫して守る成功条件 |
| --- | --- | --- |
| AP-LEARNING-004 | 同User×資格×Practice開始、公開適格性 / 分類解決 | 10一意Question・exact Snapshot / 分類・Session・操作結果を全体成功。既存Active自動終了なし |
| AP-LEARNING-005 | 同出題確定、Session終了 / 利用不可 | immutable実Answer・exact対象・進行状態・操作結果。解説Query失敗で再確定しない |
| AP-LEARNING-006 | 保存状態変更、提出 / 終了 / 利用不可 | 最新指定Draft・実Answer・20問未回答を含む提出 / Result事実・操作結果を一貫して確定 |
| AP-LEARNING-011 | 同User×資格×Mock開始、公開適格性 / 分類解決 | 20一意Question・exact Snapshot / 分類・Session・操作結果を全体成功 |
| AP-LEARNING-012 | stale write、選択削除、提出 / 終了 / 利用不可 | 保存集合・対応保存状態・ackを一致。古い成功応答が最新編集の保存成功を示さない |
| AP-LEARNING-013 | 並行保存 / 回答 / 提出 / 終了 | 明示terminal化・Active解放・確定Practice保持・操作結果。未提出Mockを採点しない |
| AP-REVIEW-004 | 三Human decision、Question公開更新、Policy変更 / 対象Mismatch | max1 exact Human Record・Lifecycle・公開参照・操作結果を一貫成功。Gate拒否なら部分成功なし |
| AP-REVIEW-005 | 同exact Revisionの別Human decision | REJECT Record・Lifecycle・操作結果を一貫成功。旧公開維持 |
| AP-REVIEW-006 | 重複Edit・base全Source blocker化 | 元Revision / Review / 公開参照不変、新Candidate・元対応・操作結果。Source差替え迂回なし |
| AP-REVIEW-007 | 同Candidate適用、系列順序・stable対応 / current Policy変更 | 最大1 materialization・stable対象・新Revision・QuestionSource / Provenance・元候補対応・操作結果。公開 / Human判断なし |
| AP-REVIEW-008 | 同exact Revisionの別Human decision | REQUEST_CHANGES Record・Lifecycle・操作結果を一貫成功。Source blockerだけでは禁止しない |
| AP-REVIEW-009 | 同新評価要求・対象Content / Grounding変化 | 編集候補と新評価処理の対応・操作結果。開始失敗でbase不変、旧PASSを継承しない |
| AP-PIPELINE-004 | 同操作による二重Run開始・Source Gate | 新Run・固定Input / 処理参照・操作結果。LLM本文完全一致は要求しない |
| AP-PIPELINE-005 | 同時Resume・current Attempt変更・stale worker結果 | FAILED再開受付 / Attempt・前段validated Artifact対応・操作結果。旧結果のcurrent上書きなし、自動crash回復なし |
| AP-FEEDBACK-001 | 同提出の重複・版 / 項目制約不正 | immutable原本・許可選択 / 版・操作結果。再提出新Record、同操作同Record |

全Commandは第13節の保存結果不明を区別し、同じ成功済み操作照合を古い期待状態Conflictより先に行う。Source Gateを必要とする新規確定はcurrent Policyを再検査する。再送の確定結果識別と、現在本文の公開許可は別であり、K応答にも禁止Contentを混ぜない。

Atomicityは利用者 / 後続処理から見た成功条件であり、Transaction、Lock、ConditionExpression、DB跨ぎACID、Saga、Store配置は指定しない。依存先の読取・検証が未完了なら業務成功を返さない。複数Storeを選ぶ#12は、この条件を満たせる方法と失敗時の振る舞いを提示する。

## 13. Failureと結果不明

| 状況 | Application上の意味・次の処理 |
| --- | --- |
| 指定ID不存在・所有対象でない | N。別Revision・別Sessionへ置換しない。Authentication詳細は本書の対象外 |
| 正常な一覧0件・Activeなし・未学習 | 正常結果。Not Found・依存失敗・正答率0%と区別する |
| 必須参照欠損・Artifact不完全 | 不完全依存として失敗。Source / Revisionを最新版から補ったことにしない |
| 未確定状態・未完了Result・未評価Artifact | Sまたは未準備を明示。成功した回答 / 提出は維持し、QueryだけRetryする |
| 期待状態の不一致・二重決定・異なる入力で同ID | X。現在状態を取得し、同じ成功済み操作か新しいHuman判断が必要か区別する |
| Schema・enum・format・Option・所属不整合 | V。Field / 安全なReasonを示す。Raw外部入力・禁止本文を保存 / Logへ出さない |
| Source / Publish Gate拒否 | G。D7の理由と未許可用途を示す。過去TRUSTED / AI PASS / 別RevisionのApprovalで迂回しない |
| 確定未保存のDependency failure | D、未保存が確認できる場合だけ同じ操作をRetry可能とする |
| timeout・応答喪失・結果照合不能 | 結果不明。未保存と断定せず、同じ操作と対象を照合する。不明の間に別操作ID・別Decisionへ切り替えない |
| 成功済みだが解説 / Result Query失敗 | 確定事実を維持し、読取だけRetry。保存Commandを新規操作として再発行しない |

R10の結果不明は、確定失敗と異なる。Human Review・Edit・FeedbackのUIでは状態再取得 / 照合まで再送を止め、確定未保存なら同じ操作をRetryする。L9の同じ回答 / 提出のRetryはKで重複を防ぐ。再送自体を受け付けるApplicationも既成功操作を識別しなければならない。結果照合能力は全15 CommandのKに内部化し、独立Query AP / Endpointは追加しない。H07により照合証拠へMVP自動TTLを設けない。

## 14. 本文14項目の追跡とGap

以下はI11の対象範囲を原文・記載順のまま転記したもの。①〜⑭は本書内の原文行参照であり正式AP IDではない。

| 原文行 | #11本文の対象範囲（原文） | 正式AP | 整理結果 |
| --- | --- | --- | --- |
| ① | Certification / Topic取得 | AP-CATALOG-001 / 002 | 資格一覧と資格内Topic詳細へ分割。1資格・8分野の件数根拠あり |
| ② | Source Revision取得 | AP-SOURCE-001 | exact取得。独立履歴一覧はDeferred、current Policyは内部保証 |
| ③ | Pipeline待ち状態取得 | AP-PIPELINE-001 | PENDING / FAILED、実行可能性・品質結果を区別。claim / checkpointはfuture Open Candidate |
| ④ | Review Queue取得 | AP-REVIEW-001 | Candidate / Domain Revisionを種別で区別。Human判断は後者のみ |
| ⑤ | Question Revision詳細取得 | AP-REVIEW-002、AP-LEARNING-002 / 003 | Reviewer / Learner回答前 / 回答後のProjectionへ分割。Candidate詳細はSupplemental AP-PIPELINE-002 |
| ⑥ | Revision差分取得 | AP-REVIEW-003 | 正式対象はQuestionRevision間Diff。SourceRevision DiffはDEFERREDのCAND-SOURCE-005 |
| ⑦ | Approve / Reject / Edit | AP-REVIEW-004 / 005 / 006 | 各Commandへ分割。REQUEST_CHANGESは原文の外のHuman採用Supplemental AP-REVIEW-008として別追跡 |
| ⑧ | Published Question取得 | AP-LEARNING-001 | 一意Question候補。Session内ContentはAP-LEARNING-002 / 003のProjectionで取得 |
| ⑨ | Practice Session作成 | AP-LEARNING-004 | 10問・Snapshot一括成功。Mock開始はSupplemental AP-LEARNING-011 |
| ⑩ | UserAnswer保存 | AP-LEARNING-005 / 006 | Practice確定とMock最終確定へ分割。Mock DraftはSupplemental AP-LEARNING-012 |
| ⑪ | Result取得 | AP-LEARNING-007、回答後詳細はAP-LEARNING-003 | 各回の結果・誤答 / 未回答参照。History一覧はSupplemental AP-LEARNING-014 |
| ⑫ | Topic別正答率取得 | AP-LEARNING-008 | モード・指定回 / 累積・重複規則。全体Progress QueryはSupplemental AP-LEARNING-015 |
| ⑬ | Feedback保存 | AP-FEEDBACK-001 | 選択式ExamFeedback。別種Feedbackを導入しない |
| ⑭ | Feedback集計取得 | AP-FEEDBACK-002 | Reviewerの抽象summary。個別一覧 / 詳細はSupplemental AP-FEEDBACK-003 / 004、PlanningはDeferred |

**Original 14/14追跡済み。** 原文を改変せず、元14項目から直接詳細化した既存20正式AP（Q13 / C7）の対応を維持した。AP-LEARNING-006のMock最終確定は本文⑩の直接詳細化であり、追加Scopeへ変更しない。

### Human承認Supplemental 16件

以下は上流Accepted ContractのGapからHumanが正式採用した16 AP（Q8 / C8）で、元14項目に最初から書かれていた扱いにしない。旧Candidate lineageとSource Contractを追跡する。

| 旧Candidate | Supplemental Formal AP | 採用根拠 |
| --- | --- | --- |
| CAND-LEARNING-001 | AP-LEARNING-009 | L9、H01 / H05 / H09 Human承認、旧CAND-LEARNING-001 |
| CAND-LEARNING-002 | AP-LEARNING-010 | L9、H01 / H03 / H05 Human承認、旧CAND-LEARNING-002 |
| CAND-LEARNING-003 | AP-LEARNING-011 | L9、H01 / H02 / H03 Human承認、旧CAND-LEARNING-003 |
| CAND-LEARNING-004 | AP-LEARNING-012 | L9、H01 / H05 Human承認、旧CAND-LEARNING-004 |
| CAND-LEARNING-005 | AP-LEARNING-013 | L9、H01 / H05 / H09 Human承認、旧CAND-LEARNING-005 |
| CAND-LEARNING-006 | AP-LEARNING-014 | L9、H01 / H05 / H09 Human承認、旧CAND-LEARNING-006 |
| CAND-LEARNING-007 | AP-LEARNING-015 | L9、H01 / H03 Human承認、旧CAND-LEARNING-007 |
| CAND-REVIEW-002 | AP-REVIEW-007 | P8、D6 / D7、R10、H01 / H04 Human承認、旧CAND-REVIEW-002 |
| CAND-REVIEW-003 | AP-REVIEW-008 | D6 / R10、H01 Human承認。I11⑦の原文にはなくHuman承認Supplemental、旧CAND-REVIEW-003 |
| CAND-REVIEW-004 | AP-REVIEW-009 | R10、P8境界、H01 / H04 Human承認、旧CAND-REVIEW-004 |
| CAND-PIPELINE-005 | AP-PIPELINE-002 | P8 / R10、H01 / H08 Human承認、旧CAND-PIPELINE-005 |
| CAND-PIPELINE-006 | AP-PIPELINE-003 | P8 / R10、H01 / H08 Human承認、旧CAND-PIPELINE-006 |
| CAND-PIPELINE-007 | AP-PIPELINE-004 | P8、H01 / H07 / H08 Human承認、旧CAND-PIPELINE-007 |
| CAND-PIPELINE-010 | AP-PIPELINE-005 | P8 resumeQuestionPipeline、H01 / H07 / H08 Human承認、旧CAND-PIPELINE-010 |
| CAND-FEEDBACK-001 | AP-FEEDBACK-003 | R10、H01 / H06 Human承認、旧CAND-FEEDBACK-001 |
| CAND-FEEDBACK-002 | AP-FEEDBACK-004 | R10、H01 / H06 Human承認、旧CAND-FEEDBACK-002 |

最終Formalは36件（Q21 / C15）。旧Candidate lineageは31件（ADOPTED16 / INTERNALIZED7 / OPEN_CANDIDATE2 / DEFERRED6）。Open2 / Deferred6は現MVPの未完成を意味せず、必要な証跡・exact参照・内部保証を落とさない。

## 15. #12への確定Contract引き継ぎと再照合

**#12 REVALIDATION_REQUIRED。Formal 36 + Internal Guarantee 7の全43追跡単位を再照合する。** 実装済み・既存Test PASS・Mappingの存在は、今回確定した保証の充足証明ではない。#12のPlan / Codeは今回変更しない。

### 分類と検証状態

`SPLIT / MERGE / MATCH`はI11 / C11との用途上の対応整理、`NEEDS_UPDATE`はConsumer側の正式ID対応・承認保証・証拠を更新する必要があることを表す。用途上MATCHを実装充足のMATCHと読み替えない。下表の更新は全件NEEDS_UPDATE、再照合は全件REVALIDATION_REQUIREDとする。Code不適合を全件確認したという意味ではなく、根拠確認前に充足MATCHへ変更しない。

Port名は#12の現行候補名であり、APのRequirement Sourceや独立AP / Endpoint数の根拠ではない。物理Key・Transaction・Store配置を本書で設計しない。

### Formal 36 → I11 / C11 / Port候補

| #11正式AP | #12現行追跡 / Port候補 | 対応整理 | 更新 | 再照合 | #12が証明すべき保証 |
| --- | --- | --- | --- | --- | --- |
| AP-CATALOG-001 | I11-01 / CertificationCatalog | SPLIT | NEEDS_UPDATE | REVALIDATION_REQUIRED | MVP1資格、Actor Context、Empty / D分離 |
| AP-CATALOG-002 | I11-01 / CertificationCatalog | SPLIT | NEEDS_UPDATE | REVALIDATION_REQUIRED | 資格所属8 Topic、表示順＋stable ID、R / E |
| AP-FEEDBACK-001 | I11-13 / ExamFeedbackRepository | NEEDS_UPDATE | NEEDS_UPDATE | REVALIDATION_REQUIRED | versioned finite allowlist、unknown / not_used / all-or-none、immutable / 再提出新Record、禁止Input / K / H07 |
| AP-FEEDBACK-002 | I11-14、C11-09 / ExamFeedbackRepository | NEEDS_UPDATE | NEEDS_UPDATE | REVALIDATION_REQUIRED | H06資格・期間内最新1 Record / Learner、facet分母 / count・版 / 観測位置、個人なし |
| AP-FEEDBACK-003 | C11-09 / ExamFeedbackRepository | SPLIT | NEEDS_UPDATE | REVALIDATION_REQUIRED | 安全な原本一覧・Filter / stable cursor、Learner identityなし、summaryと分離 |
| AP-FEEDBACK-004 | C11-09 / ExamFeedbackRepository | SPLIT | NEEDS_UPDATE | REVALIDATION_REQUIRED | exact immutable選択・許可Context・版、Learner identity / 本文 / URL / 添付なし |
| AP-LEARNING-001 | I11-08、C11-02 / QuestionRepository | NEEDS_UPDATE | NEEDS_UPDATE | REVALIDATION_REQUIRED | Question単位候補、H02完全な現在集合で不足確定、部分 / E / freshness不明を不足にしない |
| AP-LEARNING-002 | I11-05 / 08 / LearningSessionRepository / QuestionRepository | SPLIT | NEEDS_UPDATE | REVALIDATION_REQUIRED | 回答前安全Projection、exact Snapshot、H05利用不可停止 / Metadata、再抽選なし |
| AP-LEARNING-003 | I11-05 / 11、C11-04 / LearningSessionRepository / QuestionRepository | MERGE | NEEDS_UPDATE | REVALIDATION_REQUIRED | Practice当該確定問 / Mock提出後だけ解禁、exact対象、H05禁止本文非公開・許可確定事実保持 |
| AP-LEARNING-004 | I11-09、C11-02 / LearningSessionRepository / QuestionRepository | NEEDS_UPDATE | NEEDS_UPDATE | REVALIDATION_REQUIRED | 10一意Question、Active一意、H02個別current確認、H03開始時分類、全Snapshot一貫成功、K / H07 |
| AP-LEARNING-005 | I11-10 / LearningSessionRepository / UserAnswerRepository | SPLIT | NEEDS_UPDATE | REVALIDATION_REQUIRED | immutable実Answer、進行 / 結果参照、解説Query分離、H05停止、K / H07 |
| AP-LEARNING-006 | I11-10、C11-03 / LearningSessionRepository | MERGE | NEEDS_UPDATE | REVALIDATION_REQUIRED | 最新Draft照合、実Answer18 / 未回答2なら分母20、偽Answerなし、H05停止、K / H07 |
| AP-LEARNING-007 | I11-11 / LearningResultReader | NEEDS_UPDATE | NEEDS_UPDATE | REVALIDATION_REQUIRED | 10 / 20確定Result、開始時分類、H05許可事実、終了Practice部分Result / 未提出Mock scoreなし |
| AP-LEARNING-008 | I11-12、C11-04 / LearningProgressReader | NEEDS_UPDATE | NEEDS_UPDATE | REVALIDATION_REQUIRED | Mode・未回答・再回答・Topic内重複除去、開始時固定分類・観測位置 |
| AP-LEARNING-009 | C11-01 / LearningSessionRepository | SPLIT | NEEDS_UPDATE | REVALIDATION_REQUIRED | User×資格×Mode最大1 Active、Policy停止中も保持、terminal Historyと分離 |
| AP-LEARNING-010 | C11-01 / 03 / LearningSessionRepository | MERGE | NEEDS_UPDATE | REVALIDATION_REQUIRED | 同Snapshot / 固定分類と保存済みDraft集合・対応保存状態の一貫読取、H05許可再確認、回答前境界 |
| AP-LEARNING-011 | C11-02、I11-08 / 09 / LearningSessionRepository / QuestionRepository | NEEDS_UPDATE | NEEDS_UPDATE | REVALIDATION_REQUIRED | 20一意Question、H02完全現在集合不足、H03分類、Active一意、K / H07 |
| AP-LEARNING-012 | C11-03 / LearningSessionRepository | SPLIT | NEEDS_UPDATE | REVALIDATION_REQUIRED | Draft可変 / 削除、stale write / ack区別、提出 / 終了競合、回答前非採点、H05停止、K / H07 |
| AP-LEARNING-013 | C11-01 / LearningSessionRepository | SPLIT | NEEDS_UPDATE | REVALIDATION_REQUIRED | 明示終了、Practice確定保持、未提出Mock非採点、Active解放とK / H07 |
| AP-LEARNING-014 | C11-04 / LearningSessionRepository / LearningResultReader | NEEDS_UPDATE | NEEDS_UPDATE | REVALIDATION_REQUIRED | 既存terminalのみ、startedAt desc + sessionId desc、初回上限cursor、Result参照 / なし区別、exact履歴 |
| AP-LEARNING-015 | C11-04、I11-12 / LearningProgressReader | SPLIT | NEEDS_UPDATE | REVALIDATION_REQUIRED | Mode別全体累積、開始時分類、Topic合計を全体へ加算しない、再構築・観測位置 |
| AP-PIPELINE-001 | I11-03、C11-08 / PipelineRunRepository | SPLIT | NEEDS_UPDATE | REVALIDATION_REQUIRED | 待ちPENDING / FAILED、current Run / Stage / retryable、Filter後Pagination。lease / 自動RUNNING回復不要 |
| AP-PIPELINE-002 | C11-06 / PipelineRunRepository / ArtifactStore / SourceRepository | SPLIT | NEEDS_UPDATE | REVALIDATION_REQUIRED | Run内Candidate、current Run / Stage参照、exact validated Artifact復元、Provenanceとcurrent Policy |
| AP-PIPELINE-003 | C11-06 / PipelineRunRepository / ArtifactStore | SPLIT | NEEDS_UPDATE | REVALIDATION_REQUIRED | exact Candidate / Content / Attempt一致Evaluation、validated Artifact、PASS != Human APPROVE |
| AP-PIPELINE-004 | C11-08 / PipelineRunRepository / StructuredOutputProvider | SPLIT | NEEDS_UPDATE | REVALIDATION_REQUIRED | P8 Input / Source Gate、新Run、同操作重複開始なし・意図的再生成は別操作、K / H07 |
| AP-PIPELINE-005 | C11-08 / PipelineRunRepository / ArtifactStore | SPLIT | NEEDS_UPDATE | REVALIDATION_REQUIRED | FAILEDのみResume、前段Artifact保持・Input照合・current Policy・stale結果拒否。crash自動回復不要、K / H07 |
| AP-REVIEW-001 | I11-04 / QuestionRepository | MATCH | NEEDS_UPDATE | REVALIDATION_REQUIRED | 種別・状態軸・全Source分類、queuedAt全順序、Filter後Pagination |
| AP-REVIEW-002 | I11-05、C11-05 / 06 / 07 / QuestionRepository / SourceRepository | MERGE | NEEDS_UPDATE | REVALIDATION_REQUIRED | exact Content / Human Record / matching評価、previous exact、全Source current Policy、成立済みmaterialization対応 |
| AP-REVIEW-003 | I11-06、C11-05 / QuestionRepository / Application差分処理 | SPLIT | NEEDS_UPDATE | REVALIDATION_REQUIRED | 固定QuestionRevision Diffと凍結Intent SourceReference（sourceRevisionId + locator）の集合比較、previous exact比較元、初版 / 取得失敗 / 表示不可分離、H05の禁止本文をDiffで漏らさない。Source Diffは除外 |
| AP-REVIEW-004 | I11-07 / QuestionRepository / SourceRepository | SPLIT | NEEDS_UPDATE | REVALIDATION_REQUIRED | exact Revision、max1 Human decision、APPROVEとPublish一貫成功、Policy競合、K / 旧APPROVE非巻戻し / H07 |
| AP-REVIEW-005 | I11-07 / QuestionRepository | SPLIT | NEEDS_UPDATE | REVALIDATION_REQUIRED | exact REJECT、max1 decision、元Content / 旧公開不変、K / H07 |
| AP-REVIEW-006 | I11-07、C11-06 / 07 / QuestionRepository / PipelineRunRepository / SourceRepository | NEEDS_UPDATE | NEEDS_UPDATE | REVALIDATION_REQUIRED | N-01 base全Source blocker Edit禁止、差替え迂回禁止、確定時検査・解消後再取得、旧評価非継承、K / H07 |
| AP-REVIEW-007 | C11-06 / PipelineRunRepository / QuestionRepository / KnowledgePointRepository / SourceRepository | NEEDS_UPDATE | NEEDS_UPDATE | REVALIDATION_REQUIRED | 1 Candidate最大1対応、別操作同Target既存結果 / 別Target X、stable解決・QuestionSource / Revision一貫、current Policy、K / H07 |
| AP-REVIEW-008 | C11-05、I11-07の不足分 / QuestionRepository | SPLIT | NEEDS_UPDATE | REVALIDATION_REQUIRED | exact REQUEST_CHANGESとLifecycle一貫、max1 decision、Source blockerだけで禁止しない、K / H07 |
| AP-REVIEW-009 | C11-06 / PipelineRunRepository / StructuredOutputProvider | NEEDS_UPDATE | NEEDS_UPDATE | REVALIDATION_REQUIRED | 編集後exact Content＋許可Grounding、新Validation / Evaluation、旧PASS非継承・base不変、K / H07 |
| AP-SOURCE-001 | I11-02、C11-07 / SourceRepository | SPLIT | NEEDS_UPDATE | REVALIDATION_REQUIRED | 取得時Snapshotとcurrent用途Policy、N-02 identity、H05禁止本文 / 許可Metadata分離 |

### Internal Guarantee 7 → Formal / 共通Contract

| 旧Candidate Behavior | #12現行追跡 | 保証するFormal / 共通契約 | 更新 | 再照合 |
| --- | --- | --- | --- | --- |
| CAND-REVIEW-001 | C11-05 / I11-05 / 06 | AP-REVIEW-002、AP-REVIEW-003 | NEEDS_UPDATE | REVALIDATION_REQUIRED |
| CAND-PIPELINE-001 | C11-08 | AP-PIPELINE-001、AP-PIPELINE-002、AP-PIPELINE-005 | NEEDS_UPDATE | REVALIDATION_REQUIRED |
| CAND-PIPELINE-002 | C11-08 | AP-PIPELINE-001、AP-PIPELINE-002、AP-PIPELINE-005 | NEEDS_UPDATE | REVALIDATION_REQUIRED |
| CAND-PIPELINE-004 | C11-06 / 08 | AP-PIPELINE-002、AP-PIPELINE-003、AP-PIPELINE-005、AP-REVIEW-007、AP-REVIEW-009 | NEEDS_UPDATE | REVALIDATION_REQUIRED |
| CAND-PIPELINE-011 | C11-06 | AP-REVIEW-002、AP-REVIEW-007 | NEEDS_UPDATE | REVALIDATION_REQUIRED |
| CAND-SOURCE-001 | C11-07 | AP-SOURCE-001、AP-REVIEW-002、AP-REVIEW-004、AP-REVIEW-006、AP-REVIEW-007、AP-REVIEW-009、AP-PIPELINE-004、AP-PIPELINE-005 | NEEDS_UPDATE | REVALIDATION_REQUIRED |
| CAND-SYSTEM-001 | 独立I11 / C11なし。Plan第14 / 16節の結果照合 | 全15 CommandのK（第12 / 13節） | NEEDS_UPDATE | REVALIDATION_REQUIRED |

### Open / Deferred → #12の現行候補

| 候補参照 | 現行追跡 | 採否と#12への扱い |
| --- | --- | --- |
| CAND-PIPELINE-008、CAND-PIPELINE-009 | C11-08 | OPEN_CANDIDATE。自動durable回復は現MVP充足条件から除外。stale結果拒否・Artifact integrityは正式保証として残す |
| CAND-PIPELINE-003 | C11-08 | DEFERRED。独立Attempt履歴Paginationを必須にしない。証跡保持は維持 |
| CAND-SOURCE-002、CAND-SOURCE-003 | C11-07 | DEFERRED。独立履歴一覧を必須にしない。exact Source / Policy / Review参照は維持 |
| CAND-SOURCE-004 | C11-07 / 08の追記候補 | DEFERRED。影響先逆引き・自動再評価を現MVP要求へ追加しない |
| CAND-SOURCE-005 | I11-06のSource比較案 / C11-07 | DEFERRED。SourceRevision Diffを正式 / 必須にしない。既存案の削除ではなく未採用扱い |
| CAND-FEEDBACK-003 | C11-09 | DEFERRED。Planning Inputを現P8へ追加しない。技術的正答Source化禁止 |

### #12 U01〜U10への引き継ぎ

| #12未決ID | #11で確定した条件 | #12で行うこと |
| --- | --- | --- |
| U01 | Formal 36、旧Candidate採否16 / 7 / 2 / 6、原文14・Supplemental16 | 正式ID・内部保証へ対応表を更新しAP単位で再検証 |
| U02 | H02個別current公開参照確認、完全な現在集合による一意数不足判定 | E一覧 / 部分走査 / freshness不明と不足を区別する証拠 |
| U03 | Mock実Answerのみ、未回答0点・分母20、確定Session / Snapshotから再構築 | 物理表現は#12。分母・偽Answer禁止を再判断しない |
| U04 | H03開始成功時分類Identity固定、三表示の共通寄与 | 固定分類と確定事実から再構築。Current再分類なし |
| U05 | H04 Candidate最大1対応、新Revision / Provenance成立、編集後新評価。N-01固定 | stable対応・重複materialization・exact評価対象とN-01確定時Gateを再検証 |
| U06 | 正式Question Diffのみ。Source DiffはDEFERRED | previous exact解決・全文比較を保証。Source Diffを必須にしない |
| U07 | H07結果照合証拠にMVP自動TTLなし、K・業務Invariant独立 | 同操作同結果の再照合証拠とexact参照を維持。保持最適化は後続 |
| U08 | H05 Active停止・状態保持 / 再確認Resume、Historical許可事実のみ | current Gate・非公開Projection・確定事実 / Snapshot保持を再検証 |
| U09 | 論理Atomicity・stale write / ack・Policy競合・旧worker拒否。H08自動回復除外 | 物理保証を#12で示す。crash運用リスクを自動回復実装済みと扱わない |
| U10 | H06 allowlist版、個人なしReviewer、期間内最新1件 / Learner | 許可入力・再提出原本・最新選定・facet分母 / 観測位置を再検証。Planningは除外 |

### 充足判定の停止条件

I11 14/14、C11 9/9、Formal 36/36、内部保証7/7、旧Candidate lineage 31/31を追跡した。次フェーズはAP単位の#12実装再レビューであり、本書の承認で#12実装を承認した扱いにしない。

1. Consumerの一時I11 / C11表をFormal 36と7内部保証へ更新する。
2. 入出力・Sort / Filter / Pagination・Consistency・K・Concurrency・Atomicity・Failure・Data Boundaryを実装と証拠へ照合する。
3. 特にN-01、H02不足、H03固定分類、H04最大1対応、H05利用不可、H06最新寄与 / privacy、H07無自動TTL証拠、新Supplemental16を再確認する。
4. 失敗 / 重複 / stale / Policy変更 / 禁止本文 / Mock18/20のScenarioを含め、未実装・未検証・Residual Riskを明示する。
5. 自動crash回復・Open2・Deferred6を現MVP必須要求に混ぜず、stale結果拒否・validated Artifact整合は除外しない。

検証済みMATCHは0件、Consumer更新NEEDS_UPDATEは43件、REVALIDATION_REQUIREDは43件。後二者は同じ43単位への更新要否と検証状態であり、足し合わせない。#12の実DB保証・全件充足は次フェーズの根拠確認後にのみ判定する。

## 16. H01〜H09のHuman承認と確定Contract

今回のHuman指示によりH01〜H09は`RESOLVED_BY_HUMAN_DECISION`である。F-01〜F-03もRESOLVEDを維持する。#11のAccess Pattern Contractは確定し、Human判断待ちのHは0件。#12の充足・実装完了・Issue Closeを意味しない。

| Decision | Status | 採用内容 | 延期 / 対象外 | #12へ渡す保証 |
| --- | --- | --- | --- | --- |
| H01 | RESOLVED_BY_HUMAN_DECISION | 旧31候補をADOPTED 16 / INTERNALIZED 7 / OPEN_CANDIDATE 2 / DEFERRED 6へ確定。Formal 36 | 独立Run監視・全Revision履歴・Raw Artifact browse・独立Policy / 結果照合Queryは作らない | 36 APと7内部保証を全件再照合。必要Behaviorを削除しない |
| H02 | RESOLVED_BY_HUMAN_DECISION | 一覧は候補発見。Questionごとにcurrent公開参照・適格性を確認してexact解決、成功時にSnapshot固定 | 全Questionが一瞬の同一logical timestampでCurrentという保証は要求しない | 完全な現在集合の一意数でだけ10 / 20問不足を確定。不完全 / freshness不明はD / unresolved |
| H03 | RESOLVED_BY_HUMAN_DECISION | 開始成功時Topic分類Identityを固定し、同SessionのResult / History / 累積寄与で共通利用 | Current KnowledgePoint / Catalogによる過去寄与の自動再分類なし | 固定分類から再構築。同Revisionの別時期Sessionで異なる分類は許容 |
| H04 | RESOLVED_BY_HUMAN_DECISION | 1 Run内Candidate最大1 materialization。stable対象・新Revision・QuestionSource / Provenance・元候補対応を一貫して成立。編集候補は新評価へ | Content類似による自動Question統合、旧PASS / Human Review継承なし | 同操作同結果、別操作同Targetは既存対応、別TargetはX。materializationは未公開 / Human判断なし |
| H05 | RESOLVED_BY_HUMAN_DECISION | Active利用不可時は状態 / Snapshot / 保存済み状態を保持して進行停止。Historicalは許可確定事実とMetadataだけ返す | 自動再抽選 / Current差替え / 自動終了なし。具体表示UXは後続 | 許可再確認後に同Snapshot再開、明示終了はAP-LEARNING-013。禁止本文の応答 / Error / Log漏出なし |
| H06 | RESOLVED_BY_HUMAN_DECISION | versioned finite allowlist、immutable原本、ReviewerへLearner identityなし。summaryは資格・期間内最新1 Record / Learner | wire enum文字列、small-cell閾値 / UI、Planning Inputは後続 | 最新選定後のfacet別denominator / count・計算版 / 観測位置を再現。再送・再提出で重みを増やさない |
| H07 | RESOLVED_BY_HUMAN_DECISION | 全CommandのK維持。MVPでは結果照合証拠にTTLによる自動期限を設けない | TTL / retention最適化、Pagination UX / limitは後続 | Actor・operation kind / ID・semantic input identity・committed result identityを再照合。業務Invariantは独立して維持 |
| H08 | RESOLVED_BY_HUMAN_DECISION | P8 FAILED再開をAP-PIPELINE-005へ正式化。前段validated Artifact保持・stale結果拒否 | automatic durable worker recovery / lease / heartbeat / RUNNING reclaim / crash retryはMVP対象外。claim / checkpointはOPEN_CANDIDATE | 自動回復を#12充足条件から外す。Artifact integrity・current Stage / Candidate / Evaluation非上書きは維持 |
| H09 | RESOLVED_BY_HUMAN_DECISION | AP-LEARNING-014は既存モデルのterminal Sessionのみ。startedAt desc + sessionId desc。ActiveはAP-LEARNING-009 | 部分Practice Result UI、Candidate-only Edit、QuestionReview Comment入力UXは後続 | 存在するResult参照とResultなしを区別。終了Practice確定Answerを保持、未提出Mockを採点しない |

### H02 / H03: 開始・分類・通常再開

Practiceは10、Mockは20の一意Question stable IDを数え、Revision数を問題数にしない。候補一覧を起点にQuestionごとの現在公開参照と適格性を確認し、exact Revisionを解決する。成功時にはQuestion stable ID、exact Revision ID、ordinal、および開始時に解決したTopic分類Identityを固定する。全体同時点Snapshotは要求しない。

不足確定は対象Filterを満たす完全な現在Question集合の一意件数で行う。Eventual一覧、途中ページ、依存失敗、freshness不明をSの問題不足へ変換しない。候補発見が公開変更に遅れる可能性は許容するが、それを不足の根拠にしない。

同SessionのResult・History・cumulative LearningProgressは同じ固定分類を用いる。Current Topic表示名は分類Identityと別であり、KnowledgePoint / Catalog変更で過去寄与を移さない。同Revisionを別時期に出題したSessionの開始時分類は異なり得る。Mode分離、Mock未回答、再回答、Topic内重複除去の既存式は維持する。累積QueryはEと観測位置で表示し、具体refresh UXは後続とする。

### H04: materializationと新評価

```text
AP-REVIEW-006: exact Revision → 編集後の新Candidate
    → AP-REVIEW-009: 編集後exact Content + 許可Groundingで新Validation / Evaluation要求
    → AP-REVIEW-007: validated Candidateをstable Domain対象へmaterialize
    → AP-REVIEW-002: exact Domain RevisionをHumanが確認
    → AP-REVIEW-004 / 005 / 008: exact RevisionへHuman decision
```

同じIntentの既存Questionへ適用する場合はstable対象を明示し一致を検証する。別Intentは新Questionとし、Content文字列類似だけで統合しない。KnowledgePoint候補はstable対応を解決・検証し、Run内IDをDomain IDへ流用しない。Revisionの系列順序、QuestionSource / Provenanceと元Candidate対応を成功時に一貫して成立させる。対応だけ存在してRevision欠損なら成功ではない。

同Candidateの同操作は同結果、別operationIdでも同Targetなら既存対応を返し、新materializationを増やさない。異なるTargetはX。別操作の既存対応返却でも新しい操作の入力 / 結果照合を保つ。新Question要求の再送も最初のstable対応へ解決する。公開・Human Reviewは作らず、exact Domain RevisionのHuman確認を省略しない。

Edit元Revision・旧Candidate・旧Evaluation PASS・旧Human Reviewを更新 / 継承しない。再評価要求は編集後exact Contentと許可Groundingに新処理を対応づけ、開始失敗でEdit元Revisionを変更しない。同操作Retryで処理を増やさない。編集候補と新評価処理のRun / Candidate参照を追跡し、P8の既存生成Inputを無検証に転用しない。具体実行Adapter / 接続Codeは後続であり、新たなHuman未決Hではない。

N-01のbase Revision全Source blocker中APPROVE / Edit禁止、Source差替え迂回禁止、確定時current Policy変更検知、解消後の対象＋current Policy再取得を維持する。REQUEST_CHANGES / REJECTはblockerだけでは禁止せず、exact Revisionへの最大1 decisionという境界を守る。

### H05: ActiveとHistoricalの利用不可

Activeで必要Content / Sourceが現在利用不可ならSession状態・Snapshot・保存済み状態を保ち、該当学習の進行を停止する。利用可否を再確認するまで新規回答確定 / Mock保存・提出を進めず、Policy / Terms許可後はcurrent状態を再確認して同SnapshotからResumeする。明示終了はAP-LEARNING-013で行い、Practice確定Answerを失わず未提出Mockを採点しない。停止理由はApplication意味であり新しいDomain enumを作らない。

Historicalでは禁止本文を返さず、保持が許可されるSession metadata、exact ID reference、Answer fact、score / Result fact、timestamps、非機密Metadataを維持し、現在Policyで表示可能な範囲だけ返す。未提出Mockへscore / 正誤を生成せず、終了Practiceを通常10問完了Resultと同一視しない。Current Revisionに置換せず、禁止本文をError / Logへ再出力しない。本文の保持許可と事実 / Metadata保持を混同しない。具体画面文言・配置は後続UX。

### H06: Feedbackの有限選択と集計

有限選択の意味はHuman承認済みR10を正本にする。Contract版に資格 / Topic所属、形式、難易度・実機重要度の1〜5、シナリオ比率の有限区分、Similarity三観点、不足分野と不明 / 不足なしの単独選択・重複禁止を結び付ける。unknown != not_used、Similarity not_usedは三観点all-or-none。版にないField / 値、本文、自由記述、Attachment / URL、Question本文は受理・Raw保存しない。wire enumの具体文字列はAPI Issueで扱う。

原本はimmutable、訂正 / 再提出は新Record、same operation Retryは同Record。Reviewer一覧 / exact詳細の出力はRecord参照、submittedAt、許可資格 / Topic Context、抽象選択等に限り、Learner identityを返さない。内部の寄与選定に必要な提出者対応と公開Projectionを分離する。

summaryは資格・対象期間内でLearnerごとの最新Feedbackを1件選ぶ。同時刻はsubmittedAt desc + examFeedbackId descで一意に選び、その集合へTopic / facet Filterを適用する。Filterに合う過去Recordを選び直して寄与を増やさない。元Recordは削除しない。unknown / not_used / unansweredを別件数として扱い、facetごとの対象・denominator / count・計算版・観測位置を再現できるようにする。集計率を返す場合はどの分母を使うか出力で識別し、不明値を既知Ratingへ変換しない。個人Identityはsummaryにも含めない。期間はQuery入力で指定し、既定期間UI・small-cell閾値 / 表示・Planning Inputは後続へ延期する。

### H07: Kと結果照合証拠

MVPでは結果照合証拠にTTLによる自動期限を設けない。Actor、operation kind、operationId、semantic input identity、committed result identityを再照合できる状態を保持する。同操作を新操作へ変える証拠削除を採用しない。物理receiptの有無・形式は#12で決める。

業務Invariantは証拠とは独立に維持する。Practice Answer最大1、Mock提出二重確定禁止、max 1 Human decision / Revision、old APPROVE non-rollback、Candidate materialization最大1、Active Session最大1を守るだけでは、Kの同じ確定結果返却を代替できない。結果記録が見つからないだけでは未commitと断定しない。TTL / retention最適化は後続Issueで契約への影響を再確認する。

### H08: durable実行のMVP境界とResidual Risk

P8のFAILED StageからのRetry / Resumeと成功前段validated Artifact再利用をAP-PIPELINE-005で保証する。旧Attempt / stale worker結果はcurrent Stage、current Candidate、current Evaluationを上書きしない。状態だけSUCCEEDEDでArtifact欠損という成功を許さない。LLM呼出しの物理的exactly-onceや本文一致は保証しない。

Process crashでRUNNINGのまま残ったStageを、自動的にFAILEDへ変換 / 再実行しない。automatic durable worker recovery、lease、heartbeat、automatic RUNNING reclaim、automatic crash retryはMVP正式要求に含めない。manual recovery / operational interventionを要する可能性をResidual Riskとして許容する。運用手順・Admin API・新Status / Reasonは本Issueで追加しない。自動回復を採用する後続IssueでCAND-PIPELINE-008 / 009を再レビューする。自動回復は#12のMVP充足条件から外れるが、stale result rejection・validated Artifact integrityは外れない。

### H09: terminal Historyと後続UX

AP-LEARNING-014は既存状態モデルのterminalだけを対象とする。完了Practice、明示終了Practice、提出Mock、terminalになったMock等を扱い、ActiveはAP-LEARNING-009へ分ける。startedAt desc + sessionId descを正式順序とする。新しいDomain enumは追加しない。

Resultが存在すれば参照を返し、Resultなしは正常に区別する。明示終了Practiceの確定Answerは保持するが部分Resultを通常10問完了Resultとして生成しない。未提出MockはHistoryへ現れてもscore / 正誤Resultを生成しない。部分Practice Result UI、Candidate-only Edit、QuestionReview Comment入力UXは後続へ延期し、既存の任意Domain Comment Field / 読取は削除しない。

### 確定後の引き継ぎ

#11のH01〜H09判断は解消済みであり、再承認待ちには戻さない。後続は第15節のFormal 36 + Internal Guarantee 7を基準とする#12再レビューである。未検証の実DB保証を成功と呼ばず、重要なArchitecture Decisionの変更が必要なら[ADR手順](../adr/README.md)で別途扱う。本書ではStore / Domain境界を変更せず、新ADRを追加しない。

## 17. 検証

以下の実測記録はAccess Pattern確定時の履歴。承認済みRV-03は第8節の凍結Intent内SourceReference比較の明確化で、Formal ID / Q/C・内部保証・H01〜H09を変更しない。RV-01〜RV-04反映後の4文書のHash・Scenario件数・構造検査は[Implementation Plan](issue-11-implementation-plan.md)第10節へ分離し、過去結果を今回の実測へ流用しない。

Documentationのみ。`git diff --check`と未追跡文書 / 修正前後の空白直接検査、matrix・lineage・承認条件・回帰・Markdown / linksを検証する。TypeScript・設定変更なしのため`make check` / `pnpm typecheck`は実行しない。RepositoryへTest / Fixture / Validation Runtimeを追加しない。一時検査は`/tmp`だけで行う。

### 検証対象

| 対象 | 期待 |
| --- | --- |
| Formal matrix | 定義 / 条件ID一致、36件Q21 / C15、全項目非空、重複0。旧正式20 ID維持、新16 IDはHuman指定どおり |
| Candidate lineage | 31 unique ID、ADOPTED16 / INTERNALIZED7 / OPEN_CANDIDATE2 / DEFERRED6。正式化16 / 内部保証7対応完備 |
| 独立AP非追加 | 内部7に独立Formal IDなし、Open定義は2件のみ。AP-SOURCE-002再利用なし、CAND-SOURCE-005正式復帰なし |
| 原文 / Supplemental | #11本文を再取得して原文14/14照合、既存20 decomposition維持、Supplemental16/16を別表 |
| Human判断 | H01〜H09は全てRESOLVED_BY_HUMAN_DECISION。Human判断待ち0 |
| #12引き継ぎ | Formal36/36 + Internal7/7、I11 14/14 / C11 9/9、更新とREVALIDATION_REQUIREDを区別。充足MATCHは根拠確認前0 |
| 共通保証 | 全15 CommandにK・競合・Atomicity・Failure。owner / Actor、Data Boundary、結果不明、current Gate、無自動TTL証拠 |
| Markdown / 安全 | 表列数、fence、local links、末尾空白・最終改行、Storage Key / Table / GSI / DDL追加なし、対象文書のみ変更 |

### Access Pattern確定時の実測結果（RV改修前の履歴）

最終実行の結果を以下へ記録する。実DB / #12実装の充足検証ではない。

| 実行 / 検査 | 実測結果 |
| --- | --- |
| `git diff --check` | exit 0、診断0。文書は開始時から未追跡のため下記の直接検査も実施 |
| `git diff --no-index --check /dev/null docs/architecture/issue-11-access-patterns.md` | exit 1は追加差分あり、空白診断0。文書全文を検査 |
| `git diff --no-index --check /tmp/refriq-issue11-approved/before.md docs/architecture/issue-11-access-patterns.md` | exit 1は変更差分あり、空白診断0。既存未コミット版との比較 |
| `/tmp`の`validate-document.py` | 定義 / 条件36/36、Q21 / C15。旧20維持、指定16 mapping、ID重複0、全列非空 |
| Candidate / trace | unique31、ADOPTED16 / INTERNALIZED7 / OPEN_CANDIDATE2 / DEFERRED6。内部7・Open2・Deferred6の定義 / 条件一致。Original14/14、Supplemental16/16 |
| Human判断 / #12対応 | H01〜H09承認済み9 / 判断待ち0。Formal36/36 + Internal7/7、I11 14/14 / C11 9/9。充足MATCH0、更新NEEDS_UPDATE43・再照合REVALIDATION_REQUIRED43（同じ43単位） |
| `/tmp`の`validate-regressions.py` | 文書回帰14項目PASS、内部7 mappingとH02〜H09関連保証を含む29検査、エラー0。実DB / API試験ではない |
| Markdown / text | 表列数不一致0、code fence 4組対応、local links 15件（14対象）存在、末尾空白0・最終改行あり |
| 入力 / Scope | #9 / #10 / #12のHEAD / statusと#10 Contract / #12 Plan Hashは開始時と同じ。#10 N-03も読取のみ。追跡ファイル差分0、変更対象は本未追跡文書のみ |
| 対象外の検証 | `make check` / `pnpm typecheck`は実行せず、成功に数えない。#12全AP充足・Production / HTTP / 実DB / LLMは未検証 |

一時検査の初回はCandidate→Formal→#12の二段mappingと同義表現のliteral比較で停止した。参照チェーン解決と各表現の期待条件を修正して再実行し、上記のエラー0を確認した。Contractの要件を緩めたり、失敗を無視したりしていない。

### 文書回帰と後続#12で確認するシナリオ

| シナリオ | 期待するContract |
| --- | --- |
| Question9件・Revision12件からPractice開始 | 不足。一意Question数で数える。依存失敗 / 不完全一覧は不足と断定しない |
| 同じUser×資格×Modeで同時開始 / 応答喪失Retry | 最大1 Active、同じ成功Snapshot。PracticeとMockは別枠 |
| 新Revision公開後に通常Resume・History | 固定旧Revisionと順序、確定済み回答を維持。Currentへ置換しない |
| Practice確定成功後に解説取得失敗 | 回答確定は維持、QueryだけRetry、他の未確定問題は非解禁 |
| Mock Save A送信後B編集、A応答後着・古いwrite後着 | AのackでBを保存済みにしない。古いwriteを拒否。未保存中は提出不可 |
| 20問Mockで18実回答・2未回答を提出、同じ提出Retry | 分母20・未回答0点、偽Answerなし。確定事実から再構築、同じ結果 |
| 同じQuestionに同TopicのKnowledge2件、別Session再回答 | 1出題につきTopicに1寄与、別Sessionは新寄与。Practice / Mock分離 |
| CandidateとRevision Content不一致 / matching評価欠落 / 別Run同candidateId | exact RevisionがHuman確認正本、APPROVE readiness不可。REQUEST_CHANGES / REJECTはexact対象へだけ記録 |
| 同RevisionにAPPROVEとREJECTが競合、確認後Policy変更 | 最大1 Human決定。Publish Gate競合なら部分成功なし。旧公開参照維持 |
| 元RevisionにREVIEW_REQUIRED / PROHIBITED / ambiguous / missingのSourceがある状態でEdit | N-01により候補作成をGで拒否。新SourceReference集合だけの適格性で元Revisionのblockerを迂回しない |
| R1のAがTRUSTED、BがPROHIBITEDでBだけを外す / 差し替えるEdit | R1 Contentを流用した新Candidateは作らない。TRUSTED Sourceからの独立再生成 / 再提案は別Use Case |
| Edit開始後に元Source Policyがblocker化 / 外部解消後に再操作 | 保存確定時に変更を検知して拒否。解消後は対象とcurrent Policyを再取得してGateを再評価。旧TRUSTEDを使い続けない |
| Source blocker中のREQUEST_CHANGES / REJECT | blockerだけでは禁止しない。未判断の解決済みexact Revisionへの最大1 Human decisionという既存条件を維持 |
| 旧APPROVE成功後に新Revision公開、旧操作Retry | 旧確定結果を返し、新しい公開参照を巻き戻さない |
| Evaluation REVISE / REJECT、失敗Run Resume、古いAttempt結果 | 品質結果は技術Failureではない。前段validated Artifact維持、旧worker結果拒否 |
| Feedback未知Field / 値、Similarityのnot_used / Rating混在、summary依存失敗 | 不許可InputをRaw保存しない。not_usedは3観点同時、unknownは観点別。依存失敗を0件summaryにしない |
| Active / HistoricalでSource利用不可 | H05承認どおりActive停止 / 状態保持、Historical許可確定事実。本文・Error / Logへの漏出を防ぐ |
| SourceRevision Diff未採用 / 全候補必要度を評価済み | 正式DiffはAP-REVIEW-003。CAND-SOURCE-005を#12必須要求にしない。旧31候補は採否16 / 7 / 2 / 6を維持し、Source DiffはDeferred |

## 18. 対象外と停止点

- 実装、DB Schema、DynamoDB Table / Partition Key / PK / SK / GSI、Turso DDL、Migration、Repository Adapter / Port Code、AWS / Turso SDK。
- API / Hono Handler / React / Authentication / Terraform / AWS Resource / Production code・設定・Test / Fixture追加。
- DynamoDB / Turso / S3の具体配置・Cross-Store構成、Lock・Transaction・TTLの実装。
- #9 / #10 / #12文書・作業ツリー、Domain・Accepted ADRの変更。
- GitHub Issueコメント、commit、push、PR。

Human承認反映・正式AP確定・検証を終えたら停止する。次フェーズはFormal 36 + Internal Guarantee 7を基準にした#12実装再レビュー。今回#12更新、Schema / Code / API変更、commit / push / PR / Issueコメントへ進まない。
