// UX専用の架空表示例。既存fixtures/pipelineの出力とSource Metadataを再利用。
// Domainのstable ID、前Revision、Human Recordは接続後の読取投影を示す仮値。
(() => {
  const base = {
    key: "ready",
    label: "公開候補のReview",
    candidate: {
      candidateId: "synthetic-pipeline-run:ready:revision-candidate",
      certification: {
        certificationId: "synthetic-cloud-associate",
        name: "架空のCloud Associate（設計確認用）",
      },
      examTopics: [
        {
          examTopicId: "topic-routing",
          certificationId: "synthetic-cloud-associate",
          name: "リクエストルーティング",
        },
      ],
      knowledgePoints: [
        {
          title: "Route matching selects a service",
          summary:
            "An Example Gateway Route matches incoming request attributes and directs a matching request to its associated Service.",
          examTopicId: "topic-routing",
          sourceReferences: [
            {
              sourceRevisionId: "source-revision-routing-01",
              locator: "section:route-service-link",
            },
          ],
          candidateId: "synthetic-pipeline-run:knowledge:1",
        },
      ],
      questionIntent: {
        knowledgePointCandidateIds: ["synthetic-pipeline-run:knowledge:1"],
        questionType: "single_choice",
        format: "scenario",
        learningObjective:
          "Apply the relationship between a Route and its associated Service.",
        difficulty: "intermediate",
        targetConcept:
          "A matching Route directs a request to its associated Service.",
        constraints: [
          "Use only the provided Source grounding.",
          "There must be exactly one correct option.",
        ],
        sourceReferences: [
          {
            sourceRevisionId: "source-revision-routing-01",
            locator: "section:route-service-link",
          },
        ],
      },
      question: {
        type: "single_choice",
        stem: "A team configures a Route that matches requests for /inventory. Which resource receives a matching request?",
        options: [
          {
            id: "A",
            text: "The Service associated with the Route",
          },
          {
            id: "B",
            text: "A separate Certification record",
          },
          {
            id: "C",
            text: "The route's descriptive label as a response body",
          },
          {
            id: "D",
            text: "Every Service in the Gateway",
          },
        ],
        correctOptionIds: ["A"],
        explanation:
          "The fictional reference describes a Route as matching requests and directing them to its associated Service.",
        optionExplanations: {
          A: "Correct. This is the documented relationship in the synthetic Source.",
          B: "A Certification describes a learning scope and does not receive requests.",
          C: "The locator or label does not become the response body.",
          D: "The reference describes the associated Service, not every Service.",
        },
        sourceReferences: [
          {
            sourceRevisionId: "source-revision-routing-01",
            locator: "section:route-service-link",
          },
        ],
        candidateId: "synthetic-pipeline-run:ready:question",
        knowledgePointCandidateIds: ["synthetic-pipeline-run:knowledge:1"],
      },
      sourceRevision: {
        sourceDocumentId: "source-document-routing-01",
        sourceRevisionId: "source-revision-routing-01",
        sourceUrlAtRetrieval: "https://docs.example.test/gateway/routes",
        retrievedAt: "2026-09-24T00:02:00.000Z",
        contentFingerprint: "sha256:synthetic-route-source-fingerprint",
        classificationAtUse: "TRUSTED",
        usagePurposeAtUse: "NORMATIVE_TECHNICAL",
        sourceKindAtUse: "OFFICIAL_DOCUMENTATION",
        sourcePolicyDecisionId: "synthetic-policy-decision-01",
        sourceMetadataSnapshot: {
          sourceUrl: "https://docs.example.test/gateway/routes",
          sourceOwner: "Example Systems",
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
        },
        matchedAllowRuleSnapshot: {
          id: "synthetic-example-gateway-docs",
          owner: "Example Systems",
          hostname: "docs.example.test",
          pathPrefix: "/gateway",
          allowedKinds: ["OFFICIAL_DOCUMENTATION"],
          allowedPurposes: ["NORMATIVE_TECHNICAL"],
          notes: "架空Sourceの契約確認用。実Sourceの利用許可を意味しない。",
        },
        termsMetadataSnapshot: {
          reviewStatus: "CLEARED_FOR_PRODUCT_USE",
          termsUrl: "https://docs.example.test/terms",
          checkedAt: "2026-09-24T00:00:00.000Z",
          checkedBy: "synthetic-reviewer",
        },
      },
      groundingSegments: [
        {
          sourceRevisionId: "source-revision-routing-01",
          locator: "section:route-service-link",
          text: "In Example Gateway, a Route matches an incoming request and directs a matching request to its associated Service.",
        },
      ],
      evaluation: {
        decision: "PASS",
        checks: {
          CERTIFICATION_SCOPE: "PASS",
          KNOWLEDGE_POINT_ALIGNMENT: "PASS",
          ANSWER_GROUNDED: "PASS",
          DISTRACTORS_INCORRECT: "PASS",
          ANSWER_CARDINALITY: "PASS",
          NO_UNSUPPORTED_CLAIMS: "PASS",
          NO_AMBIGUITY: "PASS",
          QUESTION_TYPE_APPROPRIATE: "PASS",
          STEM_SELF_CONTAINED: "PASS",
        },
        findings: [],
        ambiguityNotes: [],
        assumptions: [],
      },
      reviewEligibility: "ELIGIBLE_FOR_HUMAN_REVIEW",
      pipelineRunId: "synthetic-pipeline-run",
      stageRuns: [
        {
          pipelineRunId: "synthetic-pipeline-run",
          stage: "KNOWLEDGE_EXTRACTION",
          attempt: 1,
          status: "SUCCEEDED",
          startedAt: "2026-09-24T00:03:00.000Z",
          completedAt: "2026-09-24T00:04:00.000Z",
          generationMetadata: {
            providerId: "fixture-fake",
            modelId: "synthetic-model",
            promptVersion: "fixture-v1",
            requestId: "synthetic-knowledge_extraction",
          },
        },
        {
          pipelineRunId: "synthetic-pipeline-run",
          stage: "QUESTION_PLANNING",
          attempt: 1,
          status: "SUCCEEDED",
          startedAt: "2026-09-24T00:03:00.000Z",
          completedAt: "2026-09-24T00:04:00.000Z",
          generationMetadata: {
            providerId: "fixture-fake",
            modelId: "synthetic-model",
            promptVersion: "fixture-v1",
            requestId: "synthetic-question_planning",
          },
        },
        {
          pipelineRunId: "synthetic-pipeline-run",
          stage: "QUESTION_GENERATION",
          attempt: 1,
          status: "SUCCEEDED",
          startedAt: "2026-09-24T00:03:00.000Z",
          completedAt: "2026-09-24T00:04:00.000Z",
          generationMetadata: {
            providerId: "fixture-fake",
            modelId: "synthetic-model",
            promptVersion: "fixture-v1",
            requestId: "synthetic-question_generation",
          },
        },
        {
          pipelineRunId: "synthetic-pipeline-run",
          stage: "QUESTION_EVALUATION",
          attempt: 1,
          status: "SUCCEEDED",
          startedAt: "2026-09-24T00:03:00.000Z",
          completedAt: "2026-09-24T00:04:00.000Z",
          generationMetadata: {
            providerId: "fixture-fake",
            modelId: "synthetic-model",
            promptVersion: "fixture-v1",
            requestId: "synthetic-question_evaluation",
          },
        },
      ],
    },
    questionId: "synthetic-question-ready",
    revision: {
      questionRevisionId: "synthetic-question-ready-r2",
      state: "REVIEW_REQUIRED",
      knowledgePointIds: ["synthetic-knowledge-routing"],
      questionSources: [
        {
          questionRevisionId: "synthetic-question-ready-r2",
          sourceRevisionId: "source-revision-routing-01",
          knowledgePointId: "synthetic-knowledge-routing",
          usagePurpose: "NORMATIVE_TECHNICAL",
          relation: "SUPPORTS_KNOWLEDGE_POINT",
          sourcePolicyDecisionId: "synthetic-policy-decision-01",
        },
        {
          questionRevisionId: "synthetic-question-ready-r2",
          sourceRevisionId: "source-revision-routing-01",
          knowledgePointId: "synthetic-knowledge-routing",
          usagePurpose: "NORMATIVE_TECHNICAL",
          relation: "SUPPORTS_CORRECT_ANSWER",
          sourcePolicyDecisionId: "synthetic-policy-decision-01",
        },
        {
          questionRevisionId: "synthetic-question-ready-r2",
          sourceRevisionId: "source-revision-routing-01",
          knowledgePointId: "synthetic-knowledge-routing",
          usagePurpose: "NORMATIVE_TECHNICAL",
          relation: "SUPPORTS_EXPLANATION",
          sourcePolicyDecisionId: "synthetic-policy-decision-01",
        },
      ],
    },
    previousRevision: {
      questionRevisionId: "synthetic-question-ready-r1",
      state: "PUBLISHED",
      question: {
        type: "single_choice",
        stem: "A Route matches a request. Which resource receives it?",
        options: [
          {
            id: "A",
            text: "The Service associated with the Route",
          },
          {
            id: "B",
            text: "A separate Certification record",
          },
          {
            id: "C",
            text: "The route's descriptive label as a response body",
          },
          {
            id: "D",
            text: "Every Service in the Gateway",
          },
        ],
        correctOptionIds: ["A"],
        explanation:
          "The fictional reference describes a Route as matching requests and directing them to its associated Service.",
        optionExplanations: {
          A: "Correct. This is the documented relationship in the synthetic Source.",
          B: "A Certification describes a learning scope and does not receive requests.",
          C: "The locator or label does not become the response body.",
          D: "The reference describes the associated Service, not every Service.",
        },
        sourceReferences: [
          {
            sourceRevisionId: "source-revision-routing-01",
            locator: "section:route-service-link",
          },
        ],
      },
    },
    currentPublishedRevisionId: "synthetic-question-ready-r1",
    currentPolicyDecisions: [
      {
        sourcePolicyDecisionId: "synthetic-policy-decision-01",
        sourceDocumentId: "source-document-routing-01",
        classification: "TRUSTED",
        usagePurpose: "NORMATIVE_TECHNICAL",
        sourceKind: "OFFICIAL_DOCUMENTATION",
        reasonCodes: [],
        evaluatedAt: "2026-09-24T00:01:00.000Z",
        matchedAllowRuleId: "synthetic-example-gateway-docs",
        matchedAllowRuleSnapshot: {
          id: "synthetic-example-gateway-docs",
          owner: "Example Systems",
          hostname: "docs.example.test",
          pathPrefix: "/gateway",
          allowedKinds: ["OFFICIAL_DOCUMENTATION"],
          allowedPurposes: ["NORMATIVE_TECHNICAL"],
          notes: "架空Sourceの契約確認用。実Sourceの利用許可を意味しない。",
        },
        sourceMetadataSnapshot: {
          sourceUrl: "https://docs.example.test/gateway/routes",
          sourceOwner: "Example Systems",
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
        },
        termsMetadataSnapshot: {
          reviewStatus: "CLEARED_FOR_PRODUCT_USE",
          termsUrl: "https://docs.example.test/terms",
          checkedAt: "2026-09-24T00:00:00.000Z",
          checkedBy: "synthetic-reviewer",
        },
      },
    ],
    humanReview: null,
  };
  const variants = [
    {
      key: "candidate",
      label: "Domain Identity未解決 / 初版",
      evaluation: {
        decision: "PASS",
        checks: {
          CERTIFICATION_SCOPE: "PASS",
          KNOWLEDGE_POINT_ALIGNMENT: "PASS",
          ANSWER_GROUNDED: "PASS",
          DISTRACTORS_INCORRECT: "PASS",
          ANSWER_CARDINALITY: "PASS",
          NO_UNSUPPORTED_CLAIMS: "PASS",
          NO_AMBIGUITY: "PASS",
          QUESTION_TYPE_APPROPRIATE: "PASS",
          STEM_SELF_CONTAINED: "PASS",
        },
        findings: [],
        ambiguityNotes: [],
        assumptions: [],
      },
      eligibility: "ELIGIBLE_FOR_HUMAN_REVIEW",
      policy: null,
    },
    {
      key: "revise",
      label: "評価の修正指摘",
      evaluation: {
        decision: "REVISE",
        checks: {
          CERTIFICATION_SCOPE: "PASS",
          KNOWLEDGE_POINT_ALIGNMENT: "PASS",
          ANSWER_GROUNDED: "PASS",
          DISTRACTORS_INCORRECT: "PASS",
          ANSWER_CARDINALITY: "PASS",
          NO_UNSUPPORTED_CLAIMS: "PASS",
          NO_AMBIGUITY: "PASS",
          QUESTION_TYPE_APPROPRIATE: "PASS",
          STEM_SELF_CONTAINED: "CONCERN",
        },
        findings: [
          {
            code: "STEM_SELF_CONTAINED",
            severity: "warning",
            message:
              "The scenario could identify the request path more clearly.",
            sourceReferences: [
              {
                sourceRevisionId: "source-revision-routing-01",
                locator: "section:route-service-link",
              },
            ],
          },
        ],
        ambiguityNotes: ["The request path is not specified in the scenario."],
        assumptions: [],
      },
      eligibility: "REVISION_REQUIRED",
      policy: null,
    },
    {
      key: "reject",
      label: "評価の却下指摘",
      evaluation: {
        decision: "REJECT",
        checks: {
          CERTIFICATION_SCOPE: "PASS",
          KNOWLEDGE_POINT_ALIGNMENT: "PASS",
          ANSWER_GROUNDED: "CONCERN",
          DISTRACTORS_INCORRECT: "PASS",
          ANSWER_CARDINALITY: "PASS",
          NO_UNSUPPORTED_CLAIMS: "FAIL",
          NO_AMBIGUITY: "PASS",
          QUESTION_TYPE_APPROPRIATE: "PASS",
          STEM_SELF_CONTAINED: "PASS",
        },
        findings: [
          {
            code: "ANSWER_GROUNDED",
            severity: "warning",
            message:
              "The selected answer needs an additional supporting statement.",
            sourceReferences: [
              {
                sourceRevisionId: "source-revision-routing-01",
                locator: "section:route-service-link",
              },
            ],
          },
          {
            code: "NO_UNSUPPORTED_CLAIMS",
            severity: "error",
            message:
              "The answer rationale contains a statement not supported by the provided synthetic Source.",
            sourceReferences: [],
          },
        ],
        ambiguityNotes: [],
        assumptions: [
          "The unsupported statement was introduced during generation.",
        ],
      },
      eligibility: "REJECTED_BY_EVALUATION",
      policy: null,
    },
    {
      key: "source-review",
      label: "Source利用の再確認待ち",
      evaluation: {
        decision: "PASS",
        checks: {
          CERTIFICATION_SCOPE: "PASS",
          KNOWLEDGE_POINT_ALIGNMENT: "PASS",
          ANSWER_GROUNDED: "PASS",
          DISTRACTORS_INCORRECT: "PASS",
          ANSWER_CARDINALITY: "PASS",
          NO_UNSUPPORTED_CLAIMS: "PASS",
          NO_AMBIGUITY: "PASS",
          QUESTION_TYPE_APPROPRIATE: "PASS",
          STEM_SELF_CONTAINED: "PASS",
        },
        findings: [],
        ambiguityNotes: [],
        assumptions: [],
      },
      eligibility: "ELIGIBLE_FOR_HUMAN_REVIEW",
      policy: {
        sourcePolicyDecisionId: "synthetic-current-source-review",
        sourceDocumentId: "source-document-routing-01",
        classification: "REVIEW_REQUIRED",
        usagePurpose: "NORMATIVE_TECHNICAL",
        sourceKind: "OFFICIAL_DOCUMENTATION",
        reasonCodes: ["TERMS_REVIEW_REQUIRED"],
        evaluatedAt: "2026-10-03T00:00:00.000Z",
        matchedAllowRuleId: "synthetic-example-gateway-docs",
        matchedAllowRuleSnapshot: {
          id: "synthetic-example-gateway-docs",
          owner: "Example Systems",
          hostname: "docs.example.test",
          pathPrefix: "/gateway",
          allowedKinds: ["OFFICIAL_DOCUMENTATION"],
          allowedPurposes: ["NORMATIVE_TECHNICAL"],
          notes: "架空Sourceの契約確認用。実Sourceの利用許可を意味しない。",
        },
        sourceMetadataSnapshot: {
          sourceUrl: "https://docs.example.test/gateway/routes",
          sourceOwner: "Example Systems",
          originStatus: "VERIFIED",
          accessClassification: "PUBLIC",
          automatedAccess: "ALLOWED",
          purposeAlignment: "ALIGNED",
          terms: {
            reviewStatus: "REQUIRES_REVIEW",
            termsUrl: "https://docs.example.test/terms",
            checkedAt: "2026-09-24T00:00:00.000Z",
            checkedBy: "synthetic-reviewer",
          },
        },
        termsMetadataSnapshot: {
          reviewStatus: "REQUIRES_REVIEW",
          termsUrl: "https://docs.example.test/terms",
          checkedAt: "2026-09-24T00:00:00.000Z",
          checkedBy: "synthetic-reviewer",
        },
      },
    },
    {
      key: "source-prohibited",
      label: "現在Source Policyで公開不可",
      evaluation: {
        decision: "PASS",
        checks: {
          CERTIFICATION_SCOPE: "PASS",
          KNOWLEDGE_POINT_ALIGNMENT: "PASS",
          ANSWER_GROUNDED: "PASS",
          DISTRACTORS_INCORRECT: "PASS",
          ANSWER_CARDINALITY: "PASS",
          NO_UNSUPPORTED_CLAIMS: "PASS",
          NO_AMBIGUITY: "PASS",
          QUESTION_TYPE_APPROPRIATE: "PASS",
          STEM_SELF_CONTAINED: "PASS",
        },
        findings: [],
        ambiguityNotes: [],
        assumptions: [],
      },
      eligibility: "ELIGIBLE_FOR_HUMAN_REVIEW",
      policy: {
        sourcePolicyDecisionId: "synthetic-current-source-prohibited",
        sourceDocumentId: "source-document-routing-01",
        classification: "PROHIBITED",
        usagePurpose: "NORMATIVE_TECHNICAL",
        sourceKind: "OFFICIAL_DOCUMENTATION",
        reasonCodes: ["PROHIBITED_TERMS"],
        evaluatedAt: "2026-10-03T00:00:00.000Z",
        matchedAllowRuleId: "synthetic-example-gateway-docs",
        matchedAllowRuleSnapshot: {
          id: "synthetic-example-gateway-docs",
          owner: "Example Systems",
          hostname: "docs.example.test",
          pathPrefix: "/gateway",
          allowedKinds: ["OFFICIAL_DOCUMENTATION"],
          allowedPurposes: ["NORMATIVE_TECHNICAL"],
          notes: "架空Sourceの契約確認用。実Sourceの利用許可を意味しない。",
        },
        sourceMetadataSnapshot: {
          sourceUrl: "https://docs.example.test/gateway/routes",
          sourceOwner: "Example Systems",
          originStatus: "VERIFIED",
          accessClassification: "PUBLIC",
          automatedAccess: "ALLOWED",
          purposeAlignment: "ALIGNED",
          terms: {
            reviewStatus: "PROHIBITED",
            termsUrl: "https://docs.example.test/terms",
            checkedAt: "2026-09-24T00:00:00.000Z",
            checkedBy: "synthetic-reviewer",
          },
        },
        termsMetadataSnapshot: {
          reviewStatus: "PROHIBITED",
          termsUrl: "https://docs.example.test/terms",
          checkedAt: "2026-09-24T00:00:00.000Z",
          checkedBy: "synthetic-reviewer",
        },
      },
    },
    {
      key: "completed",
      label: "Human Review完了",
      evaluation: {
        decision: "PASS",
        checks: {
          CERTIFICATION_SCOPE: "PASS",
          KNOWLEDGE_POINT_ALIGNMENT: "PASS",
          ANSWER_GROUNDED: "PASS",
          DISTRACTORS_INCORRECT: "PASS",
          ANSWER_CARDINALITY: "PASS",
          NO_UNSUPPORTED_CLAIMS: "PASS",
          NO_AMBIGUITY: "PASS",
          QUESTION_TYPE_APPROPRIATE: "PASS",
          STEM_SELF_CONTAINED: "PASS",
        },
        findings: [],
        ambiguityNotes: [],
        assumptions: [],
      },
      eligibility: "ELIGIBLE_FOR_HUMAN_REVIEW",
      policy: null,
    },
    {
      key: "multiple",
      label: "複数選択と長文",
      evaluation: {
        decision: "PASS",
        checks: {
          CERTIFICATION_SCOPE: "PASS",
          KNOWLEDGE_POINT_ALIGNMENT: "PASS",
          ANSWER_GROUNDED: "PASS",
          DISTRACTORS_INCORRECT: "PASS",
          ANSWER_CARDINALITY: "PASS",
          NO_UNSUPPORTED_CLAIMS: "PASS",
          NO_AMBIGUITY: "PASS",
          QUESTION_TYPE_APPROPRIATE: "PASS",
          STEM_SELF_CONTAINED: "PASS",
        },
        findings: [
          {
            code: "ANSWER_GROUNDED",
            severity: "info",
            message: "架空のGroundingに2つの正答候補の根拠があります。",
            sourceReferences: [
              {
                sourceRevisionId: "source-revision-routing-01",
                locator: "section:route-service-link",
              },
            ],
          },
        ],
        ambiguityNotes: [],
        assumptions: [],
      },
      eligibility: "ELIGIBLE_FOR_HUMAN_REVIEW",
      policy: null,
    },
  ];
  const records = [
    base,
    ...variants.map((variant) => {
      const record = structuredClone(base);
      record.key = variant.key;
      record.label = variant.label;
      record.questionId = `synthetic-question-${variant.key}`;
      const rid = `${record.questionId}-r2`;
      record.revision.questionRevisionId = rid;
      record.revision.questionSources.forEach((source) => {
        source.questionRevisionId = rid;
      });
      record.previousRevision.questionRevisionId = `${record.questionId}-r1`;
      record.currentPublishedRevisionId =
        record.previousRevision.questionRevisionId;
      record.candidate.candidateId = `synthetic-pipeline-run:${variant.key}:revision-candidate`;
      record.candidate.question.candidateId = `synthetic-pipeline-run:${variant.key}:question`;
      record.candidate.evaluation = variant.evaluation;
      record.candidate.reviewEligibility = variant.eligibility;
      if (variant.policy) record.currentPolicyDecisions = [variant.policy];
      if (variant.key === "candidate") {
        record.questionId = null;
        record.revision = null;
        record.previousRevision = null;
        record.currentPublishedRevisionId = null;
      }
      if (variant.key === "completed") {
        record.revision.state = "PUBLISHED";
        record.currentPublishedRevisionId = rid;
        record.humanReview = {
          questionReviewId: "synthetic-review-completed",
          questionRevisionId: rid,
          reviewerId: "synthetic-reviewer",
          decision: "APPROVE",
          reviewedAt: "2026-10-03T00:05:00.000Z",
        };
      }
      if (variant.key === "multiple") {
        const question = record.candidate.question;
        question.type = "multiple_select";
        question.stem =
          "架空のExample Gatewayの仕様を確認するチームが、RouteとServiceの責務を比較しています。" +
          "構成に複数のServiceが存在しても、リクエスト属性と関連付けを分けて判断する必要があります。".repeat(
            5,
          ) +
          "出典で裏付けられる記述をすべて選んでください。";
        question.options[0].text = "一致したリクエストを関連するServiceへ送る";
        question.options[1].text = "Routeはincoming requestの属性に一致する";
        question.correctOptionIds = ["A", "B"];
        question.optionExplanations.B =
          "正しい。架空SourceにはRouteがincoming requestに一致すると記載されている。";
        record.candidate.questionIntent.questionType = "multiple_select";
        record.candidate.questionIntent.constraints = [
          "Use only the provided Source grounding.",
          "Select all statements supported by the synthetic Source.",
        ];
        record.previousRevision.question = structuredClone(question);
        record.previousRevision.question.stem =
          "A Route matches a request. Which resource receives it?";
      }
      return record;
    }),
  ];
  // Domain ContentのUX読取投影。Candidateの型とは別に凍結し、IdentityとLifecycleも分離する。
  for (const record of records) {
    record.sourceRevisionSnapshots = [
      structuredClone(record.candidate.sourceRevision),
    ];
    record.knowledgePoints = record.candidate.knowledgePoints.map(
      (point, index) => ({
        ...structuredClone(point),
        knowledgePointId: record.revision?.knowledgePointIds[index],
      }),
    );
    if (record.revision) {
      const {
        candidateId: _candidate,
        knowledgePointCandidateIds: _ids,
        sourceReferences: _refs,
        ...content
      } = structuredClone(record.candidate.question);
      const { knowledgePointCandidateIds: _intentIds, ...intent } =
        structuredClone(record.candidate.questionIntent);
      record.reviewTargetRevision = {
        questionRevisionId: record.revision.questionRevisionId,
        questionId: record.questionId,
        ...content,
        language: record.key === "multiple" ? "ja" : "en",
        difficulty: record.candidate.questionIntent.difficulty,
        knowledgePointIds: structuredClone(record.revision.knowledgePointIds),
        questionSources: structuredClone(record.revision.questionSources),
        questionIntent: {
          ...intent,
          knowledgePointIds: structuredClone(record.revision.knowledgePointIds),
        },
      };
      record.previousRevision.frozenContent = {
        ...structuredClone(record.reviewTargetRevision),
        ...structuredClone(record.previousRevision.question),
        questionRevisionId: record.previousRevision.questionRevisionId,
      };
      record.previousRevision.frozenContent.questionSources.forEach(
        (source) => {
          source.questionRevisionId =
            record.previousRevision.questionRevisionId;
        },
      );
      delete record.previousRevision.frozenContent.sourceReferences;
    } else record.reviewTargetRevision = null;
    record.sourcePolicyGate = {
      eligible: !record.currentPolicyDecisions.some(
        (p) => p.classification !== "TRUSTED",
      ),
      blockers: [],
    };
    record.sourcePolicyGate.blockers = [
      ...new Set(
        record.currentPolicyDecisions
          .filter((p) => p.classification !== "TRUSTED")
          .flatMap((p) => [
            "SOURCE_POLICY_NOT_TRUSTED",
            ...p.reasonCodes,
            ...(p.classification === "REVIEW_REQUIRED"
              ? ["SOURCE_REVIEW_REQUIRED"]
              : []),
          ]),
      ),
    ];
  }
  const mismatch = structuredClone(records.find((r) => r.key === "ready"));
  mismatch.key = "content-mismatch";
  mismatch.label = "Candidateとexact RevisionのContentが異なる例";
  mismatch.candidate.candidateId += ":different";
  mismatch.candidate.question.stem =
    "Candidate-only wording. This is NOT the frozen Review target.";
  mismatch.candidate.question.explanation =
    "Candidate-only explanation. Do not use this as the Human Review Content.";
  mismatch.candidate.question.options[0].text = "Candidate-only option text";
  mismatch.reviewTargetRevision.stem =
    "Frozen Revision: Which Service receives a request matched by the /inventory Route?";
  records.push(mismatch);
  // 2件目の公式相当Source。禁止本文は収集せず、後日のPolicy変更Metadataだけを再生。
  for (const [key, classification] of [
    ["sources-trusted", "TRUSTED"],
    ["sources-review", "REVIEW_REQUIRED"],
    ["sources-prohibited", "PROHIBITED"],
    ["sources-ambiguous", "TRUSTED"],
    ["sources-missing", "TRUSTED"],
  ]) {
    const record = structuredClone(records.find((r) => r.key === "ready"));
    record.key = key;
    record.label = {
      "sources-trusted": "複数SourceがすべてTRUSTED",
      "sources-review": "2件目Sourceの再確認待ち",
      "sources-prohibited": "2件目Sourceの利用禁止",
      "sources-ambiguous": "同一Source / PurposeのPolicyが複数",
      "sources-missing": "2件目Sourceの現在Policy未取得",
    }[key];
    const snapshot = structuredClone(record.candidate.sourceRevision);
    snapshot.sourceDocumentId = "source-document-routing-02";
    snapshot.sourceRevisionId = "source-revision-routing-02";
    snapshot.sourcePolicyDecisionId = "synthetic-policy-decision-02";
    snapshot.sourceUrlAtRetrieval =
      "https://docs.example.test/gateway/services";
    snapshot.sourceMetadataSnapshot.sourceUrl = snapshot.sourceUrlAtRetrieval;
    snapshot.contentFingerprint = "sha256:synthetic-service-source-fingerprint";
    record.sourceRevisionSnapshots.push(snapshot);
    const policy = structuredClone(
      record.currentPolicyDecisions.find((p) => p.classification === "TRUSTED"),
    );
    policy.sourceDocumentId = snapshot.sourceDocumentId;
    policy.sourcePolicyDecisionId = snapshot.sourcePolicyDecisionId;
    policy.sourceMetadataSnapshot.sourceUrl = snapshot.sourceUrlAtRetrieval;
    policy.classification = classification;
    if (classification !== "TRUSTED") {
      policy.evaluatedAt = "2026-10-03T00:00:00.000Z";
      policy.sourcePolicyDecisionId =
        classification === "PROHIBITED"
          ? "synthetic-policy-decision-prohibited-02"
          : "synthetic-policy-decision-review-required-02";
      policy.reasonCodes = [
        classification === "PROHIBITED"
          ? "PROHIBITED_TERMS"
          : "TERMS_REVIEW_REQUIRED",
      ];
      policy.termsMetadataSnapshot.reviewStatus =
        classification === "PROHIBITED" ? "PROHIBITED" : "REQUIRES_REVIEW";
      policy.sourceMetadataSnapshot.terms = structuredClone(
        policy.termsMetadataSnapshot,
      );
    }
    if (key !== "sources-missing") record.currentPolicyDecisions.push(policy);
    if (key === "sources-ambiguous")
      record.currentPolicyDecisions.push({
        ...structuredClone(policy),
        sourcePolicyDecisionId: "synthetic-ambiguous-decision",
      });
    record.reviewTargetRevision.questionSources.push({
      ...structuredClone(
        record.reviewTargetRevision.questionSources.find(
          (s) => s.relation === "SUPPORTS_KNOWLEDGE_POINT",
        ),
      ),
      sourceRevisionId: snapshot.sourceRevisionId,
      sourcePolicyDecisionId: snapshot.sourcePolicyDecisionId,
    });
    record.revision.questionSources = structuredClone(
      record.reviewTargetRevision.questionSources,
    );
    record.sourcePolicyGate = {
      eligible: key === "sources-trusted",
      blockers:
        key === "sources-ambiguous"
          ? ["AMBIGUOUS_POLICY_DECISION"]
          : key === "sources-missing"
            ? ["QUESTION_PROVENANCE_MISSING"]
            : classification === "TRUSTED"
              ? []
              : [
                  "SOURCE_POLICY_NOT_TRUSTED",
                  ...policy.reasonCodes,
                  ...(classification === "REVIEW_REQUIRED"
                    ? ["SOURCE_REVIEW_REQUIRED"]
                    : []),
                ],
    };
    records.push(record);
  }
  // Difficulty / Language / stable関係の変更を実際に持つ前Revision。
  const expanded = records.find((r) => r.key === "sources-trusted");
  expanded.previousRevision.frozenContent.stem =
    "架空のRouteに一致したリクエストは、どのServiceへ送られますか。";
  expanded.previousRevision.frozenContent.language = "ja";
  expanded.previousRevision.frozenContent.difficulty = "beginner";
  expanded.previousRevision.frozenContent.knowledgePointIds = [
    "synthetic-knowledge-previous",
  ];
  expanded.previousRevision.frozenContent.questionSources.forEach((s) => {
    s.knowledgePointId = "synthetic-knowledge-previous";
  });
  for (const record of records) {
    record.editSourceReferences = structuredClone(
      record.candidate.question.sourceReferences,
    );
    if (
      record.reviewTargetRevision?.questionSources.some(
        (source) => source.sourceRevisionId === "source-revision-routing-02",
      )
    )
      record.editSourceReferences.push({
        sourceRevisionId: "source-revision-routing-02",
        locator: "section:service-link",
      });
  }
  const missingEvaluation = structuredClone(
    records.find((r) => r.key === "ready"),
  );
  missingEvaluation.key = "evaluation-missing";
  missingEvaluation.label = "exact Revisionに対応するEvaluation未確認";
  records.push(missingEvaluation);
  const sameLocator = structuredClone(
    records.find((r) => r.key === "sources-trusted"),
  );
  sameLocator.key = "same-locator";
  sameLocator.label = "異なるSourceRevisionに同じLocator";
  sameLocator.editSourceReferences = sameLocator.editSourceReferences.map(
    (ref) => ({ ...ref, locator: "section:intro" }),
  );
  records.push(sameLocator);
  const reordered = structuredClone(
    records.find((r) => r.key === "sources-trusted"),
  );
  reordered.key = "diff-reordered";
  reordered.label = "QuestionSource集合の順序だけ異なるRevision";
  reordered.previousRevision.frozenContent = structuredClone(
    reordered.reviewTargetRevision,
  );
  reordered.reviewTargetRevision.questionSources.reverse();
  records.push(reordered);
  // すべての表示例は異なるRevision Identityを持つ。同じIDへ異なるContentを割り当てない。
  for (const record of records.filter(
    (item) =>
      item.key === "content-mismatch" ||
      item.key.startsWith("sources-") ||
      ["evaluation-missing", "same-locator", "diff-reordered"].includes(
        item.key,
      ),
  )) {
    record.questionId = `synthetic-question-${record.key}`;
    record.candidate.candidateId = `synthetic-pipeline-run:${record.key}:revision-candidate`;
    record.candidate.question.candidateId = `synthetic-pipeline-run:${record.key}:question`;
    record.revision.questionRevisionId = `${record.questionId}-r2`;
    record.reviewTargetRevision.questionId = record.questionId;
    record.reviewTargetRevision.questionRevisionId =
      record.revision.questionRevisionId;
    record.reviewTargetRevision.questionSources.forEach((source) => {
      source.questionRevisionId = record.revision.questionRevisionId;
    });
    record.revision.questionSources = structuredClone(
      record.reviewTargetRevision.questionSources,
    );
    record.previousRevision.questionRevisionId = `${record.questionId}-r1`;
    record.previousRevision.frozenContent.questionId = record.questionId;
    record.previousRevision.frozenContent.questionRevisionId =
      record.previousRevision.questionRevisionId;
    record.previousRevision.frozenContent.questionSources.forEach((source) => {
      source.questionRevisionId = record.previousRevision.questionRevisionId;
    });
    record.currentPublishedRevisionId =
      record.previousRevision.questionRevisionId;
  }
  function freeze(value) {
    if (value && typeof value === "object") {
      Object.values(value).forEach(freeze);
      Object.freeze(value);
    }
    return value;
  }
  records.forEach((record) => {
    if (record.key === "sources-review") {
      // Source Review等が外部で完了した後に返る読取例。Question ReviewのPolicy編集ではない。
      record.sourcePolicyRefresh = {
        questionRevisionId: record.reviewTargetRevision.questionRevisionId,
        reviewTargetRevision: structuredClone(record.reviewTargetRevision),
        currentPolicyDecisions: structuredClone(
          records.find((item) => item.key === "sources-trusted")
            .currentPolicyDecisions,
        ),
        sourcePolicyGate: { eligible: true, blockers: [] },
      };
      const resolved = record.sourcePolicyRefresh.currentPolicyDecisions.find(
        (policy) => policy.sourceDocumentId === "source-document-routing-02",
      );
      resolved.sourcePolicyDecisionId = "synthetic-policy-after-source-review";
      resolved.sourceReviewId = "synthetic-source-review-completed";
      resolved.evaluatedAt = "2026-10-04T01:00:00.000Z";
      resolved.termsMetadataSnapshot.checkedAt = resolved.evaluatedAt;
      resolved.termsMetadataSnapshot.checkedBy = "synthetic-source-reviewer";
      resolved.sourceMetadataSnapshot.terms = structuredClone(
        resolved.termsMetadataSnapshot,
      );
      freeze(record.sourcePolicyRefresh);
    }
    // exact評価の読取投影はFixture上の独立した表示例。Candidate PASSの自動転用ではない。
    // 後続Applicationは検証済みEvaluation Inputと凍結時のID解決を記録し、同一Contentを保証する。
    record.reviewEvaluation =
      !record.reviewTargetRevision || record.key === "evaluation-missing"
        ? null
        : {
            targetKind:
              record.key === "content-mismatch"
                ? "Candidate"
                : "QuestionRevision",
            candidateId: record.candidate.candidateId,
            questionRevisionId:
              record.key === "content-mismatch"
                ? null
                : record.reviewTargetRevision.questionRevisionId,
            evaluatedContent: structuredClone(
              record.key === "content-mismatch"
                ? record.candidate.question
                : record.reviewTargetRevision,
            ),
            result: structuredClone(record.candidate.evaluation),
            reviewEligibility: record.candidate.reviewEligibility,
          };
    freeze(record.reviewEvaluation);
    freeze(record.reviewTargetRevision);
    freeze(record.previousRevision?.frozenContent);
  });
  globalThis.reviewerFixtures = records;
})();
