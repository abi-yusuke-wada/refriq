export const SOURCE_CLASSIFICATIONS = [
  "TRUSTED",
  "REVIEW_REQUIRED",
  "PROHIBITED",
] as const;

export type SourceClassification = (typeof SOURCE_CLASSIFICATIONS)[number];

export const SOURCE_KINDS = [
  "CERTIFICATION_SCOPE",
  "OFFICIAL_DOCUMENTATION",
  "OFFICIAL_PRODUCT_DOCUMENTATION",
  "OFFICIAL_REFERENCE",
  "OFFICIAL_SAMPLE",
  "OFFICIAL_TRAINING",
  "COMMUNITY_ARTICLE",
  "SECONDARY_SOURCE",
  "EXAM_FEEDBACK",
  "UNKNOWN",
] as const;

export type SourceKind = (typeof SOURCE_KINDS)[number];

export const SOURCE_USAGE_PURPOSES = [
  "NORMATIVE_TECHNICAL",
  "DISCOVERY",
  "SUPPLEMENTAL_HINT",
  "STYLE_REFERENCE",
] as const;

export type SourceUsagePurpose = (typeof SOURCE_USAGE_PURPOSES)[number];

export const PROHIBITED_SOURCE_CATEGORIES = [
  "EXAM_DUMP",
  "LEAKED_EXAM_CONTENT",
  "RECALLED_OR_RECONSTRUCTED_EXAM_ITEM",
  "REAL_EXAM_REPRODUCTION",
  "UNOFFICIAL_ANSWER_KEY_FROM_PROHIBITED_CONTENT",
  "ACCESS_CONTROL_BYPASS",
  "PROHIBITED_BY_TERMS",
] as const;

export type ProhibitedSourceCategory =
  (typeof PROHIBITED_SOURCE_CATEGORIES)[number];

export const SOURCE_POLICY_REASON_CODES = [
  "EXAM_DUMP",
  "LEAKED_CONTENT",
  "RECALLED_EXAM_ITEM",
  "REAL_EXAM_REPRODUCTION",
  "UNOFFICIAL_ANSWER_KEY_FROM_PROHIBITED_CONTENT",
  "ACCESS_CONTROL_BYPASS",
  "PROHIBITED_TERMS",
  "AUTOMATED_ACCESS_DISALLOWED",
  "EXAM_FEEDBACK_NOT_NORMATIVE",
  "NON_OFFICIAL_NORMATIVE_SOURCE",
  "SAMPLE_NOT_NORMATIVE",
  "MISSING_PROVENANCE",
  "SOURCE_ORIGIN_UNVERIFIED",
  "SOURCE_NOT_ALLOWLISTED",
  "SOURCE_USAGE_NOT_ALLOWED",
  "SOURCE_KIND_UNKNOWN",
  "ACCESS_REVIEW_REQUIRED",
  "AUTOMATED_ACCESS_UNKNOWN",
  "TERMS_REVIEW_REQUIRED",
  "LICENSE_REVIEW_REQUIRED",
  "PURPOSE_ALIGNMENT_UNCONFIRMED",
  "PURPOSE_NOT_ALIGNED",
  "SOURCE_REVIEW_REQUIRED",
  "SOURCE_REVIEW_NEEDS_INFORMATION",
  "SOURCE_REVIEW_REJECTED",
  "QUESTION_REVIEW_REQUIRED",
  "QUESTION_PROVENANCE_MISSING",
  "SOURCE_POLICY_NOT_TRUSTED",
  "AMBIGUOUS_POLICY_DECISION",
] as const;

export type SourcePolicyReasonCode =
  (typeof SOURCE_POLICY_REASON_CODES)[number];

export type SourceAccessClassification = "PUBLIC" | "AUTHENTICATED" | "UNKNOWN";

export type AutomatedAccessStatus = "ALLOWED" | "DISALLOWED" | "UNKNOWN";

export type SourceOriginStatus = "VERIFIED" | "UNVERIFIED" | "UNKNOWN";

export type PurposeAlignment = "ALIGNED" | "NOT_ALIGNED" | "UNKNOWN";

export type TermsReviewStatus =
  | "CLEARED_FOR_PRODUCT_USE"
  | "REQUIRES_REVIEW"
  | "PROHIBITED"
  | "UNKNOWN";

export interface SourceTermsMetadata {
  readonly reviewStatus: TermsReviewStatus;
  readonly licenseIdentifier?: string;
  readonly licenseUrl?: string;
  readonly termsUrl?: string;
  readonly checkedAt?: string;
  readonly checkedBy?: string;
  readonly notes?: string;
}

export interface SourcePolicyCandidate {
  readonly sourceDocumentId: string;
  readonly sourceUrl?: string;
  readonly sourceOwner?: string;
  readonly sourceKind: SourceKind;
  readonly usagePurpose: SourceUsagePurpose;
  readonly originStatus: SourceOriginStatus;
  readonly accessClassification: SourceAccessClassification;
  readonly automatedAccess: AutomatedAccessStatus;
  readonly purposeAlignment: PurposeAlignment;
  readonly terms: SourceTermsMetadata;
  readonly prohibitedCategory?: ProhibitedSourceCategory;
  readonly accessControlBypassed?: boolean;
}

export interface AllowedSource {
  readonly id: string;
  readonly owner: string;
  readonly hostname: string;
  readonly pathPrefix?: string;
  readonly allowedKinds: readonly SourceKind[];
  readonly allowedPurposes: readonly SourceUsagePurpose[];
  readonly notes: string;
}

export interface SourcePolicyMetadataSnapshot {
  readonly sourceUrl?: string;
  readonly sourceOwner?: string;
  readonly originStatus: SourceOriginStatus;
  readonly accessClassification: SourceAccessClassification;
  readonly automatedAccess: AutomatedAccessStatus;
  readonly purposeAlignment: PurposeAlignment;
  readonly terms: SourceTermsMetadata;
}

export type SourceReviewOutcome =
  | "APPROVED_FOR_USE"
  | "REJECTED"
  | "NEEDS_MORE_INFORMATION";

export interface SourceReviewRecord {
  readonly sourceReviewId: string;
  readonly sourceDocumentId: string;
  readonly reviewerId: string;
  readonly reviewedAt: string;
  readonly outcome: SourceReviewOutcome;
  readonly approvedPurposes?: readonly SourceUsagePurpose[];
}

export interface SourcePolicyDecision {
  readonly sourcePolicyDecisionId: string;
  readonly sourceDocumentId: string;
  readonly classification: SourceClassification;
  readonly usagePurpose: SourceUsagePurpose;
  readonly sourceKind: SourceKind;
  readonly reasonCodes: readonly SourcePolicyReasonCode[];
  readonly evaluatedAt: string;
  readonly matchedAllowRuleId?: string;
  readonly matchedAllowRuleSnapshot?: AllowedSource;
  readonly sourceReviewId?: string;
  readonly sourceMetadataSnapshot: SourcePolicyMetadataSnapshot;
  readonly termsMetadataSnapshot: SourceTermsMetadata;
}

export interface EvaluateSourcePolicyContext {
  readonly sourcePolicyDecisionId: string;
  readonly evaluatedAt: string;
  readonly sourceReview?: SourceReviewRecord;
}

export interface PolicyGateResult {
  readonly allowed: boolean;
  readonly reasonCodes: readonly SourcePolicyReasonCode[];
}

export interface SourceRevisionMetadataInput {
  readonly sourceRevisionId: string;
  readonly sourceUrlAtRetrieval: string;
  readonly retrievedAt: string;
  readonly contentFingerprint: string;
}

export interface SourceRevisionPolicySnapshot {
  readonly sourceDocumentId: string;
  readonly sourceRevisionId: string;
  readonly sourceUrlAtRetrieval: string;
  readonly retrievedAt: string;
  readonly contentFingerprint: string;
  readonly classificationAtUse: "TRUSTED";
  readonly usagePurposeAtUse: SourceUsagePurpose;
  readonly sourceKindAtUse: SourceKind;
  readonly sourcePolicyDecisionId: string;
  readonly sourceReviewId?: string;
  readonly sourceMetadataSnapshot: SourcePolicyMetadataSnapshot;
  readonly matchedAllowRuleSnapshot?: AllowedSource;
  readonly termsMetadataSnapshot: SourceTermsMetadata;
}

export type SourceRevisionSnapshotResult =
  | {
      readonly allowed: true;
      readonly snapshot: SourceRevisionPolicySnapshot;
      readonly reasonCodes: readonly [];
    }
  | {
      readonly allowed: false;
      readonly reasonCodes: readonly SourcePolicyReasonCode[];
    };

export const QUESTION_SOURCE_RELATIONS = [
  "SUPPORTS_KNOWLEDGE_POINT",
  "SUPPORTS_CORRECT_ANSWER",
  "SUPPORTS_EXPLANATION",
] as const;

export type QuestionSourceRelation = (typeof QUESTION_SOURCE_RELATIONS)[number];

export interface QuestionSourceAssociationInput {
  readonly questionRevisionId: string;
  readonly knowledgePointId: string;
  readonly relation: QuestionSourceRelation;
}

export interface QuestionSource {
  readonly questionRevisionId: string;
  readonly sourceRevisionId: string;
  readonly knowledgePointId: string;
  readonly usagePurpose: "NORMATIVE_TECHNICAL";
  readonly relation: QuestionSourceRelation;
  readonly sourcePolicyDecisionId: string;
}

export type QuestionSourceResult =
  | { readonly allowed: true; readonly questionSource: QuestionSource }
  | {
      readonly allowed: false;
      readonly reasonCodes: readonly SourcePolicyReasonCode[];
    };

export type HumanQuestionReviewDecision =
  | "APPROVE"
  | "REQUEST_CHANGES"
  | "REJECT";

export interface HumanQuestionReview {
  readonly questionReviewId: string;
  readonly questionRevisionId: string;
  readonly reviewerId: string;
  readonly decision: HumanQuestionReviewDecision;
  readonly reviewedAt: string;
}

export interface QuestionPublicationInput {
  readonly questionRevisionId: string;
  readonly knowledgePointIds: readonly string[];
  readonly questionSources: readonly QuestionSource[];
  readonly sourceRevisionSnapshots: readonly SourceRevisionPolicySnapshot[];
  readonly currentPolicyDecisions: readonly SourcePolicyDecision[];
  readonly questionReview?: HumanQuestionReview;
}

const OFFICIAL_SOURCE_KINDS: readonly SourceKind[] = [
  "CERTIFICATION_SCOPE",
  "OFFICIAL_DOCUMENTATION",
  "OFFICIAL_PRODUCT_DOCUMENTATION",
  "OFFICIAL_REFERENCE",
  "OFFICIAL_SAMPLE",
  "OFFICIAL_TRAINING",
];

function isNonEmpty(value: string | undefined): value is string {
  return value !== undefined && value.trim().length > 0;
}

function isValidTimestamp(value: string | undefined): value is string {
  return isNonEmpty(value) && !Number.isNaN(Date.parse(value));
}

function parseHttpUrl(value: string | undefined): URL | undefined {
  if (!isNonEmpty(value)) return undefined;

  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
    if (url.username.length > 0 || url.password.length > 0) return undefined;
    return url;
  } catch {
    return undefined;
  }
}

function hasCompleteTermsReview(terms: SourceTermsMetadata): boolean {
  return (
    terms.reviewStatus === "CLEARED_FOR_PRODUCT_USE" &&
    isValidTimestamp(terms.checkedAt) &&
    isNonEmpty(terms.checkedBy) &&
    (terms.licenseUrl === undefined ||
      parseHttpUrl(terms.licenseUrl) !== undefined) &&
    (terms.termsUrl === undefined || parseHttpUrl(terms.termsUrl) !== undefined)
  );
}

function isValidAllowRule(rule: AllowedSource): boolean {
  return (
    isNonEmpty(rule.id) &&
    isNonEmpty(rule.owner) &&
    isNonEmpty(rule.hostname) &&
    /^[a-z0-9.-]+$/i.test(rule.hostname) &&
    !rule.hostname.includes("*") &&
    isNonEmpty(rule.notes) &&
    rule.allowedKinds.length > 0 &&
    rule.allowedPurposes.length > 0 &&
    (rule.pathPrefix === undefined ||
      (rule.pathPrefix.startsWith("/") &&
        !rule.pathPrefix.includes("?") &&
        !rule.pathPrefix.includes("#")))
  );
}

function pathMatches(
  pathname: string,
  pathPrefix: string | undefined,
): boolean {
  if (pathPrefix === undefined) return true;
  if (!pathPrefix.startsWith("/")) return false;

  const normalized =
    pathPrefix.length > 1 ? pathPrefix.replace(/\/$/, "") : "/";
  return pathname === normalized || pathname.startsWith(`${normalized}/`);
}

function matchesRuleLocation(
  rule: AllowedSource,
  hostname: string,
  pathname: string,
  owner: string | undefined,
): boolean {
  return (
    isValidAllowRule(rule) &&
    isNonEmpty(owner) &&
    rule.hostname.toLowerCase() === hostname.toLowerCase() &&
    rule.owner.trim().toLowerCase() === owner.trim().toLowerCase() &&
    pathMatches(pathname, rule.pathPrefix)
  );
}

function findRuleForLocation(
  candidate: SourcePolicyCandidate,
  rules: readonly AllowedSource[],
): AllowedSource | undefined {
  const url = parseHttpUrl(candidate.sourceUrl);
  if (!url || !isNonEmpty(candidate.sourceOwner)) return undefined;

  return rules.find((rule) =>
    matchesRuleLocation(
      rule,
      url.hostname,
      url.pathname,
      candidate.sourceOwner,
    ),
  );
}

function copyTermsMetadata(terms: SourceTermsMetadata): SourceTermsMetadata {
  return Object.freeze({ ...terms });
}

function copyAllowedSource(rule: AllowedSource): AllowedSource {
  return Object.freeze({
    ...rule,
    allowedKinds: Object.freeze([...rule.allowedKinds]),
    allowedPurposes: Object.freeze([...rule.allowedPurposes]),
  });
}

function copyPolicyMetadata(
  candidate: SourcePolicyCandidate,
): SourcePolicyMetadataSnapshot {
  return Object.freeze({
    ...(candidate.sourceUrl !== undefined
      ? { sourceUrl: candidate.sourceUrl }
      : {}),
    ...(candidate.sourceOwner !== undefined
      ? { sourceOwner: candidate.sourceOwner }
      : {}),
    originStatus: candidate.originStatus,
    accessClassification: candidate.accessClassification,
    automatedAccess: candidate.automatedAccess,
    purposeAlignment: candidate.purposeAlignment,
    terms: copyTermsMetadata(candidate.terms),
  });
}

function makePolicyDecision(
  candidate: SourcePolicyCandidate,
  context: EvaluateSourcePolicyContext,
  classification: SourceClassification,
  reasonCodes: readonly SourcePolicyReasonCode[],
  matchedRule: AllowedSource | undefined,
): SourcePolicyDecision {
  const sourceReviewId = context.sourceReview?.sourceReviewId;
  return Object.freeze({
    sourcePolicyDecisionId: context.sourcePolicyDecisionId,
    sourceDocumentId: candidate.sourceDocumentId,
    classification,
    usagePurpose: candidate.usagePurpose,
    sourceKind: candidate.sourceKind,
    reasonCodes: Object.freeze([...reasonCodes]),
    evaluatedAt: context.evaluatedAt,
    ...(matchedRule ? { matchedAllowRuleId: matchedRule.id } : {}),
    ...(matchedRule
      ? { matchedAllowRuleSnapshot: copyAllowedSource(matchedRule) }
      : {}),
    ...(sourceReviewId ? { sourceReviewId } : {}),
    sourceMetadataSnapshot: copyPolicyMetadata(candidate),
    termsMetadataSnapshot: copyTermsMetadata(candidate.terms),
  });
}

function prohibitedCategoryReason(
  category: ProhibitedSourceCategory,
): SourcePolicyReasonCode {
  switch (category) {
    case "EXAM_DUMP":
      return "EXAM_DUMP";
    case "LEAKED_EXAM_CONTENT":
      return "LEAKED_CONTENT";
    case "RECALLED_OR_RECONSTRUCTED_EXAM_ITEM":
      return "RECALLED_EXAM_ITEM";
    case "REAL_EXAM_REPRODUCTION":
      return "REAL_EXAM_REPRODUCTION";
    case "UNOFFICIAL_ANSWER_KEY_FROM_PROHIBITED_CONTENT":
      return "UNOFFICIAL_ANSWER_KEY_FROM_PROHIBITED_CONTENT";
    case "ACCESS_CONTROL_BYPASS":
      return "ACCESS_CONTROL_BYPASS";
    case "PROHIBITED_BY_TERMS":
      return "PROHIBITED_TERMS";
  }
}

function validSourceReview(
  candidate: SourcePolicyCandidate,
  review: SourceReviewRecord | undefined,
): review is SourceReviewRecord {
  return (
    review !== undefined &&
    review.sourceDocumentId === candidate.sourceDocumentId &&
    isNonEmpty(review.sourceReviewId) &&
    isNonEmpty(review.reviewerId) &&
    isValidTimestamp(review.reviewedAt)
  );
}

function isOfficialSourceKind(kind: SourceKind): boolean {
  return OFFICIAL_SOURCE_KINDS.includes(kind);
}

export function evaluateSourcePolicy(
  candidate: SourcePolicyCandidate,
  allowlist: readonly AllowedSource[],
  context: EvaluateSourcePolicyContext,
): SourcePolicyDecision {
  const review = context.sourceReview;
  const locationRule = findRuleForLocation(candidate, allowlist);
  const matchedRule =
    locationRule?.allowedKinds.includes(candidate.sourceKind) &&
    locationRule.allowedPurposes.includes(candidate.usagePurpose)
      ? locationRule
      : undefined;
  const hardReasons: SourcePolicyReasonCode[] = [];

  if (candidate.prohibitedCategory) {
    hardReasons.push(prohibitedCategoryReason(candidate.prohibitedCategory));
  }
  if (candidate.accessControlBypassed)
    hardReasons.push("ACCESS_CONTROL_BYPASS");
  if (candidate.terms.reviewStatus === "PROHIBITED") {
    hardReasons.push("PROHIBITED_TERMS");
  }
  if (candidate.automatedAccess === "DISALLOWED") {
    hardReasons.push("AUTOMATED_ACCESS_DISALLOWED");
  }
  if (candidate.sourceKind === "EXAM_FEEDBACK") {
    hardReasons.push("EXAM_FEEDBACK_NOT_NORMATIVE");
  }
  if (
    candidate.usagePurpose === "NORMATIVE_TECHNICAL" &&
    candidate.sourceKind !== "UNKNOWN" &&
    !isOfficialSourceKind(candidate.sourceKind)
  ) {
    hardReasons.push("NON_OFFICIAL_NORMATIVE_SOURCE");
  }
  if (
    candidate.usagePurpose === "NORMATIVE_TECHNICAL" &&
    candidate.sourceKind === "OFFICIAL_SAMPLE"
  ) {
    hardReasons.push("SAMPLE_NOT_NORMATIVE");
  }
  if (review?.outcome === "REJECTED" && validSourceReview(candidate, review)) {
    hardReasons.push("SOURCE_REVIEW_REJECTED");
  }

  if (hardReasons.length > 0) {
    return makePolicyDecision(
      candidate,
      context,
      "PROHIBITED",
      [...new Set(hardReasons)],
      matchedRule,
    );
  }

  const reviewReasons: SourcePolicyReasonCode[] = [];
  const url = parseHttpUrl(candidate.sourceUrl);

  if (
    !isNonEmpty(candidate.sourceDocumentId) ||
    !url ||
    !isNonEmpty(candidate.sourceOwner)
  ) {
    reviewReasons.push("MISSING_PROVENANCE");
  }
  if (candidate.sourceKind === "UNKNOWN") {
    reviewReasons.push("SOURCE_KIND_UNKNOWN");
  }
  if (candidate.originStatus !== "VERIFIED") {
    reviewReasons.push("SOURCE_ORIGIN_UNVERIFIED");
  }
  if (!locationRule) {
    reviewReasons.push("SOURCE_NOT_ALLOWLISTED");
  } else if (!matchedRule) {
    reviewReasons.push("SOURCE_USAGE_NOT_ALLOWED");
  }
  if (candidate.accessClassification !== "PUBLIC") {
    reviewReasons.push("ACCESS_REVIEW_REQUIRED");
  }
  if (candidate.automatedAccess === "UNKNOWN") {
    reviewReasons.push("AUTOMATED_ACCESS_UNKNOWN");
  }
  if (candidate.terms.reviewStatus !== "CLEARED_FOR_PRODUCT_USE") {
    reviewReasons.push("TERMS_REVIEW_REQUIRED");
  }
  if (!hasCompleteTermsReview(candidate.terms)) {
    reviewReasons.push("LICENSE_REVIEW_REQUIRED");
  }
  if (candidate.purposeAlignment === "UNKNOWN") {
    reviewReasons.push("PURPOSE_ALIGNMENT_UNCONFIRMED");
  } else if (candidate.purposeAlignment === "NOT_ALIGNED") {
    reviewReasons.push("PURPOSE_NOT_ALIGNED");
  }
  if (review?.outcome === "NEEDS_MORE_INFORMATION") {
    reviewReasons.push("SOURCE_REVIEW_NEEDS_INFORMATION");
  }
  if (review && !validSourceReview(candidate, review)) {
    reviewReasons.push("MISSING_PROVENANCE");
  }
  if (
    !isNonEmpty(context.sourcePolicyDecisionId) ||
    !isValidTimestamp(context.evaluatedAt)
  ) {
    reviewReasons.push("MISSING_PROVENANCE");
  }

  const requiresHumanReview =
    !isOfficialSourceKind(candidate.sourceKind) ||
    (candidate.sourceKind === "OFFICIAL_SAMPLE" &&
      candidate.usagePurpose === "STYLE_REFERENCE") ||
    candidate.accessClassification !== "PUBLIC" ||
    candidate.terms.reviewStatus !== "CLEARED_FOR_PRODUCT_USE" ||
    candidate.originStatus !== "VERIFIED" ||
    candidate.purposeAlignment !== "ALIGNED";
  const reviewApproved =
    validSourceReview(candidate, review) &&
    review.outcome === "APPROVED_FOR_USE" &&
    review.approvedPurposes?.includes(candidate.usagePurpose) === true;

  if (reviewApproved && candidate.accessClassification === "AUTHENTICATED") {
    const accessReviewIndex = reviewReasons.indexOf("ACCESS_REVIEW_REQUIRED");
    if (accessReviewIndex >= 0) reviewReasons.splice(accessReviewIndex, 1);
  }

  if (requiresHumanReview && !reviewApproved) {
    reviewReasons.push("SOURCE_REVIEW_REQUIRED");
  }

  if (reviewReasons.length > 0) {
    return makePolicyDecision(
      candidate,
      context,
      "REVIEW_REQUIRED",
      [...new Set(reviewReasons)],
      matchedRule,
    );
  }

  return makePolicyDecision(candidate, context, "TRUSTED", [], matchedRule);
}

export function canUseForKnowledgeExtraction(
  decision: SourcePolicyDecision | undefined,
): PolicyGateResult {
  if (!decision) {
    return { allowed: false, reasonCodes: ["MISSING_PROVENANCE"] };
  }
  if (decision.classification !== "TRUSTED") {
    return {
      allowed: false,
      reasonCodes:
        decision.classification === "PROHIBITED"
          ? decision.reasonCodes
          : [...decision.reasonCodes, "SOURCE_REVIEW_REQUIRED"],
    };
  }
  if (decision.usagePurpose !== "NORMATIVE_TECHNICAL") {
    return { allowed: false, reasonCodes: ["SOURCE_USAGE_NOT_ALLOWED"] };
  }
  return { allowed: true, reasonCodes: [] };
}

export function canUseForQuestionGeneration(
  decision: SourcePolicyDecision | undefined,
): PolicyGateResult {
  if (!decision) {
    return { allowed: false, reasonCodes: ["MISSING_PROVENANCE"] };
  }
  if (decision.classification !== "TRUSTED") {
    return {
      allowed: false,
      reasonCodes:
        decision.classification === "PROHIBITED"
          ? decision.reasonCodes
          : [...decision.reasonCodes, "SOURCE_REVIEW_REQUIRED"],
    };
  }
  if (
    decision.usagePurpose === "NORMATIVE_TECHNICAL" ||
    (decision.sourceKind === "OFFICIAL_SAMPLE" &&
      decision.usagePurpose === "STYLE_REFERENCE")
  ) {
    return { allowed: true, reasonCodes: [] };
  }
  return { allowed: false, reasonCodes: ["SOURCE_USAGE_NOT_ALLOWED"] };
}

export function createSourceRevisionPolicySnapshot(
  decision: SourcePolicyDecision,
  input: SourceRevisionMetadataInput,
): SourceRevisionSnapshotResult {
  const reasonCodes: SourcePolicyReasonCode[] = [];
  if (decision.classification !== "TRUSTED") {
    if (decision.classification === "PROHIBITED") {
      reasonCodes.push(...decision.reasonCodes);
    } else {
      reasonCodes.push(...decision.reasonCodes, "SOURCE_REVIEW_REQUIRED");
    }
    reasonCodes.push("SOURCE_POLICY_NOT_TRUSTED");
  }
  if (
    !isNonEmpty(input.sourceRevisionId) ||
    !parseHttpUrl(input.sourceUrlAtRetrieval) ||
    !isValidTimestamp(input.retrievedAt) ||
    !isNonEmpty(input.contentFingerprint) ||
    !isNonEmpty(decision.sourceDocumentId) ||
    !isNonEmpty(decision.sourcePolicyDecisionId)
  ) {
    reasonCodes.push("MISSING_PROVENANCE");
  }
  const retrievalUrl = parseHttpUrl(input.sourceUrlAtRetrieval);
  if (
    !decision.matchedAllowRuleSnapshot ||
    !retrievalUrl ||
    !matchesRuleLocation(
      decision.matchedAllowRuleSnapshot,
      retrievalUrl.hostname,
      retrievalUrl.pathname,
      decision.sourceMetadataSnapshot.sourceOwner,
    ) ||
    !decision.matchedAllowRuleSnapshot.allowedKinds.includes(
      decision.sourceKind,
    ) ||
    !decision.matchedAllowRuleSnapshot.allowedPurposes.includes(
      decision.usagePurpose,
    )
  ) {
    reasonCodes.push("SOURCE_NOT_ALLOWLISTED");
  }

  if (reasonCodes.length > 0) {
    return { allowed: false, reasonCodes: [...new Set(reasonCodes)] };
  }

  const snapshot: SourceRevisionPolicySnapshot = Object.freeze({
    sourceDocumentId: decision.sourceDocumentId,
    sourceRevisionId: input.sourceRevisionId,
    sourceUrlAtRetrieval: input.sourceUrlAtRetrieval,
    retrievedAt: input.retrievedAt,
    contentFingerprint: input.contentFingerprint,
    classificationAtUse: "TRUSTED",
    usagePurposeAtUse: decision.usagePurpose,
    sourceKindAtUse: decision.sourceKind,
    sourcePolicyDecisionId: decision.sourcePolicyDecisionId,
    ...(decision.sourceReviewId
      ? { sourceReviewId: decision.sourceReviewId }
      : {}),
    sourceMetadataSnapshot: copyPolicyMetadata({
      sourceDocumentId: decision.sourceDocumentId,
      ...(decision.sourceMetadataSnapshot.sourceUrl !== undefined
        ? { sourceUrl: decision.sourceMetadataSnapshot.sourceUrl }
        : {}),
      ...(decision.sourceMetadataSnapshot.sourceOwner !== undefined
        ? { sourceOwner: decision.sourceMetadataSnapshot.sourceOwner }
        : {}),
      sourceKind: decision.sourceKind,
      usagePurpose: decision.usagePurpose,
      originStatus: decision.sourceMetadataSnapshot.originStatus,
      accessClassification:
        decision.sourceMetadataSnapshot.accessClassification,
      automatedAccess: decision.sourceMetadataSnapshot.automatedAccess,
      purposeAlignment: decision.sourceMetadataSnapshot.purposeAlignment,
      terms: decision.termsMetadataSnapshot,
    }),
    ...(decision.matchedAllowRuleSnapshot
      ? {
          matchedAllowRuleSnapshot: copyAllowedSource(
            decision.matchedAllowRuleSnapshot,
          ),
        }
      : {}),
    termsMetadataSnapshot: copyTermsMetadata(decision.termsMetadataSnapshot),
  });
  return { allowed: true, snapshot, reasonCodes: [] };
}

export function createQuestionSourceAssociation(
  input: QuestionSourceAssociationInput,
  sourceRevisionInput:
    | SourceRevisionPolicySnapshot
    | SourceRevisionSnapshotResult,
): QuestionSourceResult {
  if ("allowed" in sourceRevisionInput) {
    if (!sourceRevisionInput.allowed) {
      return {
        allowed: false,
        reasonCodes: sourceRevisionInput.reasonCodes,
      };
    }
    return createQuestionSourceAssociation(input, sourceRevisionInput.snapshot);
  }

  const sourceRevision = sourceRevisionInput;
  if (
    !isNonEmpty(input.questionRevisionId) ||
    !isNonEmpty(input.knowledgePointId) ||
    !isNonEmpty(sourceRevision.sourceRevisionId) ||
    !isNonEmpty(sourceRevision.sourcePolicyDecisionId)
  ) {
    return { allowed: false, reasonCodes: ["QUESTION_PROVENANCE_MISSING"] };
  }
  if (sourceRevision.classificationAtUse !== "TRUSTED") {
    return { allowed: false, reasonCodes: ["SOURCE_POLICY_NOT_TRUSTED"] };
  }
  if (sourceRevision.usagePurposeAtUse !== "NORMATIVE_TECHNICAL") {
    return { allowed: false, reasonCodes: ["SOURCE_USAGE_NOT_ALLOWED"] };
  }

  return {
    allowed: true,
    questionSource: Object.freeze({
      questionRevisionId: input.questionRevisionId,
      sourceRevisionId: sourceRevision.sourceRevisionId,
      knowledgePointId: input.knowledgePointId,
      usagePurpose: "NORMATIVE_TECHNICAL",
      relation: input.relation,
      sourcePolicyDecisionId: sourceRevision.sourcePolicyDecisionId,
    }),
  };
}

export function canPublishQuestionRevision(
  input: QuestionPublicationInput,
): PolicyGateResult {
  const reasons: SourcePolicyReasonCode[] = [];

  if (
    !isNonEmpty(input.questionRevisionId) ||
    input.knowledgePointIds.length === 0 ||
    input.questionSources.length === 0
  ) {
    reasons.push("QUESTION_PROVENANCE_MISSING");
  }
  if (
    !input.questionReview ||
    !isNonEmpty(input.questionReview.questionReviewId) ||
    input.questionReview.questionRevisionId !== input.questionRevisionId ||
    input.questionReview.decision !== "APPROVE" ||
    !isNonEmpty(input.questionReview.reviewerId) ||
    !isValidTimestamp(input.questionReview.reviewedAt)
  ) {
    reasons.push("QUESTION_REVIEW_REQUIRED");
  }

  const knowledgePointIds = new Set(input.knowledgePointIds);
  const sourcedKnowledgePointIds = new Set<string>();
  for (const questionSource of input.questionSources) {
    if (
      questionSource.questionRevisionId !== input.questionRevisionId ||
      !knowledgePointIds.has(questionSource.knowledgePointId) ||
      questionSource.usagePurpose !== "NORMATIVE_TECHNICAL"
    ) {
      reasons.push("QUESTION_PROVENANCE_MISSING");
      continue;
    }

    sourcedKnowledgePointIds.add(questionSource.knowledgePointId);
    const matchingSnapshots = input.sourceRevisionSnapshots.filter(
      (item) => item.sourceRevisionId === questionSource.sourceRevisionId,
    );
    if (matchingSnapshots.length !== 1) {
      reasons.push("QUESTION_PROVENANCE_MISSING");
      continue;
    }
    const snapshot = matchingSnapshots[0];
    if (!snapshot) {
      reasons.push("QUESTION_PROVENANCE_MISSING");
      continue;
    }
    if (
      snapshot.classificationAtUse !== "TRUSTED" ||
      snapshot.usagePurposeAtUse !== "NORMATIVE_TECHNICAL" ||
      snapshot.sourcePolicyDecisionId !== questionSource.sourcePolicyDecisionId
    ) {
      reasons.push("QUESTION_PROVENANCE_MISSING");
      continue;
    }

    const currentDecisions = input.currentPolicyDecisions.filter(
      (decision) =>
        decision.sourceDocumentId === snapshot.sourceDocumentId &&
        decision.usagePurpose === questionSource.usagePurpose,
    );
    if (currentDecisions.length !== 1) {
      reasons.push(
        currentDecisions.length > 1
          ? "AMBIGUOUS_POLICY_DECISION"
          : "QUESTION_PROVENANCE_MISSING",
      );
    } else if (currentDecisions[0]?.classification !== "TRUSTED") {
      reasons.push("SOURCE_POLICY_NOT_TRUSTED");
      reasons.push(...(currentDecisions[0]?.reasonCodes ?? []));
      if (currentDecisions[0]?.classification === "REVIEW_REQUIRED") {
        reasons.push("SOURCE_REVIEW_REQUIRED");
      }
    }
  }

  for (const knowledgePointId of knowledgePointIds) {
    if (!sourcedKnowledgePointIds.has(knowledgePointId)) {
      reasons.push("QUESTION_PROVENANCE_MISSING");
    }
  }

  const uniqueReasons = [...new Set(reasons)];
  return { allowed: uniqueReasons.length === 0, reasonCodes: uniqueReasons };
}
