# 本実装の検証記録

実施日: 2026-10-15 UTC。対象worktree: `/tmp/refriq-issue10`、branch: `feature/10-reviewer-ui-feedback`。実装説明は[引き継ぎ](../../reviewer-implementation.md)を参照する。

## PR #39の追加指摘への対応・再検証

実施日: 2026-10-21 UTC。対象はCodeRabbitの2026-10-20 15:27 UTCのReviewにある3件と、FeedbackクライアントのNitpick 1件。前回の6件はCodeRabbit上でも対応済みとなっている。元RepositoryのWorking Treeへ書き込まず、GitHubから取得した同じbranchの専用checkoutで作業した。

| 指摘 | 修正と確認 |
| --- | --- |
| Main全体の読み上げ | `main`の`aria-live`を除き、`id` / `tabindex`、見出しへのFocus移動、個別の`status` / `alert`を維持。Browserで属性・Focus・通知領域を確認。実スクリーンリーダーによる聴取確認は未実施 |
| MockのSection Tab | Enterで各SectionへFocusとScrollを移し、Review routeを維持。Sourceへ移動後のTabがSection内のControlへ進むことを確認 |
| Feedback文書の利用者参照 | データ表からProduction ExamFeedbackに存在しない「利用者のopaque参照」を削除。Record / DTO / Domainは変更しない |
| Catalog取得順序への依存 | Feedback送信・一覧・詳細・照合で必要なCatalogをClient内で取得・再利用。呼び出し元に先行`catalog()`を要求しない。取得失敗時は元操作を送らずErrorを返し、書込送信後の通信断はresult unknownと同じ操作の照合で扱う |

追加した10件のHTTP / Application経由Testは、修正前に10件すべてFAILを確認し、修正後は当該fileの14件すべてPASS。独立Clientでの送信・一覧・詳細・照合、Catalog cache、取得失敗・権限Error時の書込抑止、保存後の通信断から再送せず照合できることを検証する。

| 再実行した検証 | 結果 |
| --- | --- |
| `XDG_CACHE_HOME=/tmp/refriq-issue10-cache make fmt` / `make check` | PASS。Formatting / Lint / 全Workspace TypeScript / Vitest 7 files・318 tests / Nix flake check |
| `pnpm --filter @refriq/web build` | PASS |
| `node --check` | Mock view / 本実装Browser runner / Mock Browser runnerの3 files PASS |
| 本実装Browser runner | 37項目PASS、JavaScript / console Error 0件。今回のMain / Focus確認を既存項目に追加 |
| Mock Browser runner | 15項目PASS、JavaScript Error 0件。Keyboard / Focus確認1件を追加し、[結果JSON](mock-browser-results.json)を更新 |
| `git diff --check` | PASS |

Browser環境はPlaywright 1.58.2 / Nix Chromium 151.0.7922.173。本実装runnerは空白・日本語を含む一時Pathから実行した。結果JSONは既存の[browser-results.json](browser-results.json)と一致したため維持し、生成PNGは一時Directoryへ出力した。Repositoryの既存PNG / Manifestは更新していない。

### 別途確認が必要な提案

CodeRabbitのReview概要にある、強制Reload / Browser終了後の未解決操作の復旧は未実装の制限として残る。現在の`Pending`はメモリ内で、画面移動・再送抑止と`beforeunload`の注意表示は行うが、再起動後に同じoperation identityを復元する保証はない。Receiptによる重複抑止は復旧参照の保持を代替しない。復旧用参照を何に保持するか、認証済みの未解決操作照会を提供するか、その所有者・終了条件をどう扱うかは今回の4件と別の設計課題とし、新しいBrowser保存方式 / API / Persistence Contractを追加していない。

## PR #39のCodeRabbit指摘対応・再検証

実施日: 2026-10-20 UTC。元RepositoryのGit管理領域は読み取り専用のため、GitHubの同じbranchを`/tmp/refriq-issue10`へ取得して修正した。元RepositoryのWorking Treeは変更していない。

| 指摘 | 修正と確認 |
| --- | --- |
| ScreenshotのURL Path | `fileURLToPath`を使用。空白・日本語を含む`/tmp/refriq browser 日本語/`へ同一SHA256のBrowser runnerを配置し、3枚すべてが正しいPathへ出力されることを確認 |
| 未解決CandidateのEdit | Editボタン・direct route・偽造submitで拒否。編集候補を作らないことをBrowserで確認 |
| Policy変更時のGate拒否 | 確認Dialogを閉じてReviewに理由・blockerを表示。保存Retryを出さず、staleなAPPROVEを再実行してもDecision IDを再変更しない。取得時Decision参照は不変。REJECTは可能 |
| Review資料の欠落リンク | 現在収録されているContract・実装・Test・PNG / JSONへの参照に変更。過去の未収録PDF / ZIP / 全文TXTを利用可能と案内しない |
| Frontend引き継ぎ | Web UI・HTTP Adapter・Application実装済みと明記し、永続化・認証・Provider接続の境界を案内 |
| Grounding本文の返却 | 一意なcurrent TRUSTED Policyを確認できた参照Sourceだけ本文を返す。REVIEW_REQUIRED / PROHIBITED / ambiguous / missing / 未参照Sourceは両Contextの本文を除き、metadataと保存済みSnapshotを維持。UIの説明文も対応 |

Groundingの追加Unit Testは修正前に4件のFAIL（REVIEW_REQUIRED / ambiguous / missing / 未参照Source）を確認した。修正後は追加6件を含め、全308件PASS。正常なTRUSTED本文の保持と、保存済みContextの非変更も検証する。

| 再実行した検証 | 結果 |
| --- | --- |
| `XDG_CACHE_HOME=/tmp/refriq-issue10-cache make fmt` / `make check` | PASS。Formatting / Lint / 全Workspace TypeScript / Vitest 7 files・308 tests / Nix flake check |
| `pnpm --filter @refriq/web build` | PASS |
| `node --check` | 変更したMock view / Production Browser runner / Mock Browser runnerの3 files PASS |
| Markdown参照確認 | 変更したUX文書・review-context・review-promptのローカルリンク31件すべて存在 |
| 本実装Browser runner | 37項目PASS、JavaScript / console Error 0件。Playwright 1.58.2 / Nix Chromium 151.0.7922.173 |
| Mock Browser runner | 追加2項目を含む14項目PASS、JavaScript Error 0件。[結果JSON](mock-browser-results.json)を更新 |
| `git diff --check` | PASS |

本実装Browserの初回実行では37操作の後にfaviconの404を検出した。Web HTMLに空のfaviconを明示して不要なリクエストをなくし、再実行でconsole Errorも0件となった。エラーの除外・握り潰しは行っていない。

本実装の[result JSON](browser-results.json)は再実行結果と完全一致のため維持した。空白・日本語Pathの検証で生成したPNGは一時Directoryに保存し、Repositoryの既存PNG 3枚・Manifestは維持した。下記の2026-10-15時点の画面資料を今回再取得したものとして扱わない。

## 結果

| 検証 | 結果 |
| --- | --- |
| `XDG_CACHE_HOME=/tmp/refriq-issue10-cache make fmt` | PASS。Biome / Nix formatter実行 |
| `XDG_CACHE_HOME=/tmp/refriq-issue10-cache make check` | PASS。Formatting、Lint、全Workspace TypeScript、Vitest、Nix flake check |
| `pnpm format:check` / `pnpm lint` / `pnpm typecheck` / `pnpm test` | 上記make check内で各Command実行、すべてPASS |
| Vitest | 7 files、302 tests PASS。本実装89件、既存Mock145件、既存Domain / Pipeline68件 |
| `pnpm --filter @refriq/web build` | PASS。Vite production build |
| `node --check` | Mockのfixtures / review-model / feedback / view、Vite config、2 Browser runnerの7ファイルPASS。TypeScriptはtypecheckで検証 |
| `git diff --check` | PASS |
| 本実装Browser | 37項目PASS、JavaScript Error 0件。Chromium 145 / Playwright 1.58.2 |
| 承認済みMock Browser | 12項目PASS、JavaScript Error 0件。同じBrowser環境 |
| レイアウト | 本実装Reviewの1280px / 1440pxでページ全体の横overflowなし |

Nix検証は実行環境のx86_64-linuxが対象。別OS / CPUの全system buildを実施したとは扱わない。BrowserはProduction Webコード、HTTP Adapter、Application、既存Domain Gate、in-memory Adapterを通す。実DB・認証・分散TransactionのE2Eではない。

## Contractと実装Test

本実装Test: `apps/api/src/reviewer.test.ts`、`apps/api/src/http-client.test.ts`。

| Contract | 主なTest / 結果 |
| --- | --- |
| exact QuestionRevision / Candidate分離 | `detail never substitutes mismatching Candidate Content`、missing / mismatch targetの全3 Decision拒否、未解決Candidateの別Queue投影とDomain IDへの流用拒否 |
| Evaluation対象一致 | `production Human Decision Matrix`、別run / Candidate / Revision、Content / Context差、stale / unverified、PASSでも未判断状態は公開されない |
| negative decisionの独立 | mismatch / missing × REQUEST_CHANGES / REJECTを明示的に4件。APPROVE専用のEvaluation / Policy参照を省略した4件も成功 |
| 共通条件・max1 | 未判断 / REVIEW_REQUIRED / Human Context / 両version、3組の競合、REJECT後の評価追加でも再判断不可、公開pointerの競合と過去成功の再取得 |
| 11項目Diff | 全対象、集合並べ替え無視、実変更検出、Options順変更の検出 |
| SourceReference | 同Locator・異RevisionのA / B / A+B保存、同Revision・別Locator、完全なPayload保存 |
| Source Gate / N-01 | 複数Sourceの全TRUSTED / REVIEW_REQUIRED / PROHIBITED / ambiguous / missing、direct Edit相当の偽造CommandとSource削除迂回を拒否、Candidateなし |
| Policy refresh | 全参照Revisionのcurrent Policy更新、Historical Snapshot・QuestionSource不変、解消後のReview / Edit復帰、commit直前のPolicy変更で拒否 |
| N-02 | same ID / same semanticsは許可、classification / Terms変更は拒否。Fixture TestでHistorical / Current ID分離、SourceReview / Reason / Metadata等のsemantic consistencyも維持 |
| N-03 | 既存Fixture Testの取得後変更ケースだけのchronology検査を維持。日時をProduction Gateにしない |
| Edit | exact baseから新Candidate、旧Evaluationを持たず新Validation / Evaluation待ち、readonly項目の偽造変更拒否、同操作の成功再取得で重複Candidateなし |
| 保存・照合 | 確定失敗の同一操作Retry、保存済み / 未保存未確定 / 未保存確定の照合、結果不明中の別操作拒否、blind retryなし |
| Feedback | allowlist、rating / unknown / all not_used、Similarity混在拒否、禁止Field / URL / 添付相当 / object / free text拒否、immutable再提出、同一操作結果、Actorを公開しない |
| HTTP | Use Case実行、形式・未知Field拒否、外部Context / 権限エラー、書込通信断はresult unknown、別Revision応答の拒否 |
| Accessibility | Browserで名前付きControl、Focus、inline error、aria-invalid / describedby、Escape / Cancel、disabled理由、status / dialog状態 |

## Browser再生

`apps/web/test/browser-check.mjs`の各確認名と結果は[browser-results.json](browser-results.json)。37項目には以下を含む。

- Queue → exact Review、Content / Context / Source / Evaluation / Diff / HumanへのFocus。
- matching Evaluation、mismatch / missingのAPPROVE不可、各negative decisionの実保存。
- APPROVE確認のEscape中止、成功後のPUBLISHED / 最大1判断。
- Source全5状態、disabled理由 / Remediation、直接EditとSource削除Commandの拒否。
- Policy再取得後の復帰、historical Snapshot / QuestionSource参照の維持。
- 同Locatorの異SourceRevision選択3組、新Candidateの保存と再評価待ち。
- Editのinline validation / Focus、集合Diffの並び替え無視。
- 確定失敗Retry、保存済み結果不明の照合、未保存未確定ではRetryなし、未保存確定後の同一操作Retry。
- Feedback通常、unknown、全not_usedの保存、not_used同期、混在 / 複数選択のinline error、確定失敗Retry。
- 未保存Edit入力を保持する再取得、未解決Candidateの閲覧分離、閲覧専用Edit項目。
- 1280px / 1440pxの横overflow確認。

旧Mockは`apps/web/test/mock-browser-check.mjs`で12項目を再生。[mock-browser-results.json](mock-browser-results.json)へ記録。過去の全Browser suiteを完全再実行したとは扱わない。

## 画面資料

今回の本実装コードから以下3枚を取得した。日本語Fontを設定して再取得し、内容を視認した。

- [exact Revisionとmatching Evaluation](evaluation-match.png)
- [PROHIBITEDのdirect Edit拒否とRemediation](source-remediation.png)
- [Feedback混在拒否のinline error / Focus](feedback-validation.png)

画像は読取Evidenceであり、状態遷移の証明はUnit / Browserに分ける。

## セルフレビュー

実装完了後、Contract・層境界・保存・表示・Test経路を読み直した。APPROVE専用Gateをnegative decisionへ適用していない。Candidateをexact対象へFallbackしない。N-01〜N-03を維持し、Source Snapshot・Domain enum・Publish invariant・既存Pipelineを変更しない。

Production bundleに`__reviewer_test`、`InMemoryReviewerStore`、`reviewerFixtures`、検証用synthetic Questionの文字列が含まれないことも確認した。Test Composition Rootは明示的な環境変数でのみ有効。

今回確認した範囲で、新しいProduct判断を要するFinding、Major / Criticalはなし。実DB Adapter、認証接続、Workerによる新評価・materializationは未実装の外部境界として明示し、成功を偽装しない。

## 作業環境と既存Evidenceの制限

継続時に`/tmp/refriq-issue10`が消失していたため、同じ会話の保存済み編集履歴からテキスト成果物・実装を復元した。元Issue #9 worktreeへ変更は入れていない。確定UX本文のSHA256は`cad9d6320026286a2612038bdc15aa8f5b015aad254348e5396ed324ef64b490`で復元後・検証後とも同じ。

過去のReview用ZIP / PDF / 全Snapshotは復元していない。既存文書中の過去Evidence参照を今回再確認済みとは扱わない。本実装のEvidenceはこのDirectoryの新しいJSON / PNG / 検証記録を正とし、古いZIPを最新成果物として配布しない。

元worktreeは`feature/9-learner-ui-wireframes`、HEAD `c2ca874a8f400f07eda4d4b12fca7427d1e9d789`、status cleanを確認した。#9 / #11 / #12の文書・コード、Domain / ADR / 既存Pipelineを編集していない。commit / push / PR / merge / Issue commentは実行しない。
