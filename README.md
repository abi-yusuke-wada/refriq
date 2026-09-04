# refriq

`refriq` は、教材や高品質な模擬問題が不足している資格を対象に、公式公開情報をもとにした問題演習・模擬試験環境を提供するための資格学習基盤です。

## Concept

資格取得が推奨されていても、資格によって利用できる教材の充実度には大きな差があります。

AWS や Azure のように、市販書籍・オンライン講座・模擬試験が十分に存在する資格については、既存教材を利用する方が合理的です。

一方で、公式ドキュメントや学習コンテンツは存在するものの、高品質な模擬問題や反復演習環境が不足している資格もあります。

`refriq` は、そのような資格に対して、

> 公式情報を知識源として問題を作成し、人間によるレビューと実際の受験フィードバックを通じて、模擬試験の品質を継続的に改善する

ことを目指します。

## Goals

最終的には、模擬試験を繰り返し利用することで、

> 本番試験で「この論点、refriqでやった」

と感じられるレベルの問題演習環境を目指します。

単純な暗記問題の大量生成ではなく、

- 本番で問われる知識領域
- 判断を要求されるポイント
- シナリオ形式
- 紛らわしい選択肢
- トラブルシューティング
- 実務・実機経験が必要な論点

などを考慮した問題作成を目指します。

## Core Idea

問題品質を、主に2つの経路から改善します。

### Knowledge Pipeline

公式に公開されている情報を知識源として利用します。

```text
Official Reference
        ↓
Source Revision
        ↓
Knowledge Point
        ↓
Question Planning
        ↓
Question Generation
        ↓
Automated Validation
        ↓
Human Review
        ↓
Publish
```

公式情報が更新された場合は差分を検知し、その情報を参照している問題を再評価します。

AIによって生成・更新された問題を自動公開するのではなく、公開前に人間によるレビューを行います。

### Exam Feedback Loop

実際に資格試験を受験した利用者から、試験傾向についてフィードバックを収集します。

収集対象は、例えば以下です。

- 出題が多かった分野
- 問題形式
- シナリオ問題の多さ
- トラブルシューティング問題の多さ
- 実機操作の重要度
- 模擬試験との難易度差
- 模擬試験で不足していた分野

実際の試験問題本文や選択肢そのものは収集しません。

```text
Knowledge Pipeline
        │
        │  What should be asked?
        │
        ├───────────────┐
                        ↓
                Question Generator
                        ↑
        ┌───────────────┘
        │
        │  How should it be asked?
        │
Exam Feedback Loop
```

## Source Policy

`refriq` は、実試験問題や Exam Dump を収集するためのサービスではありません。

問題生成では、原則として以下のような公式公開情報を利用します。

- 公式ドキュメント
- 公式シラバス
- 公式 Exam Guide
- 公式 Learning Content
- 公式 Sample Question
- 公式 Lab

公開情報についても、利用規約やライセンスを確認した上で利用します。

Exam Dump、流出問題、受験者による実試験問題の再現などは、問題生成ソースとして利用しません。

## Initial Scope

最初から複数資格を扱う巨大な共通基盤は作りません。

まずは1資格を対象として、

```text
Official Reference
        ↓
Knowledge
        ↓
Question
        ↓
Human Review
        ↓
Practice / Mock Exam
        ↓
Feedback
```

までの一連の流れを成立させることをMVPの目標とします。

資格追加は、その後の実績を見ながら行います。

また、既に高品質な外部教材が存在する資格については、自前教材を作成せず、外部教材を案内する方針です。

MVPの対象資格、Scope、完了条件、対象外は [MVP Scope](docs/mvp-scope.md) にまとめています。Architecture Decisionは [ADR](docs/adr/) で管理します。

## Architecture Principles

`refriq` では、MVPの段階から将来の規模を予測して複雑な構成を作り込むことはしません。

基本方針は、

> Scalable に作るのではなく、Replaceable に作る。

です。

初期段階では可能な限り小さな構成とし、利用者・資格数・処理量が増えた段階で必要なコンポーネントへ置き換えます。

例えば将来的には、

```text
DynamoDB
    ↓
PostgreSQL / Other Database

Lambda Worker
    ↓
Queue / Container Worker

Simple Pipeline
    ↓
Workflow Engine

Single LLM
    ↓
Multiple Models + Evaluation
```

のような移行を許容します。

そのため、Domain / Application Layer からクラウドサービス固有の実装へ直接依存しすぎない構成を目指します。

## Technology

現在予定している主要技術です。

### Application

- TypeScript
- Node.js
- React
- Vite
- Hono

### AWS

MVPでは、常時起動するインフラを極力持たないServerless構成を想定しています。

- AWS Lambda
- Amazon DynamoDB
- Amazon S3
- Amazon EventBridge Scheduler
- Amazon Bedrock

必要性が生じるまで、Workflow Engine、Container Runtime、Vector Databaseなどは導入しません。

### Development Environment

- Nix Flakes
- direnv
- pnpm

開発ツールチェーンは `flake.nix` を正として管理します。

## Development Setup

### Requirements

Nix Flakesを利用できるNix環境が必要です。

direnvを利用する場合、シェルへのdirenv hookも有効化してください。

### direnv

初回のみ実行します。

```bash
direnv allow
```

以降はリポジトリへ移動すると、自動的に `flake.nix` の開発Shellが適用されます。

```bash
cd refriq
```

### Manual

direnvを使用しない場合は、手動でも開発Shellへ入れます。

```bash
nix develop
```

### Install dependencies

開発Shell内で、lockfileに従って依存関係をインストールします。

```bash
pnpm install --frozen-lockfile
```

### Typecheck

すべてのTypeScript Workspaceを検証します。

```bash
pnpm typecheck
```

### Verify

Human、Codex、将来のCIで共通のValidation入口を利用するため、Repositoryの検証にはMakefileのCommandを使用します。

```bash
make help
make fmt
make fmt-check
make check
```

`make check`はFormatter、Lint、TypeScript Typecheck、Test、Nix Flakeを変更なしで検証します。利用可能なCommandの一覧は`make help`を正とします。

開発Shell内で以下を確認できます。

```bash
node --version
pnpm --version
aws --version
jq --version
```

## Development Policy

MVPでは、特に以下を意識します。

- 依存ライブラリを必要以上に増やさない
- Framework固有機能へ過度に依存しない
- HonoはHTTP Adapterとして扱う
- Domain LayerからAWS SDKへ直接依存しない
- LLM ProviderをApplication Logicへ直接埋め込まない
- DynamoDB固有のKey設計をDomainへ漏らさない
- AI生成問題はHuman Review後に公開する
- 将来必要になるかもしれない機能を先回りして実装しない

## Status

Early development / MVP planning

現在は、開発ツールチェーンおよび基本アーキテクチャを整備しています。
