import type { AnySchema, SchemaObject } from "ajv";
import {
  questionContentSchema,
  sourcePolicyDecisionSchema,
  sourceRevisionPolicySnapshotSchema,
  PIPELINE_STAGES,
  QUESTION_TYPES,
  QUESTION_FORMATS,
  QUESTION_DIFFICULTIES,
} from "@refriq/application";
import {
  QUESTION_SOURCE_RELATIONS,
  SOURCE_USAGE_PURPOSES,
} from "@refriq/domain";

export const textSchema: SchemaObject = {
  type: "string",
  minLength: 1,
  pattern: "\\S",
};
export const timestampSchema: SchemaObject = {
  type: "string",
  pattern: "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d{3})?Z$",
};
export const naturalSchema: SchemaObject = {
  type: "integer",
  minimum: 0,
  maximum: Number.MAX_SAFE_INTEGER,
};
export const ordinalSchema: SchemaObject = { ...naturalSchema, minimum: 1 };
export const identifiersSchema: SchemaObject = {
  type: "array",
  minItems: 1,
  uniqueItems: true,
  items: textSchema,
};
export const enumeration = (values: readonly string[]): SchemaObject => ({
  type: "string",
  enum: [...values],
});
export function record(
  properties: Record<string, AnySchema>,
  optional: readonly string[] = [],
): SchemaObject {
  return {
    type: "object",
    properties,
    required: Object.keys(properties).filter((key) => !optional.includes(key)),
    additionalProperties: false,
  };
}

export const artifactReferenceSchema = record({
  artifactId: textSchema,
  checksum: record({
    algorithm: { const: "SHA-256" },
    value: { type: "string", pattern: "^[a-f0-9]{64}$" },
  }),
  contentType: textSchema,
  byteSize: naturalSchema,
  createdAt: timestampSchema,
  schemaVersion: ordinalSchema,
});

const questionSourceSchema = record({
  questionRevisionId: textSchema,
  sourceRevisionId: textSchema,
  knowledgePointId: textSchema,
  usagePurpose: { const: "NORMATIVE_TECHNICAL" },
  relation: enumeration(QUESTION_SOURCE_RELATIONS),
  sourcePolicyDecisionId: textSchema,
});

export const questionRevisionSchema = record({
  questionId: textSchema,
  questionRevisionId: textSchema,
  certificationId: textSchema,
  revisionOrdinal: ordinalSchema,
  createdAt: timestampSchema,
  knowledgePointIds: identifiersSchema,
  question: questionContentSchema,
  questionSources: { type: "array", minItems: 1, items: questionSourceSchema },
  questionIntent: record({
    questionType: enumeration(QUESTION_TYPES),
    format: enumeration(QUESTION_FORMATS),
    learningObjective: textSchema,
    difficulty: enumeration(QUESTION_DIFFICULTIES),
    targetConcept: textSchema,
    constraints: { type: "array", items: textSchema },
    sourceReferences: {
      type: "array",
      minItems: 1,
      items: record({ sourceRevisionId: textSchema, locator: textSchema }),
    },
  }),
});

export const artifactOwnerSchema = {
  oneOf: [
    record({ kind: { const: "RUN_INPUT" }, pipelineRunId: textSchema }),
    record({
      kind: { const: "SOURCE_ORIGINAL" },
      sourceDocumentId: textSchema,
      sourceRevisionId: textSchema,
    }),
    record({
      kind: { const: "SOURCE_NORMALIZED" },
      sourceDocumentId: textSchema,
      sourceRevisionId: textSchema,
      normalizationVersion: textSchema,
    }),
    record({
      kind: { const: "QUESTION_CONTENT" },
      questionId: textSchema,
      questionRevisionId: textSchema,
    }),
    record({
      kind: { const: "PIPELINE" },
      pipelineRunId: textSchema,
      stage: enumeration(PIPELINE_STAGES),
      attempt: ordinalSchema,
    }),
  ],
};

export const humanReviewSchema = record({
  questionReviewId: textSchema,
  questionRevisionId: textSchema,
  reviewerId: textSchema,
  decision: enumeration(["APPROVE", "REQUEST_CHANGES", "REJECT"]),
  reviewedAt: textSchema,
});

/** 完全な保存形。原本本文やRaw失敗Outputを任意JSONで通さない。 */
export const payloadSchemas = {
  CERTIFICATION: record({
    certificationId: textSchema,
    name: textSchema,
    status: enumeration(["ACTIVE", "RETIRED"]),
  }),
  EXAM_TOPIC: record({
    certificationId: textSchema,
    examTopicId: textSchema,
    name: textSchema,
    status: enumeration(["ACTIVE", "RETIRED"]),
  }),
  SOURCE_HEAD: record({
    sourceDocumentId: textSchema,
    currentLocator: textSchema,
    latestRevisionId: textSchema,
    version: naturalSchema,
  }),
  SOURCE_HISTORY: record({
    sourceDocumentId: textSchema,
    sourceRevisionId: textSchema,
    revisionOrdinal: ordinalSchema,
  }),
  SOURCE_REVISION: record({
    snapshot: sourceRevisionPolicySnapshotSchema,
    originalArtifact: artifactReferenceSchema,
    normalizedArtifact: artifactReferenceSchema,
    normalizationVersion: textSchema,
  }),
  POLICY_CURRENT: record({
    sourceDocumentId: textSchema,
    usagePurpose: enumeration(SOURCE_USAGE_PURPOSES),
    decision: sourcePolicyDecisionSchema,
    version: naturalSchema,
  }),
  POLICY_HISTORY: sourcePolicyDecisionSchema,
  SOURCE_REVIEW: record(
    {
      sourceReviewId: textSchema,
      sourceDocumentId: textSchema,
      reviewerId: textSchema,
      reviewedAt: textSchema,
      outcome: enumeration([
        "APPROVED_FOR_USE",
        "REJECTED",
        "NEEDS_MORE_INFORMATION",
      ]),
      approvedPurposes: {
        type: "array",
        minItems: 1,
        uniqueItems: true,
        items: enumeration(SOURCE_USAGE_PURPOSES),
      },
    },
    ["approvedPurposes"],
  ),
  KNOWLEDGE_POINT: record({
    knowledgePointId: textSchema,
    certificationId: textSchema,
    examTopicId: textSchema,
    title: textSchema,
    summary: textSchema,
    sourceRevisionIds: identifiersSchema,
    version: naturalSchema,
    status: enumeration(["ACTIVE", "DEPRECATED"]),
  }),
  QUESTION_HEAD: record(
    {
      questionId: textSchema,
      certificationId: textSchema,
      latestRevisionId: textSchema,
      currentPublishedRevisionId: textSchema,
      version: naturalSchema,
    },
    ["currentPublishedRevisionId"],
  ),
  QUESTION_HISTORY: record({
    questionId: textSchema,
    questionRevisionId: textSchema,
    revisionOrdinal: ordinalSchema,
  }),
  QUESTION_CONTENT: {
    oneOf: [
      record({ revision: questionRevisionSchema }),
      record({
        questionId: textSchema,
        questionRevisionId: textSchema,
        certificationId: textSchema,
        revisionOrdinal: ordinalSchema,
        artifact: artifactReferenceSchema,
      }),
    ],
  },
  QUESTION_STATE: record({
    questionId: textSchema,
    questionRevisionId: textSchema,
    status: enumeration([
      "DRAFT",
      "REVIEW_REQUIRED",
      "PUBLISHED",
      "CHANGES_REQUESTED",
      "REJECTED",
    ]),
    version: naturalSchema,
  }),
  QUESTION_REVIEW: humanReviewSchema,
  QUESTION_EVALUATION: record({
    questionRevisionId: textSchema,
    evaluationId: textSchema,
    pipelineRunId: textSchema,
    contentChecksum: record({
      algorithm: { const: "SHA-256" },
      value: { type: "string", pattern: "^[a-f0-9]{64}$" },
    }),
    artifact: artifactReferenceSchema,
  }),
  REVIEW_TARGET: {
    oneOf: [
      record({
        targetKind: { const: "CANDIDATE" },
        pipelineRunId: textSchema,
        candidateId: textSchema,
        certificationId: textSchema,
        submittedAt: timestampSchema,
        artifact: artifactReferenceSchema,
      }),
      record({
        targetKind: { const: "QUESTION_REVISION" },
        questionRevisionId: textSchema,
        certificationId: textSchema,
        submittedAt: timestampSchema,
      }),
    ],
  },
  PIPELINE_HEAD: record(
    {
      pipelineRunId: textSchema,
      certificationId: textSchema,
      immutableInputFingerprint: { type: "string", pattern: "^[a-f0-9]{64}$" },
      status: enumeration(["SUCCEEDED", "FAILED", "RUNNING"]),
      version: naturalSchema,
    },
    ["immutableInputFingerprint"],
  ),
  PIPELINE_INPUT: record({
    pipelineRunId: textSchema,
    artifact: artifactReferenceSchema,
  }),
  PIPELINE_STAGE: record(
    {
      pipelineRunId: textSchema,
      certificationId: textSchema,
      stage: enumeration(PIPELINE_STAGES),
      attempt: naturalSchema,
      status: enumeration(["PENDING", "RUNNING", "SUCCEEDED", "FAILED"]),
      version: naturalSchema,
      dueAt: timestampSchema,
      retryable: { type: "boolean" },
    },
    ["dueAt", "retryable"],
  ),
  PIPELINE_EVENT: record(
    {
      pipelineRunId: textSchema,
      stage: enumeration(PIPELINE_STAGES),
      attempt: ordinalSchema,
      eventOrdinal: ordinalSchema,
      status: enumeration(["PENDING", "RUNNING", "SUCCEEDED", "FAILED"]),
      occurredAt: timestampSchema,
      failureCode: enumeration([
        "SOURCE_POLICY_BLOCKED",
        "INPUT_VALIDATION_FAILED",
        "PROVIDER_FAILED",
        "OUTPUT_VALIDATION_FAILED",
      ]),
      retryable: { type: "boolean" },
    },
    ["failureCode", "retryable"],
  ),
  PIPELINE_ARTIFACT: record({
    pipelineRunId: textSchema,
    stage: enumeration(PIPELINE_STAGES),
    attempt: ordinalSchema,
    artifact: artifactReferenceSchema,
  }),
  MATERIALIZATION: record({
    pipelineRunId: textSchema,
    candidateId: textSchema,
    questionId: textSchema,
    questionRevisionId: textSchema,
  }),
  OPERATION_RECEIPT: record({
    actorId: textSchema,
    operationKind: textSchema,
    operationId: textSchema,
    requestDigest: textSchema,
    resultId: textSchema,
    committedAt: timestampSchema,
  }),
  ARTIFACT_MANIFEST: record({
    artifact: artifactReferenceSchema,
    owner: artifactOwnerSchema,
    bucket: textSchema,
    objectKey: textSchema,
  }),
} satisfies Record<string, AnySchema>;

export type DynamoItemKind = keyof typeof payloadSchemas;
