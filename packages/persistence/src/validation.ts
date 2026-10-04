import { Ajv2020 } from "ajv/dist/2020.js";
import type { AnySchema, ValidateFunction } from "ajv";
import {
  validateSourceRevisionPolicySnapshot,
  type SourceRevisionPolicySnapshot,
} from "@refriq/domain";
import type { QuestionRevisionDocument } from "@refriq/application";
import {
  artifactObjectKey,
  dynamoItemSchema,
  expectedIndexes,
  itemAddress,
  ttlEligibleKinds,
  type DynamoItem,
} from "./dynamodb.js";
import {
  artifactReferenceSchema,
  payloadSchemas,
  questionRevisionSchema,
  type DynamoItemKind,
} from "./schemas.js";

const ajv = new Ajv2020({ strict: true, allErrors: true });
const envelopeValidator = ajv.compile<DynamoItem>(dynamoItemSchema);
const validators = new Map<DynamoItemKind, ValidateFunction>(
  Object.entries(payloadSchemas).map(([kind, schema]) => [
    kind as DynamoItemKind,
    ajv.compile(schema),
  ]),
);
const artifactValidator = ajv.compile(artifactReferenceSchema);
const revisionValidator = ajv.compile<QuestionRevisionDocument>(
  questionRevisionSchema,
);

export class PersistenceValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PersistenceValidationError";
  }
}

function requireValid(validator: ValidateFunction, value: unknown): void {
  if (!validator(value)) {
    // 値をErrorへ埋め込まない。Source本文・Generated OutputをLogへ漏らさない。
    throw new PersistenceValidationError(
      ajv.errorsText(validator.errors, { dataVar: "record" }),
    );
  }
}

function reject(condition: boolean, reason: string): void {
  if (condition) throw new PersistenceValidationError(reason);
}

/** Schemaで宣言した日時Fieldのみ検査。自由MapのOption ID等をField名と扱わない。 */
function validateTimestamps(value: unknown, schema: AnySchema): void {
  if (typeof schema === "boolean") return;
  for (const branch of schema.oneOf ?? []) validateTimestamps(value, branch);
  if (Array.isArray(value) && schema.items && !Array.isArray(schema.items)) {
    for (const child of value) validateTimestamps(child, schema.items);
    return;
  }
  if (!value || typeof value !== "object") return;
  const record = value as Record<string, unknown>;
  for (const [key, childSchema] of Object.entries(schema.properties ?? {})) {
    const child = record[key];
    if (
      (key.endsWith("At") || key === "retrievedAt") &&
      typeof child === "string"
    ) {
      const parsed = new Date(child);
      reject(
        !Number.isFinite(parsed.getTime()) ||
          (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(child) &&
            parsed.toISOString().replace(".000Z", "Z") !==
              child.replace(".000Z", "Z")),
        "Invalid timestamp",
      );
    }
    validateTimestamps(child, childSchema as AnySchema);
  }
}

export function validateArtifactReference(value: unknown): void {
  requireValid(artifactValidator, value);
  validateTimestamps(value, artifactReferenceSchema);
}

/** S3から復元したContentにも、inline保存と同じ構造・参照条件を適用する。 */
export function validateQuestionRevisionDocument(
  value: unknown,
): QuestionRevisionDocument {
  requireValid(revisionValidator, value);
  const revision = value as QuestionRevisionDocument;
  validateTimestamps(revision, questionRevisionSchema);
  validateRevision(revision);
  return revision;
}

function validateRevision(value: QuestionRevisionDocument): void {
  const { question, questionSources, knowledgePointIds, questionRevisionId } =
    value;
  const optionIds = question.options.map((option) => option.id);
  reject(
    new Set(optionIds).size !== optionIds.length,
    "Duplicate option identity",
  );
  reject(
    question.correctOptionIds.some((id) => !optionIds.includes(id)),
    "Unknown correct option identity",
  );
  reject(
    Object.keys(question.optionExplanations).length !== optionIds.length ||
      optionIds.some((id) => !Object.hasOwn(question.optionExplanations, id)),
    "Option explanation identity mismatch",
  );
  reject(
    question.type !== value.questionIntent.questionType,
    "QuestionIntent type mismatch",
  );
  reject(
    questionSources.some(
      (source) =>
        source.questionRevisionId !== questionRevisionId ||
        !knowledgePointIds.includes(source.knowledgePointId),
    ),
    "QuestionSource exact Revision / KnowledgePoint mismatch",
  );
  reject(
    knowledgePointIds.some(
      (id) => !questionSources.some((source) => source.knowledgePointId === id),
    ),
    "KnowledgePoint lacks provenance",
  );
  const sourceIds = new Set(
    questionSources.map((source) => source.sourceRevisionId),
  );
  reject(
    [
      ...question.sourceReferences,
      ...value.questionIntent.sourceReferences,
    ].some((source) => !sourceIds.has(source.sourceRevisionId)),
    "Question / Intent source lacks provenance",
  );
}

/** Attribute名・Map/Listのoverheadを含めた保守的な見積り。marshal結果はAdapterで別途確認する。 */
export function estimateItemBytes(value: unknown): number {
  const bytes = (text: string) => new TextEncoder().encode(text).byteLength;
  if (typeof value === "string") return bytes(value);
  if (typeof value === "number")
    return Math.ceil(value.toString().length / 2) + 2;
  if (value === null || typeof value === "boolean") return 1;
  if (Array.isArray(value))
    return (
      3 +
      value.reduce((total, entry) => total + 1 + estimateItemBytes(entry), 0)
    );
  if (value && typeof value === "object")
    return (
      3 +
      Object.entries(value).reduce(
        (total, [key, entry]) =>
          total + bytes(key) + 1 + estimateItemBytes(entry),
        0,
      )
    );
  throw new PersistenceValidationError("Value is not a JSON storage value");
}

export function validateDynamoItem(value: unknown): DynamoItem {
  requireValid(envelopeValidator, value);
  // envelopeValidatorが成功した後のStorage Modelへのnarrowing。
  const item = value as DynamoItem;
  const validator = validators.get(item.kind);
  if (!validator) throw new PersistenceValidationError("Unknown item kind");
  requireValid(validator, item.payload);
  reject(
    estimateItemBytes(item) > 400 * 1024,
    "Item exceeds the inline storage budget; use an immutable Artifact reference",
  );
  validateTimestamps(item.payload, payloadSchemas[item.kind]);
  const expected = itemAddress(item.kind, item.payload, item.table);
  reject(
    expected.table !== item.table ||
      expected.PK !== item.PK ||
      expected.SK !== item.SK,
    "Item address / identity mismatch",
  );
  const indexes = expectedIndexes(item.kind, item.payload);
  for (const key of ["GSI1PK", "GSI1SK", "GSI2PK", "GSI2SK"] as const)
    reject(item[key] !== indexes[key], "Sparse index / identity mismatch");
  reject(
    item.expiresAt !== undefined && !ttlEligibleKinds.includes(item.kind),
    "Exact Revision / persistent facts are not TTL eligible",
  );
  if (item.kind === "SOURCE_REVISION") {
    const snapshot = item.payload.snapshot as SourceRevisionPolicySnapshot;
    reject(
      !validateSourceRevisionPolicySnapshot(snapshot).allowed,
      "Invalid SourceRevision Policy Snapshot",
    );
  }
  if (item.kind === "POLICY_CURRENT") {
    const decision = item.payload.decision as Record<string, unknown>;
    reject(
      decision.sourceDocumentId !== item.payload.sourceDocumentId ||
        decision.usagePurpose !== item.payload.usagePurpose,
      "Current policy pointer mismatch",
    );
  }
  if (item.kind === "QUESTION_CONTENT" && item.payload.revision)
    validateQuestionRevisionDocument(item.payload.revision);
  if (item.kind === "ARTIFACT_MANIFEST") {
    const artifact = item.payload.artifact as Record<string, unknown>;
    reject(
      item.payload.objectKey !==
        artifactObjectKey(
          item.payload.owner as Record<string, unknown>,
          artifact.artifactId as string,
        ),
      "Artifact immutable object key mismatch",
    );
  }
  if (item.kind === "PIPELINE_STAGE") {
    reject(
      item.payload.attempt === 0 && item.payload.status !== "PENDING",
      "Unattempted Stage must remain PENDING",
    );
  }
  return item;
}

/** S3へ置くArtifactの内容整合。取得元やPolicy許可は別Gateで確認する。 */
export async function verifyArtifactBody(
  reference: import("@refriq/application").ArtifactReference,
  body: Uint8Array,
): Promise<void> {
  validateArtifactReference(reference);
  reject(body.byteLength !== reference.byteSize, "Artifact byte size mismatch");
  const digest = await globalThis.crypto.subtle.digest(
    "SHA-256",
    new Uint8Array(body),
  );
  const checksum = [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  reject(checksum !== reference.checksum.value, "Artifact checksum mismatch");
}
