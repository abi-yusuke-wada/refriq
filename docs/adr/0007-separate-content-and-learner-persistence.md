# ADR-0007: ContentとLearnerの永続化境界を分離する

- Status: Proposed
- Date: 2026-10-04
- 対象: [Issue #12](https://github.com/abi-yusuke-wada/refriq/issues/12)

## 背景

#12のHuman判断でPipeline / Content / ReviewerはDynamoDB + S3、LearnerはTursoに分割する方針が採用され、Planの修正と実装着手が承認された。本ADRはその理由と交換境界を記録する。ProposedはADR文書のレビュー状態であり、採用済みDB方針を再検討するものではない。

## 判断

- Source / Question / immutable Revision / Human Review / Publish / Pipeline metadataはDynamoDB。
- 原文・Normalized Snapshot・大きなArtifactはS3。MetadataとimmutableなObject identity、checksumで接続する。
- Session・固定出題・実回答・History / Progress・Learner ExamFeedbackはTurso。
- Store間はopaque QuestionRevision ID参照。DB跨ぎJOIN / ACID / FKを要求しない。
- Domain / ApplicationはStorage非依存Portを使い、Key / SQL保存形・SDKはStorage実装へ閉じる。
- Human Reviewはexact Domain Revisionのみ。Candidate IDやEvaluationを公開判断として保存しない。
- LearningProgressは確定回答と提出済みSession / Snapshot等から再構築可能。UserAnswerは実回答のみ。

## 理由

Content側のimmutable履歴とReview / Publishの原子的境界、Learner側のSession / 回答 / 集計の関係モデルをそれぞれの責務で扱える。Domain Entityと物理Tableを一対一にせず、Use Caseが同時に守るInvariantから保存単位を決める。

## 検討した選択肢

全領域をDynamoDBへ集約する案はHuman決定で採用しない。全領域をRDBへ統一する案やDB跨ぎTransactionも採用しない。極端なSingle Table設計を目的にしない。

## 影響

Store間の参照欠損、読取失敗、公開変更後のSession継続をApplicationで扱う必要がある。現在公開参照を使って過去回答のRevisionを推測しない。正本の保持・Schema版・retry識別を設計する必要があり、詳細は[永続化モデル](../architecture/persistence-model.md)の未決事項へ残す。

本ADRはTable数、Key / Indexの最終決定、Retention日数、Source利用不可時のProduct判断、SDK、Adapter、Cloud Resource、Migration実行を承認しない。既存Accepted ADR-0004 / 0005 / 0006の判断は変更しない。

## 再検討条件

LearnerをPostgreSQL / Aurora等へ移す必要が生じた場合、またはContentの取得要件がDynamoDBの制約と合わなくなった場合。Storage実装と本ADRを更新し、Domain / Applicationへの影響を最小化する。
