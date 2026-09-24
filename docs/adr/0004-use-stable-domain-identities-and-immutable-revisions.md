# ADR-0004: Use Stable Domain Identities and Immutable Revisions

- Status: Accepted
- Date: 2026-09-24

## 背景

Issue #6では、Persistence設計より先にDomain Modelを定義する。MVPでは、公式Sourceが更新された後も過去の根拠を追跡できること、Questionを改訂してもLearnerの過去回答が回答時点の問題を示すこと、生成問題がHuman Reviewなしに公開されないことが必要である。現在のRepositoryにDomain実装はなく、PersistenceへのMappingはIssue #12で定義する。

## 決定

- `Certification`、`ExamTopic`、`SourceDocument`、`KnowledgePoint`、`Question`および各Recordは、安定したDomain Identityを持つ。具体的なID形式は決めない。
- `SourceRevision`と`QuestionRevision`はImmutableなSnapshotとする。Content変更時は新Revisionを作り、既存Revisionを更新しない。
- `Question`は同じ学習意図を表す問題系列のIdentityとし、現在公開中の`QuestionRevision`を参照する。`UserAnswer`はLearnerに表示された正確な`QuestionRevision`を参照する。
- 公開には対象`QuestionRevision`に対するHumanの`APPROVE`を必須とする。MVPではApproveとPublishを同じDomain遷移とし、Revision Stateに`APPROVED`を別途設けない。
- `ExamFeedback`は抽象化された改善Signalであり、技術的正しさのNormative Sourceにしない。`LearningProgress`は回答履歴から再構築可能なProjectionとし、計算方法は未決定のまま残す。

Domain定義とInvariantは[`docs/domain/`](../domain/)をSource of Truthとする。このADRは判断理由を記録し、APIやStorage Schemaは定義しない。

## 理由

- Stable Identityにより、名称、URL、Contentの変化後も過去の参照先を保てる。
- Immutable Revisionにより、特定時点のSource根拠とQuestion Contentを再現できる。
- Answerから正確なRevisionを参照することで、Question改訂後も過去の学習記録を変えずに保てる。
- Human Approval Recordにより、自動評価では代替できない公開前の確認条件を明確にできる。
- ProgressをDerived Dataとして扱い、未定義の計算結果が二つ目のSource of Truthになることを避ける。

## 検討した選択肢

- Source URLや現在のQuestion ContentをIdentityとして、Contentを直接更新する。URL移動や訂正後に過去の根拠・回答が曖昧になるため採用しない。
- `UserAnswer`から`Question`だけを参照し、後から現在Revisionを解決する。既存回答が別の問題を示す可能性があるため採用しない。
- 自動評価だけで生成問題を公開する、またはMVPでHuman ApprovalとPublishを別の状態にする。Human Reviewを必須とするMVPのFlowに合わないため採用しない。
- `ExamFeedback`を技術的正しさのSourceとして扱う。受験体験と公式根拠を混同するため採用しない。

## 影響

- RevisionとReview記録をDomain履歴として保持する。物理的な保存方式とRetention Policyは後続設計で決める。
- QuestionのPublishでは、ApprovalとCurrent Published Revisionの更新を一貫させる必要がある。このInvariantをStorage上でどう守るかはIssue #12で決める。
- どの公式Sourceを採用し、どのContentを取得・保存できるかはIssue #7で決める。
- Authentication、Reviewer権限、Progress計算、ID形式、物理SchemaはこのADRで決めない。

## 再検討する条件

- Human Review後に別のRelease Approvalや公開予約を導入する場合。
- 1つのQuestion Identityが異なる学習意図を持つRevisionを含める必要が生じた場合。
- RetentionまたはSource利用条件により、現在のProvenance Modelを変更する必要が生じた場合。
- 回答履歴から再構築できないProgress計算が必要になった場合。
