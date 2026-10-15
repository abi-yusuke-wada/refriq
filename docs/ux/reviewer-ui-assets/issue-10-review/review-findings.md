# Issue 10 独立レビュー指摘の対応

Human承認済みI-01〜I-06を維持し、今回承認されたR-01〜R-04だけを最小変更で反映した。現在の未コミット・未追跡成果物75ファイルをbaselineとして作業領域外のArchive / Hashへ記録し、既存ファイルを削除していない。前回の56ファイルbaselineも保持する。Domain / Application / ADR / API / DBは変更していない。Human再レビュー待ちで停止する。

## 今回のR-01〜R-04対応

| ID | 状態 | 修正箇所 | 修正内容 | Validation |
| --- | --- | --- | --- | --- |
| R-01 | 反映・検証済み | review-model.js、fixtures.js、view.js、UX文書 | targetKind / 既存Candidate・Revision ID / 評価時immutable Content Snapshotを照合。一致するResult / Eligibilityだけreadinessへ利用。不一致PASS・matching評価欠落はAPPROVE不可。Candidate Groundingを別由来として表示。 | Unitで一致 / 不一致 / missing / 別Candidate・Revision・Content / 対象未解決 / 全Field欠落を拒否。Browserでexact表示、readinessとdisabled、PASSでHuman記録なし。一致04、不一致54、欠落55。 |
| R-02 | 反映・検証済み | review-model.js、view.js、fixtures.js | SourceReferenceのIdentityをSourceRevision + Locatorへ統一。既存referenceKey規約と互換のキーをHTML向けencodeし、完全な参照へ復元。 | Unitで既存helperと一致、Aだけ / Bだけ / A+BのPayload完全一致、未知・重複キー拒否。Browserの実Edit保存で同じ3組を確認。画面56。 |
| R-03 | 反映・検証済み | feedback.js、view.js、feedback.test.js | not_usedはSimilarity 3項目のall-or-none。UI同期・利用済みへ戻る選び直し・送信境界で混在拒否。unknownは観点別。 | Unitで全not_usedとunknown / Rating許可、2種類の混在拒否。Browserで同期・Payload・UIを迂回した矛盾入力のinline / ARIA / Focus。画面47、57。 |
| R-04 | 反映・検証済み | review-model.js、fixtures.js、review-model.test.js | QuestionSource全関係値、KnowledgePoint IDs（凍結Intent内含む）、正答ID集合をcanonical比較。Options・constraints順序は維持。現在Policy除外。元配列をsortしない。 | Unitで同集合の順序違いなし、実差分あり、Multiple Select正答集合なし、Options / constraints順変更あり。Browserで実際に異なるSource順と「変更なし」を確認。画面58。 |

`reviewEvaluation`は既存Evaluation Input / OutputとIDを接続するUX読取投影。Domain Gate・enum・Invariantの追加ではない。Pipelineの`immutableInputFingerprint`はSource入力用で生成Questionの識別には使えないため、今回Hashを新設せず評価時Snapshotを照合する。Productionで現在targetを後付けコピーし旧Candidate PASSへ接続する実装は不可。

## I-01〜I-06の回帰確認

| ID | 状態 | 修正箇所 | 修正内容 | Validation |
| --- | --- | --- | --- | --- |
| I-01 | 反映・検証済み | fixtures.js、review-model.js、view.js、UX文書 | exact `reviewTargetRevision`が表示・Diff・Edit初期値・Human確認の正本。Candidateは別metadata。Content不一致・未materialize例を追加。 | Unitで凍結Content選択 / ID不一致拒否、BrowserでContent・REQUEST_CHANGES確認・記録Revision一致。Candidate不一致PASSによるAPPROVEはR-01で拒否。画面38〜39。 |
| I-02 | 反映・検証済み | review-model.js、view.js、fixtures.js | Content / Intentの11項目を比較。Language / Difficulty / stable KnowledgePoint / QuestionSourceの変更を追加。現在Policy / Termsを除外。 | Unitで各Fieldの変更とMutable情報除外、Browserで追加4種の変更表示。画面40。 |
| I-03 | 反映・検証済み | review-model.js、view.js、index.html、UX / Flow | 確定失敗は未保存を明示。結果不明は再送・離脱を抑止し、照合で保存済みまたは未保存確定へ進む。Human / Edit / Feedbackに同じ契約を適用。 | Unitで保存回数・Retry可否・照合状態、BrowserでHuman / Feedbackの両結果と重複なし。画面32 / 35 / 41〜42 / 51〜52。 |
| I-04 | 反映・検証済み | feedback.js、feedback.test.js、view.js、UX文書 | Similarity 3項目で`not_used`と`unknown`を別選択・別Payload値へ分離。 | Unitで全3項目を別値で保存、Browserで確認 / 送信済みラベル・Payloadを照合。画面47〜48。 |
| I-05 | 反映・検証済み | fixtures.js、review-model.js、view.js、fixtures.test.js | 全QuestionSourceの固定Snapshot / Purpose別現在Decisionを表示。Queueは全体要約。Source Gate読取投影のeligible / blockersを利用。 | 全TRUSTED / REVIEW_REQUIRED / PROHIBITED / 重複 / 欠落を既存Domain Gateと照合。Browserで可否・全Source表示。画面43〜46 / 53。 |
| I-06 | 反映・検証済み | feedback.js、review-model.js、view.js、styles.css | Field別理由、inline error、aria-invalid / describedby、最初の不正入力またはSummaryへのFocus。 | UnitでField別Error、BrowserでFocus・ARIA関連・Summaryリンク・Dialog cancel / disabled / statusを確認。画面49〜50。 |

ファイル名は`docs/ux/mockups/reviewer/`内を指す。画面番号は[画面と操作](screen-flow.md)から参照する。Snapshotは表示証拠で、状態遷移の成功はUnit / Browserによる別検証である。

## 再確認した既存契約

- stable Question / immutable QuestionRevision。Candidate IDやKnowledgePoint Candidate IDをDomain IDへ代入しない。
- Human decisionは`APPROVE / REQUEST_CHANGES / REJECT`のみ。1 Revisionの決定記録は最大1件。
- `LLM PASS != Human APPROVE`。MVPのHuman APPROVEはPublish遷移であり、別APPROVED State / Publish操作なし。
- 取得時Provenanceと現在Policyは別。各QuestionSource / Purposeに現在Decisionがexactly one必要。
- ExamFeedbackは抽象Signal。本文、選択肢、URL、添付、正答、QuestionRevision / SourceRevision ID、自由記述を拒否する。

## N-01時点の検証（過去のEvidence）

- `XDG_CACHE_HOME=/tmp/refriq-issue10-cache make fmt`成功。
- 同じCache指定の`make check`成功。5 Test Files / 187 Tests。Mock 119 Tests、既存Domain / Pipeline 68 Tests。全6 Workspace Typecheck、Formatting / Lint、x86_64 Nix check。
- Playwright / Chromiumで242項目成功、未処理JavaScript Error 0件。1280px / 1440pxの12表示条件を含む。
- 前の94 / 171項目検証は過去記録であり、今回の242項目へ加算しない。
- Snapshotは58枚。既存番号を維持して変更した表示を更新し、今回必要な5例（54〜58）だけ追加。保存中の画像31 / 34だけ撮影用に650ms Timerを止め、撮影後再開する。

今回Browser Runnerの戻るリンクがHeaderと本文の2件に一致したため、本文の「入力へ戻る」を明示して再実行し成功した。前回のRunner / Lint修正も過去のEvidenceとして保持する。失敗を隠したり、既存Testを削除したりしていない。

## 境界と停止点

Production Gate呼出し、保存・再照合API、idempotency、排他、DB Transaction、実Candidate materialization、認可、実LLMは未実装。Mockの結果照合はメモリ内の表示例。継続して結果不明の場合の再取得は後続実装へ残し、未保存確定なしにRetryしない契約を維持する。

新規指摘: なし。今回の4指摘とI-01〜I-06の回帰確認で受入条件を妨げる重大・主要問題は検出していない。包括的なUX採用判断やKeyboard / Contrast AuditはHumanの再レビューへ残す。Issue #9 / #12、Domain契約、Productionへ範囲を拡張せず、commit / push / PRは行わない。
