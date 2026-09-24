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

### New Decision

1. `docs/adr/`配下のExisting ADRを確認する。
2. Primary Language、Framework、Runtime、Database、Cloud Service、Persistence、Domain Boundary、LLM / AI Pipeline、Source Governance、Security、将来のMigration Costなどに関わる重要な判断か確認する。
3. 次の連番を使用し、4桁IDと短いkebab-caseのタイトルを付ける。例: `0004-replace-worker-with-queue.md`
4. [`template.md`](template.md) を使って `Proposed` として作成する。
5. Review後、採用する場合は `Accepted`、採用しない場合は `Rejected` に更新する。

### Decision Change

1. Existing ADRを直接削除・書き換えしない。
2. 変更後のDecisionについてNew ADRを作成する。
3. Old ADRのStatusを `Superseded` にし、`Superseded by ADR-XXXX` とNew ADRへのReferenceを残す。
4. New ADRからもSupersedeしたOld ADRをReferenceし、Decisionの履歴を相互に追跡できるようにする。

### Writing Rules

- Context、Decision、Reasons、Alternatives、Consequences、Revisit Whenを記録する。
- `Proposed`のADRは、採用・却下・置換の判断ができた時点でStatusを更新する。
- Scope文書やIssueの変更だけではDecisionの意図を追跡できない場合、関連ADRへのリンクを追加する。

## Current ADRs

- [ADR-0001: Use Architecture Decision Records](0001-use-architecture-decision-records.md)
- [ADR-0002: Use TypeScript and pnpm Workspace Monorepo](0002-use-typescript-pnpm-workspace-monorepo.md)
- [ADR-0003: Use Biome and Vitest for JavaScript Validation](0003-use-biome-and-vitest-for-javascript-validation.md)
- [ADR-0004: Use Stable Domain Identities and Immutable Revisions](0004-use-stable-domain-identities-and-immutable-revisions.md)
- [ADR-0005: Source Policyと利用Gateを定義する](0005-enforce-source-governance-gates.md)

## Template

新しいADRは [`template.md`](template.md) をコピーして作成する。Templateには、判断の背景、採用理由、Alternatives、Consequences、再検討条件を記録する欄を用意している。
