# ADR-0001: Use Architecture Decision Records

- Status: Accepted
- Date: 2026-08-31

## Context

`refriq`では、MVPで最小構成を採用し、将来的なTechnology Migrationを許容する。初期の判断を後から別の構成へ置き換える可能性があるため、なぜ現在のArchitectureを選んだのかを、人間とAI Development Agentの双方が理解できる形で残す必要がある。

また、`refriq`ではCodexをAI Development Agentとして利用する。IssueやCodeだけでは、判断の背景、比較したAlternatives、受け入れたTrade-offが失われやすい。

## Decision

`refriq`では、重要なArchitecture DecisionをArchitecture Decision Record（ADR）として `docs/adr/` 配下に記録する。

ADRは、Context、Decision、Reasons、Alternatives、Consequences、Revisit Whenを基本構成とする。判断が変わった場合は既存ADRを削除・書き換えず、新しいADRからSupersedeして履歴を残す。

## Reasons

- 判断理由を残す。
- 将来のMigration判断に利用する。
- Codexが過去の意図を理解できるようにする。
- Supersededされた判断も履歴として残せるようにする。
- IssueやCodeだけでは失われやすいDesign Contextを保持する。

## Alternatives

- Architecture Decisionを記録せず、CodeとIssueだけで管理する。
- すべての設計議論を単一の設計書へ集約する。
- 各Issueに判断理由を書くが、独立したDecision履歴は作らない。

これらは、判断の検索性、変更履歴、Issue完了後のContext保持が弱くなるため採用しない。

## Consequences

ADRを作成・レビュー・更新するメンテナンスコストが発生する。

一方で、すべての判断をADR化するのではなく、主要Framework / Runtime / Database、Cloud Service、Domain境界、永続化、LLM / AI Pipeline、Security / Source Governance、将来の置換コストに大きく影響するDecisionなど、重要なDecisionだけを対象とする。これにより、判断の意図とMigrationの前提を追跡しやすくする。

## Revisit When

ADR運用そのものが過剰なDocumentation Costになった場合は、対象とするDecisionの基準や運用方法を見直してよい。
