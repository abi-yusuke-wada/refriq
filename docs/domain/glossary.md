# ドメイン用語集

各Conceptの語義と境界を定義する。IdentityはDomain上で安定して参照する概念を示し、物理的なID形式は示さない。

## 資格と学習Taxonomy

### Certification

- **定義:** `Kong Gateway Certified Associate`のような、試験対象となる資格そのもの。
- **責務:** Vendor / awarding authority、資格名称、および資格内のExamTopicを束ねる。資格のIdentityは名称や試験Scopeの小さな変更では変えない。
- **識別:** Stableな`CertificationId`。Vendor名やURLはIdentityではない。Vendorは値として関連付け、独立Entityにはしない。
- **変更性:** Identityは不変。表示名や説明などのMetadataは更新可能。同じ資格が提供終了したことを表す場合はRetiredへ移せる。
- **状態・Lifecycle:** `ACTIVE` → `RETIRED`。Retiredでも既存Question、Answer、Feedbackからの参照は維持する。再開を別Stateにするかは必要になるまで決めない。
- **関連:** 1つのCertificationが複数のExamTopicを持つ。MVPはこのConceptを保持したままKongの1資格だけを扱う。
- **主な不変条件:** `INV-CERT-001`。MVPの単一資格制約はDomain Conceptを省く理由にはならず、Multi-certification機能を意味しない。

### ExamTopic

- **定義:** Certificationの公開Exam Scopeに基づいてrefriqが整理する、比較的大きな出題領域。MVPの8つのExam Domainは公式準備情報を整理した内部Taxonomyであり、公式の出題比率や試験問題の再現を表さない。
- **責務:** Question Coverageを大きな単位で分類する。細かい学習・出題単位はKnowledgePointが担う。
- **識別:** Certification内でstableな`ExamTopicId`。ラベル変更ではIdentityを変えず、境界や意味が変わる場合は旧TopicをRetiredにして別Identityを作る。
- **変更性:** Name、説明、公式Scopeへの説明的な対応は同じMeaningを保つ範囲で更新可能。
- **状態・Lifecycle:** `ACTIVE` → `RETIRED`。Retired Topicは過去のQuestion / Answerの分類に残し、新規の学習設計では使用しない。
- **関連:** 1つのCertificationに属し、複数のKnowledgePointを分類する。KnowledgePointは主たる1つのExamTopicに属する。
- **主な不変条件:** `INV-CERT-001`、`INV-KNOWLEDGE-001`。

### KnowledgePoint

- **定義:** 1つまたは複数の公式SourceRevisionから導出された、学習・出題可能な細粒度の知識単位。例:「Routeがincoming requestとGateway Serviceを対応付ける役割を理解する」。
- **責務:** ExamTopicより小さい理解目標を表し、Questionが何を測るかを示す。
- **識別:** Meaningが同じ間はstableな`KnowledgePointId`を維持する。説明文の修正だけでは新Revisionを作らない。
- **変更性:** 説明とSourceRevisionへのEvidence関係は更新可能。Meaningが大きく変わる場合は、旧KnowledgePointをDeprecatedにし、新しいIdentityを作る。KnowledgePoint用のRevision系列はMVPで設けない。
- **状態・Lifecycle:** `ACTIVE` → `DEPRECATED`。Deprecatedは過去のQuestion / Answerの説明に残すが、新しいQuestion設計の対象にはしない。
- **関連:** 主たるExamTopicに分類され、少なくとも1つの公式SourceRevisionを根拠として持つ。複数Revisionから導出・補強され得る。
- **主な不変条件:** `INV-KNOWLEDGE-001`、`INV-KNOWLEDGE-002`。Source更新だけでKnowledgePointやその履歴を自動削除しない。Evidenceの再評価はIssue #8のPipeline責務。

## 出典と履歴

### SourceDocument

- **定義:** 公式Documentation等の参照対象と、Review対象として登録されたSource候補のstable identity。
- **責務:** SourceそのもののIdentityと現在のCatalog Metadata / Locatorを表す。Sourceの用途別ClassificationはSourcePolicyDecisionで管理する。公式公開Sourceを技術的な正しさのNormative Sourceとして優先する。
- **識別:** Stableな`SourceDocumentId`。URLはLocatorでありIdentityではない。同じ著作物のURL変更やRedirectでは同じSourceDocumentを維持できる。別の著作物へ差し替わった場合は別Identityとする。
- **変更性:** Current URL、表示名などのCatalog Metadataは変更可能。過去RevisionのMetadata Snapshotは変更しない。
- **状態・Lifecycle:** 登録後、将来の取得対象からRetireできる。Retiredにしても既存Revision、QuestionSource、QuestionRevisionの参照を消さない。利用可否と用途はSourcePolicyDecisionに記録する。
- **関連:** 1つのSourceDocumentが0個以上のSourceRevisionを所有する。QuestionRevisionはSourceDocumentではなく特定のSourceRevisionへ根拠を追跡する。
- **主な不変条件:** `INV-SOURCE-001`、`INV-SOURCE-002`。

### SourceRevision

- **定義:** SourceDocumentからある時点で取得し、解析対象にしたContentのimmutable Snapshot。
- **責務:** KnowledgePoint / QuestionRevisionを作成した時点のSource Contentと取得時の文脈を再現可能にする。
- **識別:** 親SourceDocumentの下でstableな`SourceRevisionId`。Revision順序は同一Document内で識別できればよく、連番形式やID生成方式は決めない。
- **変更性:** **Immutable**。Content、`retrievedAt`、Content Fingerprint、Source Metadata Snapshot、取得時のSource URL、取得時Classification、Terms Metadata Snapshot、Policy Decision参照を作成後に更新・上書きしない。
- **状態・Lifecycle:** SourceDocumentの取得・解析時に作成され、以後は不変の履歴として保持する。Contentが変わった場合は新しいSourceRevisionを作る。同一Contentの再取得だけでContent Revisionを増やす必要はない。
- **関連:** 必ず1つのSourceDocumentに属す。KnowledgePointとQuestionSourceから参照される。
- **主な不変条件:** `INV-SOURCE-001`、`INV-SOURCE-002`、`INV-SOURCE-003`。

Content Fingerprintは解析対象Contentを比較するための値であり、Algorithm、Normalization規則、保存方式はPipeline / Persistence設計で決める。Source URLのみが変わりContentが同じならSourceDocumentのCurrent Locatorを更新し、旧SourceRevisionとその取得時URLは維持する。Content Revisionを作るのはContentが変わった場合であり、URL変更そのものをContent変更とみなさない。新Revisionには取得時URL、Metadata、Policy Decision、Terms Snapshotを記録する。Policy変更はSourceRevisionを書き換えず、新しいSourcePolicyDecisionを追記する。

### SourceReview

- **定義:** HumanがSourceの利用適格性と許可するUsage Purposeを確認するDecision Record。
- **責務:** Sourceを利用するPolicy上の判断とReviewerの証跡を残す。
- **識別:** `SourceReviewId`を持つAppend-only Entity。認証方式やReviewer権限は定義しない。
- **変更性:** Source、Reviewer、Decision、Purpose、Review日時を後から書き換えない。再確認は別Recordとする。
- **状態・Lifecycle:** `APPROVED_FOR_USE`、`REJECTED`、`NEEDS_MORE_INFORMATION`のいずれかをDecisionとして記録する。Needs More Informationは再ReviewまでSourceを利用できない。
- **関連:** 1つのSourceDocumentに属し、対応するSourcePolicyDecisionから参照できる。QuestionRevisionを審査するQuestionReviewとは別Conceptである。

### SourcePolicyDecision

- **定義:** 特定SourceとUsage Purposeを評価した時点のClassificationとReasonを表す不変Record。
- **責務:** `TRUSTED`、`REVIEW_REQUIRED`、`PROHIBITED`のProduct Policy判断を追跡可能にし、Ingestion / Publish Gateへ渡す。
- **識別:** `SourcePolicyDecisionId`を持つ。SourceDocument、Usage Purpose、評価日時、Reason Code、必要に応じSourceReviewを参照する。
- **変更性:** Append-only。Terms変更やPolicy変更後も過去Decisionを更新せず、新Decisionを作る。
- **関連:** SourceRevisionは取得時のDecision ID / Classification / Terms Metadata Snapshotを保持する。Publish GateはQuestionSourceからSourceRevisionへ辿り、最新Decisionを別途確認する。

`AllowedSource` / `SourceAllowRule`はDomain Entityではなく、完全一致Hostname、Owner、Source Kind、Purpose、任意Path Prefixを組み合わせた明示Policy設定である。Wildcard Hostnameで全許可しない。Domain EvaluatorはAllowlist一致だけでTrustedにせず、Origin、アクセス条件、Purpose、Terms Metadataも確認する。詳細は[Sourceガバナンス](source-governance.md)を参照する。

### QuestionSource

- **定義:** QuestionRevisionの特定のSourceRevisionに対する根拠関係。
- **責務:** Question作成時点でどのSource Contentを根拠にしたかを追跡可能にする。
- **識別:** 独立Identityなし。対象QuestionRevision、SourceRevision、KnowledgePoint、Usage Purpose、根拠関係を持つAssociation Value Object。
- **変更性:** 含まれるQuestionRevisionの一部としてImmutable。根拠を修正する場合は新しいQuestionRevisionを作る。
- **状態・Lifecycle:** 親QuestionRevisionと同時に作成され、親と同じ履歴期間で参照される。
- **関連:** `QuestionRevision → QuestionSource → SourceRevision → SourceDocument`。各QuestionSourceは同じQuestionRevisionのKnowledgePointと、`NORMATIVE_TECHNICAL` Purpose / Provenance Relationを結ぶ。SourceDocumentの最新Revisionから推測し直してはならない。
- **主な不変条件:** `INV-QUESTION-004`。ExamFeedbackをQuestionSourceとして登録しない。

## 問題の作成と公開

### QuestionIntent / QuestionPlan

- **定義:** QuestionIntentは「どのKnowledgePointを、どの理解・判断方法で測るか」を示す。例: Routing decisionを問う中級のScenario-based Single Choice。
- **責務:** 問題候補の教育上の目的と制約をDomain用語で表す。Questionのstable identityが表す同一学習意図を明確にする。
- **識別:** `QuestionIntent`はValue Objectであり独立Identityを持たない。`QuestionPlan`を別Entityとしては採用しない。
- **変更性:** Value Object自体はImmutable。候補の意図を変えるときは新しい値を作る。既存Questionの学習意図を別のものへ変えるなら、新しいQuestionIdentityとする。
- **状態・Lifecycle:** Question候補の設計時に作られ、QuestionRevisionの意味を説明する。Question generationのQueue / Retry / Orchestration状態はこのConceptに含めない。
- **関連:** 1つ以上のKnowledgePoint、QuestionType、難易度、Scenario / 判断Angleなどで構成し得る。具体的なField SchemaやPromptはIssue #8の対象。
- **主な不変条件:** `INV-QUESTION-001`。

`QuestionPlan`はDomain Entityではなく、QuestionIntentを利用して候補を作るApplication / Pipeline上の計画・処理として扱う。Issue #8がPipelineの用語・保存要否を決める。

### Question

- **定義:** 同じ学習意図を持つ問題系列のstable identity。問題本文そのものではない。
- **責務:** 複数Revisionの親Identityと、Learnerへ現在提示する`currentPublishedRevision`を管理する。
- **識別:** Stableな`QuestionId`。本文の修正、選択肢やExplanationの訂正で変えない。測定するKnowledge / 判断目的が変わった場合は別Questionとする。
- **変更性:** Identityは不変。Revision履歴は追加のみ。現在公開中のRevision参照は適格な新RevisionのPublish時に切り替わる。
- **状態・Lifecycle:** Published Revisionがない状態から始まり、最初のHuman-approved RevisionのPublish後は現在のPublished Revisionを持つ。新RevisionのReview中も従来のPublished Revisionを維持する。
- **関連:** 1つ以上のQuestionRevisionを持ち、各RevisionにDecisionを表すHuman Review記録は0または1件ある。`REQUEST_CHANGES`や`REJECT`の後に再提案する場合は新Revisionを作る。QuestionIntentが表す学習目的はQuestion系列を通じて同一である。
- **主な不変条件:** `INV-QUESTION-001`、`INV-QUESTION-006`。

### QuestionRevision

- **定義:** Questionのある時点のimmutableな問題Content。
- **責務:** Learnerに表示された問題と、その時点の正解・Explanation・根拠を再現可能にする。
- **識別:** 親Question内でstableな`QuestionRevisionId`。Revision 1 / 2の順序はDomain上で認識するが、番号・Storage Key形式は決めない。
- **変更性:** **ContentはImmutable**。Stem、Question Type、Options、Correct Answer、Explanation、Language、Difficulty、KnowledgePoint関係、QuestionSourceを更新しない。誤植や根拠修正を含む変更は新Revisionとする。Review / Publication LifecycleはContentとは別の状態情報。
- **状態・Lifecycle:** `DRAFT` → `REVIEW_REQUIRED` → `PUBLISHED`、またはReview結果の`CHANGES_REQUESTED` / `REJECTED`。Draft状態でもRevision Identityが付与済みならContentは凍結済み。
- **関連:** 1つのQuestionに属し、1つ以上のKnowledgePointと、各KnowledgePointのSourceRevision根拠を示す1つ以上のQuestionSourceを持つ。QuestionReviewは正確にこのRevisionを対象とする。Publish時は取得時と現在のSource Policyを再検査する。
- **主な不変条件:** `INV-QUESTION-002`〜`INV-QUESTION-006`。

### QuestionReview

- **定義:** ReviewerであるHumanが特定QuestionRevisionの品質と公開可否を確認したDecision Record。
- **責務:** Publishを許可する明示的Human Approval、または修正依頼 / Rejectの証跡を残す。
- **識別:** 各記録は`QuestionReviewId`で識別するAppend-only Entity。1つのQuestionRevisionに対する決定的なReview Recordは最大1件とする。
- **変更性:** Decision、Reviewer Identity、Reviewed At、Commentを後から書き換えない。訂正が必要なら別Review Recordを作る。
- **状態・Lifecycle:** Review時に作成され、そのDecision Recordとして残る。`APPROVE`、`REQUEST_CHANGES`、`REJECT`を扱う。
- **関連:** 1つのQuestionRevisionと1人のOpaque `ReviewerId`を参照する。AI Review / LLM Judgeは別の評価であり、このHuman Reviewの代替にならない。
- **主な不変条件:** `INV-REVIEW-001`、`INV-QUESTION-003`。Reviewer権限の判定方式は未決定。

`QuestionReview`のDomain FieldsはTarget Revision、Reviewer、Decision、Reviewed At、任意のCommentである。Reviewer UIやAPI Payloadを意味しない。

## LearnerのRecordとFeedback

### UserAnswer

- **定義:** Learnerが実際に表示されたQuestionRevisionへ回答した事実。
- **責務:** 回答内容と、その回答が何に対するものだったかを固定する。
- **識別:** 各回答記録にstableな`UserAnswerId`がある。回答者はOpaqueな`LearnerId`で識別する。
- **変更性:** 提出済みAnswer RecordはImmutable。訂正や再回答は別回答記録として表す。
- **状態・Lifecycle:** 表示されたRevisionに回答した時点で記録され、学習履歴として残る。
- **関連:** `LearnerId`と、表示・回答した**正確な`QuestionRevisionId`**を参照する。選択 / 入力内容、回答時刻、採点結果などはDomain上の概念になり得るが、API / DB Schemaは定義しない。
- **主な不変条件:** `INV-ANSWER-001`、`INV-ANSWER-002`。

### ExamFeedback

- **定義:** 実試験後にLearnerが提出する、試験体験の抽象化されたFeedback。
- **責務:** Topic Emphasis、Difficulty Impression、Question Style、Hands-on Importance、refriq Coverage Gapなどを改善判断へ伝える。
- **識別:** 各提出に`ExamFeedbackId`があり、提出者はOpaque `LearnerId`で表す。
- **変更性:** 提出済みFeedback内容はImmutableなRecord。訂正・再提出は新しいRecordとする。提出後のHandlingは改善判断のFlowであり、Normative Source化のLifecycleではない。
- **状態・Lifecycle:** 提出後、Reviewer / 改善判断に利用可能なSignalとなる。QuestionのSourceとしてPublishされるLifecycleは持たない。
- **関連:** Certification / ExamTopic等の抽象化されたTopic情報と関連付け得る。Topic Emphasis、Difficulty Impression、Question Style、Hands-on Importance、Troubleshooting Prevalence、Coverage Gapなどを扱う。QuestionSourceやSourceRevisionへの根拠関係は持たない。
- **主な不変条件:** `INV-FEEDBACK-001`。実問題Stem / 選択肢、Screenshot、Exam Dump、再構成問題、Close Paraphrase、Answer Keyは正規Domain Contentとして扱わない。詳細は[Sourceガバナンス](source-governance.md)に従う。

### LearningProgress

- **定義:** LearnerのKnowledgePoint / ExamTopic単位の学習状態を読むためのConceptual Projection。
- **責務:** UserAnswerと回答対象QuestionRevisionの関係をもとに学習状態を表示するための集約View。
- **識別:** 独立したDomain Entity IDを持たない。LearnerとTopic / KnowledgePointの組み合わせでProjectionを識別できる。
- **変更性:** Source of Truthではない。回答履歴から再構築できるDerived Dataとして扱い、結果自体を独立した事実として維持しない。
- **状態・Lifecycle:** 回答履歴に応じて更新・再構築される。正答率、重み付け、期間窓などの計算規則は未決定。
- **関連:** `UserAnswer → QuestionRevision → KnowledgePoint → ExamTopic`から導出する。回答記録やRevision Contentを置き換えない。
- **主な不変条件:** `INV-PROGRESS-001`。計算方法・更新頻度・Projectionの保存方法は後続設計で決める。
