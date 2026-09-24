# Repository Development Rules

このファイルは、Repository全体でHumanとCodexが常に守る開発Ruleを定義する。Task固有の条件は、rootのRuleへ追加せずGitHub Issueに記載する。

## 作業開始前

作業前に、存在する範囲で次を確認する。

- `README.md`
- `docs/mvp-scope.md`
- `docs/architecture/`
- `docs/adr/`
- 対象Issue

Issueの背景、目的、対象範囲、対象外、受入条件、依存Issue、検証方法をTask Contractとして扱う。対象外の作業を「ついでに」追加しない。Accepted ADRと矛盾する変更は、理由と影響を確認せずに行わない。

## Minimal Change

要求を満たす最小変更を優先する。

- 将来必要になるかもしれない機能を先行実装しない。
- 無関係なRefactorを同時に行わない。
- 新規依存を追加する前に、既存の手段で実現できないか確認する。
- 依存を追加する場合は、目的と境界を明確にする。

Architectureの原則は「Scalableに作るのではなく、Replaceableに作る」である。ただし、すべてを抽象化せず、交換可能性が高い外部境界だけを必要な範囲で抽象化する。

## ドキュメント

- RepositoryのDocumentationは原則として日本語で記載する。DocumentのTitle、見出し、表、図の表示文言も日本語にする。
- Domain用語、Code上のIdentifier、固定Status名など、正確さのために必要な英語表記は使用してよい。

## Dependency Boundary

### Domain

`packages/domain` はrefriq固有のConceptとRuleを中心とし、次へ直接依存しない。

- AWS SDK
- Hono
- Database Driver
- LLM Provider SDK
- UI Framework
- Infrastructure Library

### Application

Application Layerから特定のInfrastructure Implementationへ直接依存しすぎない。将来交換する可能性が高いDatabase、Object Storage、LLM Provider、Cloud Providerなどの外部境界は必要な場合に分離する。意味のない抽象化は追加しない。

### HTTP Adapter

HonoはHTTP Adapterとして扱う。Honoが未導入の段階でも、このRuleを適用する。

```text
Hono Handler
    ↓
Application Use Case
    ↓
Domain
```

Handlerの責務はRequest受信、Validation、Use Case呼び出し、Response変換程度とし、業務判断、DB更新、LLM呼び出し、Publish判定などの業務ロジックを書かない。

### Generated and External Input

System Boundaryを越えて入るExternal HTTP Response、Source取得結果、Generated JSON、Parsed Documentなどを無条件に信頼しない。

LLM生成物は、そのままDomain Dataとして扱わない。Application BoundaryでSchema Validation、必須項目、enum / format、必要な業務Validationを通す。

```text
LLM → Generated JSON → Schema Validation → Application → Domain
```

具体的なSchema Libraryは、このRuleだけでは固定しない。既存ADRや対象Issueに決定がある場合はそれに従う。

## Verification

MakefileをRepository Validationの共通入口とし、基本Validation Commandは次とする。

```bash
make check
```

コードまたは設定を変更したら、原則として `make check` を実行する。Formattingが必要な場合は、次の順序で実行する。

```bash
make fmt
make check
```

Documentationのみの変更など、全Validationが明らかに不要な場合は適切な検証に絞ってよいが、完了報告に実行した検証を記載する。TypeScriptを変更した場合は `pnpm typecheck` も確認する。

Node.jsとpnpmは `flake.nix` が提供するものを使用する。開発Shellが必要な場合は `direnv allow` または `nix develop` を使う。

## Failure Handling

- Validation Errorを無視しない。
- `|| true` などで失敗を隠さない。
- 既存Testを削除して検証を通さない。
- Acceptance Criteriaを満たすためのFake Scriptを追加しない。
- 原因不明の既存Failureは、解消できない場合も事実と影響を報告する。

## ADR and Source Governance

重要なArchitecture Decisionを行う場合は、まず [`docs/adr/`](docs/adr/) の既存ADRを確認し、新規ADRが必要か、既存ADRをSupersedeする必要があるかを検討する。Primary Language、Framework、Runtime、Database、Cloud Service、Persistence、Domain Boundary、LLM / AI Pipeline、Source Governance、Security、将来のMigration Costへ大きく影響する判断はADR候補とする。変わりやすい局所実装、Formatting、Minor Refactorは通常ADRにしない。

Accepted ADRの判断を変更するときは、古いADRを削除・改変せず、新しいADRを作成して `Superseded by ADR-XXXX` で接続する。作成・更新の手順は [`docs/adr/README.md`](docs/adr/README.md) を正とする。

Source利用に関する変更は [`docs/mvp-scope.md`](docs/mvp-scope.md) と関連ADRを確認する。Exam Dumpや実試験問題をSourceとして追加しない。

## Repository Scope

RootのRuleは短く保ち、異なるRuleが本当に必要になるまで下位Directoryの `AGENTS.md` は追加しない。独自Agent Runtime、Orchestrator、Codex Wrapper CLI、Prompt Management System、自動Issue作成AgentなどのAgent Frameworkは作らず、AGENTS.md、Issue、Acceptance Criteria、Verification、Architecture Docs、ADR、Makefile、Tests、CIをRepository Contractとして利用する。
