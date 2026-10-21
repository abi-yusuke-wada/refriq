# Reviewer画面・受験Feedbackの実装引き継ぎ

## 実装と接続境界

[承認済みUX契約](reviewer-ui.md)をApplication Use Case、HTTP Adapter、共有Contract、Web UIへ移した。Domain、Source Governance、Pipelineの既存定義は変更しない。

| 層 | 実装 | 責務 |
| --- | --- | --- |
| Application | `packages/application/src/reviewer/` | exact対象、Evaluation binding、全Source Gate、11項目Diff、Human判断、編集候補、Feedback allowlist、同一操作の照合 |
| Contract | `packages/contracts/src/reviewer.ts` | Web / HTTP間の型、共有Validation・Identity・Diff項目の再公開 |
| HTTP Adapter | `apps/api/src/reviewer.ts` | JSON受信・形式検査・外部で検証済みHuman Contextの取得・Use Case呼出・応答変換 |
| Web | `apps/web/src/` | semantic HTML、Queue、exact Review、Candidateの独立した閲覧、Edit、Feedback、確認Dialog、保存状態、Focus / ARIA |
| 開発・Test Adapter | `apps/api/src/in-memory-reviewer-store.ts` | プロセス内の条件付き確定、最大1判断、公開参照、操作Receipt、immutable Feedback |

Webは`/api/reviewer`へ接続する。実環境のComposition Rootは`createReviewerHandler(service, resolveContext)`へApplicationと認証済みContext解決関数を注入する。クライアントのActor / Roleを信用しない。認証方式・実DB Adapter・Deploymentは今回追加しない。

`ReviewerStore`は#11のAP-REVIEW-004 / 005 / 006 / 008、AP-FEEDBACK-001の条件を表すStorage非依存境界。Adapterはcheckに最新のexact対象・Question / Revision version・Evaluation・全Source Policyを渡し、検査とHuman Record / State / 公開参照 / Receiptの確定を一貫させる。UIのdisabledだけを整合性保証にしない。

このAdapterの同期確定は単一プロセスの検証用で、実DBのTransaction・永続化・分散排他を保証したものではない。#12のAdapter、Candidate materialization、Provider実装を先取りしない。

## 対象と判断

Human Reviewはexact QuestionRevisionの凍結Contentだけを正本とする。Candidate IDはPipeline run内の識別子でありDomain IDへ代入しない。未解決CandidateはQueue内の別の閲覧投影とし、全Human decision / Editを提供しない。現在Policy未確認のCandidateに取得時TRUSTEDを現在適格と表示せず、Grounding本文は応答から除く。

Evaluationは既存のPipeline run ID / Candidate ID、exact Revision ID、評価時の全immutable Content / Contextを照合し、読取Portが確認したcurrentな評価だけをAPPROVE readinessへ使用する。Candidate PASSへfallbackしない。

| Evaluation | APPROVE | REQUEST_CHANGES | REJECT |
| --- | --- | --- | --- |
| matching PASS / eligible | 共通条件・Source / Publish Gateも必要 | 共通条件で可 | 共通条件で可 |
| matching REVISE | 不可 | 共通条件で可 | 共通条件で可 |
| matching REJECT | 不可 | 共通条件で可 | 共通条件で可 |
| mismatch / missing / stale / unverified | 不可 | 共通条件で可 | 共通条件で可 |

共通条件はexact対象、`REVIEW_REQUIRED`、未判断、Human Context、expected Question / Revision version。確定時に再検査し、異なるDecisionの競合でも最大1 definitive Reviewを守る。

Evaluation PASSはHuman APPROVEではなく公開でもない。MVPのHuman APPROVEは既存Gateを満たした同じRevisionのPublish遷移で、独立したAPPROVED状態・別Publishボタンを設けない。

## Content・Source・Edit

Diffの正本はApplicationの`REVISION_CONTENT_FIELDS`。形式、本文、Options、正答、解説、Option説明、言語、難易度、stable KnowledgePoint関係、QuestionSource関係、凍結Intentの11項目。Source関係・KnowledgePoint ID・正答ID集合をcanonical比較し、Options等の意味ある順序は保持する。現在PolicyをContent Diffへ混ぜない。

SourceReference選択は既存`referenceKey`の`sourceRevisionId + locator`を可逆encodeする。異なるRevisionの同Locator、同Revisionの別Locatorを区別し、完全な参照へ復元する。

Source blockerは全QuestionSourceについて確認する。`REVIEW_REQUIRED / PROHIBITED / ambiguous / missing`ではAPPROVE・Editを禁止し、REQUEST_CHANGES / REJECTへAPPROVE固有Gateを広げない。

- REVIEW_REQUIRED: Source Review / Terms / Policyの解決を待つ。
- PROHIBITED: 元ContentをEditで流用せず、TRUSTED Sourceから独立した再生成 / 再提案へ渡す。
- ambiguous: 同Source / Purposeの現在Decisionを一意に解決する。
- missing: 現在Policyを確認・解決する。

direct EditやSourceを削除した偽造Commandもbase RevisionのGateで拒否する。操作時にも最新Policyを確認し、外部で解消した後の再取得でReview / Editへ戻す。Source PolicyをQuestion Review画面から変更しない。

取得時SnapshotとQuestionSourceのhistorical Decision参照は維持する。同じDecision IDは同じsemanticsを表す。後日変更のFixtureだけで`current evaluatedAt > retrievedAt`を検査し、日時をDomain Ruleへ追加しない。

Editはexact base Contentから新しいApplication Candidateを作り、Validation / Evaluationが必要な状態でPortへ渡す。旧Evaluation、Domain Revision、Human Record、公開参照を変更しない。形式・言語・難易度は閲覧専用とし、方式変更の編集を追加しない。Workerによる再評価・新Revisionのmaterializationは外部境界であり、UIで完了を偽装しない。

## 保存とFeedback

- confirmed failure: 未保存確定。同じ操作を再試行できる。
- result unknown: Retry / 別Decision / 画面移動を止め、同じoperation identityを照合する。
- committed: 保存済み結果を返す。再保存しない。
- definitely-not-committed: 未保存が確定した後だけ同じ操作を再試行する。
- still-unknown: 照合を続ける。Receipt不在だけを未保存の証明にしない。

成功済みHuman decision / Editの再取得では過去結果を返し、現在状態を理由に別のRecordを作らない。

Feedbackは`issue10-v1`の選択式allowlist。自由記述、URL、添付、問題・正答、Revision ID等を拒否する。`not_used`はSimilarity 3項目すべてのN/A、`unknown`は利用したが観点ごとに判断不能。混在はApplicationでも拒否する。再提出は新Record、同じoperationの再送は同じ結果。Reviewer向けDTOへ提出者Actorを含めない。

## 開発と検証

Node / pnpmはNix Shellのものを使う。

```bash
pnpm install
pnpm --filter @refriq/web build
```

実Adapterなしで操作検証する場合だけ、Test Composition Rootを明示して起動する。本番BuildにはTest middlewareを組み込まない。

```bash
REFRIQ_REVIEWER_TEST_SERVER=1 pnpm --filter @refriq/web dev --port 4173 --strictPort
```

別Terminalで、環境に用意したPlaywrightとChromiumを使う。

```bash
REFRIQ_PLAYWRIGHT_MODULE=/path/to/playwright PLAYWRIGHT_BROWSERS_PATH=/path/to/browsers node apps/web/test/browser-check.mjs
(
  set -e
  python3 -m http.server 4174 --bind 127.0.0.1 --directory . &
  mock_server_pid=$!
  trap 'kill "$mock_server_pid"' EXIT
  REFRIQ_PLAYWRIGHT_MODULE=/path/to/playwright PLAYWRIGHT_BROWSERS_PATH=/path/to/browsers node apps/web/test/mock-browser-check.mjs
)
```

Mock用HTTPサーバーはバックグラウンドで起動し、テストの成功・失敗にかかわらずSubshell終了時に停止する。

Playwrightを本番依存へ追加していない。環境固有のBrowser共有Library / Font設定はTest環境で行う。検証結果・実施範囲・制限は[本実装の検証記録](reviewer-ui-assets/production/validation.md)を参照。
