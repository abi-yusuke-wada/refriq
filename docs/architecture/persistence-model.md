# Issue #12 永続化モデルと実装状況

- 状態: 実装着手・一部判断待ち。Issue完了ではない。
- 日付: 2026-10-04
- 入力: [承認済みPlan 1](issue-12-plan.md)、[Issue #12](https://github.com/abi-yusuke-wada/refriq/issues/12)、[Issue #11](https://github.com/abi-yusuke-wada/refriq/issues/11)
- 作業場所: `/tmp/refriq-issue-12`、`feature/12-persistence-model`
- 実装基点: main `e65e97a65b0db54a9b985cafd3fa04257116d00f`（PR #27）。未コミット変更を保持してfast-forward取込み済み。

## 1. 実装範囲と判断待ち

HumanからPlan修正の承認と実装着手指示を受け、固定契約から実装できるPort、DynamoDB保存Schema、S3 Artifact参照、代表例を追加した。AWS / Turso Adapter、HTTP / UI、SDK、Cloud Resource、Migration、Productionへの適用は含まない。

#11はOPENで正式AP成果物・コメントがない。PlanのI11-01〜14は本文の対象範囲の追跡IDであり、正式AP IDではない。物理Table名、最終Table / Index数、Pagination・filter・一覧鮮度等はまだ確定していない。本実装の論理Table / Keyは対応候補の検証可能な定義であり、#11の完了を代替しない。

#9はPR #27でmainへ統合されCLOSED。最新の[Learner正本](../ux/learner-ui.md)を再照合した。以前参照した版からの文書差分は検証記録の更新だけで、保存Contractは変更されていない。Practice保存中 / 失敗時の前問経由ロック、全問正解ResultのFixture往復の修正も固定Session・immutable Answerの境界を変更しない。Plan第3.4節に影響確認を記録した。UIの検証件数をPersistence検証件数へ流用しない。

Tursoの完成DDLとResult / Progress読取実装は、Planに残るU03 / U04のHuman判断を待つ。選択に依存しないSnapshot / Topic / Draft / Answerの参照制約だけを部分DDLとして先行実装した。U03はSession / Snapshotで表現するか追加Outcome Persistenceを持つか、U04はTopic分類をSession開始時 / Revision作成時のどちらで固定するかである。未回答を偽UserAnswerにしないこと、提出済みSession / Snapshot等から分母20を再構築すること、Snapshotのexact Revisionを参照することは既に固定済み。

## 2. 保存境界

| 保存先 | 責務 | 実装 |
| --- | --- | --- |
| DynamoDB Content | Catalog、Source / Revision、現在Policyと履歴、SourceReview、KnowledgePoint | 論理Table / Item Schema・Key定義 |
| DynamoDB Question | Question / Revision、Lifecycle、Human Review、Evaluation、公開参照、種別付きReview Queue | 論理Table / Item Schema・Key / Index定義 |
| DynamoDB Pipeline | Run / Stage / Attempt、Input / Output参照、Candidate→Domain対応 | 論理Table / Item Schema・Key / Index定義 |
| S3 | Source原文、Normalized Snapshot、Pipeline Artifact、大きなQuestion Content | immutable objectKey、参照Metadata、checksum / size検証 |
| Turso | Session、固定出題、Draft、実回答、Result / History / Progress、ExamFeedback | DTO・Session commit / reader Port、独立したSnapshot FKの部分DDL。完成DDLは判断待ち |

Schemaは[`packages/persistence`](../../packages/persistence/src/index.ts)へ置く。Domain / ApplicationからこのPackageをimportしない。Applicationは[`persistence/`](../../packages/application/src/persistence/index.ts)のDTO / Portを公開する。既存Ajvを再利用し、DB Driver・SDKは追加しない。

## 3. Access Pattern対応

Query / Commandの並び順、filter、cursor、失敗、鮮度、排他の正式条件はPhase Aで#11と照合する。以下は取得経路と、その経路の実装段階を区別した対応表である。

| 追跡ID | #11本文のUse Case | 対応する保存形 / 経路 | Port / 実装状況 |
| --- | --- | --- | --- |
| I11-01 | Certification / Topic取得 | Content `CERT#id`のMETA / TOPIC prefix | CertificationCatalog、Item Schemaあり |
| I11-02 | Source Revision取得 | Content `SOURCE_REVISION#id / META`、原文 / normalized参照 | SourceRepository、Schemaあり |
| I11-03 | Pipeline待ち状態取得 | Pipeline StageのGSI-Work。dueAtを持つPENDING / retry可能FAILED候補 | PipelineRunRepository、Index定義あり。待ち / retry契約は未確定 |
| I11-04 | Review Queue取得 | Question GSI-Review、CANDIDATE / QUESTION_REVISION別投影 | QuestionRepository、種別Schemaあり |
| I11-05 | Question Revision詳細取得 | Question exact CONTENT / STATE / REVIEW / EVAL、Source exact参照 | QuestionRepository / SourceRepository、Schemaあり |
| I11-06 | Revision差分取得 | 固定2 Revisionの全文取得。差分だけを正本にしない | exact読取Portあり。差分algorithm / CacheはU06 |
| I11-07 | Approve / Reject / Edit | RevisionのReview slot、State、head、Policy条件、receipt | commitHumanDecision / PipelineRunRepository。REQUEST_CHANGESの正式AP明示は追跡中 |
| I11-08 | Published Question取得 | 公開pointerを持つheadだけGSI-Published。exact本Table再検査 | QuestionRepository、Index定義あり。公開集合の鮮度はU02 |
| I11-09 | Practice Session作成 | Turso内Session・全固定Snapshot・receiptの一括保存 | LearningSessionRepository。DDLは判断待ち |
| I11-10 | UserAnswer保存 | Turso内Snapshot `(sessionId, ordinal)`へFK、一意AnswerとSession更新 | Session command / UserAnswer読取Port、Snapshot照合と部分FK DDLあり。Sessionの原子的commitは未実装 |
| I11-11 | Result取得 | Tursoの固定Snapshot起点、MockはAnswerをLEFT JOINし未回答も取得 | LearningResultReader。具体QueryはU03待ち |
| I11-12 | Topic別正答率取得 | 確定回答＋提出済みMock Session＋全固定出題 / Topic Snapshotから集計 | LearningProgressReaderと純粋なProjection再構築関数。具体QueryはU03 / U04待ち |
| I11-13 | Feedback保存 | Turso immutable ExamFeedback、選択式scalar / facets、receipt | 責務定義のみ。Production入力契約U10待ち |
| I11-14 | Feedback集計取得 | Turso内資格・期間・facet集計、匿名summary | 責務定義のみ。Production集計契約U10待ち |

14項目の対応候補はあるが、Turso等の未実装経路と#11正式条件が残る。「全正式APを実装済み」とは扱わない。PlanのC11-01〜09は追加・詳細化候補のまま維持し、#11を書き換えない。

## 4. DynamoDBの保存形

`DynamoItem`は論理Tableを示す`table`と、保存Attributeの`kind / PK / SK / payload`、任意のIndex / TTL値を持つ。`table`は配置情報で、DomainのIdentifierではない。Item種別ごとのpayloadは必須項目と未知FieldをSchema検証する。

| 責務 | Item種別 | Key / 履歴 |
| --- | --- | --- |
| Catalog | CERTIFICATION / EXAM_TOPIC | CERTのMETA / TOPIC prefix |
| Source | SOURCE_HEAD / SOURCE_HISTORY / SOURCE_REVISION | mutable head、ordinal順manifest、exact immutable Snapshot |
| Policy / Source Review | POLICY_CURRENT / POLICY_HISTORY / SOURCE_REVIEW | 用途別currentと追記履歴。Source本文とは独立 |
| Knowledge | KNOWLEDGE_POINT | stable ID、主Topic・Source根拠・version。独自Revisionなし |
| Question | QUESTION_HEAD / QUESTION_HISTORY / QUESTION_CONTENT / QUESTION_STATE | latestとpublishedを分離。不変Contentと可変Stateを分離 |
| Human Review / Evaluation | QUESTION_REVIEW / QUESTION_EVALUATION | exact Revisionの固定REVIEW slotとEVAL履歴 |
| Review Queue | REVIEW_TARGET | Target種別付きderived投影。CandidateはRun ID＋Candidate ID |
| Pipeline | PIPELINE_HEAD / PIPELINE_INPUT / PIPELINE_STAGE / PIPELINE_EVENT / PIPELINE_ARTIFACT / MATERIALIZATION | Run配下のInput、Stage current、Attempt履歴、出力、対応記録 |
| 再送 | OPERATION_RECEIPT | actor＋command＋operation ID。業務更新の論理Tableへ配置 |
| Object参照 | ARTIFACT_MANIFEST | artifact IDからStorage location・owner・checksumを解決 |

全24 Item種別。具体Keyは[`dynamodb.ts`](../../packages/persistence/src/dynamodb.ts)、payload Schemaは[`schemas.ts`](../../packages/persistence/src/schemas.ts)を正とする。IDをURI encodeし、区切り文字の衝突を防ぐ。Revision / Attempt ordinalは16桁に揃え、2と10の辞書順逆転を防ぐ。Candidate IDはRun内IDのため、Queue PK / Index sortにもRun IDを含める。

GSI-PublishedはQuestion head、GSI-ReviewはReview Target、GSI-Workは待機候補Stageだけのsparse Index。GSIは一覧候補を発見する経路であり、Review / Publish / Session開始ではexact原本を再確認する。GSI再検査で新規公開のIndex遅延を補えるとは扱わない。日時の検索KeyだけをUTCへ揃え、Domain Snapshotの日時文字列を変換・上書きしない。

## 5. 不変Content・Review・原子的境界

- Source / Question Revisionは全文Snapshotを正本とし、修正は新Revision。親headのversion条件、Revision非存在、history manifest、receiptを同じStore内で更新するContract。
- Human Reviewは`QUESTION_REVISION`だけ。`assertHumanReviewTarget`で確認したIDとreview.questionRevisionIdの一致を検査する。Candidateからのmaterialization対応を保存するPortはHuman確認済みTargetを返さず、対応記録だけを返す。
- `APPROVE / REQUEST_CHANGES / REJECT`はexact Revisionへ固定。APPROVEでは既存Domain Gate、現在Policyの期待version / decision ID、Review slot非存在を検査し、Review / State / 公開head / Queue更新 / receiptを同一DynamoDB Transactionでcommitする契約。Review単独の書込Portは作らない。
- Candidate C1の表示だけで無関係なRevision R2へcommitしない。materialization後のRevision原本取得・Human確認はApplication / Reviewerの責務。Candidate Evaluation PASSはHuman APPROVEでもPublishでもない。
- Schema / Port / 対象照合だけでは実DBの原子性を保証しない。Adapter実装時に条件更新と同時commitを実測する。現在Policyの期待条件は用途別に重複除去する。
- DynamoDBのTransaction上限を超えるSource集合は部分Publishしない。action数とサイズをAdapter前の実行計画で検査する。([AWS Transaction仕様](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/transaction-apis.html))

## 6. S3参照と大きなデータ

ApplicationのArtifactReferenceはopaque artifactId、SHA-256、contentType、byteSize、createdAt、schemaVersionだけを公開する。bucket / objectKey / ownerはStorage側ARTIFACT_MANIFESTへ閉じる。

Source original / normalizedのobjectKeyにexact SourceRevision、normalizedにはnormalization版を含める。Question Contentはexact QuestionRevision、PipelineはRun / Stage / Attempt、Run InputはRun配下のinputを含む。同じID / Keyへの異内容上書きを許可しないContract。

`verifyArtifactBody`は取得した本文のサイズとchecksumを検査する。SourceFingerprintのalgorithm / Normalization規則はU06のまま残し、Artifact checksumと同一視しない。S3から復元したQuestion Contentは`validateQuestionRevisionDocument`でinline Contentと同じSchema・provenance条件を検査する。

Itemの400 KB制約はAttribute名も対象になるため、保存ModelでMap / List overheadを含む保守的なサイズ見積りを行う。SDKのmarshal後サイズ検証と、余裕を持ったS3移行閾値はAdapter / U06等の後続判断。([AWS Item制約](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Constraints.html))

PROHIBITED Source本文やValidation失敗のRaw Generated Outputは保存対象にしない。Artifact put前のPolicy Gateと、取得後の本文利用可否はApplicationで再確認する。

## 7. Turso内部参照とSessionの固定契約

[`session-snapshot.sql`](../../packages/persistence/schema/session-snapshot.sql)は4 Tableと不変性Triggerだけの部分DDL。親learning_sessions(session_id)を持つ完成Schemaではなく、既存DBへ適用するMigrationでもない。U03 / U04を決める処理は含まない。承認済みPlanから次は固定する。

1. 開始時にQuestion、exact Revision、順序を固定。Resumeで再抽選しない。
2. Draft / Answer（`session_answer_drafts` / `user_answers`）は必須`(sessionId, ordinal)`で`session_questions`の同じ2列PKを参照。子にQuestion / Revision IDを必須重複保存しない。UserAnswerは同じ2列にUNIQUE。
3. 読取時はSnapshotからexact identityを復元。`assertAnswerSnapshot`で所有者・Session・ordinal・Question / Revision一致と実選択を確認する。Current Publishedは使わない。
4. submitted Mockの全固定20問がResult / Progressの再構築元。18回答・2未回答ならAnswerは18件、分母20。未回答0点を再現する。Practiceは中断時も確定回答を集計し、Mock Draftは含めない。
5. U03は提出事実の物理表現だけ、U04はTopic分類固定時点だけ。どちらも未回答の分母やexact Revisionを再検討する項目ではない。
6. TursoとDynamoDBに跨るFK / JOIN / ACIDは作らない。Turso内のFK有効化・強制は接続方式で確認する。([SQLite FK仕様](https://www.sqlite.org/foreignkeys.html))

Session startはDynamoDBの公開Revision読取後にTursoへSnapshotを一括保存。回答時は固定Revision読取・採点後にTursoの短いTransactionへ入り、expectedVersion・Draft digestを再検査してAnswer / Session / receiptをcommitする。片Store読取失敗やmissing Revisionで成功保存を推測しない。

[`rebuildLearningProgress`](../../packages/application/src/persistence/progress.ts)は検証済みSession / Answer事実からの純粋な集計として実装した。User×資格×Modeを分離し、Practiceは確定回答だけ、Mockは提出済みSessionの全固定Snapshotを集計する。同一出題同一Topicは1件、別Sessionの再回答は別件数。同じSession / ordinalの重複入力を拒否し、元の事実を変更しない。Session提出事実の物理表現・Topic固定時点・DB Queryはこの関数で決定しない。

## 8. TTL・Retention・置換可能性

SourceRevision、QuestionRevision、Human Review、Artifact manifestはTTLを許可しない。Pipelineイベント・操作receiptだけにexpiresAtを設定できる候補とし、実際の保持日数・retry期間はU07待ち。現例はTTLを設定しない。

Session、Answer、固定Snapshot、提出事実はHistory / Progressの再構築元として保持する。Projection Cacheを削除できることは正本削除の許可にならない。本文利用条件の変更はU08のProduct判断を待つ。

PK / SK / GSIと物理配置はpersistence Package内に限定。Application PortはID・DTO・version / operation identity・opaque cursorで記述する。将来PostgreSQL / Auroraへ移すとき、Turso内部FKとSQL実装をAdapter配下で置き換える。Domain Aggregateの変更や新Domain enumは行わない。

## 9. 代表例と検証

[`fixtures/persistence/`](../../fixtures/persistence/)は全て架空データで、Exam Dumpや実試験問題を含まない。`dynamodb-items.json`はKeyが重複しない35 Item、`dynamodb-s3-content.json`はinline Contentと同Keyの代替形を別ファイルにしたもの。Source original / normalized、Question Content、Pipeline Input / Evaluation / Candidateの本文例を持つ。

確認対象:

- 全24種別のSchema compile、代表Itemの必須Field / enum / 未知Field、Key / Indexとidentity一致。
- Source Snapshotは既存Domain validatorを再利用。Questionの正答・説明・QuestionSourceはexact Revision / KnowledgePoint / Sourceへ到達する。
- CandidateとDomain RevisionのQueue種別、Run内IDの衝突回避、Human target mismatch拒否。
- Artifact本文とMetadataのbyteSize / checksum一致。JSONの再Formatting後も参照Metadataを再生成する。
- Revision / ReviewへのTTL拒否、ordinal順、過大inlineデータ拒否。
- Domain / Applicationがpersistence Package・DB SDK / Driver型へ依存しないこと。

2026-10-04、main更新後の実行結果:

| 検証 | 結果と確認範囲 |
| --- | --- |
| `make fmt` / `make check` | 成功。Formatting、Lint、`pnpm typecheck`、既存2ファイル・68テスト、対応hostのNix checkを確認。新しいTestファイルは追加していない |
| Item / Schema | 全24種別・35 ItemとS3代替形1件を検証。14の不正例を拒否 |
| Artifact | 6本文の13参照についてbyteSize / checksum一致を確認。同サイズの改変本文も拒否 |
| Snapshotの部分DDL | SQLiteメモリDBで8の不正操作を拒否。実回答18件・固定出題20件・未回答2件、exact qr1参照、不変性、FK整合性を確認 |
| Progressの純粋計算 | Mock 15正解 / 20問、未提出Mockの除外、別Session累積30 / 40、Practice 3 / 3、Topic分母、入力の重複拒否と非変更を確認 |
| 文書・依存境界 | Markdown Table / fence / JSON断片 / local link / 節・U参照 / AP14行を確認。Domain / ApplicationへのStorage Key・SDK importの漏出なし |
| `git diff --check` | 成功。未追跡ファイルの末尾空白・最終改行も別途確認 |

上記のSchema・制約・純粋計算は一時的な検証コマンドで確認し、Repository共通Testの68件とは区別する。実AWS / Tursoへの書込、DynamoDB Transaction、Turso接続でのFK、完成Result / ProgressのSQL、Sessionの再送・競合・片Store障害は未検証。部分DDLの検証はSQLiteのメモリDBと最小の親Keyを使った参照制約の確認に限定し、完成Schema / Turso integrationの成功とは扱わない。Port定義の存在をAdapter動作の検証成功とは扱わない。

## 10. 残る判断と完了条件

| 項目 | 現状と次の判断 |
| --- | --- |
| U01 / Phase A | #11の正式APが未作成。14本文項目とC11候補の正式条件を待つ |
| U02 | GSIに現れない新規公開を含む不足判定・公開集合の鮮度 |
| U03 | Session / Snapshotだけで表現するか追加Outcomeを持つか。Humanへ選択を依頼中 |
| U04 | Topic分類をSession開始 / Revision作成のどちらで固定するか。Humanへ選択を依頼中 |
| U05 | materialization algorithm・stable ID・ordinal割当等。対応記録の保存形のみ追加 |
| U06 / U07 / U08 | Fingerprint / Normalization、Retention / retry期間、Source利用不可時の扱い |
| U09 | Pipeline checkpoint Hook・Transaction / retry・実DB接続の詳細。RuntimeへHookを追加していない |
| U10 | ExamFeedback入力 / rating / facets / summaryのProduction契約。自由JSONで仮実装しない |

Phase C/Dの定義と代表例、Phase Eの独立した参照制約を先に実装したが、Phase A/B/E/Fの完了は宣言しない。Issue #12の完了には正式AP全件照合、残る物理表現 / 契約の確定、Turso Modelと具体Scenarioの検証が必要である。
