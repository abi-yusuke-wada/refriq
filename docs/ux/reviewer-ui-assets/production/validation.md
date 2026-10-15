# 本実装の検証記録

実施日: 2026-10-15 UTC。対象worktree: `/tmp/refriq-issue10`、branch: `feature/10-reviewer-ui-feedback`。実装説明は[引き継ぎ](../../reviewer-implementation.md)を参照する。

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
