# Layout C デザインレビュー用パッケージ

Issue #9のHuman最終採用Layout Cを、GPTまたはHumanがレビューするための資料。

**Layout CはHuman最終承認済み。`learner-ui.md`へLearner UX Contractを確定反映済み。Human承認済みPR独立レビュー2件も反映・再Validation済み。** このパッケージは確認用資料であり、新しいUX仕様の追加やProduction実装完了を意味しない。

## 最初に渡す資料

| 資料 | 用途 |
| --- | --- |
| [screens/](screens/) / [states/](states/) | 12画面と主要状態・操作16例の見た目をPNGで確認する。全28枚 |
| [screen-flow.md](screen-flow.md) | 画面の接続、演習・模試、保存・Retry・中断・再開のFlowを確認する |
| [review-prompt.md](review-prompt.md) | レビュー依頼文としてコピーする |
| [snapshot-manifest.json](snapshot-manifest.json) | 撮影条件、元View、画面ごとのファイル名、元MockのSHA-256を確認する |

見た目のレビューにはPNGを添付する。HTML/CSS/JSの内容確認にはMock一式も渡す。ファイルを読み取れることとHTMLを実ブラウザで描画できることは別なので、ソースだけで見た目まで確認できるとは扱わない。

Repositoryには元のStatic Mock・文書・PNGを保存する。配布用PDF・ZIPは内容が重複するためPRの成果物から外した。

## Snapshotの条件

- Chromiumで再Validation済みのStatic Mockを、PC幅1280px・viewport高さ900pxで撮影した画像を使用する。通常画面は全ページ、中断確認・離脱Blockingの3例は実際のviewportを撮影する。
- 日本語UI、架空Fixture、Layout C、深い紫のPrimaryとLavenderのSupporting surfaceを使用する。
- 画面上部の「画面・状態・モード」切替と設計用metadataは、レビュー用操作でありProduct UIの機能ではない。画像ではそのまま残している。
- 12画面の通常例は演習モードを基本とし、模試問題・模試開始は模試モードである。
- 保存失敗、古い保存成功と最新未保存、結果取得失敗、正常Empty、Fetch Errorに加え、全問正解・誤答末尾・中断確認・離脱Blocking・複数選択を収録する。全状態の画像一覧ではない。
- 回答後の判定・解説・scoreは固定Fixture。自由に変更した回答への実採点・実保存は行わない。
- Sourceは`example.invalid`の架空参照。実試験問題や実際のPublishedデータを使わない。

画像はReview用Snapshotであり、仕様の正本ではない。撮影後にMockを変更した場合はSnapshotを再作成する。今回の更新はHumanが全件承認したUXレビュー7件・再レビュー4件・最終レビューMinor 2件の反映と最終採用承認後のもの。12画面・必要状態の展開、UX Review、再Validationは完了。承認済みPlanと既存のSession・Data Boundary・採点Contractを維持し、Humanの「OK！」に基づきC最終採用とlearner-ui.mdの確定反映を完了した。Mock railは回答有無と保存状態を分け、上部の「✓ 最新の状態は保存済み」は模試全体に未保存変更がないことを示す。失敗・Retryは模試の途中状態を対象と表示する。API・DBの保存単位は定義しない。

## 画面一覧

| Snapshot番号 | 画面 | PNG |
| --- | --- | --- |
| 1 | Home | [01-home.png](screens/01-home.png) |
| 2 | Certification Detail | [02-certification.png](screens/02-certification.png) |
| 3 | Practice Start | [03-practice-start.png](screens/03-practice-start.png) |
| 4 | Mock Exam Start | [04-mock-start.png](screens/04-mock-start.png) |
| 5 | Question Practice | [05-practice.png](screens/05-practice.png) |
| 6 | Question Mock | [06-mock.png](screens/06-mock.png) |
| 7 | Explanation | [07-explanation.png](screens/07-explanation.png) |
| 8 | Result | [08-result.png](screens/08-result.png) |
| 9 | Incorrect Answer List | [09-incorrect.png](screens/09-incorrect.png) |
| 10 | Incorrect Answer Detail | [10-incorrect-detail.png](screens/10-incorrect-detail.png) |
| 11 | Topic Accuracy | [11-topics.png](screens/11-topics.png) |
| 12 | Learning Progress | [12-progress.png](screens/12-progress.png) |
| 13 | 演習・保存失敗 | [13-practice-save-failed.png](states/13-practice-save-failed.png) |
| 14 | 模試・古い保存成功、最新回答は未保存 | [14-mock-stale.png](states/14-mock-stale.png) |
| 15 | 保存成功後の結果取得失敗 | [15-result-fetch-failed.png](states/15-result-fetch-failed.png) |
| 16 | Learning Progress・正常Empty | [16-progress-empty.png](states/16-progress-empty.png) |
| 17 | Learning Progress・Fetch Error | [17-progress-fetch-error.png](states/17-progress-fetch-error.png) |
| 18 | 演習・複数選択 | [18-practice-multiple.png](states/18-practice-multiple.png) |
| 19 | 模試・複数選択とNavigation | [19-mock-multiple.png](states/19-mock-multiple.png) |
| 20 | 演習結果・全問正解 | [20-result-all-correct-practice.png](states/20-result-all-correct-practice.png) |
| 21 | 模試結果・全問正解 | [21-result-all-correct-mock.png](states/21-result-all-correct-mock.png) |
| 22 | 模試・最後の誤答 / 未回答 | [22-incorrect-detail-last.png](states/22-incorrect-detail-last.png) |
| 23 | 演習・保存済み状態からの中断確認 | [23-session-leave-practice.png](states/23-session-leave-practice.png) |
| 24 | 模試・保存済み状態からの中断確認 | [24-session-leave-mock.png](states/24-session-leave-mock.png) |
| 25 | 模試・最新回答未保存時の離脱Blocking | [25-session-leave-unsaved.png](states/25-session-leave-unsaved.png) |
| 26 | 模試・途中保存失敗と対象問題の印 | [26-mock-intermediate-save-failed.png](states/26-mock-intermediate-save-failed.png) |
| 27 | 模試・最新回答未保存と保存済み回答の区別 | [27-mock-unsaved.png](states/27-mock-unsaved.png) |
| 28 | 模試・現在問題は未回答、最新の状態は保存済み | [28-mock-current-unanswered.png](states/28-mock-current-unanswered.png) |

## 今回の再Validation

PR独立レビュー2件の対応後、既存178ケースと追加26ケース、合計204ケースを実ブラウザで確認した。演習の保存中・失敗時は前問確認で保存ロックを解除できず、同じ回答のRetryを維持する。全問正解の結果・分野別詳細・再取得・結果復帰でも同じ結果Fixtureを使用する。PNG 28枚とmanifestを更新し、Snapshot 13では前問確認が無効である理由も確認できる。

承認された7件・再レビュー4件・最終レビューMinor 2件を反映後と、Human最終承認の表示更新後に、既存回帰128ケース、初回7件の操作回帰27ケース、再レビュー4件の操作回帰23ケース、合計178ケースを実ブラウザで再実行した。既存ケース内に未回答問題と保存成功後の新文言の確認を追加した。演習10問、模試開始・途中保存・移動・最終提出、stale / 失敗 / Retryとrailの一致、Header中断・再開、誤答下部Nextからの連続Review、Empty開始とError再取得を含む。Repository標準Validationの結果は`docs/ux/mockups/selected/validation.md`を参照する。

## Mock一式を渡す場合

`docs/ux/mockups/selected/`はHTML/CSS/JSとFixtureを含み、フォルダ構造を保ってコピーすれば単独で表示できる。`index.html`をブラウザで開き、状態を切り替える。Build・サーバー・追加dependencyは不要。

同フォルダの`validation.md`から参照するPlan・既存UX文書・比較記録は、`selected/`の外にある。Contractもレビューする場合は次を併せて渡す。

- `docs/ux/issue-9-plan.md`：承認済み実行Plan。作成時点の作業状況を含む。
- `docs/ux/learner-ui.md`：Behavior / UX Contractの正本。Humanが最終承認したC採用結果を確定反映済み。
- `docs/ux/mockups/comparison.md`：HumanによるC暫定採用・最終承認と比較・レビュー記録。
- `docs/ux/mockups/selected/validation.md`：現在の12画面・状態・Fixture境界と検証結果。

Mockを渡す場合は`selected/`一式をコピーする。Contractも渡す場合は上記文書とこのReview資料を、元の相対構造を保って併せて渡す。

## レビューの扱い

HumanがLayout Cを最終採用した。今後レビュー指摘を受け取った場合も、Codexが別Layoutへ切り替えたり既存Contractを書き換えたりしない。重大なLayout問題はHuman判断の比較Checkpointへ戻す。
