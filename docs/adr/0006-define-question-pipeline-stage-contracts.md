# ADR-0006: Question PipelineのStage契約とProvider境界を定義する

- Status: Accepted
- Date: 2026-09-24

## 背景

Issue #8では、LLMの文章一致に依存せずPipelineを変更・評価できる基盤が必要になった。既存DomainはSource Policy、SourceRevision Policy Snapshot、QuestionSource、Human Review / Publish Gateを定義しているが、Knowledge Extraction、Question Planning、Question Generation、Question EvaluationのStage ContractとProvider Boundaryはなかった。

Production RuntimeではKong AI Gateway経由のLLM利用を想定している。Gateway token制限とModelのContext Windowが異なる可能性があるため、Source Revision全体を各requestへ渡す設計や、複数問題のBatch生成を前提にしない。

## 決定

- 4つのStage Contract、Orchestration、LLM Portを`packages/application`に置く。Domain ModelやSource Policyを再定義しない。
- 各Stage Input / OutputをJSON Schema Draft 2020-12で表し、AjvによるRuntime Schema Validationと参照・Domain関係の決定論的Validationを行う。Stage間へ未検証LLM Outputを渡さない。
- Pipeline Inputは既存Domainの取得時SourceRevision Policy Snapshotと現在Policy Decisionを区別して受け取り、既存のKnowledge Extraction / Question Generation Gateを通してから実行する。
- SourceRevision ProvenanceとLLM Request Contextを分離する。ApplicationはLocatorと一致した選択済みGrounding SegmentをStage単位で組み立てる。PlanningにはSource本文を渡さず、Generation / Evaluationには対象QuestionのSourceReferenceに一致したSegmentのみを渡す。
- `StructuredOutputProvider` PortにStage InputとOutput Schemaを渡す。Provider SDK、Credential、Network Call、Gateway token上限値はDomain / Application Contractへ含めない。現時点のAdapterはFixture Fakeだけである。
- Provider-neutralなprovider / model / prompt version / request IDをStage Resultへ残す。Pipeline AttemptとStage Status / FailureをRun Resultに返し、FAILED Stageから再開できる。Pipeline PersistenceはこのIssueで導入しない。
- Evaluationの`PASS` / `REVISE` / `REJECT`をSemantic Quality Resultとして扱う。これらはHuman `QuestionReview`ではなく、既存Publish GateのApproval条件を満たさない。
- Pipelineは`QuestionRevision Candidate`を返す。Domain Revision / `QuestionSource`作成とHuman Approval / Publishは既存Domain Flowに委ねる。

## 理由

- Stage毎のInput / OutputとValidationにより、責務、Failure位置、Retry位置を判定できる。
- AjvはRepositoryに既存Schema Libraryがない状態で、Stage Outputを標準JSON SchemaとしてLLM Providerにも渡すRuntime検証を提供する。
- Grounding Segmentを選択して各requestへ渡すことで、Token制約に応じたContext準備をProvider / 呼出元側で行える。DomainはProviderごとのContext制限を知らない。
- 既存DomainのSource Gate / Publish Gateを再利用し、Source provenanceとHuman ReviewのInvariantをPipelineから迂回させない。
- CandidateとImmutable Revisionを分けることで、再生成結果による既存Revision上書きを避ける。

## 検討した選択肢

### 単一の巨大Prompt

Knowledge抽出、Planning、Generation、Evaluationを1回のPromptへまとめる方法。Stage責務とSchema Failure / Provider Failureの位置が曖昧になり、部分再実行もできないため採用しない。

### Provider SDKをApplicationから直接呼ぶ

最初のLLM Providerへ合わせた実装は簡潔だが、Domain / Use CaseがProviderとCredential境界へ依存する。今回の評価基盤ではFake Providerのみで成立させ、実Adapterは必要時に追加する。

### SourceRevision全文を全Stageへ渡す

Source本文を全Stageへ再利用できる一方、Gateway / Model token上限と無関係なContextを持ち込み、Stageの必要情報が不明瞭になる。Stage単位でSourceReferenceに合うExcerptだけを渡す。

### TypeScript型だけでLLM Outputを検証する

TypeScript型はRuntimeのLLM Responseを検証しない。JSON SchemaとAjvで外部Responseを検証し、JSON Schemaで表現しにくいID / Provenance関係を追加コードで検査する。

## 影響

- Application Runtime依存としてAjvを追加する。DomainはAjvやLLM Providerへ依存しない。
- Stage SchemaとCross-Stage Validationの整合性をPipeline Contract Testで確認する。
- Fake Providerで契約を検証できる一方、Production ProviderのJSON Schema対応、token counting、context truncation / chunk selectionは未実装である。
- Pipeline Run / Artifactは現在メモリ上の戻り値であり、Process終了後の再開や重複実行排他はPersistence Issueで別途定義する。
- Evaluation `PASS`後もHuman Reviewは必須で、Candidate自体をPublish Gateへ渡すことはできない。

## 再検討する条件

- Kong AI Gateway AdapterのStructured Output機能が現在のJSON Schema表現に対応しない場合。
- Token制限に応じたSource segment選択・分割・複数回Extractionが必要になった場合。
- Stage ArtifactやAttemptを永続化し、process再起動後も再開する必要が生じた場合。
- QuestionRevision作成前後のKnowledgePoint stable identity割当とQuestionSource保存のUse Caseが確定した場合。
