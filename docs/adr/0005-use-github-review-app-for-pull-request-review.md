# ADR-0005: GitHub Review AppをPull Requestレビューに使う

- Status: Accepted
- Date: 2026-09-24

## 背景

GitHub ActionsのCIは`make check`で決定的な品質検証を行う。実装上の問題を別の視点で見つけるため、Pull RequestごとにAI Reviewを実行し、その指摘をIssueの受入条件やRepository Ruleに照らしてCodexが評価する。

`abi-techinnovation/github-review-app`はGitHub ActionとしてPull Requestの差分を取得し、設定されたOpenAI互換APIへ送り、生成されたReviewをPull Requestへコメントする。GitHub TokenとLLM API KeyをWorkflowから渡すため、権限とSecretの扱いを限定する必要がある。

## 決定

- [GitHub Review App](https://github.com/abi-techinnovation/github-review-app)を`.github/workflows/ai-review.yml`から呼び出す。
- Pull Requestの`opened`と`synchronize`で自動実行し、変更Push後にReviewを再実行する。
- Actionは確認済みの`v1`タグが指すCommit `8a21edca00d6a9c3c5830b1de93a097911c9a727`へ固定する。更新は新しいReleaseを確認してから行う。
- `LLM_API_BASE_URL`と`LLM_API_KEY`をRepository Actions Secretsから渡す。GitHub Tokenには`pull-requests: write`のみを与える。
- Fork由来のPull Requestでは自動Reviewを実行せず、`pull_request_target`を利用しない。
- AIの指摘は助言として扱い、CodexがIssue Scope、`AGENTS.md`、Accepted ADR、実装を照合する。`VALID`かつScope内の指摘だけ修正し、`make check`、Push、再Reviewを行う。Human Reviewを最終判断とする。

## 理由

- CIの静的な品質ゲートとAIによる差分Reviewを別のWorkflowとして保てる。
- 既存のGitHub Actionsと共通のPull Request上で指摘を確認でき、追加RuntimeやRepository依存を増やさない。
- Commit固定と限定されたToken権限により、Review用Actionの更新と書込み範囲を明示できる。
- Issueや既存設計に照らして指摘を分類し、AIの提案だけで範囲外の変更を増やさない。

## 検討した選択肢

- Human Reviewだけを使う。追加設定は不要だが、依頼で指定されたAI Reviewの反復工程を実行できないため採用しない。
- `@v1`タグだけでActionを参照する。更新追従は簡単だが、参照先が変わる可能性があるためCommit固定を選ぶ。
- `pull_request_target`でForkのPull RequestにもSecretsを渡す。未信頼コードのイベントで強いTokenとSecretsを使うことになるため採用しない。

## 影響

- Repository Actions Secretsに許可されたLLM APIのBase URLとKeyを登録する必要がある。
- Review AppはPull Requestの差分をそのAPIへ送信する。接続先でのデータ取扱いとRepositoryのコード共有条件を確認する責任がある。
- ForkのPull Requestには自動Reviewを行わない。AI ReviewはMergeを自動承認せず、Human Reviewも引き続き必要である。
- ActionはReviewコメントを投稿するため、PR Workflowに`pull-requests: write`権限が必要になる。

## 再検討する条件

- 指定Actionの保守、Release、権限要件またはデータ取扱いが変わった場合。
- LLM APIの利用条件がRepositoryのコード共有条件に合わなくなった場合。
- AI Reviewの指摘品質や運用コストが、Human Reviewを補助する価値を下回った場合。
