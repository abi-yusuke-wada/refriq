import { payloadSchemas, type DynamoItemKind } from "./schemas.js";

export type LogicalTable = "Content" | "Question" | "Pipeline";

/** 論理定義のみ。物理名・Billing・AWS作成RequestはこのIssueで固定しない。 */
export const dynamoTables = {
  Content: { partitionKey: "PK", sortKey: "SK", indexes: [] },
  Question: {
    partitionKey: "PK",
    sortKey: "SK",
    indexes: [
      { name: "GSI-Published", partitionKey: "GSI1PK", sortKey: "GSI1SK" },
      { name: "GSI-Review", partitionKey: "GSI2PK", sortKey: "GSI2SK" },
    ],
  },
  Pipeline: {
    partitionKey: "PK",
    sortKey: "SK",
    indexes: [{ name: "GSI-Work", partitionKey: "GSI1PK", sortKey: "GSI1SK" }],
  },
} as const;

/** payloadはSchema・参照条件を検証してから復元する。SDKのAttributeValueではない。 */
export interface DynamoItem {
  readonly table: LogicalTable;
  readonly kind: DynamoItemKind;
  readonly PK: string;
  readonly SK: string;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly GSI1PK?: string;
  readonly GSI1SK?: string;
  readonly GSI2PK?: string;
  readonly GSI2SK?: string;
  readonly expiresAt?: number;
}

export function keyPart(value: unknown): string {
  if (typeof value !== "string" || !value.trim())
    throw new Error("Key identity must be non-empty");
  return encodeURIComponent(value);
}

export function ordinalPart(value: unknown): string {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 1)
    throw new Error("Ordinal must be a positive safe integer");
  return value.toString().padStart(16, "0");
}

/** Domain Snapshotの日時文字列は変更せず、検索KeyだけUTCへ揃える。 */
export function timestampPart(value: unknown): string {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value)))
    throw new Error("Timestamp must be valid");
  return keyPart(new Date(value).toISOString());
}

/** prefix構築はStorage Packageに限定。CandidateはRun IDも含めて衝突を避ける。 */
export function itemAddress(
  kind: DynamoItemKind,
  data: Readonly<Record<string, unknown>>,
  receiptTable?: LogicalTable,
): { readonly table: LogicalTable; readonly PK: string; readonly SK: string } {
  const key = (name: string) => keyPart(data[name]);
  const ord = (name: string) => ordinalPart(data[name]);
  switch (kind) {
    case "CERTIFICATION":
      return {
        table: "Content",
        PK: `CERT#${key("certificationId")}`,
        SK: "META",
      };
    case "EXAM_TOPIC":
      return {
        table: "Content",
        PK: `CERT#${key("certificationId")}`,
        SK: `TOPIC#${key("examTopicId")}`,
      };
    case "SOURCE_HEAD":
      return {
        table: "Content",
        PK: `SOURCE#${key("sourceDocumentId")}`,
        SK: "META",
      };
    case "SOURCE_HISTORY":
      return {
        table: "Content",
        PK: `SOURCE#${key("sourceDocumentId")}`,
        SK: `REVISION#${ord("revisionOrdinal")}#${key("sourceRevisionId")}`,
      };
    case "SOURCE_REVISION": {
      const snapshot = data.snapshot as Record<string, unknown>;
      return {
        table: "Content",
        PK: `SOURCE_REVISION#${keyPart(snapshot.sourceRevisionId)}`,
        SK: "META",
      };
    }
    case "POLICY_CURRENT":
      return {
        table: "Content",
        PK: `SOURCE#${key("sourceDocumentId")}`,
        SK: `POLICY_CURRENT#${key("usagePurpose")}`,
      };
    case "POLICY_HISTORY":
      return {
        table: "Content",
        PK: `SOURCE#${key("sourceDocumentId")}`,
        SK: `POLICY#${key("usagePurpose")}#${timestampPart(data.evaluatedAt)}#${key("sourcePolicyDecisionId")}`,
      };
    case "SOURCE_REVIEW":
      return {
        table: "Content",
        PK: `SOURCE#${key("sourceDocumentId")}`,
        SK: `SOURCE_REVIEW#${timestampPart(data.reviewedAt)}#${key("sourceReviewId")}`,
      };
    case "KNOWLEDGE_POINT":
      return {
        table: "Content",
        PK: `KNOWLEDGE#${key("knowledgePointId")}`,
        SK: "META",
      };
    case "QUESTION_HEAD":
      return {
        table: "Question",
        PK: `QUESTION#${key("questionId")}`,
        SK: "META",
      };
    case "QUESTION_HISTORY":
      return {
        table: "Question",
        PK: `QUESTION#${key("questionId")}`,
        SK: `HISTORY#${ord("revisionOrdinal")}#${key("questionRevisionId")}`,
      };
    case "QUESTION_CONTENT": {
      const revision = (data.revision ?? data) as Record<string, unknown>;
      return {
        table: "Question",
        PK: `REVISION#${keyPart(revision.questionRevisionId)}`,
        SK: "CONTENT",
      };
    }
    case "QUESTION_STATE":
      return {
        table: "Question",
        PK: `REVISION#${key("questionRevisionId")}`,
        SK: "STATE",
      };
    case "QUESTION_REVIEW":
      return {
        table: "Question",
        PK: `REVISION#${key("questionRevisionId")}`,
        SK: "REVIEW",
      };
    case "QUESTION_EVALUATION":
      return {
        table: "Question",
        PK: `REVISION#${key("questionRevisionId")}`,
        SK: `EVAL#${key("evaluationId")}`,
      };
    case "REVIEW_TARGET":
      return {
        table: "Question",
        PK:
          data.targetKind === "CANDIDATE"
            ? `REVIEW_TARGET#CANDIDATE#${key("pipelineRunId")}#${key("candidateId")}`
            : `REVIEW_TARGET#QUESTION_REVISION#${key("questionRevisionId")}`,
        SK: "QUEUE",
      };
    case "PIPELINE_HEAD":
      return {
        table: "Pipeline",
        PK: `RUN#${key("pipelineRunId")}`,
        SK: "META",
      };
    case "PIPELINE_INPUT":
      return {
        table: "Pipeline",
        PK: `RUN#${key("pipelineRunId")}`,
        SK: "INPUT",
      };
    case "PIPELINE_STAGE":
      return {
        table: "Pipeline",
        PK: `RUN#${key("pipelineRunId")}`,
        SK: `STAGE#${key("stage")}`,
      };
    case "PIPELINE_EVENT":
      return {
        table: "Pipeline",
        PK: `RUN#${key("pipelineRunId")}`,
        SK: `EVENT#${key("stage")}#${ord("attempt")}#${ord("eventOrdinal")}`,
      };
    case "PIPELINE_ARTIFACT":
      return {
        table: "Pipeline",
        PK: `RUN#${key("pipelineRunId")}`,
        SK: `ARTIFACT#${key("stage")}#${ord("attempt")}`,
      };
    case "MATERIALIZATION":
      return {
        table: "Pipeline",
        PK: `RUN#${key("pipelineRunId")}`,
        SK: `MATERIALIZATION#${key("candidateId")}`,
      };
    case "OPERATION_RECEIPT": {
      if (!receiptTable)
        throw new Error("Receipt requires the mutation's logical table");
      return {
        table: receiptTable,
        PK: `OPERATION#${key("actorId")}`,
        SK: `${key("operationKind")}#${key("operationId")}`,
      };
    }
    case "ARTIFACT_MANIFEST": {
      const owner = data.owner as Record<string, unknown>;
      const artifact = data.artifact as Record<string, unknown>;
      const table =
        owner.kind === "PIPELINE" || owner.kind === "RUN_INPUT"
          ? "Pipeline"
          : owner.kind === "QUESTION_CONTENT"
            ? "Question"
            : "Content";
      return {
        table,
        PK: `ARTIFACT#${keyPart(artifact.artifactId)}`,
        SK: "META",
      };
    }
  }
}

export function artifactObjectKey(
  owner: Readonly<Record<string, unknown>>,
  artifactId: string,
): string {
  const key = (name: string) => keyPart(owner[name]);
  const artifact = keyPart(artifactId);
  switch (owner.kind) {
    case "RUN_INPUT":
      return `pipeline/${key("pipelineRunId")}/input/${artifact}`;
    case "SOURCE_ORIGINAL":
      return `sources/${key("sourceDocumentId")}/${key("sourceRevisionId")}/original/${artifact}`;
    case "SOURCE_NORMALIZED":
      return `sources/${key("sourceDocumentId")}/${key("sourceRevisionId")}/normalized/${key("normalizationVersion")}/${artifact}`;
    case "QUESTION_CONTENT":
      return `questions/${key("questionId")}/${key("questionRevisionId")}/${artifact}`;
    case "PIPELINE":
      return `pipeline/${key("pipelineRunId")}/${key("stage")}/${ordinalPart(owner.attempt)}/${artifact}`;
    default:
      throw new Error("Unknown artifact owner");
  }
}

export function expectedIndexes(
  kind: DynamoItemKind,
  data: Readonly<Record<string, unknown>>,
): Readonly<Record<string, string>> {
  const key = (name: string) => keyPart(data[name]);
  if (kind === "QUESTION_HEAD" && data.currentPublishedRevisionId)
    return {
      GSI1PK: `PUBLISHED#${key("certificationId")}`,
      GSI1SK: key("questionId"),
    };
  if (kind === "REVIEW_TARGET") {
    const identity =
      data.targetKind === "CANDIDATE"
        ? `${key("pipelineRunId")}#${key("candidateId")}`
        : key("questionRevisionId");
    return {
      GSI2PK: `REVIEW#${key("certificationId")}#${key("targetKind")}`,
      GSI2SK: `${timestampPart(data.submittedAt)}#${key("targetKind")}#${identity}`,
    };
  }
  if (
    kind === "PIPELINE_STAGE" &&
    (data.status === "PENDING" ||
      (data.status === "FAILED" && data.retryable === true)) &&
    data.dueAt
  )
    return {
      GSI1PK: `WORK#${key("certificationId")}#${key("stage")}#${key("status")}`,
      GSI1SK: `${timestampPart(data.dueAt)}#${key("pipelineRunId")}`,
    };
  return {};
}

/** Pipelineの失敗イベント・操作receiptだけがTTL候補。期間はU07。 */
export const ttlEligibleKinds: readonly DynamoItemKind[] = [
  "PIPELINE_EVENT",
  "OPERATION_RECEIPT",
];

export const dynamoItemSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: "object",
  properties: {
    table: { enum: ["Content", "Question", "Pipeline"] },
    kind: { enum: Object.keys(payloadSchemas) },
    PK: { type: "string", minLength: 1, maxLength: 2048 },
    SK: { type: "string", minLength: 1, maxLength: 1024 },
    payload: { type: "object" },
    GSI1PK: { type: "string", minLength: 1, maxLength: 2048 },
    GSI1SK: { type: "string", minLength: 1, maxLength: 1024 },
    GSI2PK: { type: "string", minLength: 1, maxLength: 2048 },
    GSI2SK: { type: "string", minLength: 1, maxLength: 1024 },
    expiresAt: {
      type: "integer",
      minimum: 0,
      maximum: Number.MAX_SAFE_INTEGER,
    },
  },
  required: ["table", "kind", "PK", "SK", "payload"],
  additionalProperties: false,
};
