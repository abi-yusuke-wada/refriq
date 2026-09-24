# Architecture

`docs/architecture/` は、`refriq` のArchitectureの**現在どうなっているか**を説明する場所である。現在のComponent、Package境界、Data Flow、実装済みの制約を記載し、未実装の将来案を現在の構成として扱わない。

Architecture DocumentとADRの責務は分ける。

- Architecture Documentは「現在どうなっているか」を記載する。
- ADRは「なぜそのDecisionを行ったか」を記録する。

## Documentation Responsibility

| Document | Responsibility |
| --- | --- |
| [`README.md`](../../README.md) | Project概要と開発開始方法 |
| [`docs/mvp-scope.md`](../mvp-scope.md) | MVPで何を作るか、対象外、完了条件 |
| [`docs/domain/`](../domain/) | 各Domain Conceptの意味、Identity、Lifecycle、不変条件 |
| [`docs/domain/source-governance.md`](../domain/source-governance.md) | Source Policy、許可条件、Provenance、Ingestion / Publish Gate |
| `docs/architecture/` | 現在のArchitecture |
| [`docs/adr/`](../adr/) | Architecture Decisionを行った理由、Alternatives、Consequences |
| [`AGENTS.md`](../../AGENTS.md) | Codexを含む開発者が常に守るRepository Rule |
| GitHub Issue | 個別TaskのGoal、Scope、Acceptance Criteria、Verification |

同じ内容を複数のDocumentへ大量にコピーせず、詳細の正となるDocumentへリンクする。

## Current Baseline

現在のRepositoryは、TypeScriptとpnpm WorkspaceによるMonorepoのSkeletonである。

- `apps/`: `web`、`api`、`pipeline`
- `packages/`: `domain`、`application`、`contracts`
- `packages/domain`: Source Classification、利用Gate、Provenance / Publish Ruleを持つ。Pipeline OrchestrationやPersistenceは持たない。
- `Makefile`: Human、Codex、将来のCIが利用する共通Validation入口
- `docs/mvp-scope.md`: MVPのScopeとSource Policy
- `docs/adr/`: Architecture Decisionの履歴

Application機能やInfrastructure実装の詳細は、実装された時点でこのDirectoryへ現在状態として追加する。Decisionの背景を記載する必要がある場合は、既存ADRを参照し、必要なら新しいADRを作成する。
