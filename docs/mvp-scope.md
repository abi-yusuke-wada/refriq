# refriq MVP Scope

- Status: Issue #1 baseline
- Last updated: 2026-08-31
- Target certification: Kong Gateway Certified Associate

## Purpose

この文書は、`refriq` MVPで検証する仮説、対象ユーザー、Knowledge Source、機能範囲、対象外、完了条件を定義する。後続のDomain設計、Knowledge Pipeline設計、UI Wireframe、DynamoDB設計、AWS Architectureは、この文書を前提にする。

この文書はMVPのScopeを固定するものであり、ApplicationやInfrastructureの実装仕様、Database Schema、AWSサービスの最終選定を定義するものではない。今回のIssueでは、Scope決定とADR運用の初期整備だけを行う。

## MVP hypothesis and product goal

### MVP hypothesis

公式公開情報を根拠としてAIで問題案を生成し、人間によるレビューを経て公開することで、本番試験の学習に利用できる問題セットを効率的かつ継続的に構築できる。

### Product goal

模擬試験を周回することで、本番試験で「この論点、refriqでやった」と感じられる学習体験を作る。

本番試験の完全再現や合格を保証することは、MVPのDone条件に含めない。

## Target certification

MVPの対象資格は、**Kong Gateway Certified Associateの1資格だけ**とする。

- MVPでは他資格に対応しない。
- 資格を抽象化した複数資格対応Platformを先行実装しない。
- 他資格の追加、資格Marketplace、外部教材Recommendationは後続Issueで検討する。

## Exam Domain

Kong公式の試験準備ページに記載された到達目標を基に、MVPでCoverageを確認するための内部Taxonomyを次の8領域として定義する。[Kong Gateway Certified Associate Exam](https://konghq.com/academy/exam-preparation)に記載された公式の到達目標を整理したものであり、公式の出題比率や試験問題の再現を意味しない。

| ID | MVP Exam Domain | 主な対象 | 重視する判断形式 |
| --- | --- | --- | --- |
| D1 | Gateway Fundamentals and Request Flow | Kong Gatewayの役割、microservice connectivity、request/response flow、APIの基本的な接続 | 要件からGatewayの挙動を判断するScenario |
| D2 | Core Entities and Configuration | Services、Routes、Plugins、Consumers、Admin API、Kong Manager、decKによる構成 | Configuration Reading、Command Reading |
| D3 | Upstreams and Traffic Routing | Upstreams、Targets、load balancing、routing条件、traffic control | 構成とリクエスト結果から挙動を判断するScenario |
| D4 | Security and Access Control | Authentication、Security、RBAC、Roles、Workspaces、Teams、dataplane security | 要件に対する認証・権限設定の選択 |
| D5 | API Design and OpenAPI | OpenAPI Specification、InsomniaによるAPIの設計・テスト・管理 | API定義や設定の読み取り |
| D6 | Installation, Operations and Versioning | Installation requirements、導入手順、運用、Upgrade approach、versioning | 運用手順・更新方針を判断するScenario |
| D7 | Plugins, Observability and Transformations | Authentication / Security / Traffic Control / Analytics & Monitoring / Transformations / Loggingの主要Plugin | 目的に合うPluginや観測方法の選択 |
| D8 | Troubleshooting | Kong Gatewayのcommon problems、ログ・設定・リクエストからの原因切り分け | Troubleshooting Scenario、Configuration Reading |

Coverageの初期品質条件として、30問以上のPUBLISHED Questionに各Domainの問題を複数問含め、特定Domainに極端に偏らないようにする。公式の出題比率が公開・確認できない場合に、推測した比率を採用しない。具体的な問題配分は、ReviewerがSourceと問題品質を確認した上で決める。

## Users and authentication boundary

### Learner

資格学習を行う利用者。MVPでは次を利用できる。

- 10問演習
- 20問模擬試験
- 問題回答
- 採点結果確認
- 解説確認
- Source確認
- 間違えた問題確認
- Topic別正答率確認
- Exam Feedback登録

### Reviewer

AI生成問題を確認・管理する利用者。MVPでは次を行える。

- Review Queue確認
- Question確認
- Knowledge Point確認
- Source確認
- 正解確認
- 誤答選択肢確認
- Explanation確認
- Question編集
- Approve
- Reject
- Exam Feedback確認

MVPではAdministratorをReviewerから分離しない。1人がLearnerとReviewerを兼務してよい。

### Authentication

認証方式そのものはMVPの対象外とする。Application Domainには、呼び出し元から次が取得済みである前提を置く。

```text
userId
role
```

開発・MVP検証では固定UserまたはテストUserを利用できる。例として `learner-01`、`reviewer-01` を使用してよい。SSO、社内認証、詳細なRBACを決めることをMVPの前提にしない。

## Source policy

詳細なSource Policyの正本は[Sourceガバナンス](domain/source-governance.md)である。Domainで利用可否を`TRUSTED`、`REVIEW_REQUIRED`、`PROHIBITED`に分類し、Allowlist、Source Review、Provenance、Ingestion / Publish Gateを機械的に検証する。

- `TRUSTED`: Source Origin、Access、利用目的、Terms / License Metadataを確認した明示Allowlist Source。通常のKnowledge / Question Pipelineへ進めるが、Questionの自動公開はできない。
- `REVIEW_REQUIRED`: Source利用可否に未解決事項がある。Metadataの登録とReview待ちはできるが、Human Source Review完了までSource本文をKnowledge / Question Pipelineへ流さない。
- `PROHIBITED`: Exam Dump等の禁止Source、利用禁止が明確なSource、アクセス制御を回避して取得したContent。本文はPipeline・長期保存・Fixture・Logへ含めない。

Normative Technical Sourceには公式公開Sourceを使う。Community / Secondary SourceはSource Review後もDiscovery / Supplemental Hintに用途を限定し、技術的正答の根拠にしない。認証・License・Termsが未確認のSourceを公式HostだけでTrustしない。実装したGateおよび禁止Content一覧は[Sourceガバナンス](domain/source-governance.md)に従う。

初期のSource候補は[Kong公式Exam Preparation](https://konghq.com/academy/exam-preparation)、[公開Gateway Documentation](https://developer.konghq.com/gateway/)、Kong Gateway Entity Documentation、decK Documentation、Learning Content / Lab、Official Sample Questionである。MVP Allowlistには確認範囲を絞ったKongのCertification Scope / Gateway Documentation Ruleを置く。個々の利用可否はTerms等のMetadataを別途確認し、ADRで全Hostを許可しない。

受験者のExamFeedbackは技術的正しさのSourceではない。Topic Emphasis、Difficulty Impression、Question Style、Hands-on Importance、Troubleshooting Prevalence、Coverage Gapのような抽象化した改善Signalのみ受け入れる。実問題Stem / Options、Screenshot、Answer Key、再構成問題、Close Paraphraseを受け取らない。

## MVP functional scope

### Knowledge Pipeline

MVPでは、次の一連の処理を成立させる。

```text
Official Source
      ↓
Source Policy Gate
      ↓ TRUSTED
Fetch
      ↓
Normalize
      ↓
Source Revision
      ↓
Change Detection
      ↓
Knowledge Extraction
      ↓
Knowledge Point
      ↓
Question Planning
      ↓
Question Generation
      ↓
Automated Validation
      ↓
Question Review Required
      ↓
Human Question Review
      ↓
PUBLISHED
```

- ReviewerがKong公式Sourceを登録できる。
- Pipelineが採用済みSourceを取得・Normalizeし、Source Revisionを保持できる。
- 新しいRevisionと既存Revisionを比較し、Source変更の有無を判定できる。
- SourceからKnowledge Pointを生成できる。
- Knowledge PointからQuestion PlanningとQuestion Candidate生成を行える。
- Automated Validation後、Questionは人間の確認が必要な `REVIEW_REQUIRED` になる。
- ReviewerのApproveで `PUBLISHED`、Rejectで公開されない状態になる。
- Workerと永続化されたStatusで処理を成立させる。Step FunctionsなどのWorkflow Engineは必須としない。

Pipelineの各Stepの詳細なWorker実装、実行基盤、再試行方式、Schemaはこの文書では固定しない。

### Traceability

すべてのPUBLISHED Questionは、最低1件の公式Sourceに追跡できなければならない。最低限、次の関係を確認できる状態をMVPの条件とする。

```text
Source
  ↓
Source Revision
  ↓
Knowledge Point
  ↓
Question
```

Questionから次を確認できること。

- 何を根拠としているか
- どのKnowledge Pointを問う問題なのか
- どのSource Revisionから作られたか

Traceabilityのための概念関係はMVPで固定するが、物理的なTable、Collection、Key、API形式は後続の設計で決める。

### Question

MVPで扱う最低限の問題形式は次のとおり。

- Single Choice
- Multiple Select
- Scenario-based Choice
- Configuration / Command Reading
- Troubleshooting Scenario

要件・構成・設定・挙動から判断させる問題を重視する。単純な用語暗記だけで問題数を満たさない。Performance-based試験を完全再現するInteractive Labは作らず、実機判断に近い内容はConfiguration Reading、Command Reading、Scenario、Troubleshootingで近似する。

Question Reviewでは、Reviewerが少なくとも次を確認・編集できる。

- Question本文
- Choices
- 正解
- Explanation
- Topic / Exam Domain
- Knowledge Point
- SourceとSource RevisionへのTrace

PUBLISHEDにできる条件は、Human Review済みであり、正解・誤答選択肢・Explanation・TraceabilityがReviewerに確認されていることとする。AIだけで自動公開しない。

MVP完了時点で、Human Reviewを経たPUBLISHED Questionを30問以上用意する。30問は本番試験の問題数を再現するためではなく、Question Generation、Human Review、Random Practice、Mock Exam、Topic Analysis、Revision、Feedbackを検証するための最低量である。

### Practice and Mock Exam

#### 10問演習

LearnerがPUBLISHED Questionから10問演習を実施できる。

- 問題を取得する
- 回答する
- 採点する
- 正解を確認する
- Explanationを確認する
- Sourceを確認する
- Resultを保存する

出題選択の詳細なアルゴリズムはMVP Scopeでは固定しない。ただし、Adaptive LearningやPersonalized Recommendationは行わない。

#### 20問模擬試験

LearnerがPUBLISHED Questionから20問の模擬試験を実施できる。

本番と完全に同じ問題数、制限時間、出題比率を再現することはMVP条件としない。MVPでは問題取得、回答、採点、Result保存と結果確認を成立させる。

### Learning Result

Learnerは最低限次を確認できる。

- 正答数
- 正答率
- 間違えた問題
- Topic別正答率
- 各問題のExplanation
- 各問題のSource

次はMVP対象外とする。

- Adaptive Learning
- Spaced Repetition
- Personalized Recommendation
- AI Tutor

### Exam Feedback

実試験受験後、Learnerは実試験の内容そのものではなく、抽象化された構造化Feedbackを登録できる。MVPで扱う項目は次のとおり。

| 項目 | MVPで収集する内容 |
| --- | --- |
| Topic | どのExam Domain / 分野の出題が多かったか、または不足していたか |
| Question Style | Knowledge、Scenario、Configuration Reading、Troubleshooting、Performance / Lab |
| Difficulty | 1〜5段階 |
| Practical Experience Importance | 実機経験がどの程度重要だったかを表す構造化Rating |
| refriq Similarity | 論点、判断方法、難易度がrefriqとどの程度近かったかを表す構造化Rating |
| Missing Topic | refriqで不足していたと感じる、選択式のTopic / Exam Domain |

実試験問題本文、選択肢、Screenshot、Exam Dumpを入力させない。実問題を自由記述で入力するUIも提供しない。MVPでは次の流れまでを対象とする。

```text
Exam Feedback
      ↓
Reviewer
      ↓
Improvement Decision
```

FeedbackからAIが自動で問題を生成・公開するところまでは実装しない。Practical Experience Importanceとrefriq Similarityの具体的なRating尺度は、構造化データであることをScope条件とし、詳細な選択肢は後続のUI / Domain設計で確定する。

## MVP end-to-end done scenario

次の一周が成立することをMVPのEnd-to-End Done Scenarioとする。

1. ReviewerがKong公式Sourceを登録する。
2. PipelineがSourceを取得する。
3. Source Revisionを保存する。
4. SourceからKnowledge Pointを生成する。
5. Knowledge PointからQuestion Candidateを生成する。
6. Questionが `REVIEW_REQUIRED` になる。
7. ReviewerがSource / Knowledge / Question / Choices / Answer / Explanationを確認する。
8. ReviewerがQuestionをApproveする。
9. Questionが `PUBLISHED` になる。
10. Learnerが10問演習を実施する。
11. Learnerが20問模擬試験を実施する。
12. LearnerがScore / Incorrect Questions / Topic Performanceを確認する。
13. 実試験受験後、LearnerがExam Feedbackを登録する。
14. ReviewerがExam Feedbackを確認する。

## MVP out of scope

### Certification

- 複数資格対応
- 資格Marketplace
- 外部教材Recommendation Engine

### Learning

- Adaptive Learning
- Spaced Repetition
- AI Tutor
- Chat-based Learning
- Personalized Curriculum

### Exam

- 実試験完全再現
- Interactive Performance Lab
- Remote Terminal
- Kong Gateway Sandbox

### AI

- Autonomous Publishing
- Multi Agent Workflow
- Model Ensemble
- Fine-tuning
- 高度なLLM Judge

### Search

- Vector Database
- Semantic Search
- 大規模RAG Platform

### Infrastructure

- ECS
- Kubernetes
- RDS
- Step Functions
- OpenSearch

これらは必要性が発生してから後続Issueで検討する。今回のScopeから導入を推測しない。

### Organization

- 高度な認証
- SSO
- Organization管理
- Team管理
- Detailed RBAC

### Delivery

- Automatic CD

## Architecture principle and MVP assumptions

### Principle

`refriq`のArchitecture Principleは、

> Scalableに作るのではなく、Replaceableに作る。

である。

MVPでは最小構成を優先し、将来必要になった場合に次のような置換を許容できる境界を意識する。

```text
DynamoDB
  ↓
PostgreSQL等

Lambda
  ↓
Container Worker

Simple Worker
  ↓
Queue / Workflow Engine

Single LLM
  ↓
Multiple Models + Evaluation
```

これは将来の移行可能性を示す原則であり、今回のIssueで移行先や各AWSサービスを決定・実装するものではない。

### MVP assumptions

- Authenticationは外部で解決済みで、Applicationは `userId` と `role` を受け取る。
- PipelineはWorkerと永続化されたStatusで成立させればよく、Workflow Engineは必須ではない。
- Source、Source Revision、Knowledge Point、Questionの概念関係は固定するが、物理Schemaは後続Issueで設計する。
- 10問演習と20問模擬試験はPUBLISHED Questionから出題する。Adaptiveな出題制御は行わない。
- Mock Examの制限時間と本番試験の出題比率はMVPのDone条件に含めない。
- Exam Domainの8領域はCoverage管理用の内部Taxonomyであり、公式試験の重み付けを仮定しない。

## MVP Done Definition

以下のChecklistがすべて満たされることをTechnical Doneとする。実装前のBaselineとして未チェックで管理し、実際の検証時にチェックする。

### Scope

- [ ] Target Certificationが1資格（Kong Gateway Certified Associate）に固定されている
- [ ] Exam Domainが定義されている
- [ ] Source Policyが定義されている

### Source

- [ ] 最低1件の公式SourceをPipelineで取得できる
- [ ] Source Revisionを保持できる
- [ ] Source変更有無を判定できる

### Knowledge

- [ ] SourceからKnowledge Pointを生成できる
- [ ] Knowledge PointからSourceへTraceできる

### Question

- [ ] Knowledge PointからQuestion Candidateを生成できる
- [ ] QuestionからSourceへTraceできる
- [ ] Human Reviewできる
- [ ] Approve / Rejectできる
- [ ] 30問以上がHuman Reviewを経てPUBLISHEDになっている
- [ ] 8つのExam Domainすべてに複数のPUBLISHED Questionが存在し、特定Domainへ極端に偏っていない

### Learner

- [ ] 10問演習を完了できる
- [ ] 20問模擬試験を完了できる
- [ ] Scoreを確認できる
- [ ] Incorrect Questionを確認できる
- [ ] Topic別正答率を確認できる
- [ ] Explanationを確認できる
- [ ] Sourceを確認できる
- [ ] Practice / Mock ExamのResultが保存される

### Feedback

- [ ] Exam Feedbackを構造化データとして登録できる
- [ ] 実試験問題そのものを入力させない設計になっている
- [ ] ReviewerがFeedbackを確認できる

### Quality

- [ ] PUBLISHED Questionがすべて公式Sourceを持つ
- [ ] PUBLISHED QuestionがすべてHuman Review済みである
- [ ] Exam DumpをSourceとして使用していない
- [ ] PUBLISHED QuestionからSource RevisionとKnowledge Pointまで遡れる

### End-to-End

- [ ] 「MVP end-to-end done scenario」の14ステップを一周できる

## MVP success criteria

Technical Doneとは別に、次をMVP Success Criteriaとする。

1. 1名以上の利用者が、次のFlowを一周利用できる。LearnerとReviewerは同一人物でもよい。

   ```text
   公式Source
   ↓
   Question Generation
   ↓
   Human Review
   ↓
   Practice
   ↓
   Mock Exam
   ↓
   Exam Feedback
   ```

2. Reviewerが、手作業のみで問題初稿を作るより、AI Pipelineを利用することで問題作成初稿の効率化が期待できると評価できる。

本番試験との完全一致、合格率、試験問題の再現度をMVP Success Criteriaにしない。

## Open questions and non-blocking assumptions

今回、Scopeを超えて勝手に固定しない事項は次のとおり。いずれも後続のDomain / Knowledge Pipeline / UI / Data設計で確定する。

- 公式Certificationの出題比率が明示されていない場合、8つの内部Domainへの30問の細かな配分をどうするか。
- MVPで基準とするKong GatewayのVersion範囲と、Version更新時にSource Revision・Questionを再評価する運用。
- 候補Sourceごとの利用規約・ライセンス確認結果、自動取得・保存できる範囲、取得頻度。
- Practical Experience Importanceとrefriq SimilarityのRating尺度・選択肢。
- Knowledge PointのTopic粒度と、Change DetectionがQuestion再レビューを要求する具体的な判定規則。
- 10問演習の出題選択方法、Mock Examの制限時間・出題比率。ただしAdaptiveな制御や本番完全再現はMVP対象外のままとする。

これらはMVPのScope文書化をブロックしない。新たなArchitecture Decisionが必要になった場合は、既存ADRを確認し、必要に応じて新しいADRまたはSuperseding ADRを作成する。

## This issue does not implement

Issue #1では、次を実装・変更しない。

- React / Vite Application
- Hono API
- DynamoDB
- S3
- AWS Infrastructure
- Bedrock Integration
- Pipeline Implementation
- Database Schema
- UI Implementation
- Wireframe
- CI/CD
- Authentication
- package dependencies
- Application Code
