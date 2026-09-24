# ADR-0005: Source Policyと利用Gateを定義する

- Status: Accepted
- Date: 2026-09-24

## Context

Issue #6で`SourceDocument`、immutableな`SourceRevision`、`KnowledgePoint`、`QuestionRevision`、`QuestionSource`、`QuestionReview`の関係を定義した。公式公開Sourceを優先し、生成Questionの公開前にHuman Reviewを行う方針は存在したが、Sourceの利用分類、Source Review、Pipeline / Publish時の検証がなかった。

Sourceが後に利用禁止となる可能性があり、Source利用時点の判断を残しつつ、禁止SourceをPipelineへ流さないDomain Boundaryが必要である。

## Decision

- Source利用状態を用途ごとに`TRUSTED`、`REVIEW_REQUIRED`、`PROHIBITED`で分類する。判定は明示Metadata、Allowlist、禁止Category、Human Source Reviewを使う決定的なDomain Ruleとする。
- `TRUSTED`はSource Origin、Owner / Kind、Access、Purpose、Terms / License Metadataを確認したSourceに限る。公式公開Sourceを技術的正答のNormative Sourceとする。Community / Secondary Sourceは用途限定のDiscovery / Supplemental Hintとし、Normative Technical Groundingにしない。
- Allowlist RuleはOwner、完全一致Hostname、Source Kind、Usage Purpose、任意Path Prefixを持つ明示設定とする。Wildcard全許可やAllowlist一致だけでのTrustはしない。
- `REVIEW_REQUIRED`はMetadata登録だけを許し、Source Reviewが完了するまでKnowledge / Question Pipelineへ渡さない。`PROHIBITED`はPipeline、SourceRevision、KnowledgePoint、QuestionSourceで拒否する。禁止本文を保存する代わりに拒否MetadataとReason Codeだけを扱う。
- Source Reviewは`APPROVED_FOR_USE`、`REJECTED`、`NEEDS_MORE_INFORMATION`を記録し、QuestionReviewと分離する。
- Source Policy Decisionは履歴として追記し、SourceRevisionは取得時Classification、Policy Decision参照、Terms Metadata Snapshotを含めてimmutableに保つ。Policy変更時に既存Revisionを更新しない。
- PublishではQuestionRevisionのHuman `QuestionReview` `APPROVE`、KnowledgePoint / SourceRevision Provenance、Publish時点の最新Source Policy `TRUSTED`をすべて検証する。Source TrustはQuestion Quality Approvalを代替しない。
- 法的最終判断、Crawler、Browser Automation、アクセス制御回避、物理SchemaはこのDecisionに含めない。個別HostはAllowlist Configで管理し、ADRに固定しない。

## Reasons

- Classification、Reason Code、GateをDomain Ruleにすることで、警告表示に依存せず禁止Sourceと未確認Sourceを処理境界で拒否できる。
- Exact Host / Kind / Purposeを明示するAllowlistにより、公式サイトであることだけからContent全体を許可する誤判定を避けられる。
- ImmutableなRevision Snapshotと追記式Policy Decisionを分け、過去の根拠と後日の利用判断を両方追跡できる。
- Source ReviewとQuestion Reviewを分離し、Source利用判断とQuestion公開品質のHuman Approvalを混同しない。

## Alternatives

### Documentation-only Policy

運用者の注意だけに依存する方法。禁止SourceがKnowledge ExtractionやQuestionSourceへ進むことをDomain / Pipeline Boundaryで検証できないため採用しない。

### Official Hostを自動的にTrustedとする

公式DomainのContentでもAccess、Terms、License、利用Purposeは異なる。Host一致だけでは利用条件を確認できないため採用しない。

### Source Policy変更で既存SourceRevisionを更新する

取得時点の状態と現行判断が混ざり、過去Questionの根拠を再現できなくなるため採用しない。

## Consequences

- Source候補MetadataとPolicy DecisionをDomainで検証する。利用許可時はAllowlist・Terms Metadata・Usage Purposeの確認が必要となる。
- Publish Gateは取得時Provenanceに加えて現在のPolicy Decisionを必要とする。
- Domain RuleとTestは追加するが、Crawler、Fetch Worker、Database Schema、Reviewer Authenticationは追加しない。
- Source / Review / Decision / SnapshotのPersistence Key、Storage、RetentionはIssue #12で決める。

## Revisit When

- Source Policyの状態やUsage Purposeを別Conceptへ分ける必要が明確になった場合。
- Official / Non-official Sourceの利用境界を変更する場合。
- Source ReviewとPolicy Decisionの履歴方式を変更する必要が生じた場合。
- Source Policy以外の独立したRelease ApprovalやPublish Flowを導入する場合。
