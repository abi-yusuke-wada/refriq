# 開発・PRレビュー手順

## 開発から人間レビューまで

```text
Issue・AGENTS.md・ADRを確認
          ↓
       Codexが変更
          ↓
     make check → Push → Pull Request
                           ┌────┴────┐
                           │         │
                           ↓         ↓
                     CI: make check  AI Review
                                       ↓
                                  AIのレビュー指摘
                                       ↓
                        CodexがIssue・Rule・ADR・実装に
                             照らして指摘を分類
                                       ↓
                         VALIDかつScope内だけ修正
                                       ↓
                            make check → Push
                                       ↓
                              AI Review再実行
                                       ↓
                             人間の最終レビュー
```

CIとAI Reviewは独立して実行する。CIは`.github/workflows/ci.yml`で`make check`を行い、AI Reviewは[GitHub Review App](https://github.com/abi-techinnovation/github-review-app)でPull Requestの差分を確認する。Pull Request作成時と更新時にAI Reviewが自動実行される。

## AI Review指摘の扱い

AI ReviewはPull Request全体へのコメントを投稿する。差分入力の既定上限は12,000文字なので、大きなPull Requestは実際の全差分も照合する。各指摘について、Codexは次を確認する。

1. 対象コードと周辺実装を読み、問題が再現・成立するか確認する。
2. Issueの受入条件・Scope、`AGENTS.md`、Accepted ADRと照合する。
3. 根拠があり、現在のIssueのScope内にある指摘だけを`VALID`として修正する。
4. 誤検知、再現しない懸念、Scope外の提案は変更せず、分類理由を報告する。
5. 有効な修正後に`make check`を実行してPushする。Pushで`AI Review`が再実行されるため、新しい差分に対する指摘を同じ基準で確認する。

AI Reviewの出力は助言であり、正しさの保証やHuman Approvalではない。最終判断とMerge前の確認はHuman Reviewerが行う。

## GitHub Actions設定

`.github/workflows/ai-review.yml`は`pull_request`の`opened`と`synchronize`で実行する。ForkからのPull Requestは、Secretsを安全に利用できないため自動Reviewを省略する。Workflowは`pull_request_target`を使わない。

GitHub Repositoryの **Settings → Secrets and variables → Actions → Secrets** に次を登録する。

| Secret | 用途 |
| --- | --- |
| `LLM_API_BASE_URL` | 許可されたOpenAI互換APIのBase URL |
| `LLM_API_KEY` | 同APIの認証Key |

`GITHUB_TOKEN`はGitHub Actionsが提供し、WorkflowにはPR情報取得・Review投稿用の`pull-requests: write`だけを許可する。Review AppはPull Requestの差分を設定されたLLM APIへ送信するため、Secretsを設定する前に接続先とコード共有条件を確認する。未設定の場合、AI Review Workflowは明示的なエラーで失敗する。
