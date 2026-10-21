import {
  failure,
  isObject,
  type HumanContext,
  type Result,
  type ReviewerService,
} from "@refriq/application";
import type { ReviewerClient } from "@refriq/contracts";

/** Composition Rootは外部で検証済みのHuman Contextを渡す。 */
export function createReviewerClient(
  service: ReviewerService,
  context: HumanContext,
): ReviewerClient {
  return {
    catalog: () => service.catalog(),
    queue: (request) => service.queue(request),
    detail: (id) => service.detail(id),
    decide: (input) => service.decide(input, context),
    edit: (input) => service.edit(input, context),
    submitFeedback: (input) => service.submitFeedback(input, context),
    feedbacks: (request) => service.feedbacks(request),
    feedback: (id) => service.feedback(id),
    reconcile: (input) => service.reconcile(input, context),
  };
}

/** HTTP Framework / 認証 / DB Adapterから分離した受信境界。 */
export function createReviewerHandler(
  service: ReviewerService,
  context: (
    request: Request,
    operation: string,
  ) => Promise<Result<HumanContext>>,
) {
  return async (request: Request): Promise<Response> => {
    let writing = false;
    try {
      if (request.method !== "POST")
        return Response.json(
          failure("VALIDATION", "POSTのJSON操作を送信してください。"),
          { status: 405 },
        );
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return Response.json(
          failure("VALIDATION", "JSON形式を確認してください。"),
          { status: 400 },
        );
      }
      if (
        !isObject(body) ||
        Object.keys(body).some(
          (key) => !["operation", "input"].includes(key),
        ) ||
        typeof body.operation !== "string"
      )
        return Response.json(
          failure("VALIDATION", "操作形式を確認してください。"),
        );
      const authorized = await context(request, body.operation);
      if (!authorized.ok) return Response.json(authorized);
      const human = authorized.value;
      if (!human.actorId)
        return Response.json(
          failure("UNAUTHORIZED", "Human Contextを確認できません。"),
        );
      writing = ["decide", "edit", "submitFeedback"].includes(body.operation);
      let result: unknown;
      switch (body.operation) {
        case "catalog":
          result = await service.catalog();
          break;
        case "queue":
        case "feedbacks": {
          if (
            !isObject(body.input) ||
            typeof body.input.certificationId !== "string" ||
            typeof body.input.limit !== "number" ||
            !(
              body.input.cursor === undefined ||
              typeof body.input.cursor === "string"
            ) ||
            Object.keys(body.input).some(
              (key) => !["certificationId", "cursor", "limit"].includes(key),
            )
          )
            return Response.json(
              failure("VALIDATION", "一覧条件を確認してください。"),
            );
          const input = {
            certificationId: body.input.certificationId,
            limit: body.input.limit,
            ...(body.input.cursor ? { cursor: body.input.cursor } : {}),
          };
          result =
            body.operation === "queue"
              ? await service.queue(input)
              : await service.feedbacks(input);
          break;
        }
        case "detail":
        case "feedback": {
          if (typeof body.input !== "string")
            return Response.json(
              failure("VALIDATION", "exact対象IDを確認してください。"),
            );
          result =
            body.operation === "detail"
              ? await service.detail(body.input)
              : await service.feedback(body.input);
          break;
        }
        case "decide":
          result = await service.decide(body.input, human);
          break;
        case "edit":
          result = await service.edit(body.input, human);
          break;
        case "submitFeedback":
          result = await service.submitFeedback(body.input, human);
          break;
        case "reconcile":
          result = await service.reconcile(body.input, human);
          break;
        default:
          result = failure("VALIDATION", "定義済みの操作を選択してください。");
      }
      return Response.json(result);
    } catch {
      // 保存処理中の予期しない例外を「確定未保存」と推測しない。
      return Response.json(
        writing
          ? {
              ok: false,
              unknown: true,
              message: "保存結果を確認できません。同じ操作を照合してください。",
            }
          : failure(
              "SYSTEM_ERROR",
              "処理を完了できませんでした。再取得してください。",
            ),
      );
    }
  };
}
