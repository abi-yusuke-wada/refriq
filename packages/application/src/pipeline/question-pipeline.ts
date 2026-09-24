import {
  EVALUATION_CRITERIA,
  PIPELINE_STAGES,
  type KnowledgeExtractionInput,
  type KnowledgePointCandidate,
  type GenerationMetadata,
  type PipelineArtifacts,
  type PipelineExecutionOptions,
  type PipelineStage,
  type PipelineStageRun,
  type QuestionCandidate,
  type QuestionContent,
  type QuestionPipelineInput,
  type QuestionPipelineRun,
  type QuestionRevisionCandidate,
  type ReviewEligibility,
  type StructuredOutputProvider,
  type StructuredOutputResponse,
} from "./contracts.js";
import {
  knowledgeExtractionOutputSchema,
  questionEvaluationOutputSchema,
  questionGenerationOutputSchema,
  questionPlanningOutputSchema,
} from "./schemas.js";
import {
  SourcePolicyGateError,
  selectGroundingSegments,
  validateKnowledgeExtractionInput,
  validateKnowledgeExtractionOutput,
  validatePipelineInput,
  validateQuestionEvaluationInput,
  validateQuestionEvaluationOutput,
  validateQuestionGenerationInput,
  validateQuestionGenerationOutput,
  validateQuestionPlanningInput,
  validateQuestionPlanningOutput,
} from "./validation.js";

const GENERATION_RULES = [
  "Create an original learning question from the provided grounding segments.",
  "Do not reproduce or closely paraphrase any real examination item or answer option.",
  "Do not add factual claims that are not supported by the provided grounding segments.",
  "Preserve the planned question type, learning objective, and source references.",
  "Provide an explanation for the answer and for every option.",
] as const;

type StageExecution<T> =
  | { readonly succeeded: true; readonly output: T }
  | { readonly succeeded: false; readonly failedStage: PipelineStage };

interface MutableRunState {
  stages: Record<PipelineStage, PipelineStageRun>;
  readonly stageRunHistory: PipelineStageRun[];
  artifacts: PipelineArtifacts;
  immutableInputFingerprint?: string;
}

type InputParser<TInput> = (value: unknown) => TInput;
type OutputParser<TInput, TOutput> = (value: unknown, input: TInput) => TOutput;

const outputSchemas = {
  KNOWLEDGE_EXTRACTION: knowledgeExtractionOutputSchema,
  QUESTION_PLANNING: questionPlanningOutputSchema,
  QUESTION_GENERATION: questionGenerationOutputSchema,
  QUESTION_EVALUATION: questionEvaluationOutputSchema,
} satisfies Record<PipelineStage, unknown>;

export async function runQuestionPipeline(
  input: unknown,
  provider: StructuredOutputProvider,
  options: PipelineExecutionOptions,
): Promise<QuestionPipelineRun> {
  const state = createRunState(options.pipelineRunId);
  let parsedInput: QuestionPipelineInput;
  try {
    parsedInput = validatePipelineInput(input);
  } catch (error) {
    recordInputFailure(options.pipelineRunId, PIPELINE_STAGES[0], state, error);
    return finishRun(options.pipelineRunId, state, PIPELINE_STAGES[0]);
  }
  state.immutableInputFingerprint =
    await fingerprintImmutablePipelineInput(parsedInput);

  return executeFromStage(
    parsedInput,
    provider,
    options.pipelineRunId,
    state,
    0,
  );
}

/**
 * Continue a failed run from its failed stage, reusing earlier validated
 * artifacts. A caller explicitly starts a new run for a new generation.
 */
export async function resumeQuestionPipeline(
  input: unknown,
  previousRun: QuestionPipelineRun,
  provider: StructuredOutputProvider,
): Promise<QuestionPipelineRun> {
  if (previousRun.status !== "FAILED" || !previousRun.failedStage) {
    throw new Error("Only a failed PipelineRun can be resumed");
  }

  const state: MutableRunState = {
    stages: { ...previousRun.stages },
    stageRunHistory: [...previousRun.stageRunHistory],
    artifacts: { ...previousRun.artifacts },
  };
  let parsedInput: QuestionPipelineInput;
  try {
    parsedInput = validatePipelineInput(input);
  } catch (error) {
    recordInputFailure(
      previousRun.pipelineRunId,
      previousRun.failedStage,
      state,
      error,
    );
    return finishRun(previousRun.pipelineRunId, state, previousRun.failedStage);
  }

  const firstReusedStageIndex = PIPELINE_STAGES.indexOf(
    previousRun.failedStage,
  );
  const reusesSuccessfulStage = PIPELINE_STAGES.slice(
    0,
    firstReusedStageIndex,
  ).some((stage) => previousRun.stages[stage].status === "SUCCEEDED");
  if (
    reusesSuccessfulStage &&
    previousRun.immutableInputFingerprint === undefined
  ) {
    throw new PipelineResumeInputMismatchError(
      "This PipelineRun has no immutable input identity; start a new PipelineRun",
    );
  }

  const resumedInputFingerprint =
    await fingerprintImmutablePipelineInput(parsedInput);
  if (
    previousRun.immutableInputFingerprint !== undefined &&
    previousRun.immutableInputFingerprint !== resumedInputFingerprint
  ) {
    throw new PipelineResumeInputMismatchError(
      "Immutable Pipeline inputs changed; start a new PipelineRun",
    );
  }
  state.immutableInputFingerprint = resumedInputFingerprint;

  return executeFromStage(
    parsedInput,
    provider,
    previousRun.pipelineRunId,
    state,
    PIPELINE_STAGES.indexOf(previousRun.failedStage),
  );
}

export class PipelineResumeInputMismatchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PipelineResumeInputMismatchError";
  }
}

async function executeFromStage(
  pipelineInput: QuestionPipelineInput,
  provider: StructuredOutputProvider,
  pipelineRunId: string,
  state: MutableRunState,
  startAt: number,
): Promise<QuestionPipelineRun> {
  if (startAt <= 0) {
    const extractionInput: KnowledgeExtractionInput = {
      certification: pipelineInput.certification,
      examTopics: pipelineInput.examTopics,
      sourceRevisionId: pipelineInput.sourceRevision.snapshot.sourceRevisionId,
      groundingSegments: pipelineInput.groundingSegments,
    };
    const extraction = await executeStage(
      "KNOWLEDGE_EXTRACTION",
      () => extractionInput,
      validateKnowledgeExtractionInput,
      (output, input) => validateKnowledgeExtractionOutput(output, input),
      provider,
      pipelineRunId,
      state,
    );
    if (!extraction.succeeded) {
      return finishRun(pipelineRunId, state, extraction.failedStage);
    }

    state.artifacts = {
      ...state.artifacts,
      knowledgePoints: extraction.output.knowledgePoints.map(
        (knowledgePoint, index): KnowledgePointCandidate => ({
          ...knowledgePoint,
          candidateId: `${pipelineRunId}:knowledge:${index + 1}`,
        }),
      ),
    };
  }

  if (startAt <= 1) {
    const planning = await executeStage(
      "QUESTION_PLANNING",
      () => ({
        certification: pipelineInput.certification,
        examTopics: pipelineInput.examTopics,
        knowledgePoints: requireArtifact(
          state.artifacts.knowledgePoints,
          "KnowledgeExtractionOutput",
        ),
      }),
      validateQuestionPlanningInput,
      (output, input) => validateQuestionPlanningOutput(output, input),
      provider,
      pipelineRunId,
      state,
    );
    if (!planning.succeeded) {
      return finishRun(pipelineRunId, state, planning.failedStage);
    }
    state.artifacts = {
      ...state.artifacts,
      questionIntent: planning.output.questionIntent,
    };
  }

  if (startAt <= 2) {
    const generationAttempt = state.stages.QUESTION_GENERATION.attempt + 1;
    const generation = await executeStage(
      "QUESTION_GENERATION",
      () => {
        const questionIntent = requireArtifact(
          state.artifacts.questionIntent,
          "QuestionPlanningOutput",
        );
        const knowledgePoints = resolveIntentKnowledgePoints(
          questionIntent,
          requireArtifact(
            state.artifacts.knowledgePoints,
            "KnowledgeExtractionOutput",
          ),
        );
        const examTopics = resolveKnowledgePointTopics(
          knowledgePoints,
          pipelineInput.examTopics,
        );
        return {
          certification: pipelineInput.certification,
          examTopics,
          knowledgePoints,
          questionIntent,
          groundingSegments: selectGroundingSegments(
            questionIntent.sourceReferences,
            pipelineInput.groundingSegments,
          ),
          rules: GENERATION_RULES,
        };
      },
      validateQuestionGenerationInput,
      (output, input) => validateQuestionGenerationOutput(output, input),
      provider,
      pipelineRunId,
      state,
    );
    if (!generation.succeeded) {
      return finishRun(pipelineRunId, state, generation.failedStage);
    }

    const questionIntent = requireArtifact(
      state.artifacts.questionIntent,
      "QuestionPlanningOutput",
    );
    const question: QuestionCandidate = {
      ...generation.output.question,
      candidateId: `${pipelineRunId}:question:${generationAttempt}`,
      knowledgePointCandidateIds: questionIntent.knowledgePointCandidateIds,
    };
    state.artifacts = { ...state.artifacts, question };
  }

  if (startAt <= 3) {
    const evaluation = await executeStage(
      "QUESTION_EVALUATION",
      () => {
        const questionIntent = requireArtifact(
          state.artifacts.questionIntent,
          "QuestionPlanningOutput",
        );
        const knowledgePoints = resolveIntentKnowledgePoints(
          questionIntent,
          requireArtifact(
            state.artifacts.knowledgePoints,
            "KnowledgeExtractionOutput",
          ),
        );
        const examTopics = resolveKnowledgePointTopics(
          knowledgePoints,
          pipelineInput.examTopics,
        );
        const question = requireArtifact(
          state.artifacts.question,
          "QuestionCandidate",
        );
        return {
          certification: pipelineInput.certification,
          examTopics,
          knowledgePoints,
          questionIntent,
          question: asQuestionContent(question),
          groundingSegments: selectGroundingSegments(
            questionIntent.sourceReferences,
            pipelineInput.groundingSegments,
          ),
          criteria: EVALUATION_CRITERIA,
        };
      },
      validateQuestionEvaluationInput,
      (output, input) => validateQuestionEvaluationOutput(output, input),
      provider,
      pipelineRunId,
      state,
    );
    if (!evaluation.succeeded) {
      return finishRun(pipelineRunId, state, evaluation.failedStage);
    }

    const questionIntent = requireArtifact(
      state.artifacts.questionIntent,
      "QuestionPlanningOutput",
    );
    const knowledgePoints = resolveIntentKnowledgePoints(
      questionIntent,
      requireArtifact(
        state.artifacts.knowledgePoints,
        "KnowledgeExtractionOutput",
      ),
    );
    const question = requireArtifact(
      state.artifacts.question,
      "QuestionCandidate",
    );
    const candidate = buildQuestionRevisionCandidate(
      pipelineInput,
      pipelineRunId,
      knowledgePoints,
      questionIntent,
      question,
      selectGroundingSegments(
        questionIntent.sourceReferences,
        pipelineInput.groundingSegments,
      ),
      evaluation.output,
      state.stageRunHistory,
    );
    state.artifacts = {
      ...state.artifacts,
      evaluation: evaluation.output,
      questionRevisionCandidate: candidate,
    };
  }

  return finishRun(pipelineRunId, state);
}

async function executeStage<TInput, TOutput>(
  stage: PipelineStage,
  inputFactory: () => unknown,
  parseInput: InputParser<TInput>,
  parseOutput: OutputParser<TInput, TOutput>,
  provider: StructuredOutputProvider,
  pipelineRunId: string,
  state: MutableRunState,
): Promise<StageExecution<TOutput>> {
  const attempt = state.stages[stage].attempt + 1;
  const startedAt = new Date().toISOString();
  const running: PipelineStageRun = {
    pipelineRunId,
    stage,
    attempt,
    status: "RUNNING",
    startedAt,
  };
  state.stages[stage] = running;
  state.stageRunHistory.push(running);

  let input: TInput;
  try {
    input = parseInput(inputFactory());
  } catch (error) {
    recordStageFailure(
      pipelineRunId,
      stage,
      attempt,
      startedAt,
      state,
      failureCode(error) === "SOURCE_POLICY_BLOCKED"
        ? "SOURCE_POLICY_BLOCKED"
        : "INPUT_VALIDATION_FAILED",
      errorMessage(error),
      false,
    );
    return { succeeded: false, failedStage: stage };
  }

  let providerResponse: StructuredOutputResponse;
  try {
    const response: unknown = await provider.generateStructuredOutput({
      stage,
      input: input as never,
      responseSchema: outputSchemas[stage],
    });
    providerResponse = validateProviderResponse(response);
  } catch {
    recordStageFailure(
      pipelineRunId,
      stage,
      attempt,
      startedAt,
      state,
      "PROVIDER_FAILED",
      "Structured output provider request failed; provider error details were not retained.",
      true,
    );
    return { succeeded: false, failedStage: stage };
  }

  let output: TOutput;
  try {
    output = parseOutput(providerResponse.output, input);
  } catch (error) {
    recordStageFailure(
      pipelineRunId,
      stage,
      attempt,
      startedAt,
      state,
      "OUTPUT_VALIDATION_FAILED",
      errorMessage(error),
      false,
      providerResponse.generationMetadata,
    );
    return { succeeded: false, failedStage: stage };
  }

  const succeeded: PipelineStageRun = {
    pipelineRunId,
    stage,
    attempt,
    status: "SUCCEEDED",
    startedAt,
    completedAt: new Date().toISOString(),
    generationMetadata: providerResponse.generationMetadata,
  };
  state.stages[stage] = succeeded;
  state.stageRunHistory.push(succeeded);
  return { succeeded: true, output };
}

function recordInputFailure(
  pipelineRunId: string,
  stage: PipelineStage,
  state: MutableRunState,
  error: unknown,
): void {
  const attempt = state.stages[stage].attempt + 1;
  const startedAt = new Date().toISOString();
  const running: PipelineStageRun = {
    pipelineRunId,
    stage,
    attempt,
    status: "RUNNING",
    startedAt,
  };
  state.stages[stage] = running;
  state.stageRunHistory.push(running);
  recordStageFailure(
    pipelineRunId,
    stage,
    attempt,
    startedAt,
    state,
    failureCode(error) === "SOURCE_POLICY_BLOCKED"
      ? "SOURCE_POLICY_BLOCKED"
      : "INPUT_VALIDATION_FAILED",
    errorMessage(error),
    false,
  );
}

function recordStageFailure(
  pipelineRunId: string,
  stage: PipelineStage,
  attempt: number,
  startedAt: string,
  state: MutableRunState,
  code: NonNullable<PipelineStageRun["failure"]>["code"],
  message: string,
  retryable: boolean,
  generationMetadata?: GenerationMetadata,
): void {
  const failed: PipelineStageRun = {
    pipelineRunId,
    stage,
    attempt,
    status: "FAILED",
    startedAt,
    completedAt: new Date().toISOString(),
    ...(generationMetadata ? { generationMetadata } : {}),
    failure: { code, retryable, message },
  };
  state.stages[stage] = failed;
  state.stageRunHistory.push(failed);
}

function createRunState(pipelineRunId: string): MutableRunState {
  const stages = {} as Record<PipelineStage, PipelineStageRun>;
  for (const stage of PIPELINE_STAGES) {
    stages[stage] = {
      pipelineRunId,
      stage,
      attempt: 0,
      status: "PENDING",
    };
  }
  return { stages, stageRunHistory: [], artifacts: {} };
}

function finishRun(
  pipelineRunId: string,
  state: MutableRunState,
  failedStage?: PipelineStage,
): QuestionPipelineRun {
  return {
    pipelineRunId,
    status: failedStage ? "FAILED" : "SUCCEEDED",
    ...(state.immutableInputFingerprint !== undefined
      ? { immutableInputFingerprint: state.immutableInputFingerprint }
      : {}),
    stages: state.stages,
    stageRunHistory: state.stageRunHistory,
    artifacts: state.artifacts,
    ...(failedStage ? { failedStage } : {}),
  };
}

async function fingerprintImmutablePipelineInput(
  input: QuestionPipelineInput,
): Promise<string> {
  const serialized = stableJson({
    certification: input.certification,
    examTopics: input.examTopics,
    sourceRevisionSnapshot: input.sourceRevision.snapshot,
    groundingSegments: input.groundingSegments,
  });
  const digest = await globalThis.crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(serialized),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableJson(item)).join(",")}]`;
  }
  if (isRecord(value)) {
    const entries = Object.entries(value)
      .filter(([, item]) => item !== undefined)
      .sort(([left], [right]) => left.localeCompare(right));
    return `{${entries
      .map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`)
      .join(",")}}`;
  }
  const serialized = JSON.stringify(value);
  if (serialized === undefined) {
    throw new Error("Pipeline input contains a non-JSON value");
  }
  return serialized;
}

function buildQuestionRevisionCandidate(
  input: QuestionPipelineInput,
  pipelineRunId: string,
  knowledgePoints: readonly KnowledgePointCandidate[],
  questionIntent: NonNullable<PipelineArtifacts["questionIntent"]>,
  question: QuestionCandidate,
  groundingSegments: QuestionRevisionCandidate["groundingSegments"],
  evaluation: NonNullable<PipelineArtifacts["evaluation"]>,
  stageRuns: readonly PipelineStageRun[],
): QuestionRevisionCandidate {
  const generationAttempt = question.candidateId.split(":").at(-1) ?? "1";
  const reviewEligibility: ReviewEligibility =
    evaluation.decision === "PASS"
      ? "ELIGIBLE_FOR_HUMAN_REVIEW"
      : evaluation.decision === "REVISE"
        ? "REVISION_REQUIRED"
        : "REJECTED_BY_EVALUATION";

  return {
    candidateId: `${pipelineRunId}:revision-candidate:${generationAttempt}`,
    certification: input.certification,
    examTopics: resolveKnowledgePointTopics(knowledgePoints, input.examTopics),
    knowledgePoints,
    questionIntent,
    question,
    sourceRevision: input.sourceRevision.snapshot,
    groundingSegments,
    evaluation,
    reviewEligibility,
    pipelineRunId,
    stageRuns,
  };
}

function resolveIntentKnowledgePoints(
  questionIntent: NonNullable<PipelineArtifacts["questionIntent"]>,
  knowledgePoints: readonly KnowledgePointCandidate[],
): readonly KnowledgePointCandidate[] {
  return questionIntent.knowledgePointCandidateIds.map((candidateId) =>
    requireArtifact(
      knowledgePoints.find((point) => point.candidateId === candidateId),
      `KnowledgePoint ${candidateId}`,
    ),
  );
}

function resolveKnowledgePointTopics(
  knowledgePoints: readonly KnowledgePointCandidate[],
  examTopics: QuestionPipelineInput["examTopics"],
): QuestionPipelineInput["examTopics"] {
  const topicIds = [
    ...new Set(knowledgePoints.map((point) => point.examTopicId)),
  ];
  return topicIds.map((examTopicId) =>
    requireArtifact(
      examTopics.find((topic) => topic.examTopicId === examTopicId),
      `ExamTopic ${examTopicId}`,
    ),
  );
}

function requireArtifact<T>(value: T | undefined, name: string): T {
  if (value === undefined) {
    throw new Error(`Missing validated Pipeline artifact: ${name}`);
  }
  return value;
}

function asQuestionContent(question: QuestionCandidate): QuestionContent {
  return {
    type: question.type,
    stem: question.stem,
    options: question.options,
    correctOptionIds: question.correctOptionIds,
    explanation: question.explanation,
    optionExplanations: question.optionExplanations,
    sourceReferences: question.sourceReferences,
  };
}

function failureCode(
  error: unknown,
): NonNullable<PipelineStageRun["failure"]>["code"] | undefined {
  return error instanceof SourcePolicyGateError
    ? "SOURCE_POLICY_BLOCKED"
    : undefined;
}

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Pipeline stage input or output validation failed.";
}

function validateProviderResponse(value: unknown): StructuredOutputResponse {
  if (!isRecord(value) || !isRecord(value.generationMetadata)) {
    throw new Error("Structured output provider response is malformed");
  }

  const metadata = value.generationMetadata;
  if (
    typeof metadata.providerId !== "string" ||
    metadata.providerId.trim().length === 0 ||
    !isOptionalNonEmptyString(metadata.modelId) ||
    !isOptionalNonEmptyString(metadata.promptVersion) ||
    !isOptionalNonEmptyString(metadata.requestId) ||
    !Object.hasOwn(value, "output")
  ) {
    throw new Error("Structured output provider metadata is malformed");
  }

  return {
    output: value.output,
    generationMetadata: {
      providerId: metadata.providerId,
      ...(typeof metadata.modelId === "string"
        ? { modelId: metadata.modelId }
        : {}),
      ...(typeof metadata.promptVersion === "string"
        ? { promptVersion: metadata.promptVersion }
        : {}),
      ...(typeof metadata.requestId === "string"
        ? { requestId: metadata.requestId }
        : {}),
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isOptionalNonEmptyString(value: unknown): boolean {
  return (
    value === undefined ||
    (typeof value === "string" && value.trim().length > 0)
  );
}
