// 明示的なVite Test環境からのみ利用するComposition Root。本番認証・永続化ではない。
import {
  ReviewerService,
  success,
  type ReviewRecord,
} from "@refriq/application";
import { InMemoryReviewerStore } from "../src/in-memory-reviewer-store.js";
import { createReviewerHandler } from "../src/reviewer.js";
import {
  seed,
  catalog,
  resolvedPolicies,
  unresolvedCandidate,
} from "./reviewer-fixtures.js";
let record: ReviewRecord;
let store: InMemoryReviewerStore;
let handler: (request: Request) => Promise<Response>;
function reset(scenario = "ready") {
  record = seed(scenario === "unresolved" ? "ready" : scenario);
  store = new InMemoryReviewerStore(
    scenario === "unresolved" ? [] : [record],
    catalog,
    scenario === "unresolved"
      ? [
          {
            queuedAt: record.queuedAt,
            candidateProjection: unresolvedCandidate(),
          },
        ]
      : [],
  );
  handler = createReviewerHandler(new ReviewerService(store), async () =>
    success({ actorId: "synthetic-human" }),
  );
}
reset();
export async function handleTestRequest(request: Request): Promise<Response> {
  if (new URL(request.url).pathname === "/api/reviewer")
    return handler(request);
  const body = (await request.json()) as {
    action: string;
    scenario?: string;
    fault?: "confirmed-failure" | "unknown-committed" | "unknown-uncommitted";
    operationId?: string;
  };
  if (body.action === "reset") reset(body.scenario);
  if (body.action === "fault") store.nextFault = body.fault ?? null;
  if (body.action === "refresh")
    store.refreshPolicies(record.questionRevisionId, resolvedPolicies());
  if (body.action === "abort" && body.operationId)
    store.confirmAborted(body.operationId);
  return Response.json({
    record: await store.readReview(record.questionRevisionId),
    candidates: store.candidates,
  });
}
