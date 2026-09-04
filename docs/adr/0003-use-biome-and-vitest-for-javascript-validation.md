# ADR-0003: Use Biome and Vitest for JavaScript Validation

- Status: Accepted
- Date: 2026-08-31

## Context

Issue #3では、人間、Codex、将来のCIが同じValidation Commandを利用できる共通Harnessを整備する。Issue #2で採用したpnpm Workspaceでは、rootのpackage scriptを共通入口として利用する方針が決まっているが、TypeScript / JavaScriptのFormatter、Lint、Test Runnerはまだ導入されていない。

初期段階では、Application Frameworkや業務ロジックを追加せず、将来のWorkspaceにも適用できる最小の開発Toolchainを選ぶ必要がある。

## Decision

TypeScript / JavaScriptのFormatterとLinterにはBiomeを採用する。Biomeは単一Toolで両方の責務を担い、root `package.json` の次のscriptから実行する。

- `format`: Biomeでファイルをformatする。
- `format:check`: Biomeでformat差分を検証する。
- `lint`: Biomeのrecommended ruleでLintする。

Test RunnerにはVitestを採用し、rootの `test` scriptから実行する。現時点ではApplication業務テストを追加せず、テストが0件でもRunner自体が成功する `--passWithNoTests` を利用する。

Nix sourceのFormatterは既存のnixfmtを継続利用する。Makefileの `fmt` はBiomeとNixのformatを実行し、`fmt-check` は両方の非破壊検証を実行する。

## Reasons

- FormatterとLinterをBiomeに統合し、ESLintとPrettierを重複導入しない。
- Biomeのrecommended ruleを基準にすることで、MVPで大量のstylistic ruleやFramework固有ruleを導入せずに静的検証を開始できる。
- Vitestは将来のTypeScriptテストへ拡張でき、テスト0件を許容することで意味のないdummy testを追加せずにHarnessを成立させられる。
- pnpmが提供するroot scriptとMakefileの責務を分離し、Human、Codex、CIが同じscriptを利用できる。
- Nixが提供するNode.js / pnpm / Nix toolchainと、Application/JS toolをpackage.jsonで管理する方針を維持できる。

## Alternatives

### ESLint and Prettier

広く利用される組み合わせだが、FormatterとLinterで2つのToolを追加することになる。MVPの最小構成と責務重複を避ける方針に合わないため採用しない。

### Biome and another JavaScript Linter

BiomeのFormatterに別のLinterを組み合わせる方法。Biome単体で必要な初期Lintを実行できるため、Toolchainを増やす理由がなく採用しない。

### Node.js built-in test runner

追加依存は少ないが、今後のTypeScriptテストで必要になる設定や機能をRepositoryごとに組み立てることになる。VitestでTest Harnessを統一する方が拡張しやすいため採用しない。

## Consequences

- BiomeとVitestのVersion更新がrootのpackage.jsonとpnpm-lock.yamlに影響する。
- Biomeのrecommended ruleを変更すると、既存・将来のWorkspaceのLint結果が変わる。
- Testが0件の間は、`make test` はTest Runnerの起動確認を主な目的とする。業務品質のTest保証は後続Issueで追加する。
- Framework固有のLint rule、追加のTest Environment、Test Coverage要件は、導入が必要になった時点で別途判断する。

## Revisit When

- BiomeのLint/Format機能がRepositoryの言語・Framework要件を満たせなくなった。
- Lint ruleの適用範囲や規模がBiomeのrecommended ruleだけでは不足する。
- Test Environment、Coverage、WorkspaceごとのTest実行が必要になり、Vitestの現在構成では扱えなくなった。
