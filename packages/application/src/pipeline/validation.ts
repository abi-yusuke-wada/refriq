import { Ajv2020 } from "ajv/dist/2020.js";
import type { ValidateFunction } from "ajv";
import {
  canUseForKnowledgeExtraction,
  canUseForQuestionGeneration,
} from "@refriq/domain";
import {
  EVALUATION_CRITERIA,
  type EvaluationDecision,
  type GroundingSegment,
  type KnowledgeExtractionInput,
  type KnowledgeExtractionOutput,
  type KnowledgePointCandidate,
  type QuestionContent,
  type QuestionEvaluationInput,
  type QuestionEvaluationOutput,
  type QuestionGenerationInput,
  type QuestionGenerationOutput,
  type QuestionPipelineInput,
  type QuestionPlanningInput,
  type QuestionPlanningOutput,
  type SourceReference,
} from "./contracts.js";
import {
  knowledgeExtractionInputSchema,
  knowledgeExtractionOutputSchema,
  pipelineInputSchema,
  questionEvaluationInputSchema,
  questionEvaluationOutputSchema,
  questionGenerationInputSchema,
  questionGenerationOutputSchema,
  questionPlanningInputSchema,
  questionPlanningOutputSchema,
} from "./schemas.js";

const ajv = new Ajv2020({ allErrors: true, strict: true });

const validators = {
  pipelineInput: ajv.compile<QuestionPipelineInput>(pipelineInputSchema),
  knowledgeExtractionInput: ajv.compile<KnowledgeExtractionInput>(
    knowledgeExtractionInputSchema,
  ),
  knowledgeExtractionOutput: ajv.compile<KnowledgeExtractionOutput>(
    knowledgeExtractionOutputSchema,
  ),
  questionPlanningInput: ajv.compile<QuestionPlanningInput>(
    questionPlanningInputSchema,
  ),
  questionPlanningOutput: ajv.compile<QuestionPlanningOutput>(
    questionPlanningOutputSchema,
  ),
  questionGenerationInput: ajv.compile<QuestionGenerationInput>(
    questionGenerationInputSchema,
  ),
  questionGenerationOutput: ajv.compile<QuestionGenerationOutput>(
    questionGenerationOutputSchema,
  ),
  questionEvaluationInput: ajv.compile<QuestionEvaluationInput>(
    questionEvaluationInputSchema,
  ),
  questionEvaluationOutput: ajv.compile<QuestionEvaluationOutput>(
    questionEvaluationOutputSchema,
  ),
};

export class ContractValidationError extends Error {
  readonly code = "CONTRACT_VALIDATION_FAILED";

  constructor(message: string) {
    super(message);
    this.name = "ContractValidationError";
  }
}

export class SourcePolicyGateError extends ContractValidationError {
  constructor(message: string) {
    super(message);
    this.name = "SourcePolicyGateError";
  }
}

function assertSchema<T>(
  validator: ValidateFunction<T>,
  value: unknown,
  contractName: string,
): T {
  if (!validator(value)) {
    const details =
      validator.errors
        ?.map(
          (error) =>
            `${error.instancePath || "/"} ${error.message ?? "invalid"}`,
        )
        .join("; ") ?? "invalid structure";
    throw new ContractValidationError(`${contractName}: ${details}`);
  }
  return value;
}

export function validatePipelineInput(value: unknown): QuestionPipelineInput {
  const input = assertSchema(
    validators.pipelineInput,
    value,
    "QuestionPipelineInput",
  );
  const { certification, examTopics, sourceRevision, groundingSegments } =
    input;
  const { policyDecision, snapshot } = sourceRevision;

  if (
    policyDecision.sourceDocumentId !== snapshot.sourceDocumentId ||
    snapshot.classificationAtUse !== "TRUSTED" ||
    snapshot.usagePurposeAtUse !== policyDecision.usagePurpose
  ) {
    throw new ContractValidationError(
      "QuestionPipelineInput: SourceRevisionとPolicy Decisionが一致しない",
    );
  }

  if (policyDecision.classification !== "TRUSTED") {
    throw new SourcePolicyGateError(
      `QuestionPipelineInput: Source Policy Gate denied (${policyDecision.reasonCodes.join(", ")})`,
    );
  }

  const extractionGate = canUseForKnowledgeExtraction(policyDecision);
  const generationGate = canUseForQuestionGeneration(policyDecision);
  if (!extractionGate.allowed || !generationGate.allowed) {
    throw new SourcePolicyGateError(
      `QuestionPipelineInput: Source Policy Gate denied (${[
        ...extractionGate.reasonCodes,
        ...generationGate.reasonCodes,
      ].join(", ")})`,
    );
  }

  if (
    !isHttpUrl(snapshot.sourceUrlAtRetrieval) ||
    Number.isNaN(Date.parse(snapshot.retrievedAt)) ||
    !isNonEmpty(snapshot.contentFingerprint)
  ) {
    throw new ContractValidationError(
      "QuestionPipelineInput: SourceRevision metadata is invalid",
    );
  }

  if (
    examTopics.some(
      (topic) => topic.certificationId !== certification.certificationId,
    ) ||
    new Set(examTopics.map((topic) => topic.examTopicId)).size !==
      examTopics.length
  ) {
    throw new ContractValidationError(
      "QuestionPipelineInput: ExamTopic must be unique and belong to the Certification",
    );
  }

  for (const segment of groundingSegments) {
    if (segment.sourceRevisionId !== snapshot.sourceRevisionId) {
      throw new ContractValidationError(
        "QuestionPipelineInput: Grounding Segment references a different SourceRevision",
      );
    }
  }
  assertUniqueReferences(
    groundingSegments,
    "QuestionPipelineInput.groundingSegments",
  );

  return input;
}

export function validateKnowledgeExtractionInput(
  value: unknown,
): KnowledgeExtractionInput {
  const input = assertSchema(
    validators.knowledgeExtractionInput,
    value,
    "KnowledgeExtractionInput",
  );
  if (
    new Set(input.examTopics.map((topic) => topic.examTopicId)).size !==
    input.examTopics.length
  ) {
    throw new ContractValidationError(
      "KnowledgeExtractionInput.examTopics: duplicate ExamTopicId",
    );
  }
  if (
    input.examTopics.some(
      (topic) => topic.certificationId !== input.certification.certificationId,
    ) ||
    input.groundingSegments.some(
      (segment) => segment.sourceRevisionId !== input.sourceRevisionId,
    )
  ) {
    throw new ContractValidationError(
      "KnowledgeExtractionInput: Certification or SourceRevision reference mismatch",
    );
  }
  assertUniqueReferences(
    input.groundingSegments,
    "KnowledgeExtractionInput.groundingSegments",
  );
  return input;
}

export function validateKnowledgeExtractionOutput(
  value: unknown,
  input: KnowledgeExtractionInput,
): KnowledgeExtractionOutput {
  const output = assertSchema(
    validators.knowledgeExtractionOutput,
    decodeStructuredOutput(value),
    "KnowledgeExtractionOutput",
  );
  const topicIds = new Set(input.examTopics.map((topic) => topic.examTopicId));
  const allowedReferences = referenceSet(input.groundingSegments);

  for (const [index, point] of output.knowledgePoints.entries()) {
    if (!topicIds.has(point.examTopicId)) {
      throw new ContractValidationError(
        `KnowledgeExtractionOutput.knowledgePoints[${index}]: unknown ExamTopicId`,
      );
    }
    assertUniqueReferences(
      point.sourceReferences,
      `KnowledgeExtractionOutput.knowledgePoints[${index}].sourceReferences`,
    );
    assertReferencesKnown(
      point.sourceReferences,
      allowedReferences,
      `KnowledgeExtractionOutput.knowledgePoints[${index}].sourceReferences`,
    );
  }
  return output;
}

export function validateQuestionPlanningInput(
  value: unknown,
): QuestionPlanningInput {
  const input = assertSchema(
    validators.questionPlanningInput,
    value,
    "QuestionPlanningInput",
  );
  const topicIds = new Set(input.examTopics.map((topic) => topic.examTopicId));
  if (
    topicIds.size !== input.examTopics.length ||
    input.examTopics.some(
      (topic) => topic.certificationId !== input.certification.certificationId,
    )
  ) {
    throw new ContractValidationError(
      "QuestionPlanningInput: ExamTopics must be unique and belong to the Certification",
    );
  }
  const candidateIds = new Set<string>();
  for (const point of input.knowledgePoints) {
    if (
      !topicIds.has(point.examTopicId) ||
      candidateIds.has(point.candidateId)
    ) {
      throw new ContractValidationError(
        "QuestionPlanningInput: KnowledgePoint candidate has an unknown topic or duplicate ID",
      );
    }
    candidateIds.add(point.candidateId);
    assertUniqueReferences(
      point.sourceReferences,
      "QuestionPlanningInput.sourceReferences",
    );
  }
  return input;
}

export function validateQuestionPlanningOutput(
  value: unknown,
  input: QuestionPlanningInput,
): QuestionPlanningOutput {
  const output = assertSchema(
    validators.questionPlanningOutput,
    decodeStructuredOutput(value),
    "QuestionPlanningOutput",
  );
  const intent = output.questionIntent;
  const knowledgePoints = findSelectedKnowledgePoints(
    intent.knowledgePointCandidateIds,
    input.knowledgePoints,
    "QuestionPlanningOutput.questionIntent.knowledgePointCandidateIds",
  );
  if (knowledgePoints.length === 0) {
    throw new ContractValidationError(
      "QuestionPlanningOutput: QuestionIntent must reference input KnowledgePoints",
    );
  }
  assertUniqueReferences(
    intent.sourceReferences,
    "QuestionPlanningOutput.sourceReferences",
  );
  assertReferencesKnown(
    intent.sourceReferences,
    referenceSet(knowledgePoints.flatMap((point) => point.sourceReferences)),
    "QuestionPlanningOutput.sourceReferences",
  );
  assertSelectedKnowledgePointsGrounded(
    knowledgePoints,
    intent.sourceReferences,
    "QuestionPlanningOutput.sourceReferences",
  );
  return output;
}

export function validateQuestionGenerationInput(
  value: unknown,
): QuestionGenerationInput {
  const input = assertSchema(
    validators.questionGenerationInput,
    value,
    "QuestionGenerationInput",
  );
  const knowledgePoints = validateSelectedKnowledgePoints(
    input.questionIntent.knowledgePointCandidateIds,
    input.knowledgePoints,
    input.examTopics,
    input.certification.certificationId,
    "QuestionGenerationInput",
  );
  if (
    new Set(input.examTopics.map((topic) => topic.examTopicId)).size !==
    input.examTopics.length
  ) {
    throw new ContractValidationError(
      "QuestionGenerationInput: duplicate ExamTopicId",
    );
  }
  const allowedPointReferences = referenceSet(
    knowledgePoints.flatMap((point) => point.sourceReferences),
  );
  assertUniqueReferences(
    input.questionIntent.sourceReferences,
    "QuestionGenerationInput.questionIntent.sourceReferences",
  );
  assertReferencesKnown(
    input.questionIntent.sourceReferences,
    allowedPointReferences,
    "QuestionGenerationInput.questionIntent.sourceReferences",
  );
  assertSelectedKnowledgePointsGrounded(
    knowledgePoints,
    input.questionIntent.sourceReferences,
    "QuestionGenerationInput.questionIntent.sourceReferences",
  );
  assertReferencesKnown(
    input.groundingSegments,
    allowedPointReferences,
    "QuestionGenerationInput.groundingSegments",
  );
  assertReferencesKnown(
    input.groundingSegments,
    referenceSet(input.questionIntent.sourceReferences),
    "QuestionGenerationInput.groundingSegments",
  );
  assertUniqueReferences(
    input.groundingSegments,
    "QuestionGenerationInput.groundingSegments",
  );
  assertReferencesKnown(
    input.questionIntent.sourceReferences,
    referenceSet(input.groundingSegments),
    "QuestionGenerationInput.groundingSegments",
  );
  return input;
}

export function validateQuestionGenerationOutput(
  value: unknown,
  input: QuestionGenerationInput,
): QuestionGenerationOutput {
  const output = assertSchema(
    validators.questionGenerationOutput,
    decodeStructuredOutput(value),
    "QuestionGenerationOutput",
  );
  const question = output.question;
  validateQuestionInvariants(question, input.questionIntent.questionType);
  assertReferencesKnown(
    question.sourceReferences,
    referenceSet(input.groundingSegments),
    "QuestionGenerationOutput.question.sourceReferences",
  );
  assertUniqueReferences(
    question.sourceReferences,
    "QuestionGenerationOutput.question.sourceReferences",
  );
  return output;
}

export function validateQuestionEvaluationInput(
  value: unknown,
): QuestionEvaluationInput {
  const input = assertSchema(
    validators.questionEvaluationInput,
    value,
    "QuestionEvaluationInput",
  );
  const knowledgePoints = validateSelectedKnowledgePoints(
    input.questionIntent.knowledgePointCandidateIds,
    input.knowledgePoints,
    input.examTopics,
    input.certification.certificationId,
    "QuestionEvaluationInput",
  );
  if (
    new Set(input.examTopics.map((topic) => topic.examTopicId)).size !==
    input.examTopics.length
  ) {
    throw new ContractValidationError(
      "QuestionEvaluationInput: duplicate ExamTopicId",
    );
  }
  validateQuestionInvariants(input.question, input.questionIntent.questionType);
  assertReferencesKnown(
    input.question.sourceReferences,
    referenceSet(input.groundingSegments),
    "QuestionEvaluationInput.question.sourceReferences",
  );
  assertReferencesKnown(
    input.groundingSegments,
    referenceSet(knowledgePoints.flatMap((point) => point.sourceReferences)),
    "QuestionEvaluationInput.groundingSegments",
  );
  assertUniqueReferences(
    input.groundingSegments,
    "QuestionEvaluationInput.groundingSegments",
  );
  assertUniqueReferences(
    input.question.sourceReferences,
    "QuestionEvaluationInput.question.sourceReferences",
  );
  assertUniqueReferences(
    input.questionIntent.sourceReferences,
    "QuestionEvaluationInput.questionIntent.sourceReferences",
  );
  assertReferencesKnown(
    input.questionIntent.sourceReferences,
    referenceSet(
      input.knowledgePoints.flatMap((point) => point.sourceReferences),
    ),
    "QuestionEvaluationInput.questionIntent.sourceReferences",
  );
  assertSelectedKnowledgePointsGrounded(
    knowledgePoints,
    input.questionIntent.sourceReferences,
    "QuestionEvaluationInput.questionIntent.sourceReferences",
  );
  assertReferencesKnown(
    input.groundingSegments,
    referenceSet(input.questionIntent.sourceReferences),
    "QuestionEvaluationInput.groundingSegments",
  );
  assertReferencesKnown(
    input.questionIntent.sourceReferences,
    referenceSet(input.groundingSegments),
    "QuestionEvaluationInput.groundingSegments",
  );
  assertReferencesKnown(
    input.question.sourceReferences,
    referenceSet(input.questionIntent.sourceReferences),
    "QuestionEvaluationInput.question.sourceReferences",
  );
  if (input.criteria.length !== EVALUATION_CRITERIA.length) {
    throw new ContractValidationError(
      "QuestionEvaluationInput.criteria: every evaluation criterion is required",
    );
  }
  return input;
}

export function validateQuestionEvaluationOutput(
  value: unknown,
  input: QuestionEvaluationInput,
): QuestionEvaluationOutput {
  const output = assertSchema(
    validators.questionEvaluationOutput,
    decodeStructuredOutput(value),
    "QuestionEvaluationOutput",
  );
  const expectedDecision = deriveEvaluationDecision(output);
  if (output.decision !== expectedDecision) {
    throw new ContractValidationError(
      `QuestionEvaluationOutput: decision must match checks (${expectedDecision})`,
    );
  }
  const contradictoryErrorFinding = output.findings.find(
    (finding) =>
      finding.severity === "error" && output.checks[finding.code] === "PASS",
  );
  if (contradictoryErrorFinding) {
    throw new ContractValidationError(
      `QuestionEvaluationOutput: error finding contradicts PASS check ${contradictoryErrorFinding.code}`,
    );
  }
  const findingCodes = new Set(output.findings.map((finding) => finding.code));
  for (const [criterion, result] of Object.entries(output.checks)) {
    if (
      result !== "PASS" &&
      !findingCodes.has(criterion as (typeof EVALUATION_CRITERIA)[number])
    ) {
      throw new ContractValidationError(
        `QuestionEvaluationOutput.findings: ${criterion} needs a finding`,
      );
    }
  }
  assertReferencesKnown(
    output.findings.flatMap((finding) => finding.sourceReferences),
    referenceSet(input.groundingSegments),
    "QuestionEvaluationOutput.findings.sourceReferences",
  );
  for (const [index, finding] of output.findings.entries()) {
    assertUniqueReferences(
      finding.sourceReferences,
      `QuestionEvaluationOutput.findings[${index}].sourceReferences`,
    );
  }
  return output;
}

export function deriveEvaluationDecision(
  evaluation: Pick<QuestionEvaluationOutput, "checks">,
): EvaluationDecision {
  const values = Object.values(evaluation.checks);
  if (values.includes("FAIL")) return "REJECT";
  if (values.includes("CONCERN")) return "REVISE";
  return "PASS";
}

export function referenceSet(
  references: readonly SourceReference[],
): ReadonlySet<string> {
  return new Set(references.map(referenceKey));
}

export function referenceKey(reference: SourceReference): string {
  return `${reference.sourceRevisionId}\u0000${reference.locator}`;
}

export function assertReferencesKnown(
  references: readonly SourceReference[],
  allowed: ReadonlySet<string>,
  fieldName: string,
): void {
  for (const reference of references) {
    if (!allowed.has(referenceKey(reference))) {
      throw new ContractValidationError(
        `${fieldName}: SourceReference is not in the provided grounding context`,
      );
    }
  }
}

export function assertUniqueReferences(
  references: readonly SourceReference[],
  fieldName: string,
): void {
  if (referenceSet(references).size !== references.length) {
    throw new ContractValidationError(
      `${fieldName}: duplicate SourceReference`,
    );
  }
}

export function selectGroundingSegments(
  references: readonly SourceReference[],
  segments: readonly GroundingSegment[],
): readonly GroundingSegment[] {
  const requested = referenceSet(references);
  const selected = segments.filter((segment) =>
    requested.has(referenceKey(segment)),
  );
  if (selected.length !== references.length) {
    throw new ContractValidationError(
      "GroundingContext: KnowledgePoint references are missing from the selected SourceRevision context",
    );
  }
  return selected;
}

function validateSelectedKnowledgePoints(
  candidateIds: readonly string[],
  knowledgePoints: readonly KnowledgePointCandidate[],
  examTopics: QuestionGenerationInput["examTopics"],
  certificationId: string,
  contractName: string,
): readonly KnowledgePointCandidate[] {
  const selected = findSelectedKnowledgePoints(
    candidateIds,
    knowledgePoints,
    `${contractName}.questionIntent.knowledgePointCandidateIds`,
  );
  const selectedIds = new Set(candidateIds);
  const expectedTopicIds = new Set(selected.map((point) => point.examTopicId));
  const actualTopicIds = new Set(examTopics.map((topic) => topic.examTopicId));
  if (
    selected.length !== knowledgePoints.length ||
    knowledgePoints.some((point) => !selectedIds.has(point.candidateId)) ||
    examTopics.some((topic) => topic.certificationId !== certificationId) ||
    expectedTopicIds.size !== actualTopicIds.size ||
    [...expectedTopicIds].some((topicId) => !actualTopicIds.has(topicId))
  ) {
    throw new ContractValidationError(
      `${contractName}: Certification and ExamTopics must exactly match the selected KnowledgePoints`,
    );
  }
  return selected;
}

function findSelectedKnowledgePoints(
  candidateIds: readonly string[],
  knowledgePoints: readonly KnowledgePointCandidate[],
  fieldName: string,
): readonly KnowledgePointCandidate[] {
  const byId = new Map(
    knowledgePoints.map((point) => [point.candidateId, point]),
  );
  const selected = candidateIds.map((candidateId) => byId.get(candidateId));
  if (
    new Set(candidateIds).size !== candidateIds.length ||
    byId.size !== knowledgePoints.length ||
    selected.some((point) => point === undefined)
  ) {
    throw new ContractValidationError(
      `${fieldName}: every ID must uniquely reference an input KnowledgePoint`,
    );
  }
  const resolved: KnowledgePointCandidate[] = [];
  for (const point of selected) {
    if (!point) {
      throw new ContractValidationError(
        `${fieldName}: every ID must uniquely reference an input KnowledgePoint`,
      );
    }
    resolved.push(point);
  }
  return resolved;
}

function validateQuestionInvariants(
  question: QuestionContent,
  plannedType: QuestionContent["type"],
): void {
  if (question.type !== plannedType) {
    throw new ContractValidationError(
      "Question: generated question type must match QuestionIntent",
    );
  }

  const optionIds = question.options.map((option) => option.id);
  if (new Set(optionIds).size !== optionIds.length) {
    throw new ContractValidationError("Question: option IDs must be unique");
  }
  const optionIdSet = new Set(optionIds);
  if (question.correctOptionIds.some((id) => !optionIdSet.has(id))) {
    throw new ContractValidationError(
      "Question: every correctOptionId must reference an existing option",
    );
  }
  if (
    Object.keys(question.optionExplanations).length !== optionIds.length ||
    optionIds.some((id) => !Object.hasOwn(question.optionExplanations, id))
  ) {
    throw new ContractValidationError(
      "Question: every option must have exactly one option explanation",
    );
  }
  if (
    question.type === "single_choice" &&
    question.correctOptionIds.length !== 1
  ) {
    throw new ContractValidationError(
      "Question: single_choice requires exactly one correct option",
    );
  }
  if (
    question.type === "multiple_select" &&
    question.correctOptionIds.length < 1
  ) {
    throw new ContractValidationError(
      "Question: multiple_select requires at least one correct option",
    );
  }
}

function assertSelectedKnowledgePointsGrounded(
  knowledgePoints: readonly KnowledgePointCandidate[],
  sourceReferences: readonly SourceReference[],
  fieldName: string,
): void {
  const availableReferences = referenceSet(sourceReferences);
  for (const knowledgePoint of knowledgePoints) {
    if (
      !knowledgePoint.sourceReferences.some((reference) =>
        availableReferences.has(referenceKey(reference)),
      )
    ) {
      throw new ContractValidationError(
        `${fieldName}: every selected KnowledgePoint needs at least one grounding SourceReference`,
      );
    }
  }
}

function decodeStructuredOutput(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    throw new ContractValidationError("Structured output is not valid JSON");
  }
}

function isNonEmpty(value: string): boolean {
  return value.trim().length > 0;
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      (url.protocol === "https:" || url.protocol === "http:") &&
      url.username.length === 0 &&
      url.password.length === 0
    );
  } catch {
    return false;
  }
}
