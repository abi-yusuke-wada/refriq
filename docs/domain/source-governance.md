# Sourceガバナンス

## 目的と適用範囲

この文書は、Sourceをどの用途に利用できるか、取得・生成物の根拠をどう追跡するかを定義する。分類はrefriq内のProduct Policyであり、法律上の利用可否を判定するものではない。

Domain Ruleは [`packages/domain/src/source-governance.ts`](../../packages/domain/src/source-governance.ts) に実装する。Issue #8のPipelineは、ContentをKnowledge ExtractionやQuestion Generationへ渡す前にこのGateを呼び出す。Allowlistは明示的な設定として管理し、全Webサイトの自動探索・取得は行わない。

## Source分類と用途

`SourceKind`はSourceの種類、`SourceClassification`はPolicy上の状態を表す。両者は別の軸である。たとえば公式Training Contentでも、利用条件が未確認なら`REVIEW_REQUIRED`になる。

| 分類 | 意味 | Pipeline利用 |
| --- | --- | --- |
| `TRUSTED` | この用途に必要なSource確認が完了し、Product Policy上、通常の利用フローへ進める。 | 対象のUsage Purposeに限り許可する。Questionの自動Publishは許可しない。 |
| `REVIEW_REQUIRED` | 取得元、アクセス、利用条件、用途などに未解決点がある。 | Source Review完了までKnowledge / Question Pipelineへの利用を拒否する。Metadata登録とReview待ちは許可する。 |
| `PROHIBITED` | Exam Dump等の禁止Content、明示的な利用禁止、アクセス制御回避などに該当する。 | Source本文をPipelineへ渡さず、SourceRevision、KnowledgePoint、QuestionSourceを作成しない。拒否Metadataだけ記録できる。 |

`SourceUsagePurpose`は`NORMATIVE_TECHNICAL`、`DISCOVERY`、`SUPPLEMENTAL_HINT`、`STYLE_REFERENCE`を表す。Questionの技術的な正答を支える`QuestionSource`に使えるのは、公式Sourceの`NORMATIVE_TECHNICAL`だけである。

`SourceKind`は`CERTIFICATION_SCOPE`、`OFFICIAL_DOCUMENTATION`、`OFFICIAL_PRODUCT_DOCUMENTATION`、`OFFICIAL_REFERENCE`、`OFFICIAL_SAMPLE`、`OFFICIAL_TRAINING`、`COMMUNITY_ARTICLE`、`SECONDARY_SOURCE`、`UNKNOWN`などを区別する。`EXAM_FEEDBACK`は誤用をDomain Gateで拒否するための値であり、`ExamFeedback`を`SourceDocument`にする意味ではない。

## 判定表

| 条件 | 分類・扱い |
| --- | --- |
| 公式公開Source、OwnerとOriginを確認済み、明示Allowlistに一致し、用途がRuleに含まれ、利用条件確認者・日時・Terms状態が揃い、アクセス条件が確認済み | `TRUSTED`。公式SourceをNormative Technical Sourceにできる。 |
| Allowlist一致だが、Origin、アクセス条件、用途、License / Termsのいずれかが不明 | `REVIEW_REQUIRED`。Allowlist一致だけではTrustしない。 |
| 公式だがログイン必須 | `REVIEW_REQUIRED`。利用条件と許可された取得方法をHumanが確認する。 |
| License情報が未確認、Termsの解釈が必要、利用条件を確認したReviewer / 時刻がない | `REVIEW_REQUIRED`。`termsReviewStatus`はProduct Policy上の確認状態であり、法的結論ではない。 |
| Community / Secondary Source | 原則`REVIEW_REQUIRED`。Human承認と用途限定AllowlistがあればDiscovery / Supplemental Hintには使える。Technical Groundingには使わない。 |
| SourceのOrigin、Kind、利用目的、Provenanceが不明または曖昧 | `REVIEW_REQUIRED`。`TRUSTED`へFallbackしない。 |
| Exam Dump、流出・記憶・再構成された実試験問題、明確な利用禁止 | `PROHIBITED`。 |
| アクセス制御を回避して取得したContent、または自動アクセスが明示的に禁止されたSource | `PROHIBITED`。 |
| Official Sample Question | Human Source Review後、Format / Question Styleの`STYLE_REFERENCE`に限定して利用できる。KnowledgePointの技術的根拠やQuestionSourceにせず、本文、選択肢、解答を複製しない。near-copyやclose paraphraseを生成しない。 |
| `ExamFeedback` | 問題傾向等を示す改善Signalとしてのみ扱い、Sourceや技術的正答根拠にしない。 |

### `TRUSTED`に必要な確認

少なくとも次が、利用するPurposeについて揃っていることをDomain Evaluatorで検証する。

- `SourceDocumentId`、Source URL、Source Owner、Source Kind
- 公式Originの確認状態
- 公開 / 認証必須などのAccess Classification
- automated accessの可否
- Allowlist Ruleとの一致（Owner、完全一致Hostname、Source Kind、Usage Purpose、任意のPath Prefix）
- 利用目的との整合
- License / TermsのReview Status、確認者、確認日時
- Source Reviewが必要だった場合は、そのDecisionとReviewer

Terms / Licenseの識別子やURLは分かる場合に記録する。存在しないLicense情報を推定したり、`LEGAL_TO_USE`のような法的結論を記録したりしない。`CLEARED_FOR_PRODUCT_USE`はrefriqのProduct Policy上の確認状態を示すだけである。

## Source Allowlist

MVPでは登録されたSource URL / Documentを対象にした明示Allowlistを使う。Ruleには少なくとも次を持たせる。

- Vendor / Source Owner
- 完全一致のHostname
- 必要な場合はPath Prefix
- 許可するSource Kind
- 許可するUsage Purpose
- Ruleの意図を説明するNotes

`*.com`のようなWildcardは許可しない。`konghq.com`や`developer.konghq.com`も、Hostnameだけで全ContentをTrustしない。たとえばCertification ScopeやGateway Documentationのように、Owner・Host・Kind・Path・Purposeの境界を明示する。AllowlistはTrust判定の重要な条件だが、Origin、Terms、Access、Purposeの確認を置き換えない。

現在のMVP候補Ruleは[`packages/domain/src/source-allowlist.ts`](../../packages/domain/src/source-allowlist.ts)に置く。これは対象Kind / Path / Purposeの範囲を絞るRuleであり、Terms確認なしにSourceを自動的に`TRUSTED`にする設定ではない。

| Owner | Hostname | Path Prefix | Source Kind | Usage Purpose |
| --- | --- | --- | --- | --- |
| Kong | `konghq.com` | `/academy/exam-preparation` | `CERTIFICATION_SCOPE` | `NORMATIVE_TECHNICAL` |
| Kong | `developer.konghq.com` | `/gateway` | `OFFICIAL_DOCUMENTATION` | `NORMATIVE_TECHNICAL` |

AllowlistにないSourceをCrawlerで自動採用しない。新しいSourceはMetadataとして発見・登録できるが、明示Ruleへ加わるまでは`REVIEW_REQUIRED`でPipelineから隔離する。認証回避、Paywall回避、robots方針の迂回、認証済みBrowser Automationは行わない。

## Human Source Review

`SourceReview`は「このSourceを、どの用途でrefriq内利用してよいか」を決めるAppend-only Decision Recordである。Decisionは`APPROVED_FOR_USE`、`REJECTED`、`NEEDS_MORE_INFORMATION`を表し、Opaque `ReviewerId`、Source、Purpose、Review時刻を追跡する。

- `APPROVED_FOR_USE`: Review待ち要因の解消と、対象Purposeの明示Allowlistを確認した後にのみ、そのPurposeの分類を`TRUSTED`にできる。必須MetadataやAllowlistの不足、明示禁止を上書きしない。
- `REJECTED`: Sourceを`PROHIBITED`として扱う。
- `NEEDS_MORE_INFORMATION`: `REVIEW_REQUIRED`のまま保持し、情報が補われるまで利用を拒否する。

Source Reviewは`QuestionReview`から独立する。前者はSourceの利用適格性を、後者は特定`QuestionRevision`の品質と公開可否を審査する。Reviewer IdentityやAuthentication方式は決めない。

## 禁止Content

次のContentやその派生物をSource、ExamFeedback、Knowledge、Question、Prompt、Fixture、Snapshot、Logへ入れない。

- Exam Dump / Brain Dump
- Leakedまたは盗用された試験Content
- 受験者が記憶から持ち込む実試験問題
- 実試験Stem、選択肢、Screenshotの再現・複製
- 記憶・流出問題を基にした再構成問題
- それらを由来とする非公式Answer Key
- Access Controlを回避して得たContent
- Source Policy上、明示的に利用禁止されたContent

禁止判定時に本文を保存してはならない。拒否Recordは、必要な範囲の`SourceDocumentId`、URL / Origin Metadata、機械可読Reason Code、検出Policy Category、判定者・時刻までとし、Raw ContentやContent Fingerprintを必須化しない。Validation Failure Logも本文、Prompt、選択肢を出力せず、Classification、Reason Code、Source ID程度に留める。

## ExamFeedbackの境界

許容するのは実試験を特定・再構成できない抽象的なExperience Signalである。

- Topic Emphasis / Coverage Gap
- Difficulty Impression
- Question Style
- Hands-on Importance
- Troubleshooting Prevalence
- Missing Learning Areas

次は受け取らず、保存、Log、Prompt、Test、Fixtureへ含めない。

- Exact Stem / Options
- 再構成した問題、または実問題のClose Paraphrase
- Screenshot、Answer Key
- 実問題を復元する意図のある細部

ExamFeedbackはSourceDocument / SourceRevision / QuestionSourceに接続しない。公式Sourceは技術的正答のNormative Grounding、ExamFeedbackは試験体験の改善Signalである。

## ProvenanceとImmutable Revision

`SourceRevision`はIssue #6の定義どおりimmutableなSnapshotであり、Policy変更でContentや既存Metadataを書き換えない。Source Policyの新しい判断は、SourceDocumentに対する別の`SourcePolicyDecision`として追記する。

各`SourceRevision`の利用時Metadata Snapshotには少なくとも次を含める。

- `SourceDocumentId` / `SourceRevisionId`
- 取得時Source URL、`retrievedAt`、Content Fingerprint
- Source Owner / Kind / Origin / Access Classification / automated access可否 / PurposeのMetadata Snapshot
- 利用時`TRUSTED` Classification、`SourcePolicyDecisionId`、Purpose
- 一致した場合はAllowlist RuleのIDとRule Snapshot
- 利用時点のLicense / Terms Metadata Snapshot
- Source Reviewを経た場合の`SourceReviewId`

`QuestionRevision`は少なくとも1つの`KnowledgePoint`と、各KnowledgePointを根拠づける`QuestionSource`を持つ。`QuestionSource`は次を関連づけるAssociation Value Objectである。

- 対象`QuestionRevisionId`
- `SourceRevisionId`
- 関連する`KnowledgePointId`
- `NORMATIVE_TECHNICAL`なUsage Purpose
- `SUPPORTS_KNOWLEDGE_POINT`、`SUPPORTS_CORRECT_ANSWER`、`SUPPORTS_EXPLANATION`などのProvenance Relation
- SourceRevisionの取得時Policy Decisionへの参照

したがって根拠は次の双方を再現できる。

```text
QuestionRevision → KnowledgePoint
QuestionRevision → QuestionSource → SourceRevision → SourceDocument
```

`QuestionSource`に`ExamFeedback`を登録しない。SourceRevisionが後から更新されてもQuestionSourceを最新Revisionへ読み替えない。

## Ingestion Gate

GateはSource本文がKnowledge ExtractionやQuestion Generationへ流れる前のDomain Boundaryである。Metadata登録だけはReview待ち状態でもできる。

```text
Source candidate metadata
        ↓
Deterministic Source Policy evaluation
        ├─ TRUSTED ─────────────→ permitted use only → immutable SourceRevision
        ├─ REVIEW_REQUIRED ─────→ stop; wait for SourceReview
        └─ PROHIBITED ──────────→ reject; retain rejection metadata only
```

Domainの`canUseForKnowledgeExtraction`は`TRUSTED`な`NORMATIVE_TECHNICAL` Sourceだけを許可する。`canUseForQuestionGeneration`はそれに加え、Source Reviewを経たOfficial Sampleの`STYLE_REFERENCE`を許可するが、その用途のSourceRevisionはKnowledgePoint / QuestionSourceの根拠にはできない。Style Referenceは出題形式の抽象的な理解に限り、Sample本文の再利用・near-copy・close paraphraseを禁止する。Revision作成時は取得時URL、取得日時、Content Fingerprint、Policy Decision、Terms Snapshotを検査する。Gateの前に禁止本文を検知目的で永続化しない。Issue #8でOrchestratorや取得Workerを先行実装しない。

## Publish Gate

`QuestionRevision`を`PUBLISHED`にする時、Issue #6のHuman `QuestionReview` `APPROVE`に加えて、次を確認する。

1. QuestionRevisionに1つ以上の`KnowledgePoint`がある。
2. 各KnowledgePointに、そのQuestionRevisionを対象とする`QuestionSource`がある。
3. 各QuestionSourceから取得時点で`TRUSTED`だったSourceRevision、SourceDocument、Policy Decisionを追跡できる。
4. Publish時点のSource Policyも各参照SourceRevisionについて`TRUSTED`である。
5. Source ReviewとQuestion Reviewの対象Identity、用途、Decisionが一致する。

取得時は`TRUSTED`でもPublish前に現在Policyが`REVIEW_REQUIRED`または`PROHIBITED`へ変わった場合、Publishを拒否しHuman判断へ回す。現在の判定が改めて`TRUSTED`になるまで、過去のSource分類やQuestionReviewで迂回できない。Source PolicyとQuestion Quality Approvalは別のGateであり、`TRUSTED` SourceでもQuestionを自動Publishしない。

## Domain Gate APIとReason Code

Domain Ruleは外部HTTP、DB、LLM、Crawlerに依存しない決定的な関数として実装する。

- `evaluateSourcePolicy`: explicit metadata、Allowlist、Prohibited Category、SourceReviewからClassificationとReason Codeを作る。
- `canUseForKnowledgeExtraction` / `canUseForQuestionGeneration`: Pipeline利用を許可・拒否する。
- `createSourceRevisionPolicySnapshot`: 不十分なProvenanceや`TRUSTED`でないSourceからRevision Snapshotを作らない。
- `createQuestionSourceAssociation`: `TRUSTED`な技術根拠SourceRevision以外をQuestionSourceにしない。
- `canPublishQuestionRevision`: KnowledgePoint / SourceRevision Trace、現在Source Policy、Human QuestionReviewを一括検査する。

代表的な機械可読Reason Codeは`EXAM_DUMP`、`RECALLED_EXAM_ITEM`、`LEAKED_CONTENT`、`ACCESS_CONTROL_BYPASS`、`TERMS_REVIEW_REQUIRED`、`LICENSE_REVIEW_REQUIRED`、`SOURCE_NOT_ALLOWLISTED`、`MISSING_PROVENANCE`、`SOURCE_REVIEW_REQUIRED`、`QUESTION_REVIEW_REQUIRED`である。判定失敗時にRaw ContentをErrorやLogへ含めない。

## FixtureとLogのRule

- Prohibited本文をFixture、Unit Test、Snapshot、Example、Prompt、Logに書かない。
- Classification TestはCategory enumや明らかに架空のSynthetic Metadataだけで行う。
- Prohibited判定のRecord / Error / LogはReason Code、Source ID、必要最小限のOrigin Metadataに限定する。
- ExamFeedbackのInput Validationでも、違反本文をError / Logに再出力しない。

現在のDomain TestはProhibitedの分類値だけを入力し、試験問題本文を含まない。

## 未決事項

| 項目 | 後続で決める場所 |
| --- | --- |
| URL / Terms Metadata、Policy Decision、SourceReview、SourceRevision SnapshotのPersistenceとRetention | Issue #12 |
| Fetch、Content Normalize / Fingerprint、Knowledge抽出のOrchestrationとBoundaryへのGate接続 | Issue #8 |
| Source Review / Question ReviewのReviewer操作・Authorization | Issue #10と後続Security設計 |
| ExamFeedbackの入力UI Validationおよび違反Inputの運用処理 | Learner / Reviewer設計 |
| 個々のAllowlist Rule追加・更新 | MVPのSource Policy / Config。ADRにHostnameを固定しない |
| 法的な最終判断 | 対象外。`termsReviewStatus`で代替しない |

全Web Crawler、Browser Automation、robots / Login / Paywallの迂回は対象外である。
