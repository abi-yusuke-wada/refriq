# ADR-0002: Use TypeScript and pnpm Workspace Monorepo

- Status: Accepted
- Date: 2026-08-31

## Context

`refriq`は、Web UI、HTTP API、Knowledge Pipelineと、Domain / Application / Contractの境界を持つApplicationへ段階的に成長する。現在のRepositoryにはApplication実装を始めるためのTypeScript構成がなく、人間、Codex、将来のCIが同じWorkspace構造と検証Commandを利用できる基盤が必要である。

MVPでは、将来の規模を先回りして複雑な構成を作らず、必要になった時に置き換えられる境界を優先する。

## Decision

`refriq`では、TypeScriptをApplicationの主言語とし、pnpm Workspaceで`apps/*`と`packages/*`を管理するMonorepoを採用する。

次の6つをWorkspace Packageとして用意する。

- `@refriq/web`
- `@refriq/api`
- `@refriq/pipeline`
- `@refriq/domain`
- `@refriq/application`
- `@refriq/contracts`

Workspace間の依存は、実際に必要になるまで追加しない。Task Runnerは導入せず、rootのpackage scriptを共通入口として、現時点では`pnpm typecheck`で各WorkspaceのTypeScript Compilerを実行する。

共通のTypeScript設定はrootの`tsconfig.base.json`で管理する。Node.js、将来のHono / Lambda、ブラウザBundlerで共有しやすい最小の基準として、ES2022をtargetにし、NodeNextのModule設定とESM Package境界を採用する。環境固有の設定やApplication Build設定は、必要になったIssueでWorkspaceごとに追加する。

## Reasons

- Frontend、API、PipelineでTypeScriptの知識と型を共有できる。
- Codex、人間、CIが同一Repository構造と同じ`pnpm typecheck`を利用できる。
- Domain、Application、Contractの責務境界をDirectoryとPackage名で明示できる。
- pnpm Workspaceだけで現時点のWorkspace管理に必要な機能を満たせる。
- MVP段階でTurborepoなどのTask Runnerを導入する必要がない。
- 将来、Task数やCI時間が増えた場合にBuild Orchestratorを追加できる。

## Alternatives

### Repository分割

ApplicationごとにRepositoryを分ける方法。独立したDeployment Cycleには向くが、初期段階で共通のDomain / Contract境界と変更を追跡する負担が増えるため採用しない。

### npm Workspace

npm標準機能でWorkspaceを管理する方法。追加ツールは少ないが、現在のFlakeが提供するpnpmとRepositoryの開発運用に合わせるため採用しない。

### yarn Workspace

yarnでWorkspaceを管理する方法。pnpmと同様の構成は可能だが、現在の開発Toolchainと異なるPackage Managerを増やす理由がないため採用しない。

### pnpm + Turborepo

pnpm WorkspaceにTask Runnerを追加する方法。将来的に有効な可能性はあるが、現時点のWorkspace数とTask数ではpnpmのrecursive commandで十分なため採用しない。

## Consequences

- Workspace間の依存を追加する場合、依存方向とPackage Boundaryを管理する必要がある。
- Monorepo内の変更がRepository全体のTypecheckや将来のCIに影響する可能性がある。
- Packageごとの独立したRelease / Deploymentを行う場合、追加の運用設計が必要になる。
- 規模拡大時には、Task実行順序・Cache・CI時間のためにTask Runner導入を再検討する可能性がある。
- NodeNext / ESMを共通の初期基準とするため、将来BundlerやRuntime固有の要件が明らかになった場合はWorkspaceごとの設定調整が必要になる。

## Revisit When

- Workspace数またはTask数が大幅に増えた。
- TypecheckやCI時間が開発上の問題になった。
- Workspaceごとに独立したDeployment Cycleが必要になった。
- Monorepoの運用コストが共有境界のメリットを上回った。
- Node.js、Browser Bundler、LambdaのModule要件が共通NodeNext基準で扱えなくなった。
