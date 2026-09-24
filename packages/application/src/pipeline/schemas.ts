import type { AnySchema, SchemaObject } from "ajv";
import {
  AUTOMATED_ACCESS_STATUSES,
  PURPOSE_ALIGNMENTS,
  SOURCE_ACCESS_CLASSIFICATIONS,
  SOURCE_CLASSIFICATIONS,
  SOURCE_KINDS,
  SOURCE_ORIGIN_STATUSES,
  SOURCE_POLICY_REASON_CODES,
  SOURCE_USAGE_PURPOSES,
  TERMS_REVIEW_STATUSES,
} from "@refriq/domain";
import {
  EVALUATION_CHECK_RESULTS,
  EVALUATION_CRITERIA,
  EVALUATION_DECISIONS,
  EVALUATION_FINDING_SEVERITIES,
  QUESTION_DIFFICULTIES,
  QUESTION_FORMATS,
  QUESTION_TYPES,
} from "./contracts.js";

const nonEmptyString: SchemaObject = { type: "string", minLength: 1 };
const stringArray: SchemaObject = {
  type: "array",
  items: { type: "string", minLength: 1 },
};
const enumSchema = (values: readonly string[]): SchemaObject => ({
  type: "string",
  enum: [...values],
});

function objectSchema(
  properties: Record<string, AnySchema>,
  required = Object.keys(properties),
): SchemaObject {
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    type: "object",
    properties,
    required,
    additionalProperties: false,
  };
}

const certificationSchema = objectSchema({
  certificationId: nonEmptyString,
  name: nonEmptyString,
});

const examTopicSchema = objectSchema({
  examTopicId: nonEmptyString,
  certificationId: nonEmptyString,
  name: nonEmptyString,
});

const sourceReferenceSchema = objectSchema({
  sourceRevisionId: nonEmptyString,
  locator: nonEmptyString,
});

const groundingSegmentSchema = objectSchema({
  sourceRevisionId: nonEmptyString,
  locator: nonEmptyString,
  text: nonEmptyString,
});

const knowledgePointDraftSchema = objectSchema({
  title: nonEmptyString,
  summary: nonEmptyString,
  examTopicId: nonEmptyString,
  sourceReferences: {
    type: "array",
    minItems: 1,
    items: sourceReferenceSchema,
  },
});

const knowledgePointCandidateSchema = objectSchema({
  candidateId: nonEmptyString,
  title: nonEmptyString,
  summary: nonEmptyString,
  examTopicId: nonEmptyString,
  sourceReferences: {
    type: "array",
    minItems: 1,
    items: sourceReferenceSchema,
  },
});

const questionIntentSchema = objectSchema({
  knowledgePointCandidateIds: {
    type: "array",
    minItems: 1,
    uniqueItems: true,
    items: nonEmptyString,
  },
  questionType: { type: "string", enum: [...QUESTION_TYPES] },
  format: { type: "string", enum: [...QUESTION_FORMATS] },
  learningObjective: nonEmptyString,
  difficulty: { type: "string", enum: [...QUESTION_DIFFICULTIES] },
  targetConcept: nonEmptyString,
  constraints: { ...stringArray, minItems: 1 },
  sourceReferences: {
    type: "array",
    minItems: 1,
    items: sourceReferenceSchema,
  },
});

const questionOptionSchema = objectSchema({
  id: nonEmptyString,
  text: nonEmptyString,
});

const questionContentSchema: AnySchema = {
  ...objectSchema({
    type: { type: "string", enum: [...QUESTION_TYPES] },
    stem: nonEmptyString,
    options: {
      type: "array",
      minItems: 2,
      items: questionOptionSchema,
    },
    correctOptionIds: {
      type: "array",
      minItems: 1,
      uniqueItems: true,
      items: nonEmptyString,
    },
    explanation: nonEmptyString,
    optionExplanations: {
      type: "object",
      minProperties: 2,
      additionalProperties: nonEmptyString,
    },
    sourceReferences: {
      type: "array",
      minItems: 1,
      items: sourceReferenceSchema,
    },
  }),
  oneOf: [
    {
      properties: {
        type: { const: "single_choice" },
        correctOptionIds: { type: "array", minItems: 1, maxItems: 1 },
      },
      required: ["type", "correctOptionIds"],
    },
    {
      properties: {
        type: { const: "multiple_select" },
        correctOptionIds: { type: "array", minItems: 1 },
      },
      required: ["type", "correctOptionIds"],
    },
  ],
};

const evaluationChecksSchema = objectSchema(
  Object.fromEntries(
    EVALUATION_CRITERIA.map((criterion) => [
      criterion,
      { type: "string", enum: [...EVALUATION_CHECK_RESULTS] },
    ]),
  ),
);

const evaluationFindingSchema = objectSchema({
  code: { type: "string", enum: [...EVALUATION_CRITERIA] },
  severity: { type: "string", enum: [...EVALUATION_FINDING_SEVERITIES] },
  message: nonEmptyString,
  sourceReferences: {
    type: "array",
    items: sourceReferenceSchema,
  },
});

const sourceTermsMetadataSchema = objectSchema(
  {
    reviewStatus: enumSchema(TERMS_REVIEW_STATUSES),
    licenseIdentifier: nonEmptyString,
    licenseUrl: nonEmptyString,
    termsUrl: nonEmptyString,
    checkedAt: nonEmptyString,
    checkedBy: nonEmptyString,
    notes: { type: "string" },
  },
  ["reviewStatus"],
);

const sourcePolicyMetadataSnapshotSchema = objectSchema(
  {
    sourceUrl: nonEmptyString,
    sourceOwner: nonEmptyString,
    originStatus: enumSchema(SOURCE_ORIGIN_STATUSES),
    accessClassification: enumSchema(SOURCE_ACCESS_CLASSIFICATIONS),
    automatedAccess: enumSchema(AUTOMATED_ACCESS_STATUSES),
    purposeAlignment: enumSchema(PURPOSE_ALIGNMENTS),
    terms: sourceTermsMetadataSchema,
  },
  [
    "originStatus",
    "accessClassification",
    "automatedAccess",
    "purposeAlignment",
    "terms",
  ],
);

const allowedSourceSchema = objectSchema(
  {
    id: nonEmptyString,
    owner: nonEmptyString,
    hostname: nonEmptyString,
    pathPrefix: nonEmptyString,
    allowedKinds: {
      type: "array",
      minItems: 1,
      items: enumSchema(SOURCE_KINDS),
    },
    allowedPurposes: {
      type: "array",
      minItems: 1,
      items: enumSchema(SOURCE_USAGE_PURPOSES),
    },
    notes: nonEmptyString,
  },
  ["id", "owner", "hostname", "allowedKinds", "allowedPurposes", "notes"],
);

const sourcePolicyDecisionSchema = objectSchema(
  {
    sourcePolicyDecisionId: nonEmptyString,
    sourceDocumentId: nonEmptyString,
    classification: enumSchema(SOURCE_CLASSIFICATIONS),
    usagePurpose: enumSchema(SOURCE_USAGE_PURPOSES),
    sourceKind: enumSchema(SOURCE_KINDS),
    reasonCodes: {
      type: "array",
      items: enumSchema(SOURCE_POLICY_REASON_CODES),
    },
    evaluatedAt: nonEmptyString,
    matchedAllowRuleId: nonEmptyString,
    matchedAllowRuleSnapshot: allowedSourceSchema,
    sourceReviewId: nonEmptyString,
    sourceMetadataSnapshot: sourcePolicyMetadataSnapshotSchema,
    termsMetadataSnapshot: sourceTermsMetadataSchema,
  },
  [
    "sourcePolicyDecisionId",
    "sourceDocumentId",
    "classification",
    "usagePurpose",
    "sourceKind",
    "reasonCodes",
    "evaluatedAt",
    "sourceMetadataSnapshot",
    "termsMetadataSnapshot",
  ],
);

const sourceRevisionPolicySnapshotSchema = objectSchema(
  {
    sourceDocumentId: nonEmptyString,
    sourceRevisionId: nonEmptyString,
    sourceUrlAtRetrieval: nonEmptyString,
    retrievedAt: nonEmptyString,
    contentFingerprint: nonEmptyString,
    classificationAtUse: { const: "TRUSTED" },
    usagePurposeAtUse: enumSchema(SOURCE_USAGE_PURPOSES),
    sourceKindAtUse: enumSchema(SOURCE_KINDS),
    sourcePolicyDecisionId: nonEmptyString,
    sourceReviewId: nonEmptyString,
    sourceMetadataSnapshot: sourcePolicyMetadataSnapshotSchema,
    matchedAllowRuleSnapshot: allowedSourceSchema,
    termsMetadataSnapshot: sourceTermsMetadataSchema,
  },
  [
    "sourceDocumentId",
    "sourceRevisionId",
    "sourceUrlAtRetrieval",
    "retrievedAt",
    "contentFingerprint",
    "classificationAtUse",
    "usagePurposeAtUse",
    "sourceKindAtUse",
    "sourcePolicyDecisionId",
    "sourceMetadataSnapshot",
    "termsMetadataSnapshot",
  ],
);

export const pipelineInputSchema: AnySchema = objectSchema({
  certification: certificationSchema,
  examTopics: {
    type: "array",
    minItems: 1,
    items: examTopicSchema,
  },
  sourceRevision: objectSchema({
    policyDecision: sourcePolicyDecisionSchema,
    snapshot: sourceRevisionPolicySnapshotSchema,
  }),
  groundingSegments: {
    type: "array",
    minItems: 1,
    items: groundingSegmentSchema,
  },
});

export const knowledgeExtractionInputSchema: AnySchema = objectSchema({
  certification: certificationSchema,
  examTopics: {
    type: "array",
    minItems: 1,
    items: examTopicSchema,
  },
  sourceRevisionId: nonEmptyString,
  groundingSegments: {
    type: "array",
    minItems: 1,
    items: groundingSegmentSchema,
  },
});

export const knowledgeExtractionOutputSchema: AnySchema = objectSchema({
  knowledgePoints: {
    type: "array",
    minItems: 1,
    items: knowledgePointDraftSchema,
  },
});

export const questionPlanningInputSchema: AnySchema = objectSchema({
  certification: certificationSchema,
  examTopics: {
    type: "array",
    minItems: 1,
    items: examTopicSchema,
  },
  knowledgePoints: {
    type: "array",
    minItems: 1,
    items: knowledgePointCandidateSchema,
  },
});

export const questionPlanningOutputSchema: AnySchema = objectSchema({
  questionIntent: questionIntentSchema,
});

export const questionGenerationInputSchema: AnySchema = objectSchema({
  certification: certificationSchema,
  examTopics: {
    type: "array",
    minItems: 1,
    items: examTopicSchema,
  },
  knowledgePoints: {
    type: "array",
    minItems: 1,
    items: knowledgePointCandidateSchema,
  },
  questionIntent: questionIntentSchema,
  groundingSegments: {
    type: "array",
    minItems: 1,
    items: groundingSegmentSchema,
  },
  rules: { type: "array", minItems: 1, items: nonEmptyString },
});

export const questionGenerationOutputSchema: AnySchema = objectSchema({
  question: questionContentSchema,
});

export const questionEvaluationInputSchema: AnySchema = objectSchema({
  certification: certificationSchema,
  examTopics: {
    type: "array",
    minItems: 1,
    items: examTopicSchema,
  },
  knowledgePoints: {
    type: "array",
    minItems: 1,
    items: knowledgePointCandidateSchema,
  },
  questionIntent: questionIntentSchema,
  question: questionContentSchema,
  groundingSegments: {
    type: "array",
    minItems: 1,
    items: groundingSegmentSchema,
  },
  criteria: {
    type: "array",
    minItems: EVALUATION_CRITERIA.length,
    maxItems: EVALUATION_CRITERIA.length,
    uniqueItems: true,
    items: { type: "string", enum: [...EVALUATION_CRITERIA] },
  },
});

export const questionEvaluationOutputSchema: AnySchema = objectSchema({
  decision: { type: "string", enum: [...EVALUATION_DECISIONS] },
  checks: evaluationChecksSchema,
  findings: { type: "array", items: evaluationFindingSchema },
  ambiguityNotes: stringArray,
  assumptions: stringArray,
});
