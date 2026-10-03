# Issue #9: ツールに依存せずLearner UIを比較・確定する

> この文書はIssue #9 execution planであり、Learner UX Contractの最終正本ではない。
> 最終的なBehavior / UX Contractの正本は`docs/ux/learner-ui.md`とする。
> 本Planの承認・保存は、Issue更新、Prototype実装、HumanのLayout選択、全画面Mock作成を実施したことを意味しない。

対象Issue: https://github.com/abi-yusuke-wada/refriq/issues/9

現在の最新版Planをbaselineとして、既存の学習体験・Session・Data Boundaryを維持する。今回の修正は、承認された次の4件に限定する。

| No. | 承認された修正 | 反映先 |
| --- | --- | --- |
| 1 | 回答前後のFixtureを物理分離し、回答前Viewから回答後Fixtureをloadしない | Prototype構成、Data Boundary、Validation |
| 2 | #7 Source Governanceと#8 Knowledge / Question PipelineへのContract上の依存を明記する | Issue定義、依存関係、Handoff |
| 3 | untrackedの`learner-ui.md`をbaselineとして保護・比較する | 現在状態、実行開始手順、Documentation、Validation |
| 4 | HumanのLayout選択を暫定採用とし、重大問題時にHumanの再判断へ戻す | 設計Flow、Checkpoint、全画面Validation、採用確定 |

今回の作業範囲はPlanの修正・保存・内容確認までとする。その時点で停止し、以下に記載するIssue更新やPrototype作成へ自動的に進まない。

## 1. 現在状態とrollback調査

### 1.1 現在状態

調査時点のbranchは`feature/9-learner-ui-wireframes`である。mainを起点として作成済みの作業branchを維持する。

Working Treeには次の既存変更がある。

```text
 M README.md
?? docs/ux/
```

untrackedファイルとして実在するのは`docs/ux/learner-ui.md`である。

READMEの変更は、既存のDocumentation案内へ`docs/ux/learner-ui.md`へのリンクを追加したものである。Productionコード、Domain、依存、Build設定には今回の関連変更がない。

`docs/ux/learner-ui.md`には、承認済みのBehavior Contract、画面別の必要データ、Wireflow、検証シナリオが既に記載されている。一方、進行状況・成果物の役割・比較工程等にはFigma前提の記述が残っている。

Repository内に独立したPlanファイルはまだ存在しない。今回の保存先は`docs/ux/issue-9-plan.md`とする。

以下はまだ作成されていない。

- Figmaファイル、URL、export画像。
- 3 Layout × 4 representative screensの比較成果物。
- HumanによるLayout選択記録。
- 採用Layoutの全画面Mock。
- `docs/ux/mockups/`。
- `docs/ux/learner-ui-assets/`。

存在しない成果物を「削除した」と報告しない。

### 1.2 Keep / Rewrite / Remove / Not Created

| 分類 | 対象 | 対応 |
| --- | --- | --- |
| Keep | READMEのLearner文書へのリンク | 維持する |
| Keep | 既存`learner-ui.md`の学習体験、Session、Data Boundary、保存・取得状態、History、Learning Progress、必要データ、Wireflow | 維持する |
| Keep | PC優先、A/B/C、4代表画面、8評価軸、Human選択後に採用案だけを展開する方針 | 維持する |
| Rewrite | Figma接続を作業開始条件とする記述 | Design Toolに依存しない工程へ変更する |
| Rewrite | FigmaをVisual / Layoutの正本とする記述 | Design Prototype、採用後のStatic Mock、Behavior文書の責務へ変更する |
| Rewrite | Figma exportが必須という記述 | 必要な場合のみReview Snapshotを作成する方針へ変更する |
| Rewrite | Layout選択をそのまま最終決定と扱う記述 | 暫定採用、全画面Validation、採用確定の順へ変更する |
| Remove | 実在するFigma専用成果物 | 調査時点では該当なし。ファイル削除は行わない |
| Not Created | Figma成果物、比較Prototype、採用記録、全画面Mock、Assets | 未作成として扱う |

Figmaを利用しないことを理由に、既存Learner UX Contractを破棄しない。

### 1.3 Working Treeとuntracked文書のbaseline保護

実行開始時には現在状態を再取得する。調査後に追加された変更もbaselineに含める。

```bash
git status --short
git branch --show-current
git diff --stat
git diff
git ls-files --others --exclude-standard
```

通常の`git diff`にはuntrackedファイル本文が含まれない。そのため、`docs/ux/learner-ui.md`が存在する場合は、編集前に必ず全文を読む。

```bash
cat docs/ux/learner-ui.md
```

後続Phaseで同文書を編集する前には、可能な限りRepository外の一時領域へbaseline copyを保存し、内容を識別できるようにする。

手順例:

```bash
issue9_baseline_dir="$(mktemp -d /tmp/refriq-issue9-baseline.XXXXXX)"
cp docs/ux/learner-ui.md "$issue9_baseline_dir/learner-ui.md"
sha256sum docs/ux/learner-ui.md "$issue9_baseline_dir/learner-ui.md"
```

baseline copyの保存先と編集前の識別情報を作業記録に残す。既存の一時コピーを上書きしない。

編集後はRepository外のbaselineとの比較により、次を区別する。

- 維持したUX Contract。
- Figma固有なので変更した内容。
- 今回承認された追加内容。
- Human選択・全画面Validation後に追加した採用記録。

比較例:

```bash
git diff --no-index \
  "$issue9_baseline_dir/learner-ui.md" \
  docs/ux/learner-ui.md
```

`git diff --no-index`の終了コード1は差分が存在する場合の通常動作である。差分の内容を確認し、コマンドの失敗を隠す処理は追加しない。

ここで示したコマンド形式自体は実装Contractではない。「untrackedファイルもbaselineとして保護し、編集後に比較する」ことを必須ルールとする。

Repository内にbaseline用コピーを追加せず、保護のための`git add`も行わない。

### 1.4 今回のPlan修正・保存の終了条件

今回変更するファイルは`docs/ux/issue-9-plan.md`のみとする。

- 修正版Plan全文をMarkdownとして保存する。
- 既存のREADME変更とuntrackedの`learner-ui.md`を保持する。
- `learner-ui.md`を最終版へ更新しない。
- Issue #9を実更新しない。
- HTML / CSS / JS、Prototype、Assetsを作成しない。
- HumanにLayout選択を求めない。
- 保存後の確認を実施して停止する。

保存先が実行開始時点で既に存在していた場合は、その全文を先に読み、既存内容をbaselineとして差分を確認する。

以下のPhaseは、後続の実行時に用いるPlanであり、今回の保存作業に含めない。

## 2. Issue #9の再定義と更新予定

### 2.1 タイトルと目的

新しいタイトル:

**Learner UIのレイアウトを比較し、画面・学習フローを確定する**

目的は、複数Layoutを比較し、Learner UIの画面・学習フローをHumanと確定することである。

Design Toolは交換可能な実装詳細として扱う。特定製品のアカウント認証やPlugin接続を、Issueの目的やAcceptance Criteriaにしない。

### 2.2 依存Issueと既存Contract

| Issue | 利用するContract | Issue #9の責務境界 |
| --- | --- | --- |
| #1 refriq MVPのスコープと完了条件 | 対象資格、MVP Scope、完了条件、対象外 | MVPを拡張しない |
| #6 Core Domain Model / lifecycle invariants | Question stable identity、immutable QuestionRevision、UserAnswer、Lifecycle | Domain概念やInvariantを変更しない |
| #7 Source Governance | Source利用可否、provenance、publish gate、SourceRevisionの扱い | Source Policyや利用可否の意味を再定義しない |
| #8 Knowledge / Question Pipeline | QuestionRevision Candidate、Human Review、Published QuestionRevisionまでの責務境界 | CandidateやReview中の情報を独自にPublishedとして扱わない |

これらは仕様Contract上の依存であり、#7 / #8の実システムが稼働しなければUI Prototypeを作れない、という意味ではない。Prototypeは既存Contractに整合する架空Fixtureで作成できる。

特にPublished QuestionRevisionの意味をIssue #9で独自に定義しない。#6・#7・#8の公開・Review・Source GovernanceのContractを利用する。

公開済みQuestionRevisionの内部Contentをそのまま回答前Clientへ渡してよい、という意味にも解釈しない。

### 2.3 更新予定のIssue本文

#### 背景

LearnerのBehavior Contractと画面別データは整理されているが、Layout比較、Humanによる選択、全画面・状態のVisual確認は未完了である。

特定Design Toolの認証・接続を前提にせず、交換可能な設計手段でLearner UXを比較・確定できる工程へ変更する。

#### 目的

複数レイアウトを比較し、Learner UIの画面・学習フローを確定する。

PCを優先し、Humanが暫定採用したLayoutのみをStatic HTML/CSS Mockへ展開する。全画面・状態・WireflowのValidation後に採用を確定し、日本語のBehavior / UX Contractと画面別データ一覧を完成させる。

#### 対象範囲

- Layout A / B / Cの3案比較。
- Home / Question / Result / Learning Progressの4代表画面。
- 共通の架空Fixture、日本語UI、共通のPC表示条件。
- 8評価軸による比較と、良い点・懸念点・向いている画面の記録。
- Humanによる暫定採用。
- 暫定採用案のみの全画面Static HTML/CSS Mock。
- Loading / Empty / Fetch Error / Retry、保存中・保存失敗・提出・未回答の状態。
- 全画面・状態・WireflowのValidation。
- 重大なLayout問題がある場合のHuman再判断。
- 採用確定後の`docs/ux/learner-ui.md`。
- 必要な場合のみReview Snapshot。

#### 維持するLearner UX Contract

- Practiceは10問、Mock Examは20問とする。
- 抽選・不足判定・重複判定はQuestion stable identity単位とする。
- 選択したQuestionごとに開始時点のPublished QuestionRevisionを1件解決する。
- Question stable identity、QuestionRevision ID、順序をSession開始前にSnapshot固定する。
- 開始後の新Revisionを既存Sessionへ反映せず、Resumeでも再抽選しない。
- 進行中SessionはUser × Certification × Modeごとに最大1件とする。
- Practiceは各問の回答確定・保存成功後に採点・正解・解説・Sourceを表示する。
- Practiceの確定回答は変更できない。
- Mock Examは時間制限なしとし、最終提出前は回答編集・問題移動が可能である。
- Mock Examの途中保存と最終提出を分離する。
- 古い保存成功応答で最新回答を保存済みにしない。
- 最新回答が未保存の間は最終提出を許可しない。
- 回答前・最終提出前のClientへ正解情報そのものを渡さない。
- 回答前Viewはanswer-bearing Fixtureを読み込まない。
- 保存成功と結果取得成功を別状態として扱う。
- Loading、正常なEmpty、Fetch Error、Retryを区別する。
- HistoryはUserAnswerが参照した回答時点のQuestionRevisionを表示する。
- Single Choice / Multiple Selectは完全一致、部分点なしとする。
- Mock Examの未回答は不正解とし、20問を正答率の分母に含める。
- Learning ProgressはPractice / Mock Examを分離する。
- 分野別の同一Questionの重複計上を避け、回答のない分野は「未学習」と表示する。
- HistoricalとActive SessionのQuestionRevision / Source利用不可ルールは後続Issueへ残す。

#### 設計工程

```text
UX Contract
    ↓
3 Layout Candidates
    ↓
4 representative screens × 3案比較
    ↓
Humanによる暫定採用
    ↓
暫定採用案のみ全画面Static Mockへ展開
    ↓
全画面・状態・Wireflow Validation
    ├─ 重大なLayout問題なし → 採用確定
    │                           ↓
    │                     learner-ui.md確定
    │                           ↓
    │                     後続React実装
    │
    └─ 重大なLayout問題あり → Humanへ問題報告
                                ↓
                          比較・選択Checkpoint
                                ↓
                          Humanが再判断
```

#### Acceptance Criteria

- [ ] 特定Design Toolの認証・接続を完了条件としていない。
- [ ] 3 Layout × 4代表画面を比較できる。
- [ ] A/B/Cで同じFixture内容と日本語UIを利用している。
- [ ] 8評価軸、良い点、懸念点、向いている画面が記録されている。
- [ ] Humanが暫定採用を判断でき、選択理由を追跡できる。
- [ ] 全画面Validationで重大問題があればHumanの再判断へ戻れる。
- [ ] Question stable identityによる抽選とSession SnapshotのContractがある。
- [ ] Practice / Mock ExamのFlowと回答前後のData Boundaryがある。
- [ ] 回答前後のFixtureが物理分離され、回答前Viewから回答後Fixtureをloadしない。
- [ ] 保存、最終提出、結果取得の成功・失敗・Retryを区別できる。
- [ ] 主要読取画面のLoading / Empty / Fetch Error / Retryを確認できる。
- [ ] History / Learning Progressと画面別データのContractがある。
- [ ] 暫定採用案の全画面Static HTML/CSS MockをPCで確認できる。
- [ ] 全画面・状態・WireflowのValidation後に採用が確定している。
- [ ] `docs/ux/learner-ui.md`に確定したBehavior / UX Contractが記録されている。
- [ ] API、DB、Persistence、Production React、Domain変更を先取りしていない。

比較Prototype完成と最初のHuman Checkpointは、Issue #9全体の完了とは区別する。

#### 依存Issue

- #1 refriq MVPのスコープと完了条件。
- #6 Core Domain Model / lifecycle invariants。
- #7 Source Governance。
  - Source利用可否。
  - provenance。
  - publish gate。
  - SourceRevisionの扱い。
- #8 Knowledge / Question Pipeline。
  - QuestionRevision Candidate。
  - Human Review。
  - Published QuestionRevisionまでの責務境界。

これらの意味を変更せずLearner UIから利用する。実システム接続をPrototype作成の前提にしない。

#### 検証方法

- 同じFixtureを使った3 Layout × 4画面の比較。
- PC表示、長文、Single Choice / Multiple Select、Navigation、一覧性の確認。
- 回答前Viewが読み込むHTML / JS / Fixtureに正解情報が含まれないことの確認。
- Practice / Mock Examの保存・提出・結果取得・RetryのWireflow確認。
- 主要読取画面のLoading / Empty / Fetch Error / Retry確認。
- HistoryとSession SnapshotのRevision参照確認。
- 全画面展開後の重大Layout問題とHuman再判断経路の確認。
- `git diff --check`。
- コード・設定変更時のRepository標準Validation。

#### 対象外

Production React UI、Hono API、API Payload Schema詳細、DB、DynamoDB、S3、Persistence、Authentication、Authorization、Production LLM、Kong AI、Reviewer UI、Exam Feedback入力、Domain変更、Source Governance・Pipelineの再設計、Mobile最適化、最終Visual polish、Design System本実装、Design ToolのRuntime integration、ゲーミフィケーション、適応型出題、通知。

#### 後続Issueへの引き継ぎ

- #10: Exam Feedback入力。
- #11・後続Application / API: Access Pattern、Snapshot利用、非同期保存、Data Boundary、Concurrency、Retry。
- #12・後続Persistence: Snapshot、回答、履歴、Projectionの保存。
- Source Governance・Session実装: Active Session内のQuestionRevision / Source利用不可。
- Source Governance・履歴表示実装: Historical QuestionRevision / Source利用不可。
- 後続Frontend: 採用確定したLayoutとBehavior Contractに基づくReact実装。
- 別Visual polish Issue: 配色、Font、細かな余白等。

### 2.4 GitHub Issue更新手順

今回のPlan修正フェーズではIssueを更新しない。

後続実行時には次の順に行う。

1. Issue #9の現在タイトル・本文を再取得する。
2. 新旧を比較し、既存UX Contractと無関係な情報を失わないことを確認する。
3. 目的・Acceptance CriteriaからFigma依存を除去する。
4. #7 / #8をContract上の依存として追加する。
5. 本Planの新しいTask Contractに合わせてタイトル・本文を更新する。
6. 更新後に再取得し、意図した変更が反映されたことを確認する。

前回調査ではGitHub CLIが利用可能で、Repositoryの編集権限も確認済みである。ただし、実行時の認証・権限を改めて確認する。

複数行の本文は一時ファイルへ正確に書き、`--body-file`を利用する。ラベル、担当者等の無関係なIssue属性を変更しない。

更新できない場合は、完成版タイトル・本文と実際の失敗理由を報告する。更新成功とは扱わない。

## 3. Human選択前の比較Prototype

### 3.1 Design Prototype strategy

Layout構造、情報階層、Navigationを比較するためのラフPrototypeを作る。

Design ToolはReplaceableとする。Excalidrawは任意の設計補助として利用できるが、直接操作できない場合も作業を止めない。

比較Prototypeは最小限のStatic HTML / CSS / JSで実現する。

- 新規Production dependencyを追加しない。
- Build systemを追加しない。
- `apps/web`へ混ぜない。
- Reactを利用しない。
- API、DB、Authenticationに接続しない。
- Fixtureのみを表示する。
- Git diffで確認できるRepository内のStatic filesとする。
- 日本語UI、PC優先とする。

`@excalidraw/excalidraw`をProduction dependencyへ追加しない。Whiteboard機能をrefriq本体へ実装しない。

### 3.2 Figma固有記述の安全な書換え

後続実行時に`learner-ui.md`を変更する場合は、§1.3のbaseline保護を先に実施する。

変更対象は成果物の役割、Figma接続前提、export前提、比較・採用工程、進行状況等とする。

以下は保持する。

- 学習体験と採点規則。
- Session開始・Snapshot・Resume。
- Data Boundary。
- 保存・Retry・結果取得の状態。
- 読取画面の状態。
- History / Learning Progress。
- 画面別必要データとDomain対応。
- 既存Wireflowと検証シナリオ。
- 後続Issueへの引き継ぎと未決事項。

この段階で同文書を最終版としない。採用確定は全画面Validation後である。

READMEの既存リンク追加は維持する。

### 3.3 Layout A / B / C

| Layout | 構造 | 比較する意図 |
| --- | --- | --- |
| A: シンプル縦配置 | 上部Navigation + 中央Content | 問題文の読みやすさと学習開始の分かりやすさ |
| B: ダッシュボード配置 | 左Navigation + Card / List | Progress、履歴、一覧性 |
| C: 2ペイン配置 | Main content + Supporting information | 回答後のExplanation、Source、結果確認 |

共通のFixture、文言、PC幅、基本的な色・Font条件を利用し、配置と情報階層を比較する。最終Visual polishは行わない。

Cの回答前Supporting informationには、問題位置、User自身の回答状況等だけを置く。正解、Explanation、Sourceを置かない。

### 3.4 Representative screens

各Layoutで次の4画面を作る。

| 代表画面 | 比較対象 |
| --- | --- |
| Home | 学習開始、再開、資格、モード別概要への導線 |
| Question | 長い問題文、Single / Multiple Select、現在位置、回答操作 |
| Result | Score、Topic別正答率、誤答・Explanation / Sourceへの導線 |
| Learning Progress | Practice / Mockの分離、履歴、分野別集計、未学習表示 |

3 Layout × 4画面 = 12 comparison viewsとする。

全対象画面を3案ずつ作らない。Questionの回答前と回答後の表示差は、状態別Viewとして確認する。回答前のdocumentへ回答後データを先に読み込まない。

### 3.5 Prototype構成とFixtureの物理分離

予定構成:

```text
docs/ux/mockups/
├── index.html
├── view.html
├── styles.css
├── comparison.js
├── view.js
├── comparison.md
└── fixtures/
    ├── question-before.js
    ├── result-after.js
    └── overview.js
```

| ファイル群 | 責務 |
| --- | --- |
| index.html / comparison.js | A/B/Cと4代表画面の比較導線、各Viewの表示、拡大表示への導線 |
| view.html / view.js | Layout・画面・状態に応じた独立したViewの表示 |
| styles.css | 共通の表示条件とA/B/Cの配置差 |
| comparison.md | 8評価軸、良い点、懸念点、向いている画面、Humanの判断記録 |
| question-before.js | 回答前に許可された問題・選択肢・表示情報 |
| result-after.js | 回答確定後・最終提出成功後に利用する結果・解説・Source |
| overview.js | Home / Learning Progress用の既存履歴・概要。回答前問題の正解情報は含めない |

単一の`fixtures.js`へ回答前後の全情報をまとめる構成は採用しない。

#### 回答前Fixture

含めてよい情報:

- stem。
- options。
- display metadata。
- question type。
- navigation表示用情報。
- 必要な場合のUser自身の回答状態。

含めない情報:

- correctOptionIds。
- correctness。
- score。
- Explanation。
- Option Explanation。
- optionごとの正誤理由。
- 正解を直接推測できる情報。
- answer-revealing Source。
- Source・出典リンク。

#### 回答後Fixture

回答確定・保存成功後、またはMock Exam最終提出成功後の画面でのみ利用する。

含めてよい情報:

- correctOptionIds。
- correctness。
- score。
- Explanation。
- Option Explanation。
- Source。

A/B/Cはそれぞれ同じ回答前Fixture、同じ回答後Fixture、同じ概要Fixtureを利用する。Layoutによって問題文、選択肢、結果、履歴を変えない。

#### Loading rule

回答前Question Viewでは`result-after.js`自体をloadしない。

- 回答前HTMLへ正解情報を埋め込まない。
- 回答前Viewが読み込む共通JSへ正解情報を埋め込まない。
- 非表示DOM、data属性、コメント、hidden要素へ正解情報を置かない。
- CSSで隠して保持しない。
- JS変数へ保持したまま表示だけ止めない。
- 回答後Fixtureをpreload・先読みしない。
- 全Fixtureをまとめたbundleを回答前Viewへ読み込ませない。

各Viewのdocumentに必要なFixtureだけを読み込む。比較ページは各Viewを分けて扱い、回答後のデータを回答前Viewへ集約・注入しない。

回答前・回答後の切替は、対応する状態のViewへ移動して確認する。回答前状態へ戻したdocumentに回答後Fixtureを保持する方式は採用しない。

Resultの比較Fixtureは、回答前Questionとは別の完了済みSessionのものとし、比較中の回答前問題の正解を漏らさない。

Home / Learning Progressの概要Fixtureも、現在の回答前Questionの正解・解説を含めない。

Static MockはSecurity機構そのものではない。Productionで要求されるData Boundaryを、Viewが受け取る情報とFixtureの読み込み構成で再現する。

### 3.6 Static viewingと操作範囲

相対パスのStatic filesと通常のscript読み込みで表示できるようにする。Fixture取得のためのAPI、fetch、Build、CDN、外部Fontを必要としない。

PC確認の基準は1280pxと1440pxの幅とする。

許可する操作は、比較・表示・Layout / screen / state切替、拡大表示、選択肢の選択状態等、設計確認に必要なものに限定する。

以下は実装しない。

- 実際のランダム抽選。
- Production採点処理。
- Production集計処理。
- 実際の回答保存・提出。
- localStorage / IndexedDB等によるPersistence。
- Backend連携。

保存・提出・結果はFixture状態の再現とする。

長い日本語の問題文、設定例・コマンド、Single Choice、Multiple Selectを確認できる架空データを用いる。Exam Dumpや実試験問題はFixtureに利用しない。

### 3.7 Layout比較基準

| 評価軸 | 確認内容 |
| --- | --- |
| 問題文の読みやすさ | 長いシナリオ、設定、コマンドを追いやすいか |
| 選択肢の操作性 | 単一・複数選択、選択状態、回答操作が分かるか |
| Explanation / Source | 回答後に理由と出典を追いやすいか |
| 現在位置 / Progress | 問題番号、回答済み・未回答、保存状態を把握できるか |
| 履歴 / Learning Progressの一覧性 | 過去の回とTopic別傾向を見渡せるか |
| Navigation | 開始、再開、回答、提出、結果、履歴の導線が分かるか |
| PC情報密度 | 必要な情報が収まり、過密・過度な余白を避けられるか |
| 画面間の一貫性 | 操作位置と情報階層が画面間で揃うか |

数値Scoreは必須にしない。

各Layoutについて、実際のPrototypeを確認して次を記録する。

| Layout | 良い点 | 懸念点 | 向いている画面 |
| --- | --- | --- | --- |
| A | 比較後に記録 | 比較後に記録 | 比較後に記録 |
| B | 比較後に記録 | 比較後に記録 | 比較後に記録 |
| C | 比較後に記録 | 比較後に記録 | 比較後に記録 |

比較前に評価結果や採用案を確定しない。

## 4. Human Checkpointと採用後の全画面展開

### 4.1 最初のHuman selection checkpoint

12 comparison viewsが完成したら、次を報告して停止する。

1. Rollback investigation。
   - Keep。
   - Rewrite。
   - Remove。
   - Not Created。
2. Issue #9。
   - 新タイトル。
   - 更新結果。
   - Figma依存を除去した内容。
3. New Plan。
   - 主要変更点。
4. Prototype。
   - 作成ファイルと閲覧方法。
5. Layout Comparison。
   - A/B/Cの良い点、懸念点、向いている画面。
   - 8評価軸の比較。
6. Validation。
   - 実施結果。
   - 未実施の確認と理由。
7. Scope。
   - Production実装等を行っていないこと。
8. Human Decision Required。

最後に次を明確に確認する。

**Layout A / B / C のどれを暫定採用しますか？**

この選択は全画面展開へ進むための暫定採用である。採用確定ではない。

Humanの回答が得られなければ停止を維持する。Codexが自動で案を選ばない。

今回のPlan修正・保存フェーズでは、この選択自体を求めない。

### 4.2 暫定採用後のMock strategy

Humanが暫定採用した案だけを、詳細なStatic HTML/CSS Mockへ展開する。

選択した案、選択理由、残る懸念を比較記録へ残す。

全画面Mockは`docs/ux/mockups/selected/`へ配置する。Fixtureは§3.5の回答前後の物理分離とLoading ruleを維持する。

全画面展開後も次を維持する。

- Fixtureのみ。
- Static HTML / CSS / 最小限JS。
- API / DB / Authentication接続なし。
- Production Business Logicなし。
- actual persistenceなし。
- React Applicationへの統合なし。

### 4.3 Learner screensと必要データ

採用案で対象とする画面は次のとおり。

| 画面 | 目的・主な操作 | 必要な論理データ |
| --- | --- | --- |
| Home | 資格、学習開始、モード別Session再開、Progressへ進む | Certification、モード別進行状況、既存履歴・累積概要 |
| Certification Detail | 資格・Topic、開始条件、Progressを確認する | 資格・分野情報、利用可能な一意Question数、モード別Session |
| Practice Start | 10問と即時解説を確認して開始する | User・Certification・Mode、必要数10、開始可否、不足理由 |
| Mock Exam Start | 20問・時間制限なし・提出後結果を確認する | User・Certification・Mode、必要数20、開始可否、不足理由 |
| Question Practice | 問題を読み選択・回答確定する | 固定Question / Revision、stem、options、type、番号、User選択・保存状態 |
| Question Mock | 回答編集・問題移動・途中保存・提出へ進む | Snapshot、stem、options、回答・保存状態、未回答数、Navigation |
| Explanation | 保存成功後の正誤・正解・理由・Sourceを確認する | 確定回答、回答対象Revision、正解、Explanation、Option Explanation、Source |
| Result | 正答数・率・Topic別結果から詳細へ進む | Session・Mode、提出状態、正答数、分母、Topic別集計、誤答・未回答参照 |
| Incorrect Answer List | その回の誤答・未回答から詳細へ進む | Session、回答時点Revision、一覧用本文、Topic、誤答・未回答 |
| Incorrect Answer Detail | 回答時点の問題と理由・Sourceを確認する | UserAnswerのRevision、問題・選択肢、自分の回答、正解、Explanation、Source |
| Topic Accuracy | その回または累積のTopic別傾向を確認する | 集計対象、Topic、正答数、対象件数、率、未学習の区別 |
| Learning Progress | モード別累積・履歴・再開導線を確認する | User・Certification・Mode、累積集計、Topic集計、Session履歴・参照 |

これは画面に必要な論理項目であり、API Payload、TypeScript型、DB Schemaではない。

既存`learner-ui.md`のL01〜L12の対応表と矛盾しないようにする。

Source情報は回答時点RevisionのQuestionSourceから特定SourceRevision・SourceDocumentへ辿れる情報とする。現在のSource本文から過去の正解・根拠を推測し直さない。

Reviewer UIは対象外とする。Exam Feedback入力は#10の責務とし、既存方針どおり導線の確認に留める。

### 4.4 全画面・状態・Wireflow確認

最低限、次の状態を確認可能にする。

- 通常表示。
- Loading。
- Empty。
- Save in progress。
- Save failed。
- Fetch failed。
- Retry。
- Submitted。
- Unanswered。

全画面で必要な操作、状態、遷移、データ表示時点を確認する。

重点確認対象:

- Incorrect Answer Detail。
- Topic Accuracy。
- Explanation。
- Mock Exam navigation。
- Loading / Empty / Fetch Error。
- Save Errorと結果取得Error。
- 長い問題文・選択肢・解説・Source。
- PC幅での一覧・集計。

### 4.5 重大問題と再選択経路

次のようにLayout選択そのものに影響する問題があれば、Humanへ報告して比較・選択Checkpointへ戻る。

- 主要画面で情報階層が成立しない。
- Navigation構造が成立しない。
- Question / Explanationが共存できない。
- Learning Progressが実用的に表示できない。
- Error / Loading状態を配置できない。

報告には、該当画面・状態、具体的な問題、Layout選択への影響を含める。

Humanが再判断するまで、別Layoutへ変更しない。Codexが「Aに問題があったためBへ変更する」と決定しない。

軽微な余白、文言、局所的な配置の問題は、既存の暫定採用案の中で調整する。軽微な問題のたびに再選択へ戻さない。

### 4.6 採用確定

全画面・状態・WireflowのValidationで重大なLayout問題がないことを確認した後、採用確定として記録する。

採用記録には次を残す。

- 暫定採用したLayoutと理由。
- 全画面Validationで見つかった問題と対応。
- 再選択があればHumanの判断と理由。
- 最終的に採用確定したLayout。
- 後続Issueへ残す事項。

この時点で`learner-ui.md`を確定したBehavior / UX Contractとして整える。

後続React実装は採用確定した成果物を利用する。Issue #9内ではProduction Reactを実装しない。

## 5. 維持するUX Contract、Documentation、Validation、Handoff

### 5.1 Session SnapshotとQuestion selection

Questionはstable identity、QuestionRevisionはimmutable revisionである。

Sessionの抽選単位はQuestion stable identityとする。

```text
UserがCertification・Modeを指定して開始要求
    ↓
現在利用可能なQuestion stable identityを列挙
    ↓
利用可能な一意Question数が必要問題数以上か確認
    ├─ 不足 → 開始不可・不足理由を表示
    └─ 必要数以上
          ↓
      Questionをランダム選択
          ↓
      各Questionの開始時点Published QuestionRevisionを1件解決
          ↓
      問題順を確定
          ↓
      Question stable identity
      QuestionRevision ID
      order
      をSession Snapshotへ固定
          ↓
      Session開始
```

必要問題数はPractice 10問、Mock Exam 20問とする。

不足判定はPublished Revision件数ではなく、現在利用可能な一意Question数で行う。

Q001にRevision 1とRevision 2が存在しても2問とは数えない。一意Questionが9件、Revisionが12件でも10問Practiceは開始不可である。

同一Session内で同一Question stable identityを複数回選択しない。

全Topicを対象とするランダム選択を維持し、適応型出題を追加しない。

Session開始後はQuestion stable identity、解決済みQuestionRevision ID、orderを変更しない。新RevisionがPublishされても開始済みSessionへ反映しない。

新Sessionはその開始時点で利用可能なPublished QuestionRevisionを利用できる。

Publishedの意味とSource利用可否は#6・#7・#8のContractに従う。Issue #9で独自定義しない。

DB構造、Query、Snapshot保存方式、Publish処理は設計しない。

### 5.2 Active Session granularity

概念上、User × Certification × Modeごとに進行中Sessionを最大1件とする。

ModeはPractice / Mock Examとする。同じUser・Certificationでも両ModeのSessionを別々に持てる。

MVPではCertificationは1つだが、Session対象としてCertificationを明示する。

同じ組み合わせで新Sessionを始める場合は、既存Sessionの終了確認を挟む。Practiceの確定回答は履歴へ残し、未提出Mock Examは採点しない。

DB UNIQUE、PK、Persistence ModelはIssue #9で設計しない。

### 5.3 Practice flow

```text
Question表示
    ↓
回答選択
    ↓
回答確定操作
    ↓
保存中
    ├─ 失敗 → 回答保持・Error・同じ回答をRetry
    └─ 成功 → 確定回答
                ↓
            採点・解説取得
                ├─ 失敗 → 確定済みを維持・結果取得だけRetry
                └─ 成功 → 正誤・正解・Explanation
                           Option Explanation・Source
                                ↓
                            Next Question
                                ↓
                            10問完了後Result
```

保存成功前は正解・Explanationを表示せず、次問題への確定遷移を行わない。

保存中は回答編集、再確定、次問移動を止める。

保存失敗時は回答を保持し、変更・次問移動を止めたまま同じ回答をRetryできる。

保存成功後の確定回答は変更不可である。

保存成功後に結果取得だけが失敗した場合は、確定済みを維持し、回答を再保存しない。

### 5.4 Mock Exam flow

時間制限なしとする。最終提出前は問題間移動と回答変更を可能にする。

```text
Question
    ↓
Answer edit
    ↓
Intermediate save
    ↓
Navigation・回答変更
    ↓
全ての最新回答状態が保存済みか確認
    ├─ 未保存あり → 最終提出不可
    └─ 保存済み
          ↓
      Final Submit操作
          ↓
      未回答があれば確認
          ↓
      Final submission saving
          ├─ 失敗 → 回答保持・未提出・同じ提出をRetry
          └─ 成功 → 提出済み
                      ↓
                  Scoring / Result取得
                      ├─ 失敗 → 提出済み維持・結果取得だけRetry
                      └─ 成功 → Result・正解・Explanation・Source
```

途中保存成功は最終提出成功を意味しない。

最終提出の保存中は回答編集、問題移動、再提出を止める。

最終提出失敗時は提出済み扱いにせず、回答を保持し、回答変更を止めたまま同じ提出をRetryできる。

最終提出成功後の結果取得失敗では提出済みを維持し、再提出しない。

### 5.5 Async save consistency

途中保存中もMock Examの回答編集と問題移動を許可する。

保存成功は「その保存要求に含まれていた回答状態」についてのみ成立する。

```text
Answer A
    ↓
Save A開始
    ↓
UserがBへ変更
    ↓
Save A成功
    ↓
Aは保存成功済み
現在表示中のBは未保存
    ↓
Bの保存成功を確認するまでFinal Submit不可
```

古い保存成功responseで最新回答を保存済みにしない。

途中保存失敗でも最新回答を保持し、編集・移動・Retryを可能にする。

request sequence、version number、updatedAt、optimistic concurrency、idempotency key等の具体策は後続Application設計で決める。

### 5.6 Answer Data Boundary

表示を隠すだけでなく、解禁前には正解情報そのものをClientへ渡さない。

| 時点 | 利用可能な情報 | 利用できない情報 |
| --- | --- | --- |
| Practice回答確定・保存成功前 | stem、options、表示metadata、type、Navigation情報、User自身の回答状態 | correctOptionIds、correctness、score、Explanation、Option Explanation、正答を推測できる情報、Source |
| Practice回答確定・保存成功後 | 上記に加え、その確定回答の正解、正誤、Explanation、Option Explanation、Source | 未確定の別問題には回答前境界を継続 |
| Mock Exam最終提出成功前 | stem、options、User自身の回答状態、Navigation metadata | correctOptionIds、score、正誤、Explanation、Option Explanation、answer-revealing Source |
| Mock Exam最終提出成功後 | 正解、採点結果、Explanation、Option Explanation、Source | 未提出の別Sessionには提出前境界を継続 |

Source・出典リンクは正答を直接示す可能性があるため、Practiceでは回答確定・保存成功後、Mock Examでは最終提出成功後に表示する。

Static MockのFixture構成・Loading ruleもこの境界に従う。

API Endpoint、Payload Schema、取得実装はIssue #9で定義しない。

### 5.7 Save / Retry / Error状態

| 状態 | 必要な表示・操作 |
| --- | --- |
| Practice save in progress | 保存中を表示。編集・再確定・次問移動を停止。正解情報は渡さない |
| Practice save failed | 回答を保持。Errorを表示。同じ回答をRetry可能 |
| Practice save succeeded | 確定回答を維持し、採点・解説取得へ進む |
| Mock intermediate save in progress | 編集・移動可能。最新回答の保存状態を区別 |
| Mock intermediate save failed | 最新回答を保持。編集・移動・Retry可能。未保存なら提出不可 |
| Mock final submission in progress | 編集・移動・再提出を停止。成功確認までは未提出 |
| Mock final submission failed | 回答保持。未提出を維持。同じ提出をRetry可能 |
| Result fetch failed | 確定・提出成功を維持。結果取得だけRetry可能 |

保存成功と結果取得成功を別状態とする。

Retryによって二重回答・二重提出にならないことを後続Application要件として渡す。TransactionやIdempotencyの方式は決めない。

### 5.8 Loading / Empty / Fetch Error / Retry

対象はHome、Certification Detail、Result、Incorrect Answer List、Incorrect Answer Detail、Topic Accuracy、Learning Progressとする。

```text
読取開始
    ↓
Loading
    ├─ 成功・データあり → 通常表示
    ├─ 成功・データなし → Empty
    └─ 取得失敗 → Fetch Error
                      ↓
                  UserがRetry
                      ↓
                  Loading
```

| 状態 | Contract |
| --- | --- |
| Loading | データ取得中であることが分かる |
| Empty | 取得成功後の該当データなし。履歴なし、未学習、誤答なし等を画面に応じて表示 |
| Fetch Error | 取得失敗であることが分かる。正常Emptyへ置き換えない |
| Retry | Userが再取得できる。再取得時はLoadingへ戻る |

取得失敗を利用可能問題数0、正答率0%、未学習、誤答なし、履歴なしとして表示しない。

HTTP Status、API Error Schema、Retry回数、exponential backoff、cache、network libraryは設計しない。

### 5.9 Resume

```text
Existing Session Snapshot
    ↓
same Question stable identity
same QuestionRevision
same order
saved answers
    ↓
Resume
```

通常の再開では再抽選しない。

Practiceの確定回答は変更不可、Mock Examの未提出回答は編集可能とする。

中断時に最新回答が未保存・保存中・保存失敗なら、保存・Retryへ案内し、中断完了として扱わない。

Snapshot内QuestionRevision / Sourceの後日利用不可は通常Resumeとは別の未決事項である。

### 5.10 History / Learning Progress / Scoring

HistoryはUserAnswerが実際に参照したQuestionRevisionを表示する。

後から新RevisionがPublishされても、過去の問題文・選択肢・正解・Explanation・Source参照を新Revisionへ置き換えない。

Resultには正答数、正答率、Topic別正答率、誤答・未回答から詳細への導線を含める。過去の完了回はLearning Progressから確認する。

誤答一覧は各回を対象とする。累積誤答一覧や誤答だけの演習を追加しない。

Single Choiceは正解との完全一致、Multiple Selectは正解集合との完全一致で1点とする。部分点なし。

Mock Examの未回答は0点とし、20問全てを正答率の分母に含める。Practice完了結果の分母は10問とする。

| 項目 | Learning ProgressのContract |
| --- | --- |
| 表示単位 | User・Certification・Mode。PracticeとMock Examを分離 |
| Practice反映 | 各問の回答確定・保存成功後。中断・終了後も確定回答を含める |
| Mock反映 | Final Submit成功後。途中保存・未提出状態は集計しない |
| 再回答 | 別Sessionでの回答は新しい回答として毎回累積 |
| 全体件数 | 1回答のQuestionを1回だけ数える |
| Topic別件数 | 対象Revisionに関連する各Topicへ1回答1回ずつ計上 |
| Topic内重複 | 同じTopicのKnowledgePointが複数でも重複計上しない |
| 複数Topic | Topic件数の合計が全体件数を超える場合がある |
| 回答なし | 正答率0%ではなく「未学習」 |

LearningProgressは既存Domainの回答履歴から再構築可能なProjectionとして扱う。新たなDomain Aggregateや更新・保存実装を追加しない。

### 5.11 Documentationと成果物の責務

| 成果物 | 責務 |
| --- | --- |
| docs/ux/issue-9-plan.md | Issue #9のexecution plan。現在状態、実行順序、Issue更新予定、Prototype、Checkpoint、Validation、Handoff |
| Design Prototype / comparison.md | Layout比較、Wireframe、情報階層、比較評価、Human判断記録 |
| 採用確定後のStatic HTML/CSS Mock | Visual / Layoutと画面・状態配置を確認する成果物 |
| docs/ux/learner-ui.md | 最終的なBehavior / UX Contractの正本 |
| docs/ux/learner-ui-assets/ | 必要な場合のReview Snapshot。画像自体は仕様の正本ではない |

`learner-ui.md`に記載する内容:

- Screen purpose。
- Operations。
- State。
- Transition。
- Required data。
- Session SnapshotとRevision固定。
- Answer / Resultの表示・取得時点。
- Error / Retry。
- Data Boundary。
- 後続ApplicationへのHandoff。
- 比較記録・採用確定成果物への参照。

必要に応じてMermaidでScreen transition、Practice flow、Mock Exam flow、Session lifecycleを記載する。

既存文書をゼロから破棄せず、baselineとの差分で維持・書換え・追加を確認する。

今回は同文書を最終版へ更新しない。Humanの暫定採用、全画面Validation、採用確定の後に確定する。

未作成画像を参照せず、画像の作成を文書理解の前提にしない。

### 5.12 実行順序と停止位置

| Phase | 作業 | 終了条件・停止位置 |
| --- | --- | --- |
| 今回 | 承認4点のPlan修正・保存・確認 | Plan保存後に停止。後続Phaseへ進まない |
| 調査 | 最新Issue、Working Tree、既存文書、untrackedを再確認 | Keep / Rewrite / Remove / Not Createdを確定 |
| Contract更新 | 新旧差分を確認してIssue #9を更新 | 更新結果を再取得。失敗なら本文と理由を報告 |
| 比較準備 | baseline保護後、Figma固有記述だけを必要に応じて変更 | 既存UX Contractを保持 |
| 比較Prototype | 3 Layout × 4代表画面を共通Fixtureで作成 | Comparison Validation完了 |
| Checkpoint 1 | 比較結果をHumanへ提示 | 暫定採用の回答が得られるまで停止 |
| 全画面Mock | 暫定採用案だけを全画面・状態へ展開 | 全画面・状態・Wireflow Validation |
| 再判断 | 重大なLayout問題があればHumanへ戻す | Humanが再判断するまでLayout変更を停止 |
| 確定 | 重大問題なしを確認して採用確定、Behavior文書を整える | Issue #9の成果物とACを確認 |
| Handoff | 後続IssueへContract・未決事項を渡す | Production実装へ自動的に進まない |

### 5.13 Validation

#### 今回のPlan保存後

最低限、次を実行する。

```bash
git status --short
git diff --check
```

`docs/ux/issue-9-plan.md`がuntrackedなら通常の`git diff`には本文が出ないため、ファイルを直接全文再読する。

```bash
cat docs/ux/issue-9-plan.md
```

確認対象:

- Plan全文が省略なく保存されている。
- Markdownだけで読める。
- 見出し、Markdown table、Flow、command blockが成立している。
- 承認された4点が明示されている。
- 既存Planの情報とUX Contractを失っていない。
- READMEと既存untracked文書が保持されている。
- 今回追加したのがPlan Markdownのみである。
- Productionコード、依存、設定、Repository標準Validationへ影響していない。
- untracked Plan自体の末尾空白、改行、リンク等も直接確認している。

`git add`は行わない。

Plan Markdownのみの追加なら`make check`は必須ではない。実施した検証を報告する。

#### Comparison Prototype

- 3 Layout × 4 Screensが確認できる。
- A/B/Cで同じFixture内容、日本語UIを使っている。
- PC幅1280px / 1440pxで表示を確認できる。
- Long question text、設定・コマンドを確認できる。
- Single Choice / Multiple Selectを認識・操作できる。
- Explanation / Sourceを回答後のViewで比較できる。
- Learning Progressの履歴・集計・未学習表示を比較できる。
- Static filesのみで表示できる。
- Productionコード、Build、依存を変更していない。

Data Boundaryは画面表示だけで確認しない。

- 回答前ViewのHTMLを確認する。
- 回答前Viewが読み込む共通JSとFixtureを確認する。
- correctOptionIds、correctness、score、Explanation、Option Explanation、answer-revealing Sourceが含まれないことを確認する。
- DOM、属性、コメント、非表示要素、JS変数への正解情報の埋込みがないことを確認する。
- 回答前Viewから回答後Fixtureのload・preload・先読みがないことを確認する。
- 実ブラウザを利用できる場合は、読み込まれたscript / resourceも確認する。

Static Mockの確認を、Production Security実装の完了と報告しない。

#### 全画面Mock・Wireflow

- 対象12画面と必要データの対応。
- Practice保存前後とMock提出前後のData Boundary。
- 保存成功前の正解表示・次問遷移禁止。
- Save A成功後も現在のBが未保存のままであること。
- 未保存最新回答がある間のFinal Submit禁止。
- 保存失敗と結果取得失敗の分離。
- 保存・提出をやり直さず結果取得だけRetryできること。
- 主要読取画面のLoading / Empty / Fetch Error / Retry。
- Session Snapshot、Resume、回答時点RevisionのHistory。
- Practice / MockのProgress分離とTopic内重複防止。
- 重大Layout問題があればHumanへ戻る経路。
- 採用確定前に最終文書・Production実装へ進んでいないこと。

これらはFixtureの状態確認とWireflowレビューであり、Backend実装の動作テストではない。

#### Repository標準Validation

```bash
git diff --check
make check
```

後続PhaseでHTML / CSS / JS等のコードを追加した場合は、AGENTS.mdに従ってRepository標準Validationを実行する。

Formattingが必要な場合は今回変更した対象に限定し、既存の無関係な変更を巻き込まない。

untrackedファイルは通常の`git diff --check`だけでは検査できないため、本文の直接確認も行う。

調査時点では利用可能なブラウザCLIが確認できていない。実行時に確認手段を再確認する。確認のためにProduction dependencyを追加しない。実ブラウザ確認ができない場合は、その項目を未実施として報告し、Visual確認済みと扱わない。

#### Plan全体の整合性確認

| No. | 確認項目 |
| --- | --- |
| 1 | Data BoundaryとFixture構成が一致している |
| 2 | 回答前Question Viewがanswer-bearing Fixtureをloadしない |
| 3 | #7 / #8へのContract上の依存が明記されている |
| 4 | Source GovernanceやPipeline、Publishedの意味を再定義していない |
| 5 | untrackedのlearner-ui.mdを保護・比較できる |
| 6 | Question stable identityとQuestionRevisionの役割が一致している |
| 7 | Session開始前にSnapshot固定が完了する |
| 8 | Resumeで再抽選しない |
| 9 | stale save responseで最新回答を保存済みにしない |
| 10 | Loading / Empty / Fetch Errorを混同しない |
| 11 | Human選択前に全画面Mockへ進まない |
| 12 | 全画面展開後の重大問題ではHumanが再判断できる |
| 13 | Layout変更をCodexが自動決定しない |
| 14 | Production実装へScopeを拡大していない |

### 5.14 Out of Scope

Issue #9では次を実装・設計しない。

- Production React UI、apps/webへの統合。
- Hono API。
- API Payload Schema詳細。
- DynamoDB、S3、DB Schema、PK、UNIQUE constraint。
- Persistence、Transaction。
- Authentication、Authorization。
- Production LLM、Kong AI。
- Domain Model変更、Domain Aggregate追加、Physical Schema追加。
- Source Governance、Publication、Knowledge / Question Pipelineの再設計。
- 非同期保存のsequence、version、optimistic concurrency、idempotency key等の方式決定。
- HTTP Status、API Error Schema、Retry回数、backoff、cache、network libraryの方式決定。
- Reviewer UI。
- Exam Feedback入力。
- Mobile polish。
- Visual design final polish。
- Design System本実装。
- Excalidraw runtime integration。
- Figma integration。
- ゲーミフィケーション、適応型出題、通知。

今回の作業では、さらにIssue実更新、Prototype実装、Layout選択、全画面Mock作成も行わない。

全Phaseを通じて次は禁止する。

- git reset。
- git restoreによる既存変更削除。
- git clean。
- stashによる退避・復元。
- unrelated refactor。
- commit。
- push。
- PR作成。

### 5.15 Handoffと後続Issueへ残す未決事項

| 引き継ぎ先 | 渡すContract・成果物 | 後続で決める事項 |
| --- | --- | --- |
| #11・Application設計 | Question単位の抽選、一意数判定、Snapshot、Session粒度、開始・再開、保存・提出・取得 | Query / Command、Consistency、Concurrency、非同期応答の対応付け、Idempotency |
| 後続API設計 | 回答前後Data Boundary、成功確認、読取・保存状態 | Endpoint、Payload、Error Schema、HTTP Status、取得・Retry方式 |
| #12・Persistence | Snapshot、途中・確定回答、履歴、モード別Progress | DB、PK、UNIQUE、Transaction、保存・Projection更新 |
| #7等のSource Governance・履歴表示実装 | Historical QuestionRevision / Sourceが後日利用不可となったケース | 履歴の表示可否・内容・Human判断 |
| Source Governance・Session実装 | Active Session Snapshot内QuestionRevision / Sourceが開始後利用不可となったケース | 再開・回答可否・Session継続・Human判断 |
| #10 | LearnerからExam Feedbackへの導線 | Feedback入力と関連Reviewer UI |
| 後続Frontend | 採用確定したStatic Mock、Behavior Contract、画面別データ、Wireflow | Production React実装 |
| 別Visual polish Issue | 採用確定したLayoutとBehavior | 配色、Font、部品、細かな余白 |

Historicalの未決事項:

「Historical QuestionRevision / Sourceが後日利用不可になった場合の履歴表示ルールは、Source Governanceおよび履歴表示実装Issueで決定する。」

Active Sessionの未決事項:

「進行中SessionのSnapshotに含まれるQuestionRevisionまたはSourceが、Session開始後に利用不可となった場合の再開・回答可否・Session継続ルールは、Source GovernanceおよびSession実装Issueで決定する。」

両ケースを区別する。

そのまま再開、回答不可、Session終了、Human判断、別表示等をIssue #9で勝手に確定しない。代替Questionへの再抽選も採用しない。

#7のSource Governanceと#8のPipelineの意味は維持し、必要な後続判断をそれぞれの責務へ引き継ぐ。

### 5.16 要確認の扱い

今回承認された4件以外の仕様判断は追加しない。

後続作業で新たな判断が必要になった場合は、確定事項へ混ぜず「要確認」として分離する。

実行環境上の未確認事項や、実施できなかったValidationも、仕様決定や検証成功として扱わない。
