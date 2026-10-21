# Reviewer・受験Feedback Mockの検証記録

## R-01〜R-04反映後の最新検証

現在RepositoryのIssue本文 / comments、UX / RV文書、Mock、Pipeline / Domain / Source契約を読み直し、4指摘がまだ成立することを確認してから修正した。I-01〜I-06の既存状態を維持する。作業前75ファイルをArchive / Hashへ記録し、既存成果物を削除していない。

| 実行Command / 対象 | 結果 |
| --- | --- |
| `XDG_CACHE_HOME=/tmp/refriq-issue10-cache make fmt` | 成功。 |
| `XDG_CACHE_HOME=/tmp/refriq-issue10-cache make check` | 成功。Formatting / Lint、全6 Workspace Typecheck、5 Test Files / 187 Tests、x86_64 Nix check。 |
| `pnpm test` | 187 Tests成功。Mock 119（Feedback 36 / Fixture 34 / Review Model 49）、既存Domain / Pipeline 68。 |
| `node --check docs/ux/mockups/reviewer/{view,review-model,fixtures,feedback}.js`（各ファイルへ実行） | 全4 Scriptの構文確認成功。 |
| `node /tmp/issue10-r-browser.cjs` | Chromium / Playwrightで242確認成功、未処理JavaScript Error 0件。1280px / 1440pxの12表示条件を含む。 |
| `node /tmp/issue10-r-capture.cjs` | Snapshot58枚、Error 0件。既存番号を維持し、54〜58の5例を追加。画像は表示EvidenceでTest数へ加算しない。 |
| `git diff --check` | 成功。未追跡成果物は別途末尾空白・改行・相対リンク・Package Hashを検査。 |

### 今回の操作・境界検証

- Evaluation: 一致PASS / Candidate不一致PASS / matching評価欠落。exact Revision ContentとIDを表示し、不一致・欠落はAPPROVE disabled。PASSだけでHuman記録 / 公開を作らない。生成元Candidate Groundingを別由来として表示。ID・評価時Content・全Field欠落はUnitで照合する。
- SourceReference: 同Locatorの2つのSourceRevisionをAだけ / Bだけ / A+Bで選択し、実Edit submitと保存後新CandidateのSourceReferencesが完全一致。Unitで既存Application referenceKeyとの互換・未知 / 重複キー拒否。
- Feedback: 1項目のnot_usedで3項目が同期。全not_used保存可能。利用済みに戻すと残りを選び直す。unknown / 4 / similarは確認可能。UI同期を迂回したnot_used + Rating、not_used / unknown / not_usedはいずれも拒否し、3項目へinline error / aria-invalid / describedbyとFocusを確認。禁止Field / URL / Object / 自由文字列 / 添付相当の拒否は既存Testを維持。
- Diff: 同じQuestionSource集合の順序違いは「変更なし」、実関係の変更は「変更あり」。KnowledgePoint / Multiple Select正答IDも集合比較。Optionsとconstraintsの順序変更はDiffを検出。凍結元配列を変更しない。
- I-01〜I-06: exact Content・Human対象ID、11項目Diff、全Source TRUSTED / REVIEW_REQUIRED / PROHIBITED / ambiguous / missing、confirmed failure / result unknown、not_used / unknown、inline validation / Focus / ARIAを再確認。Human三決定・確認Cancel・Edit新Candidate・保存失敗Retry・結果不明Reconcile・重複なしを実再生。

Browser Runnerは初回、戻るリンクがHeaderと本文に2件あってstrict locatorで停止した。本文の「入力へ戻る」を明示し、242確認を再実行して成功した。失敗を隠していない。包括的な支援技術 / Keyboard / Contrast Audit、Production API / idempotency / Persistence / materialization / Backend Gate / LLMは未確認・未実装。Domain / Application / ADR / package manifest / lock / Issue #9 / #12は変更していない。

新規指摘: なし。Human最終再RVを待ち、commit / push / PR / Production / Domain変更へ進まない。

## I-01〜I-06反映時の検証（過去のEvidence）

以下の152 Tests / 171項目は前回I-01〜I-06反映時の検証。最新の187 Tests / 242項目へ加算しない。Human承認済み6指摘を反映し、当時の実装を検証した。[指摘対応](../../reviewer-ui-assets/issue-10-review/review-findings.md)、[UX契約](../../reviewer-ui.md)を参照。画面番号は未収録の旧レビュー資料の番号であり、現在収録されている画像との対応を示さない。現在利用できる検証結果と画面は[本実装の検証記録](../../reviewer-ui-assets/production/validation.md)を参照。

| 実行 / 対象 | 結果 |
| --- | --- |
| `XDG_CACHE_HOME=/tmp/refriq-issue10-cache make fmt` | 成功。 |
| 同じCache指定の`make check` | 成功。Formatting / Lint（警告なし）、全6 Workspace Typecheck、5 Test Files / 152 Tests、x86_64 Nix check。 |
| Mockの84 Unit Tests | exact Revision、Content / Intent全11種Diff、全Source Gate投影、保存の確定失敗 / 結果不明、not_used / unknown、禁止Field / 値、Field別Error。 |
| 既存Domain / Pipeline 68 Tests | 変更せず成功。 |
| Browser 171項目 | 未処理JavaScript Error 0件。下記の操作を実再生。 |
| Snapshot 53枚 | 旧37枚を含め最新UIへ更新。保存中の31 / 34だけTimerを撮影中に一時停止。表示Evidence。 |

BrowserではQueue → exact Review → Content / Context / Source / Evaluation / Diff、APPROVE確認・Cancel・成功、REQUEST_CHANGES、REJECT、確定保存失敗・Retry、結果不明から保存済み / 未保存確定の照合、Edit → 新Candidate、全Source状態、Feedback通常 / not_used / unknown、選択不備 / 未知Field、送信確定失敗 / Retry / 結果不明を確認した。

前回はCandidate Content不一致でも凍結Revisionの本文・選択肢・解説と確認内容を表示し、同じRevision IDへHuman Recordを記録した。今回R-01ではmatching評価のないAPPROVEを拒否し、exact対象の記録一致はREQUEST_CHANGESで再確認する。各Fixtureは異なるRevision IDを持つ。Language / Difficulty / KnowledgePoint / QuestionSourceの変更表示と、現在Policyの除外を確認した。

Sourceの全TRUSTEDはApprove可能、2件目のREVIEW_REQUIRED / PROHIBITED、同じSource / Purposeの重複、現在Decision欠落は不可。Fixtureのeligible / blockersはsame-Revision Human APPROVEを与えた既存Domain Gateの結果と完全一致した。Human Recordなし / 他RevisionへのApprovalは既存Gateで拒否された。

保存結果不明では即再送を置かず、状態再取得 / 照合へ進める。照合で保存済みなら同じ結果を表示して再保存しない。未保存確定後だけRetryし、Feedbackの追加Recordは1件のみ。DialogのCancel / Escapeは保存・未照合中に抑止される。Productionのidempotency / API / DB Transactionを実装したものではない。

FeedbackのSimilarity 3項目は`not_used`と`unknown`を別Payload・別ラベルで送信・閲覧する。本文 / 選択肢 / 正答 / 解答根拠 / Comment / URL / File / Attachment / Screenshot / QuestionRevisionId / SourceRevisionIdを許可しない。

EditとFeedbackのinline Error、Controlのaria-invalid / aria-describedby、最初の不正入力へのFocus、Summaryのrole=alertとリンクのFocusを確認。Statusのrole=status、Dialog cancel、保存中のdisabled、1280px / 1440pxの6画面ずつ12表示条件で横溢れなしを確認。実支援技術の音声・Keyboard全操作・Contrastの包括的Auditは未実施。

初回のLint Failureと旧Browser文言Assertion Failureは修正し、上記を再実行して通過した。失敗を隠していない。実Backend / 実LLM / 他Architectureは未検証。

元Issue #9のbranch / HEAD / statusは開始時と同じで、本作業から書き込んでいない。Domain / Application / ADR / Manifest / LockのTracked変更なし。新規重大・主要問題は今回の6指摘の検証では検出していない。Human再レビュー待ちで停止する。

## 初回実装の検証記録（過去のEvidence）

以下の109 Tests / 94項目は今回の通過数に加算しない。旧画面の検証記録を保持する。

検証日: 2026-10-04（JST）。対象: [Issue #10](https://github.com/abi-yusuke-wada/refriq/issues/10)。[実行計画](../../issue-10-plan.md)、[UX契約](../../reviewer-ui.md)、[操作Mock](index.html)を照合した。

## 検証対象と再生方法

`index.html`をブラウザで開く。Queueの8行から各例へ移動する。上部の設計検証用Selectで通常 / 取得中 / 空 / 取得失敗 / 保存失敗 / 確認後のPolicy変更を切り替えられる。保存失敗は次の保存1回を失敗させ、Retryで成功例へ進む。Reloadまたは「Mockを初期化」で初期状態へ戻す。

Mockはメモリ内の表示・操作例であり、実保存・公開、Authentication、LLM呼出し、Production API Validationの完了を意味しない。

## Repository検証

| 確認 | 結果 |
| --- | --- |
| `make fmt` | 成功。初回はNixの既定Cacheが読み取り専用で失敗したため、`XDG_CACHE_HOME=/tmp/refriq-issue10-cache`を指定して再実行した。 |
| `make check` | 同じCache指定で成功。Formatting、Lint（警告なし）、全Workspace Typecheck、109 Tests、Nix Flake checkを確認。 |
| `pnpm typecheck` | `make check`から実行され、全6 Workspaceで成功。TypeScriptの変更はない。 |
| Feedback入力境界 | `feedback.test.js`の25 Testsで、全対象項目・定義済み選択肢、余分なField / 未知値 / Object / 未入力 / 重複 / 矛盾する不明選択の拒否を確認。 |
| Fixture整合 | `fixtures.test.js`の16 Testsで、8例のGeneration / Evaluation / Source Snapshotを既存Validatorへ渡して成功。7つのDomain投影についてHuman Reviewなし / 対象不一致 / 現在Policy変更による拒否を既存Domain Gateで確認。 |
| `git diff --check` | 成功。追加ファイルは未追跡のため、別途各ファイルの末尾空白・改行と相対リンクも確認。 |

Nix checkは現在のx86_64-linux環境に対して実行。標準Commandが除外するaarch64-linux / aarch64-darwinでの実行・Buildは行っていない。

## ブラウザで再生した操作

Playwright + Chromium headlessで**94項目成功**。JavaScriptの未処理Errorは0件。検証用Runner・Browser設定・画像は`/tmp/refriq-issue10-*`に置き、Repository依存は追加していない。Chromium実行には既存のBrowserバイナリの独立コピーとNixライブラリを使用した。Issue #9のBrowser資産・Font Cacheは変更していない。

| シナリオ | 確認結果 |
| --- | --- |
| Human `APPROVE` | 確認とキャンセル、保存中の重複操作抑止、成功時`PUBLISHED`とCurrent Published Revision切替。Content不変。 |
| Human `REQUEST_CHANGES` | `CHANGES_REQUESTED`、元の公開参照とContent維持、対象への二度目の判断不可。 |
| Human `REJECT` | `REJECTED`、元の公開参照とContent維持、対象への二度目の判断不可。 |
| Domain ID未解決 | Application Candidateと表示、Human Approve不可、初版で前Revisionなし。 |
| Evaluation `REVISE / REJECT` | Findingsを閲覧でき、Approve不可。Human decisionと区別。 |
| 現在Source `REVIEW_REQUIRED / PROHIBITED` | Approve不可。取得時TRUSTEDは保持。禁止例で抜粋を表示しない。 |
| Review完了 | Human Record・Lifecycleを表示。再判断ボタンを無効化。 |
| Queue / 詳細 / Feedback一覧 / Feedback詳細の読取状態 | Loading / 正常Empty / Fetch Errorを区別。Retry → Loading → 通常を再生。 |
| Human保存失敗 | Review未記録、公開参照未変更。Retry成功後だけ結果を表示。 |
| 確認後にPolicy変更 | 確定時Gateが拒否。Human Record / 公開参照を更新せず、現在PolicyとApprove無効化を画面へ反映。 |
| Editの入力不備 | 単一選択の複数正答、KnowledgePoint参照なしを拒否。 |
| Editの離脱 | 未保存の破棄確認。キャンセルで入力保持。 |
| Editの保存失敗・再試行 | 入力保持。失敗後に内容を修正してRetryした場合も最新内容を保存。 |
| Edit成功 | 新Candidate・再評価待ち・差分を表示。元Revision Content / 公開参照を維持。旧PASSを新候補へ流用しない。 |
| Feedbackの入力欄 | 全10項目を確認。Textarea、自由入力、File、contenteditableなし。 |
| Feedback不許可入力 | 不明と具体Topicの併用を拒否。DOMに未知の`stem` Fieldを追加しても確認へ進まない。禁止本文は使用しない。 |
| Feedback確認 / 失敗 / Retry / 成功 | 確認は読取専用。送信中は重複操作不可。失敗時に選択内容保持。Retryで新Recordは1件だけ増える。 |
| Reviewer Feedback閲覧 | 提出された抽象化選択内容を閲覧。QuestionReviewの操作や自由記述欄と混在しない。 |
| PC表示 | 1280px / 1440pxでQueue、長文・複数選択Review、Edit、Feedback入力、一覧、詳細の12条件でページの横溢れなし。複数正答2件を表示。 |

表示画像でReviewerの内容 / Context配置とFeedback全入力欄を確認した。字体を日本語のSans Serifへ指定した後も、上記PC12条件で横溢れがないことを再確認した。画面のHuman採用承認やProductionのEnd-to-End完了を主張するものではない。

## 検証で修正した点

- 確認後のSource Policy変更時、公開拒否後に元画面へ最新Policyを反映する。
- 未保存の編集で離脱確認をキャンセルした場合に内容を保持する。
- 保存失敗後に編集内容を変えたRetryが、失敗前の古い内容を保存しないようにする。
- KnowledgePoint / Sourceの選択状態を編集候補に保持する。
- LintのCSS Selector順序とOptional Chainの警告を解消する。

## Issue #9の安全確認

Issue #10の全追加ファイルは専用worktree内の`docs/ux/issue-10-plan.md`、`docs/ux/reviewer-ui.md`、`docs/ux/mockups/reviewer/`だけ。元worktree、README、Learner文書、比較成果物、selected Mock、Layout C assets、package manifest / lock、Domain / Application、ADRへ書き込んでいない。merge / cherry-pick / stash / reset / restore / clean / commit / push / PR作成は行っていない。

開始時に元worktreeの100ファイルのHashを記録した。検証中の照合では37ファイルの変化を検出し、元worktreeのGit statusは` M README.md`、`?? docs/ux/`のままだった。並行作業中の元成果物に変化があるため「全成果物のHashが不変」とは報告しない。本作業からの書き込みはなく、これらの変更を復元・上書きしていない。

## 後続実装で必要な検証

ProductionでのCandidate materialization、QuestionSource作成、並行Review・現在Policy再検査の保存整合性、重複送信 / 保存結果不明時の再取得、Reviewer権限、BackendのFeedback allowlist、違反Inputの運用・Retentionは今回未実装。これらは[UX契約の引き継ぎ](../../reviewer-ui.md#後続への引き継ぎと未決事項)に残した。
