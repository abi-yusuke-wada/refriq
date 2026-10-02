import { describe, expect, it } from "vitest";
import {
  EVALUATION_CRITERIA,
  PipelineResumeInputMismatchError,
  PIPELINE_STAGES,
  resumeQuestionPipeline,
  runQuestionPipeline,
  validateQuestionEvaluationInput,
  type PipelineStage,
  type QuestionEvaluationInput,
  type QuestionPipelineInput,
} from "@refriq/application";
import {
  canPublishQuestionRevision,
  createSourceRevisionPolicySnapshot,
  evaluateSourcePolicy,
  type AllowedSource,
  type SourcePolicyCandidate,
  type SourcePolicyDecision,
} from "@refriq/domain";
import { FixtureFakeLlmProvider } from "./fake-llm-provider.js";
import knowledgeExtractionValid from "../../../fixtures/pipeline/knowledge-extraction/valid.json" with {
  type: "json",
};
import knowledgeExtractionInvalid from "../../../fixtures/pipeline/knowledge-extraction/invalid-missing-source.json" with {
  type: "json",
};
import questionPlanningValid from "../../../fixtures/pipeline/question-planning/valid.json" with {
  type: "json",
};
import questionGenerationValid from "../../../fixtures/pipeline/question-generation/valid-single-choice.json" with {
  type: "json",
};
import questionGenerationInvalid from "../../../fixtures/pipeline/question-generation/invalid-multiple-correct.json" with {
  type: "json",
};
import questionGenerationEmptyMultipleSelect from "../../../fixtures/pipeline/question-generation/invalid-empty-correct-multiple-select.json" with {
  type: "json",
};
import questionGenerationMissingSource from "../../../fixtures/pipeline/question-generation/invalid-missing-source.json" with {
  type: "json",
};
import questionEvaluationPass from "../../../fixtures/pipeline/question-evaluation/pass.json" with {
  type: "json",
};
import questionEvaluationRevise from "../../../fixtures/pipeline/question-evaluation/revise.json" with {
  type: "json",
};
import questionEvaluationReject from "../../../fixtures/pipeline/question-evaluation/reject.json" with {
  type: "json",
};

const pipelineRunId = "synthetic-pipeline-run";
const sourceReference = {
  sourceRevisionId: "source-revision-routing-01",
  locator: "section:route-service-link",
};
const allowedSource: AllowedSource = {
  id: "synthetic-example-gateway-docs",
  owner: "Example Systems",
  hostname: "docs.example.test",
  pathPrefix: "/gateway",
  allowedKinds: ["OFFICIAL_DOCUMENTATION"],
  allowedPurposes: ["NORMATIVE_TECHNICAL"],
  notes: "Synthetic policy rule for pipeline contract tests.",
};
const sourceCandidate: SourcePolicyCandidate = {
  sourceDocumentId: "source-document-routing-01",
  sourceUrl: "https://docs.example.test/gateway/routes",
  sourceOwner: "Example Systems",
  sourceKind: "OFFICIAL_DOCUMENTATION",
  usagePurpose: "NORMATIVE_TECHNICAL",
  originStatus: "VERIFIED",
  accessClassification: "PUBLIC",
  automatedAccess: "ALLOWED",
  purposeAlignment: "ALIGNED",
  terms: {
    reviewStatus: "CLEARED_FOR_PRODUCT_USE",
    termsUrl: "https://docs.example.test/terms",
    checkedAt: "2026-09-24T00:00:00.000Z",
    checkedBy: "synthetic-reviewer",
  },
};

function makePipelineInput(
  policyDecision?: SourcePolicyDecision,
): QuestionPipelineInput {
  const originalDecision = evaluateSourcePolicy(
    sourceCandidate,
    [allowedSource],
    {
      sourcePolicyDecisionId: "synthetic-policy-decision-01",
      evaluatedAt: "2026-09-24T00:01:00.000Z",
    },
  );
  const snapshotResult = createSourceRevisionPolicySnapshot(originalDecision, {
    sourceRevisionId: sourceReference.sourceRevisionId,
    sourceUrlAtRetrieval: sourceCandidate.sourceUrl ?? "",
    retrievedAt: "2026-09-24T00:02:00.000Z",
    contentFingerprint: "sha256:synthetic-route-source-fingerprint",
  });
  if (!snapshotResult.allowed)
    throw new Error("Synthetic Source should be trusted");

  return {
    certification: {
      certificationId: "synthetic-cloud-associate",
      name: "Synthetic Cloud Associate",
    },
    examTopics: [
      {
        examTopicId: "topic-routing",
        certificationId: "synthetic-cloud-associate",
        name: "Request Routing",
      },
    ],
    sourceRevision: {
      policyDecision: policyDecision ?? originalDecision,
      snapshot: snapshotResult.snapshot,
    },
    groundingSegments: [
      {
        ...sourceReference,
        text: "In Example Gateway, a Route matches an incoming request and directs a matching request to its associated Service.",
      },
    ],
  };
}

function fixture(path: string): unknown {
  const fixtures: Readonly<Record<string, unknown>> = {
    "knowledge-extraction/valid.json": knowledgeExtractionValid,
    "knowledge-extraction/invalid-missing-source.json":
      knowledgeExtractionInvalid,
    "question-planning/valid.json": questionPlanningValid,
    "question-generation/valid-single-choice.json": questionGenerationValid,
    "question-generation/invalid-multiple-correct.json":
      questionGenerationInvalid,
    "question-generation/invalid-empty-correct-multiple-select.json":
      questionGenerationEmptyMultipleSelect,
    "question-generation/invalid-missing-source.json":
      questionGenerationMissingSource,
    "question-evaluation/pass.json": questionEvaluationPass,
    "question-evaluation/revise.json": questionEvaluationRevise,
    "question-evaluation/reject.json": questionEvaluationReject,
  };
  const value = fixtures[path];
  if (!value) throw new Error(`Unknown pipeline fixture: ${path}`);
  return structuredClone(value);
}

function providerWith(
  evaluation = fixture("question-evaluation/pass.json"),
  generation = fixture("question-generation/valid-single-choice.json"),
  extraction = fixture("knowledge-extraction/valid.json"),
): FixtureFakeLlmProvider {
  return new FixtureFakeLlmProvider({
    KNOWLEDGE_EXTRACTION: [extraction],
    QUESTION_PLANNING: [fixture("question-planning/valid.json")],
    QUESTION_GENERATION: [generation],
    QUESTION_EVALUATION: [evaluation],
  });
}

function readEvaluationFixture(decision: "revise" | "reject"): unknown {
  return fixture(`question-evaluation/${decision}.json`);
}

function stage(provider: FixtureFakeLlmProvider, name: PipelineStage) {
  return provider.requests.find((request) => request.stage === name);
}

describe("Question Pipeline Stage contracts", () => {
  it("Fake Provider runs one SourceRevision through the four independent stages", async () => {
    const input = makePipelineInput();
    const fakeProvider = providerWith();
    const run = await runQuestionPipeline(input, fakeProvider, {
      pipelineRunId,
    });

    expect(run.status).toBe("SUCCEEDED");
    expect(PIPELINE_STAGES.map((name) => run.stages[name].status)).toEqual([
      "SUCCEEDED",
      "SUCCEEDED",
      "SUCCEEDED",
      "SUCCEEDED",
    ]);
    expect(fakeProvider.requests.map((request) => request.stage)).toEqual(
      PIPELINE_STAGES,
    );
    expect(run.artifacts.questionRevisionCandidate).toMatchObject({
      reviewEligibility: "ELIGIBLE_FOR_HUMAN_REVIEW",
      sourceRevision: {
        sourceRevisionId: sourceReference.sourceRevisionId,
        sourceUrlAtRetrieval: sourceCandidate.sourceUrl,
      },
      evaluation: { decision: "PASS" },
    });

    const candidate = run.artifacts.questionRevisionCandidate;
    const knowledgePoint = run.artifacts.knowledgePoints?.[0];
    const questionIntent = run.artifacts.questionIntent;
    const question = run.artifacts.question;
    expect(knowledgePoint?.sourceReferences).toEqual([sourceReference]);
    expect(questionIntent?.knowledgePointCandidateIds).toEqual([
      knowledgePoint?.candidateId,
    ]);
    expect(questionIntent?.sourceReferences).toEqual([sourceReference]);
    expect(question?.knowledgePointCandidateIds).toEqual([
      knowledgePoint?.candidateId,
    ]);
    expect(question?.sourceReferences).toEqual([sourceReference]);
    expect(candidate?.question.sourceReferences).toEqual([sourceReference]);
    expect(candidate?.groundingSegments).toEqual([
      expect.objectContaining({
        ...sourceReference,
        text: expect.any(String),
      }),
    ]);
    expect(candidate?.stageRuns.map((run) => run.stage)).toContain(
      "QUESTION_EVALUATION",
    );
    expect(
      candidate?.stageRuns
        .filter((run) => run.stage === "QUESTION_GENERATION")
        .at(-1),
    ).toMatchObject({
      status: "SUCCEEDED",
      generationMetadata: {
        providerId: "fixture-fake",
        promptVersion: "pipeline-fixtures-v1",
      },
    });

    // PASS allows Human Review to inspect the candidate. It creates no Human
    // QuestionReview and contains no automatic publish decision.
    expect(candidate).not.toHaveProperty("questionReview");
    expect(candidate).not.toHaveProperty("publishable");
    expect(candidate).not.toHaveProperty("published");

    const extractionRequest = stage(fakeProvider, "KNOWLEDGE_EXTRACTION");
    const planningRequest = stage(fakeProvider, "QUESTION_PLANNING");
    const generationRequest = stage(fakeProvider, "QUESTION_GENERATION");
    const evaluationRequest = stage(fakeProvider, "QUESTION_EVALUATION");
    expect(extractionRequest?.input).toMatchObject({
      sourceRevisionId: sourceReference.sourceRevisionId,
      groundingSegments: [{ locator: sourceReference.locator }],
    });
    expect(extractionRequest?.input).not.toHaveProperty(
      "sourceRevision.snapshot",
    );
    expect(planningRequest?.input).not.toHaveProperty("groundingSegments");
    expect(generationRequest?.input).toMatchObject({
      groundingSegments: [{ locator: sourceReference.locator }],
    });
    expect(evaluationRequest?.input).toMatchObject({
      groundingSegments: [{ locator: sourceReference.locator }],
      criteria: EVALUATION_CRITERIA,
    });
  });

  it.each([
    ["SourceRevision fingerprint", "snapshot"],
    ["grounding context", "grounding"],
    ["Certification", "certification"],
  ] as const)(
    "requires a new PipelineRun when resuming with changed %s",
    async (_label, changedPart) => {
      const input = makePipelineInput();
      const fakeProvider = new FixtureFakeLlmProvider({
        KNOWLEDGE_EXTRACTION: [fixture("knowledge-extraction/valid.json")],
        QUESTION_PLANNING: [fixture("question-planning/valid.json")],
        QUESTION_GENERATION: [
          fixture("question-generation/valid-single-choice.json"),
        ],
        QUESTION_EVALUATION: [
          new Error("synthetic transient provider failure"),
          fixture("question-evaluation/pass.json"),
        ],
      });
      const failedRun = await runQuestionPipeline(input, fakeProvider, {
        pipelineRunId,
      });
      expect(failedRun.failedStage).toBe("QUESTION_EVALUATION");
      expect(failedRun.stages.QUESTION_GENERATION.status).toBe("SUCCEEDED");

      const changedInput = structuredClone(input);
      if (changedPart === "snapshot") {
        Object.assign(changedInput.sourceRevision.snapshot, {
          contentFingerprint: "sha256:changed-synthetic-fingerprint",
        });
      } else if (changedPart === "grounding") {
        const segment = changedInput.groundingSegments[0];
        if (!segment)
          throw new Error("Synthetic grounding segment is required");
        Object.assign(segment, {
          text: "Changed synthetic grounding with a different meaning.",
        });
      } else {
        const certificationId = "synthetic-different-certification";
        Object.assign(changedInput.certification, {
          certificationId,
          name: "Synthetic Different Certification",
        });
        for (const topic of changedInput.examTopics) {
          Object.assign(topic, { certificationId });
        }
      }

      const requestCountBeforeResume = fakeProvider.requests.length;
      await expect(
        resumeQuestionPipeline(changedInput, failedRun, fakeProvider),
      ).rejects.toThrow(PipelineResumeInputMismatchError);
      expect(fakeProvider.requests).toHaveLength(requestCountBeforeResume);
      expect(
        fakeProvider.requests.filter(
          (request) => request.stage === "QUESTION_GENERATION",
        ),
      ).toHaveLength(1);
    },
  );

  it("an extraction output without SourceReference fails and prevents later Stages", async () => {
    const fakeProvider = providerWith(
      fixture("question-evaluation/pass.json"),
      fixture("question-generation/valid-single-choice.json"),
      fixture("knowledge-extraction/invalid-missing-source.json"),
    );
    const run = await runQuestionPipeline(makePipelineInput(), fakeProvider, {
      pipelineRunId,
    });

    expect(run.status).toBe("FAILED");
    expect(run.failedStage).toBe("KNOWLEDGE_EXTRACTION");
    expect(run.stages.KNOWLEDGE_EXTRACTION.failure?.code).toBe(
      "OUTPUT_VALIDATION_FAILED",
    );
    expect(run.stages.QUESTION_PLANNING.status).toBe("PENDING");
    expect(fakeProvider.requests).toHaveLength(1);
  });

  it("unknown SourceReference in generated KnowledgePoint is rejected", async () => {
    const extraction = fixture("knowledge-extraction/valid.json") as {
      knowledgePoints: Array<{
        sourceReferences: Array<{ sourceRevisionId: string; locator: string }>;
      }>;
    };
    const firstReference = extraction.knowledgePoints
      .at(0)
      ?.sourceReferences.at(0);
    if (!firstReference) throw new Error("Fixture SourceReference is required");
    firstReference.sourceRevisionId = "unprovided-source-revision";
    const fakeProvider = providerWith(undefined, undefined, extraction);
    const run = await runQuestionPipeline(makePipelineInput(), fakeProvider, {
      pipelineRunId,
    });

    expect(run.failedStage).toBe("KNOWLEDGE_EXTRACTION");
    expect(run.stages.KNOWLEDGE_EXTRACTION.failure?.code).toBe(
      "OUTPUT_VALIDATION_FAILED",
    );
    expect(fakeProvider.requests).toHaveLength(1);
  });

  it("QuestionIntent can select multiple KnowledgePoints and retains each link", async () => {
    const extraction = fixture("knowledge-extraction/valid.json") as {
      knowledgePoints: Array<{
        title: string;
        summary: string;
        examTopicId: string;
        sourceReferences: (typeof sourceReference)[];
      }>;
    };
    const firstKnowledgePoint = extraction.knowledgePoints.at(0);
    if (!firstKnowledgePoint)
      throw new Error("Fixture KnowledgePoint is required");
    extraction.knowledgePoints.push({
      ...firstKnowledgePoint,
      title: "Synthetic request matching behavior",
      summary: "A Route matches an incoming request before forwarding it.",
    });
    const planning = fixture("question-planning/valid.json") as {
      questionIntent: { knowledgePointCandidateIds: string[] };
    };
    planning.questionIntent.knowledgePointCandidateIds.push(
      `${pipelineRunId}:knowledge:2`,
    );
    const provider = new FixtureFakeLlmProvider({
      KNOWLEDGE_EXTRACTION: [extraction],
      QUESTION_PLANNING: [planning],
      QUESTION_GENERATION: [
        fixture("question-generation/valid-single-choice.json"),
      ],
      QUESTION_EVALUATION: [fixture("question-evaluation/pass.json")],
    });

    const run = await runQuestionPipeline(makePipelineInput(), provider, {
      pipelineRunId,
    });

    expect(run.status).toBe("SUCCEEDED");
    expect(run.artifacts.questionIntent?.knowledgePointCandidateIds).toEqual([
      `${pipelineRunId}:knowledge:1`,
      `${pipelineRunId}:knowledge:2`,
    ]);
    expect(run.artifacts.question?.knowledgePointCandidateIds).toEqual(
      run.artifacts.questionIntent?.knowledgePointCandidateIds,
    );
    expect(
      run.artifacts.questionRevisionCandidate?.knowledgePoints,
    ).toHaveLength(2);
    expect(stage(provider, "QUESTION_GENERATION")?.input).toMatchObject({
      knowledgePoints: [
        { candidateId: `${pipelineRunId}:knowledge:1` },
        { candidateId: `${pipelineRunId}:knowledge:2` },
      ],
    });
    expect(run.artifacts.questionIntent?.sourceReferences).toEqual([
      sourceReference,
    ]);
  });

  it("rejects a QuestionIntent that leaves a selected KnowledgePoint ungrounded", async () => {
    const baseInput = makePipelineInput();
    const secondReference = {
      sourceRevisionId: sourceReference.sourceRevisionId,
      locator: "section:second-synthetic-concept",
    };
    const input: QuestionPipelineInput = {
      ...baseInput,
      groundingSegments: [
        ...baseInput.groundingSegments,
        {
          ...secondReference,
          text: "A separate fictional statement supports the second concept.",
        },
      ],
    };

    const extraction = fixture("knowledge-extraction/valid.json") as {
      knowledgePoints: Array<{
        title: string;
        summary: string;
        examTopicId: string;
        sourceReferences: (typeof sourceReference)[];
      }>;
    };
    const firstPoint = extraction.knowledgePoints[0];
    if (!firstPoint) throw new Error("Synthetic KnowledgePoint is required");
    extraction.knowledgePoints.push({
      title: "A second fictional concept",
      summary: "A second concept supported by separate grounding.",
      examTopicId: firstPoint.examTopicId,
      sourceReferences: [secondReference],
    });

    const planning = fixture("question-planning/valid.json") as {
      questionIntent: { knowledgePointCandidateIds: string[] };
    };
    planning.questionIntent.knowledgePointCandidateIds.push(
      `${pipelineRunId}:knowledge:2`,
    );
    const fakeProvider = new FixtureFakeLlmProvider({
      KNOWLEDGE_EXTRACTION: [extraction],
      QUESTION_PLANNING: [planning],
      QUESTION_GENERATION: [
        fixture("question-generation/valid-single-choice.json"),
      ],
      QUESTION_EVALUATION: [fixture("question-evaluation/pass.json")],
    });

    const run = await runQuestionPipeline(input, fakeProvider, {
      pipelineRunId,
    });

    expect(run.failedStage).toBe("QUESTION_PLANNING");
    expect(run.stages.QUESTION_PLANNING.failure?.code).toBe(
      "OUTPUT_VALIDATION_FAILED",
    );
    expect(run.stages.QUESTION_GENERATION.status).toBe("PENDING");
  });

  it.each([false, true])(
    "Question Generation requires grounding for every selected KnowledgePoint (complete: %s)",
    async (complete) => {
      const baseInput = makePipelineInput();
      const secondReference = {
        ...sourceReference,
        locator: "section:second-synthetic-concept",
      };
      const input: QuestionPipelineInput = {
        ...baseInput,
        groundingSegments: [
          ...baseInput.groundingSegments,
          {
            ...secondReference,
            text: "A separate fictional statement supports the second concept.",
          },
        ],
      };
      const extraction = structuredClone(knowledgeExtractionValid);
      const firstPoint = extraction.knowledgePoints[0];
      if (!firstPoint) throw new Error("Synthetic KnowledgePoint is required");
      extraction.knowledgePoints.push({
        ...firstPoint,
        title: "A second fictional concept",
        sourceReferences: [secondReference],
      });
      const planning = structuredClone(questionPlanningValid);
      planning.questionIntent.knowledgePointCandidateIds.push(
        `${pipelineRunId}:knowledge:2`,
      );
      planning.questionIntent.sourceReferences.push(secondReference);
      const generation = structuredClone(questionGenerationValid);
      if (complete) generation.question.sourceReferences.push(secondReference);
      const provider = new FixtureFakeLlmProvider({
        KNOWLEDGE_EXTRACTION: [extraction],
        QUESTION_PLANNING: [planning],
        QUESTION_GENERATION: [generation],
        QUESTION_EVALUATION: [fixture("question-evaluation/pass.json")],
      });

      const run = await runQuestionPipeline(input, provider, { pipelineRunId });

      if (!complete) {
        expect(run.failedStage).toBe("QUESTION_GENERATION");
        expect(run.stages.QUESTION_GENERATION.failure?.code).toBe(
          "OUTPUT_VALIDATION_FAILED",
        );
        expect(run.stages.QUESTION_EVALUATION.status).toBe("PENDING");
        expect(run.artifacts.questionRevisionCandidate).toBeUndefined();
        return;
      }

      expect(run.status).toBe("SUCCEEDED");
      expect(run.artifacts.question?.sourceReferences).toEqual([
        sourceReference,
        secondReference,
      ]);
      const evaluationRequest = stage(provider, "QUESTION_EVALUATION");
      if (!evaluationRequest) throw new Error("Evaluation request is required");
      const evaluationInput =
        evaluationRequest.input as QuestionEvaluationInput;
      expect(() =>
        validateQuestionEvaluationInput({
          ...evaluationInput,
          question: {
            ...evaluationInput.question,
            sourceReferences: [sourceReference],
          },
        }),
      ).toThrow("every selected KnowledgePoint");
    },
  );

  it.each([
    ["snapshot", "sourceKindAtUse"],
    ["snapshot", "sourceMetadataSnapshot"],
    ["snapshot", "termsMetadataSnapshot"],
    ["policyDecision", "evaluatedAt"],
    ["policyDecision", "sourceMetadataSnapshot"],
    ["policyDecision", "termsMetadataSnapshot"],
  ] as const)(
    "rejects missing Domain Source Governance field %s.%s",
    async (container, field) => {
      const input = structuredClone(makePipelineInput());
      const sourceRevision = input.sourceRevision as unknown as Record<
        "snapshot" | "policyDecision",
        Record<string, unknown>
      >;
      delete sourceRevision[container][field];
      const fakeProvider = providerWith();

      const run = await runQuestionPipeline(input, fakeProvider, {
        pipelineRunId,
      });

      expect(run.failedStage).toBe("KNOWLEDGE_EXTRACTION");
      expect(run.stages.KNOWLEDGE_EXTRACTION.failure?.code).toBe(
        "INPUT_VALIDATION_FAILED",
      );
      expect(fakeProvider.requests).toHaveLength(0);
    },
  );

  it("single_choice answer count invariant fails before evaluation", async () => {
    const fakeProvider = providerWith(
      undefined,
      fixture("question-generation/invalid-multiple-correct.json"),
    );
    const run = await runQuestionPipeline(makePipelineInput(), fakeProvider, {
      pipelineRunId,
    });

    expect(run.failedStage).toBe("QUESTION_GENERATION");
    expect(run.stages.QUESTION_GENERATION.failure?.code).toBe(
      "OUTPUT_VALIDATION_FAILED",
    );
    expect(run.stages.QUESTION_EVALUATION.status).toBe("PENDING");
    expect(fakeProvider.requests.map((request) => request.stage)).toEqual([
      "KNOWLEDGE_EXTRACTION",
      "QUESTION_PLANNING",
      "QUESTION_GENERATION",
    ]);
  });

  it("unknown QuestionType is rejected by the planning schema", async () => {
    const planning = fixture("question-planning/valid.json") as {
      questionIntent: { questionType: string };
    };
    planning.questionIntent.questionType = "essay";
    const fakeProvider = new FixtureFakeLlmProvider({
      KNOWLEDGE_EXTRACTION: [fixture("knowledge-extraction/valid.json")],
      QUESTION_PLANNING: [planning],
      QUESTION_GENERATION: [
        fixture("question-generation/valid-single-choice.json"),
      ],
      QUESTION_EVALUATION: [fixture("question-evaluation/pass.json")],
    });
    const run = await runQuestionPipeline(makePipelineInput(), fakeProvider, {
      pipelineRunId,
    });

    expect(run.failedStage).toBe("QUESTION_PLANNING");
    expect(run.stages.QUESTION_PLANNING.failure?.code).toBe(
      "OUTPUT_VALIDATION_FAILED",
    );
    expect(fakeProvider.requests.map((request) => request.stage)).toEqual([
      "KNOWLEDGE_EXTRACTION",
      "QUESTION_PLANNING",
    ]);
  });

  it.each([
    [
      "multiple_select with no correct option",
      "question-generation/invalid-empty-correct-multiple-select.json",
      "multiple_select",
    ],
    [
      "question with no SourceReference",
      "question-generation/invalid-missing-source.json",
      "single_choice",
    ],
  ] as const)(
    "rejects %s before Question Evaluation",
    async (_label, questionFixture, questionType) => {
      const planning = fixture("question-planning/valid.json") as {
        questionIntent: { questionType: string };
      };
      planning.questionIntent.questionType = questionType;
      const fakeProvider = new FixtureFakeLlmProvider({
        KNOWLEDGE_EXTRACTION: [fixture("knowledge-extraction/valid.json")],
        QUESTION_PLANNING: [planning],
        QUESTION_GENERATION: [fixture(questionFixture)],
        QUESTION_EVALUATION: [fixture("question-evaluation/pass.json")],
      });
      const run = await runQuestionPipeline(makePipelineInput(), fakeProvider, {
        pipelineRunId,
      });

      expect(run.failedStage).toBe("QUESTION_GENERATION");
      expect(run.stages.QUESTION_GENERATION.failure?.code).toBe(
        "OUTPUT_VALIDATION_FAILED",
      );
      expect(run.stages.QUESTION_EVALUATION.status).toBe("PENDING");
    },
  );

  it("duplicate option IDs are rejected programmatically", async () => {
    const generation = fixture(
      "question-generation/valid-single-choice.json",
    ) as { question: { options: Array<{ id: string; text: string }> } };
    const secondOption = generation.question.options.at(1);
    if (!secondOption) throw new Error("Fixture second option is required");
    secondOption.id = "A";
    const fakeProvider = providerWith(undefined, generation);
    const run = await runQuestionPipeline(makePipelineInput(), fakeProvider, {
      pipelineRunId,
    });

    expect(run.failedStage).toBe("QUESTION_GENERATION");
    expect(run.stages.QUESTION_GENERATION.failure?.code).toBe(
      "OUTPUT_VALIDATION_FAILED",
    );
  });

  it("rejects an inherited option explanation property such as toString", async () => {
    const generation = fixture(
      "question-generation/valid-single-choice.json",
    ) as { question: { options: Array<{ id: string; text: string }> } };
    const lastOption = generation.question.options.at(-1);
    if (!lastOption) throw new Error("Synthetic option is required");
    lastOption.id = "toString";
    const fakeProvider = providerWith(undefined, generation);

    const run = await runQuestionPipeline(makePipelineInput(), fakeProvider, {
      pipelineRunId,
    });

    expect(run.failedStage).toBe("QUESTION_GENERATION");
    expect(run.stages.QUESTION_GENERATION.failure?.code).toBe(
      "OUTPUT_VALIDATION_FAILED",
    );
  });

  it("PROHIBITED current Source Policy blocks the input before any LLM request", async () => {
    const prohibitedDecision = evaluateSourcePolicy(
      {
        ...sourceCandidate,
        terms: {
          reviewStatus: "PROHIBITED",
          termsUrl: "https://docs.example.test/terms",
        },
      },
      [allowedSource],
      {
        sourcePolicyDecisionId: "synthetic-current-prohibited-decision",
        evaluatedAt: "2026-09-24T00:03:00.000Z",
      },
    );
    expect(prohibitedDecision.classification).toBe("PROHIBITED");
    const fakeProvider = providerWith();
    const run = await runQuestionPipeline(
      makePipelineInput(prohibitedDecision),
      fakeProvider,
      { pipelineRunId },
    );

    expect(run.status).toBe("FAILED");
    expect(run.stages.KNOWLEDGE_EXTRACTION.failure?.code).toBe(
      "SOURCE_POLICY_BLOCKED",
    );
    expect(fakeProvider.requests).toHaveLength(0);
  });

  it.each([
    ["sourceUrlAtRetrieval", "https://unlisted.example.test/gateway/routes"],
    ["sourceUrlAtRetrieval", "https://docs.example.test/gateway-copy/routes"],
    ["sourceKindAtUse", "COMMUNITY_ARTICLE"],
    ["matchedAllowRuleSnapshot", undefined],
  ] as const)(
    "rejects a SourceRevision inconsistent with its historical allowlist (%s: %s)",
    async (field, value) => {
      const input = structuredClone(makePipelineInput());
      Object.assign(input.sourceRevision.snapshot, { [field]: value });
      const provider = providerWith();

      const run = await runQuestionPipeline(input, provider, { pipelineRunId });

      expect(run.failedStage).toBe("KNOWLEDGE_EXTRACTION");
      expect(run.stages.KNOWLEDGE_EXTRACTION.failure?.code).toBe(
        "SOURCE_POLICY_BLOCKED",
      );
      expect(run.stages.KNOWLEDGE_EXTRACTION.failure?.message).toContain(
        "SOURCE_NOT_ALLOWLISTED",
      );
      expect(provider.requests).toHaveLength(0);
    },
  );

  it("validates the retrieval URL against the historical rule after the Source URL moves", async () => {
    const input = makePipelineInput();
    const currentDecision = evaluateSourcePolicy(
      {
        ...sourceCandidate,
        sourceUrl: "https://new-docs.example.test/gateway/routes",
      },
      [{ ...allowedSource, hostname: "new-docs.example.test" }],
      {
        sourcePolicyDecisionId: "synthetic-policy-after-url-move",
        evaluatedAt: "2026-09-24T00:05:00.000Z",
      },
    );
    expect(currentDecision.classification).toBe("TRUSTED");

    const run = await runQuestionPipeline(
      {
        ...input,
        sourceRevision: {
          ...input.sourceRevision,
          policyDecision: currentDecision,
        },
      },
      providerWith(),
      { pipelineRunId },
    );

    expect(run.status).toBe("SUCCEEDED");
    expect(run.artifacts.questionRevisionCandidate?.sourceRevision).toEqual(
      input.sourceRevision.snapshot,
    );
  });

  it.each([
    ["stem", "   "],
    ["option", "\n"],
    ["explanation", "\t"],
    ["optionExplanation", "\u3000"],
  ] as const)("rejects whitespace-only generated %s", async (field, text) => {
    const generation = structuredClone(questionGenerationValid);
    if (field === "stem" || field === "explanation") {
      generation.question[field] = text;
    } else if (field === "optionExplanation") {
      generation.question.optionExplanations.A = text;
    } else {
      const option = generation.question.options[0];
      if (!option) throw new Error("Synthetic option is required");
      option.text = text;
    }
    const provider = providerWith(undefined, generation);

    const run = await runQuestionPipeline(makePipelineInput(), provider, {
      pipelineRunId,
    });

    expect(run.failedStage).toBe("QUESTION_GENERATION");
    expect(run.stages.QUESTION_GENERATION.failure?.code).toBe(
      "OUTPUT_VALIDATION_FAILED",
    );
    expect(run.stages.QUESTION_EVALUATION.status).toBe("PENDING");
    expect(run.artifacts.questionRevisionCandidate).toBeUndefined();
  });

  it.each([
    ["REVISE", "revise", "REVISION_REQUIRED"],
    ["REJECT", "reject", "REJECTED_BY_EVALUATION"],
  ] as const)(
    "Evaluation %s is a successful Stage execution with a non-publish decision",
    async (_decision, fixtureName, eligibility) => {
      const fakeProvider = providerWith(readEvaluationFixture(fixtureName));
      const run = await runQuestionPipeline(makePipelineInput(), fakeProvider, {
        pipelineRunId,
      });
      const candidate = run.artifacts.questionRevisionCandidate;

      expect(run.status).toBe("SUCCEEDED");
      expect(run.stages.QUESTION_EVALUATION.status).toBe("SUCCEEDED");
      expect(run.stages.QUESTION_EVALUATION.failure).toBeUndefined();
      expect(candidate?.reviewEligibility).toBe(eligibility);
      expect(candidate?.evaluation.decision).toBe(_decision);
      expect(candidate).not.toHaveProperty("published");
    },
  );

  it("PASS does not satisfy the existing Domain Publish Gate without Human Review", async () => {
    const run = await runQuestionPipeline(makePipelineInput(), providerWith(), {
      pipelineRunId,
    });
    const result = canPublishQuestionRevision({
      questionRevisionId: "synthetic-question-revision-candidate",
      knowledgePointIds: [],
      questionSources: [],
      sourceRevisionSnapshots: [makePipelineInput().sourceRevision.snapshot],
      currentPolicyDecisions: [
        makePipelineInput().sourceRevision.policyDecision,
      ],
    });

    expect(run.artifacts.questionRevisionCandidate?.evaluation.decision).toBe(
      "PASS",
    );
    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain("QUESTION_REVIEW_REQUIRED");
  });

  it("Provider failure can retry the failed Stage without regenerating prior artifacts", async () => {
    const fakeProvider = new FixtureFakeLlmProvider({
      KNOWLEDGE_EXTRACTION: [fixture("knowledge-extraction/valid.json")],
      QUESTION_PLANNING: [
        new Error("synthetic provider credential details"),
        fixture("question-planning/valid.json"),
      ],
      QUESTION_GENERATION: [
        fixture("question-generation/valid-single-choice.json"),
      ],
      QUESTION_EVALUATION: [fixture("question-evaluation/pass.json")],
    });
    const input = makePipelineInput();
    const failedRun = await runQuestionPipeline(input, fakeProvider, {
      pipelineRunId,
    });
    expect(failedRun.failedStage).toBe("QUESTION_PLANNING");
    expect(failedRun.stages.QUESTION_PLANNING.failure).toMatchObject({
      code: "PROVIDER_FAILED",
      retryable: true,
    });
    expect(failedRun.stages.QUESTION_GENERATION.status).toBe("PENDING");

    const refreshedPolicyDecision = evaluateSourcePolicy(
      sourceCandidate,
      [allowedSource],
      {
        sourcePolicyDecisionId: "synthetic-refreshed-policy-decision",
        evaluatedAt: "2026-09-24T00:05:00.000Z",
      },
    );
    const resumedInput = {
      ...input,
      sourceRevision: {
        ...input.sourceRevision,
        policyDecision: refreshedPolicyDecision,
      },
    };
    const resumedRun = await resumeQuestionPipeline(
      resumedInput,
      failedRun,
      fakeProvider,
    );
    expect(resumedRun.status).toBe("SUCCEEDED");
    expect(resumedRun.stages.KNOWLEDGE_EXTRACTION.attempt).toBe(1);
    expect(resumedRun.stages.QUESTION_PLANNING.attempt).toBe(2);
    expect(
      fakeProvider.requests.filter(
        (request) => request.stage === "KNOWLEDGE_EXTRACTION",
      ),
    ).toHaveLength(1);
    expect(
      fakeProvider.requests.filter(
        (request) => request.stage === "QUESTION_PLANNING",
      ),
    ).toHaveLength(2);
    expect(
      resumedRun.stageRunHistory.some((run) => run.status === "RUNNING"),
    ).toBe(true);
    expect(resumedRun.immutableInputFingerprint).toBe(
      failedRun.immutableInputFingerprint,
    );
  });

  it("rechecks current Source Policy on resume independently of immutable inputs", async () => {
    const input = makePipelineInput();
    const fakeProvider = new FixtureFakeLlmProvider({
      KNOWLEDGE_EXTRACTION: [fixture("knowledge-extraction/valid.json")],
      QUESTION_PLANNING: [fixture("question-planning/valid.json")],
      QUESTION_GENERATION: [
        fixture("question-generation/valid-single-choice.json"),
      ],
      QUESTION_EVALUATION: [
        new Error("synthetic transient provider failure"),
        fixture("question-evaluation/pass.json"),
      ],
    });
    const failedRun = await runQuestionPipeline(input, fakeProvider, {
      pipelineRunId,
    });
    expect(failedRun.failedStage).toBe("QUESTION_EVALUATION");

    const prohibitedDecision = evaluateSourcePolicy(
      {
        ...sourceCandidate,
        terms: {
          reviewStatus: "PROHIBITED",
          termsUrl: "https://docs.example.test/terms",
        },
      },
      [allowedSource],
      {
        sourcePolicyDecisionId: "synthetic-resume-prohibited-decision",
        evaluatedAt: "2026-09-24T00:06:00.000Z",
      },
    );
    const resumeInput = {
      ...input,
      sourceRevision: {
        ...input.sourceRevision,
        policyDecision: prohibitedDecision,
      },
    };
    const requestCountBeforeResume = fakeProvider.requests.length;

    const resumedRun = await resumeQuestionPipeline(
      resumeInput,
      failedRun,
      fakeProvider,
    );

    expect(resumedRun.status).toBe("FAILED");
    expect(resumedRun.stages.QUESTION_EVALUATION.failure?.code).toBe(
      "SOURCE_POLICY_BLOCKED",
    );
    expect(fakeProvider.requests).toHaveLength(requestCountBeforeResume);
    expect(resumedRun.immutableInputFingerprint).toBe(
      failedRun.immutableInputFingerprint,
    );

    const restoredRun = await resumeQuestionPipeline(
      input,
      resumedRun,
      fakeProvider,
    );
    expect(restoredRun.status).toBe("SUCCEEDED");
    expect(restoredRun.stages.QUESTION_GENERATION.attempt).toBe(1);
    expect(restoredRun.stages.QUESTION_EVALUATION.attempt).toBe(3);
  });

  it("can resume with corrected input after an input validation failure without losing input identity", async () => {
    const input = makePipelineInput();
    const provider = new FixtureFakeLlmProvider({
      KNOWLEDGE_EXTRACTION: [fixture("knowledge-extraction/valid.json")],
      QUESTION_PLANNING: [
        new Error("synthetic transient provider failure"),
        fixture("question-planning/valid.json"),
      ],
      QUESTION_GENERATION: [
        fixture("question-generation/valid-single-choice.json"),
      ],
      QUESTION_EVALUATION: [fixture("question-evaluation/pass.json")],
    });
    const failedRun = await runQuestionPipeline(input, provider, {
      pipelineRunId,
    });
    expect(failedRun.failedStage).toBe("QUESTION_PLANNING");
    const invalidRun = await resumeQuestionPipeline(
      { ...input, groundingSegments: [] },
      failedRun,
      provider,
    );
    expect(invalidRun.stages.QUESTION_PLANNING.failure?.code).toBe(
      "INPUT_VALIDATION_FAILED",
    );
    expect(invalidRun.immutableInputFingerprint).toBe(
      failedRun.immutableInputFingerprint,
    );
    await expect(
      resumeQuestionPipeline(
        {
          ...input,
          groundingSegments: input.groundingSegments.map((segment) => ({
            ...segment,
            text: "Different fictional grounding content.",
          })),
        },
        invalidRun,
        provider,
      ),
    ).rejects.toThrow(PipelineResumeInputMismatchError);

    const restoredRun = await resumeQuestionPipeline(
      input,
      invalidRun,
      provider,
    );
    expect(restoredRun.status).toBe("SUCCEEDED");
    expect(restoredRun.artifacts.knowledgePoints).toEqual(
      failedRun.artifacts.knowledgePoints,
    );
    expect(restoredRun.stages.KNOWLEDGE_EXTRACTION.attempt).toBe(1);
    expect(restoredRun.stages.QUESTION_PLANNING.attempt).toBe(3);
    expect(
      provider.requests.filter(
        (request) => request.stage === "KNOWLEDGE_EXTRACTION",
      ),
    ).toHaveLength(1);
  });

  it("Evaluation decision must agree with the deterministic criterion summary", async () => {
    const revise = fixture("question-evaluation/revise.json") as {
      decision: string;
    };
    revise.decision = "PASS";
    const fakeProvider = providerWith(revise);
    const run = await runQuestionPipeline(makePipelineInput(), fakeProvider, {
      pipelineRunId,
    });

    expect(run.failedStage).toBe("QUESTION_EVALUATION");
    expect(run.stages.QUESTION_EVALUATION.failure?.code).toBe(
      "OUTPUT_VALIDATION_FAILED",
    );
  });

  it("rejects an error finding that contradicts a passing evaluation check", async () => {
    const evaluation = fixture("question-evaluation/pass.json") as {
      findings: Array<{
        code: string;
        severity: string;
        message: string;
        sourceReferences: (typeof sourceReference)[];
      }>;
    };
    evaluation.findings.push({
      code: "ANSWER_GROUNDED",
      severity: "error",
      message: "The synthetic correct answer is not supported by the Source.",
      sourceReferences: [],
    });
    const fakeProvider = providerWith(evaluation);

    const run = await runQuestionPipeline(makePipelineInput(), fakeProvider, {
      pipelineRunId,
    });

    expect(run.failedStage).toBe("QUESTION_EVALUATION");
    expect(run.stages.QUESTION_EVALUATION.failure?.code).toBe(
      "OUTPUT_VALIDATION_FAILED",
    );
    expect(run.artifacts.questionRevisionCandidate).toBeUndefined();
  });
});
