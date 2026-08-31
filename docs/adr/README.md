# Architecture Decision Records

`refriq`の重要なArchitecture Decisionを、変更の背景とともに記録する。ADRは、IssueやCodeだけでは失われやすいDesign Contextを人間とAI Development Agentの双方が追跡できるようにするための文書である。

## ADRの目的

重要なArchitecture Decisionについて、少なくとも次を記録する。

- Context
- Decision
- Reasons
- Alternatives
- Consequences
- Revisit Condition

ADRは、現在の判断を正当化するためだけでなく、将来のMigrationや判断変更のために意図を残すことを目的とする。

## ADR化する判断の基準

次のような、将来の置換コストや責務境界に大きく影響する判断はADR化を検討する。

- 主要Framework / Runtime / Databaseの選定
- Cloud Serviceの導入・廃止
- Domain間の責務境界
- データ永続化方式
- LLM / AI Pipelineの重要な設計方針
- Security / Source Governance方針
- 将来の置換コストに大きく影響する判断

単純な実装詳細、容易に変更可能な局所判断、既存Decisionの自然な実装は、通常ADRにしない。迷う場合は、将来その判断理由を説明する必要があるか、変更時に複数のDomain・Componentへ影響するかを基準にする。

## Status

ADRでは最低限、次のStatusを使用する。

- `Proposed`: 提案中。まだ採用を確定していない。
- `Accepted`: 採用済み。現在の方針として扱う。
- `Superseded`: 新しいADRに置き換えられた。元のファイルは削除・書き換えしない。
- `Rejected`: 検討したが採用しない。

一度 `Accepted` になったADRは、判断が変わっても削除・書き換えによって履歴を消さない。新しいADRを作成し、旧ADRを `Superseded` として履歴を残す。

## ADRの作成・更新ルール

1. 重要なArchitecture Decisionを行う前に、`docs/adr/`配下の既存ADRを確認する。
2. 既存ADRと矛盾する判断を採用する場合は、理由を明記し、新しいADRでSupersedeする。
3. 新しいADRには、連番の4桁IDと短いkebab-caseのタイトルを付ける。例: `0002-replace-worker-with-queue.md`
4. `Proposed`のADRは、採用・却下・置換の判断ができた時点でStatusを更新する。
5. ADRの本文は、Decisionだけでなく、採用しなかったAlternativesと受け入れたConsequencesも記録する。
6. Scope文書やIssueの変更だけではArchitecture Decisionの意図が追跡できない場合、関連ADRへのリンクを追加する。

## Current ADRs

- [ADR-0001: Use Architecture Decision Records](0001-use-architecture-decision-records.md)
- [ADR-0002: Use TypeScript and pnpm Workspace Monorepo](0002-use-typescript-pnpm-workspace-monorepo.md)

## Template

```markdown
# ADR-XXXX: Title

- Status: Proposed
- Date: YYYY-MM-DD

## Context

この判断が必要になった背景・制約。

## Decision

採用する判断。

## Reasons

採用理由。

## Alternatives

検討した他の選択肢。

## Consequences

得られるメリットと受け入れるデメリット。

## Revisit When

どの条件になったら再検討するか。
```
