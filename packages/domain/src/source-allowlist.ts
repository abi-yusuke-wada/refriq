import type { AllowedSource } from "./source-governance.js";

export const KONG_MVP_SOURCE_ALLOWLIST: readonly AllowedSource[] =
  Object.freeze([
    Object.freeze({
      id: "kong-certification-scope",
      owner: "Kong",
      hostname: "konghq.com",
      pathPrefix: "/academy/exam-preparation",
      allowedKinds: Object.freeze(["CERTIFICATION_SCOPE"] as const),
      allowedPurposes: Object.freeze(["NORMATIVE_TECHNICAL"] as const),
      notes: "MVP候補の公開Certification Scope。Terms等の個別確認は別途必須。",
    }),
    Object.freeze({
      id: "kong-gateway-documentation",
      owner: "Kong",
      hostname: "developer.konghq.com",
      pathPrefix: "/gateway",
      allowedKinds: Object.freeze(["OFFICIAL_DOCUMENTATION"] as const),
      allowedPurposes: Object.freeze(["NORMATIVE_TECHNICAL"] as const),
      notes:
        "MVP候補の公開Gateway Documentation。Terms等の個別確認は別途必須。",
    }),
  ]);
