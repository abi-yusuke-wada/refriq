# Learner UI Layout比較記録

対象: [Issue #9](https://github.com/abi-yusuke-wada/refriq/issues/9)。実行のTask Contractは[承認済みPlan](../issue-9-plan.md)、Behavior Contractは[learner-ui.md](../learner-ui.md)を参照する。

**現在の状態: HumanがLayout Cを最終採用。初回UXレビュー7件・再レビュー4件・最終レビューMinor 2件・PR独立レビュー2件を反映済み。12画面・必要状態の展開と再Validationは完了。learner-ui.mdへLearner UX Contractを確定反映済み。**

最新の実ブラウザ確認は204ケース（既存回帰128、初回7件の操作回帰27、再レビュー4件の操作回帰23、PR指摘の追加26）。PR指摘の保存ロック・全問正解結果の詳細往復を修正し、既存178ケースも再実行済み。結果は[Validation記録](selected/validation.md)を参照する。

## 閲覧方法

1. このディレクトリの[index.html](index.html)をブラウザで開く。Static filesのみで動作し、サーバー起動やBuildは不要。
2. A / B / CのHome、問題回答、結果、Learning Progressを比較する。「代表画面」で1画面だけを横並びにもできる。
3. 「PC表示」で各Viewを別タブに開く。比較一覧の縮小プレビューだけで判断せず、ブラウザ幅1280px / 1440pxで実寸を確認する。
4. 実寸Viewのレビュー用操作から、演習 / 模試、単一 / 複数選択、回答前 / 回答後を切り替える。Home・結果・Learning ProgressではLoading / Empty / Fetch Errorも確認できる。

比較ページの「PC幅」はプレビューの描画幅を切り替える。PC表示リンクは実際に開いたブラウザの幅を使う。

日本語、同じ架空Fixture、同じ基本色・Font条件で配置を比べる。最終配色・Font・Mobile最適化は今回の判断対象にしない。

## 12 comparison views

| Layout | Home | Question | Result | Learning Progress |
| --- | --- | --- | --- | --- |
| A: シンプル縦配置 | [開く](view.html?layout=A&screen=home) | [開く](view.html?layout=A&screen=question) | [開く](view.html?layout=A&screen=result) | [開く](view.html?layout=A&screen=progress) |
| B: ダッシュボード配置 | [開く](view.html?layout=B&screen=home) | [開く](view.html?layout=B&screen=question) | [開く](view.html?layout=B&screen=result) | [開く](view.html?layout=B&screen=progress) |
| C: 2ペイン配置 | [開く](view.html?layout=C&screen=home) | [開く](view.html?layout=C&screen=question) | [開く](view.html?layout=C&screen=result) | [開く](view.html?layout=C&screen=progress) |

全対象画面を3案ずつ作ってはいない。Questionの状態差と読取状態は代表画面の表示例であり、全画面・全状態のValidationは暫定採用後に行う。

## Layout比較

以下は作成したPrototypeのPC表示を確認した記録。数値Scoreや採用順位は付けない。

| Layout | 良い点 | 懸念点 | 向いている画面 |
| --- | --- | --- | --- |
| A | 中央の問題文・選択肢へ集中しやすい。上から下へ同じ順で読む構造を保ちやすい | 解説、進捗、履歴が下へ続き、長いページではスクロール量が増える | Question、学習開始を中心にしたHome |
| B | 左Navigationと広いCard / List領域により、集計と履歴を見渡しやすい | 左Navigationが横幅を使う。問題文の行が長くなりやすく、Card間の優先度を全画面展開時に確認する必要がある | Home、Learning Progress、Resultの一覧部分 |
| C | 主情報と補助情報を同時に見られる。問題と解説、分野別集計と履歴を対応づけやすい | 補助欄が狭く、長い解説やSourceが縦に伸びる。左右の情報量と優先度に注意が必要 | 回答後Question、Result、履歴を並べるLearning Progress |

### 8評価軸

| 評価軸 | A: シンプル縦配置 | B: ダッシュボード配置 | C: 2ペイン配置 |
| --- | --- | --- | --- |
| 問題文の読みやすさ | 中央の幅を制限して読み進める。長い文章でも読む場所が一定 | 内容領域が広く、設定例を置きやすい。長い行の読みやすさを確認する | 左の主欄に問題をまとめる。右欄と並べても1280pxで長文を確認できる |
| 選択肢の操作性 | 問題文の直後に同じ幅で配置。確定操作まで縦に追う | Card内で選択と操作をまとめる。主欄の横幅を確保しやすい | 主欄に選択肢、補助欄に進行状況を分ける。回答操作は主欄に置く |
| Explanation / Source | 問題の下で広い幅を使える。参照には縦スクロールが必要 | 問題の下のCardで読む。Sourceを長い文言でも表示しやすい | 問題と並べて読める。狭い補助欄では長い文言の折り返しが増える |
| 現在位置 / Progress | 問題番号は上、詳細な進行状況は問題の下。両者を同時に見にくい | 問題番号はCard上部、進行状況は後続Card。縦移動が必要 | 問題番号と右の進行状況を同時に確認しやすい |
| 履歴 / Learning Progressの一覧性 | 分野と履歴を順番に読む。履歴は下方になる | 広い表とCardで集計を見渡す。履歴は分野一覧の後に続く | 分野と履歴を左右で比較できる。履歴の日時・補足は折り返しが増える |
| Navigation | 上部の共通Navigationと各画面の操作で構成 | 左の共通Navigationで画面位置を示す。スクロール時の固定表示は今回実装していない | 上部の共通Navigationと主欄の操作で構成。補助欄には確認情報を置く |
| PC情報密度 | 余白と読む順序が明確。ページ全体の縦長さが増える | 左Navigationを除いた領域をCard / Listに使う。広い一覧を置ける | 左右を使って情報を収める。補助情報が多い場合は密度が上がる |
| 画面間の一貫性 | 全画面が上部Navigationと中央の縦配置で揃う | 全画面が左NavigationとCard構成で揃う | 全画面を主欄・補助欄で揃える。何を補助欄に置くかが展開後の確認点 |

## FixtureとData Boundary

| ファイル | 利用するView | 内容 |
| --- | --- | --- |
| fixtures/question-before.js | 回答前Questionのみ | 問題文、設定例、選択肢、Question identity / Revision参照、選択方式、User自身の回答、Navigation情報 |
| fixtures/question-after.js | 演習の保存成功後 / 模試の最終提出成功後Questionのみ | 同じ問題の固定された回答後例、正解、正誤、解説、Option Explanation、架空Source |
| fixtures/result-after.js | 完了済みの別SessionのResultのみ | 正答率、誤答、過去の別QuestionRevisionの解説・Source。回答前Questionの正解は含めない |
| fixtures/overview.js | Home / Learning Progressのみ | 既存履歴、演習・模試別概要、分野別集計、未学習、進行中Sessionの表示例 |

各Viewのdocumentは必要なFixtureを1つだけ読み込む。Questionの回答前Viewは`question-after.js`、`result-after.js`、`overview.js`を読み込まず、回答前HTML・共通JSにも正解情報を埋め込まない。回答後への切替は別documentへの移動であり、非表示DOMやJS変数で正解を先に保持する方式ではない。

Planにある回答後Fixtureを、現在のQuestion用と別SessionのResult用へさらに分けた。回答前QuestionとResultを同じ比較ページに並べても、ResultのFixtureから現在の問題の正解が分からない構成とする。

Static filesは閲覧可能な設計成果物であり、アクセス制御の仕組みではない。Productionで必要なData Boundaryを、Viewが受け取るデータと読み込み構成で再現する。

## Prototypeで確認できる操作と限界

- 長い問題文・設定例と、単一選択のradio / 複数選択のcheckboxを確認できる。
- 演習の「回答を確定する」は保存成功後の固定例へ移動する。Userが選んだ内容に応じた採点や保存は行わない。
- 模試の回答前例では、選択変更で最新回答を「未保存」にし、最終提出を無効にする。保存要求・保存応答は生成しない。
- 模試の問題Navigationは配置確認用。別の問題を抽選・取得しない。提出確認も固定例で、実際の提出はしない。
- 回答後は選択肢を編集不可にし、Explanation / Sourceを表示する。模試の回答後例は結果への導線を置く。
- Home・Result・Learning ProgressではLoading / 正常Empty / Fetch Errorを切り替えられる。「再取得する」はLoading例へ移動する。
- 演習 / 模試のLearning Progress、未学習の分野、回答時点Revisionの振り返り例を確認できる。
- 出典URLは`example.invalid`の架空リンク。実試験問題、実際のSource、API、Authentication、Persistenceは使わない。

比較Prototypeの範囲では、保存中・保存失敗・stale save response・最終提出失敗・結果取得失敗の全状態と、残りの画面・Wireflowは扱わない。暫定採用Cの全画面Mockで追加した確認結果は、[Validation記録](selected/validation.md)を参照する。

## 作成ファイル

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
    ├── question-after.js
    ├── result-after.js
    └── overview.js
```

Production Application、package manifest、lockfile、Build設定へ変更を加えない。Design Toolは固定せず、Runtime dependencyを追加しない。

## Validation記録

Chromiumでローカルの`file://`表示を確認した。

| 確認 | 結果 |
| --- | --- |
| 3 Layout × 4代表画面 | 比較ページの12Viewと各PC表示を確認 |
| PC幅1280px / 1440px | 24表示ケースで横方向のはみ出しなし |
| 共通Fixture | 各画面のFixtureがA/B/Cで一致 |
| 長い日本語問題・設定例 | PC表示とスクリーンショットで確認 |
| 演習 / 模試 × 単一 / 複数選択 × 3 Layout | 12ケースで回答前後、選択操作、回答後の編集不可を確認 |
| 回答前Data Boundary | 回答前Fixtureの禁止項目不在、読み込みscript、回答後データの不在を確認 |
| Resultの履歴分離 | 現在の回答前Questionのidentityを結果Fixtureに含めないことを確認 |
| Home / Result / Learning ProgressのLoading / Empty / Fetch Error | 27ケースとErrorからRetryへの操作を確認 |
| 外部通信 / JavaScriptエラー | 自動確認中のHTTP通信とpage errorは0件 |
| Static viewing | Build・ローカルサーバーなしで表示 |
| Repository標準Validation | `make check`を実行 |
| 差分確認 | `git diff --check`とuntrackedファイルの直接確認を実施 |

PC表示24、Question状態12、読取状態27の計63ケースを確認対象にした。ブラウザ確認用のツールとスクリーンショットはRepository外の一時領域を使い、Production dependencyには追加しない。

## Human判断記録

| 項目 | 状態 |
| --- | --- |
| 暫定採用Layout | Layout C（2ペイン配置）をHumanが暫定採用し、全画面展開・再Validationへ進めた |
| 採用理由 | Main contentとSupporting informationの責務を分離し、学習操作を中心にしながら継続・履歴・振り返りを並行表示できる。Bより管理画面感を抑え、Aより情報量を扱いやすい |
| 暫定採用後の確認点 | 長文・解説・Source、全画面のNavigation、履歴・分野一覧、Loading / Empty / Error、演習 / 模試の保存・提出状態 |
| 採用確定 | **Layout CをHumanが最終採用。learner-ui.mdへの確定反映を承認し、反映済み** |

暫定採用後は、その案だけを全画面Static Mockへ展開する。主要画面の情報階層やNavigationが成立しない、Question / Explanationを配置できない、Learning Progressが実用的に表示できない、Loading / Error状態を置けない等の重大な問題があれば、問題を報告して比較・選択Checkpointへ戻る。別案への変更は必ずHumanが決める。軽微な配置調整で毎回再選択は求めない。

### Human Decisionの詳細

- HomeはMainに今日の学習・主CTA、Supporting railに継続・履歴を置く。
- ResultはMainに結果本体、Supporting railに振り返り・誤答確認への導線を置く。
- Learning ProgressはMainに集計・分野別進捗、Supporting railに履歴・次の学習を置く。
- Questionは主欄の幅を優先し、細いrailに問題番号・全問題数・回答済み件数・保存状態・模試Navigationだけを置く。解説は保存・提出成功後の主欄下部で広く読む。
- 紫系はStatic Mock専用の暫定Tokenとする。白系の本文背景とSemantic success / warning / errorを維持する。会社の正式カラーとは扱わない。
- 全画面Validationで重大問題があればHuman判断の比較Checkpointへ戻る。Codexが別案へ変更しない。

[採用確定Cの12画面Mock](selected/index.html)と[Validation記録](selected/validation.md)を確認する。Human最終承認を受け、`learner-ui.md`へ採用理由・画面配置・操作・Brand方向・Validationを確定反映した。

### Human最終承認

最終確認「Layout Cを最終採用し、Issue #9のLearner UX Contractとしてlearner-ui.mdへ確定反映してよいですか？」に対するHumanの「OK！」を最終採用と正本への反映承認として記録する。既存UX Contractと承認済みPlanを維持し、新しい仕様判断は追加しない。Production実装・GitHub Issue更新・commit / push / PR作成の承認を意味しない。

以下の初回Validation・レビュー記録は各時点の履歴であり、「暫定採用」「Human判断待ち」は最終承認前の状態を示す。現在の採用状態は上記Human最終承認を参照する。

初回のC全画面MockはPC表示・必要状態・操作を含む126ケースを確認した。Layout選択そのものへ戻す重大問題は確認されず、続くHuman UXレビュー7件を以下のとおり反映した。Codexによる最終採用や別案への変更は行わず、Humanの最終判断を待つ。

### Humanが承認したUXレビュー7件

初回全画面Validation後のHumanレビューで以下7件すべてが承認された。Cの基本構造と既存UX Contractを維持して反映した。

| No. | 承認内容 | 反映結果 |
| --- | --- | --- |
| 1 | Learner向け内部Domain用語の除去 | 開始・再開・集計等の文言を自然な日本語へ変更。内部Contractは維持 |
| 2 | 中断とGlobal Navigationの統一 | 保存済みでも中断確認。未保存は離脱を止め、同じSnapshotへ再開 |
| 3 | Explanation上部のNext | 判定・正解の上部CTAと既存下部CTAが同じTransition |
| 4 | 結果に応じたPrimary CTA | 誤答・未回答ありは振り返り、全問正解は次の学習。振り返りは強制しない |
| 5 | 誤答詳細の前後Navigation | 同じ誤答集合の現在位置・前後移動・先頭/末尾のdisabled |
| 6 | Learning Progress Emptyの次Action | 学習開始Primaryから資格詳細へ。Fetch ErrorのRetryと分離 |
| 7 | Mock Exam railの可読性 | 3列・大きな番号と記号・Legend・太枠による現在位置 |

修正後は既存回帰128ケースと承認指摘の操作検証27ケース、合計155ケースを確認した。[更新したValidation記録](selected/validation.md)と[Review Snapshot](../learner-ui-assets/layout-c-review/README.md)を参照する。重大なLayout問題は確認されていないが、最終採用はHumanが判断する。

### Humanが承認した再レビュー4件

更新後Mockへの再レビュー4件をHumanが全件承認した。CのMain / Supporting rail、Questionの簡略C、紫系暫定Token、既存UX Contractを維持して反映した。

| No. | 承認内容 | 反映結果 |
| --- | --- | --- |
| 1 | 模試railで回答有無と保存状態を分離 | 回答なし・保存済み・未保存・保存失敗・現在問題を記号、文字、aria-label、枠で区別。失敗・Retryは模試の途中状態を対象と明示。物理保存単位は定義しない |
| 2 | 誤答詳細下部の前後Navigation | 上下が同じ誤答集合・順序・Navigation定義を使う。先頭・末尾のdisabled、一覧・結果への導線を維持 |
| 3 | Empty / Fetch ErrorのProduct copy | Learnerへ履歴なし・開始案内、または読込み失敗・再取得案内を表示。内部名・状態説明はレビュー欄へ限定 |
| 4 | learner-ui.mdの受入状況を実態へ更新 | 12画面、状態、UX Review、実ブラウザ再確認を完了済みとして記録。最終採用・最終Contractは未承認のまま |

既存回帰128、前回7件の操作回帰27、今回の操作検証23の合計178ケースを実ブラウザで確認した。確認範囲でLayout選択を妨げる重大問題は見つかっていない。**Layout Cは暫定採用であり、最終採用はHuman判断待ち。**

### Humanが承認した最終レビューMinor 2件

残るMinor 2件もHumanが両方承認した。Layout Cの構造と既存UX Contractを変更せず、以下を反映した。

| No. | 承認内容 | 反映結果 |
| --- | --- | --- |
| 1 | 模試rail上部の保存状態文言 | 「✓ 最新回答は保存済み」を「✓ 最新の状態は保存済み」へ変更。問題への回答有無と模試全体の未保存変更の有無を分離 |
| 2 | 比較記録冒頭の現在状態 | 7件・4件・Minor 2件の反映、12画面展開・再Validation完了、Human最終判断待ちを明示 |

同じ178ケースを再実行し、未回答問題と保存成功後の新文言を既存ケース内で追加確認した。保存状態の意味、aria-live、問題セルの状態・aria-label、全画面・操作・Data Boundaryの回帰を確認済み。**C最終採用とlearner-ui.md最終確定は未実施。**

## Human承認済みPR独立レビュー2件の反映

[PR #27の独立レビュー](https://github.com/abi-yusuke-wada/refriq/pull/27#issuecomment-5973937672)のMajor 1件・Minor 1件をHumanが全件承認した。演習の保存中・保存失敗では前問確認を無効にして保存ロックを維持し、全問正解の結果は同じ回の分野別詳細・再取得・結果復帰で同じFixtureを保持する。Layout Cの構造・採用状態・既存UX Contractは変更しない。

既存178ケースと追加26ケース、合計204ケースを再確認した。保存成功後の前問確認、通常結果へのレビュー切替、別モード・次の学習、回答前Data Boundaryも維持する。詳細は[Validation記録](selected/validation.md)を参照する。
