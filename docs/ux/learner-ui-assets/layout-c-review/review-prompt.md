# GPTへのデザインレビュー依頼文

以下をレビュー用ファイルと一緒に渡してください。

---

refriq Issue #9のLearner UIをデザインレビューしてください。

Layout C「Main content + Supporting information rail」をPC優先の12画面Static HTML/CSS Mockへ展開し、全画面Validationと承認済み指摘の反映を経てHumanが最終採用しました。learner-ui.mdへLearner UX Contractを確定反映済みです。

前回レビューの7件はHumanがすべて承認し、今回の資料へ反映しています。内部Domain用語の除去、Global Navigationと中断の統一、解説上部Next、結果別CTA、誤答詳細の前後Navigation、Learning Progress Emptyの開始CTA、模試railの可読性を再確認してください。元のSession・Data Boundary・採点Contractを変更するレビューではありません。

再レビュー4件もHuman承認済みで反映しています。模試railの回答なし・保存済み・未保存・保存失敗・現在位置とstale応答の整合、誤答詳細の上下Navigation、Empty / Fetch Errorの簡潔なProduct copy、learner-ui.mdの受入状況を確認してください。現Mockの途中保存案内は模試の途中状態を対象とし、各問題の印で最新回答の状態を示します。API・DBの保存単位は未定義です。12画面・状態・ブラウザ再Validationと、Human最終承認後のContract確定反映を完了しています。

最終レビューMinor 2件も承認・反映済みです。模試rail上部を「✓ 最新の状態は保存済み」とし、未回答問題の「○ 回答なし」と保存状態を分離しました。比較記録冒頭も7件・4件・Minor 2件の反映とHuman最終承認までの現在状態へ更新しています。Snapshot 28で未回答問題の通常表示を確認できます。

まず`screens/`・`states/`のPNGと`screen-flow.md`を読み、見た目と画面フローをレビューしてください。ソースが利用できる場合は`docs/ux/mockups/selected/`、`validation.md`、既存Plan・UX Contract・比較記録も確認してください。HTMLを実ブラウザで確認できなかった場合は、その制約を明記してください。

確認する点：

1. 問題文・長い日本語・設定例・選択肢が読みやすいか。
2. Mainが主役で、右railが学習操作を妨げていないか。Questionのrailは進捗・保存状態・模試Navigationだけで十分か。
3. 単一選択と複数選択、選択中と未選択、正解・不正解・未回答が分かるか。
4. Home、Result、Learning ProgressでMainと補助情報の分離が有効か。分野別集計や履歴が一覧として読めるか。
5. 画面間のNavigation、開始・中断・再開・振り返りのFlowが理解できるか。
6. Loading・正常Empty・Fetch Error・Retryが区別できるか。
7. 保存失敗と保存成功後の結果取得失敗、模試途中保存と最終提出が区別できるか。
8. 紫のPrimary、Lavenderの補助面、白い本文背景が適切か。Semantic success / warning / errorが色と文言で伝わるか。
9. focus、Contrast、色だけに依存しない状態表現に明らかな問題がないか。
10. 回答前Data Boundaryが維持されているか。ソースを確認できる場合、回答前Viewが回答後Fixtureを読み込んでいないか。画像だけでClientのData Boundaryが証明できたとは判断しないでください。

前提：

- 上部の画面・状態・モード切替と設計用metadataはレビュー用操作でありProduct UIではありません。
- 保存・採点・結果は固定Fixtureで、API・DB・Authentication・Persistence・Production React実装はありません。
- Practice 10問、Mock 20問・時間制限なし、完全一致・部分点なしです。
- Session Snapshot、再開時の再抽選禁止、回答時点RevisionのHistory、stale save responseの扱い等、既存UX Contractを変更するレビューではありません。
- 会社の正式なBrand Guidelineを実装したものではなく、Human指定の紫系暫定Tokenです。
- 全状態を画像化していません。未提示の状態は推測せず、Mockで確認できる場合に限って評価してください。
- Source利用不可時の扱い、API / DB設計、Mobile最適化、最終Visual polishは後続Issueです。

出力形式：

| 重要度 | 画面・状態 / Snapshot番号 | 観察した問題 | Learnerへの影響 | 修正提案 | 根拠 |
| --- | --- | --- | --- | --- | --- |

重要度はCritical / Major / Minorで分類してください。Layout Cの採用自体へ影響する重大問題と、Cのまま調整できる軽微な問題を分けてください。問題がない点は無理に指摘せず、確認できない点は「未確認」としてください。

最後に、HumanのLayout再判断が必要な重大問題があるかを報告してください。別案への変更や既存Contractの変更を勝手に行わず、新しい仕様判断が必要な提案は「要確認」として分離してください。
