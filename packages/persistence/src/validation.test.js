import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  artifactObjectKey,
  expectedIndexes,
  itemAddress,
  keyPart,
  ordinalPart,
} from "./dynamodb.js";
import { payloadSchemas } from "./schemas.js";
import {
  PersistenceValidationError,
  validateArtifactReference,
  validateDynamoItem,
  validateQuestionRevisionDocument,
  verifyArtifactBody,
} from "./validation.js";
import items from "../../../fixtures/persistence/dynamodb-items.json" with {
  type: "json",
};
import s3Content from "../../../fixtures/persistence/dynamodb-s3-content.json" with {
  type: "json",
};
import revision from "../../../fixtures/persistence/question-revision.json" with {
  type: "json",
};

function item(kind) {
  const fixture = items.find((entry) => entry.kind === kind);
  if (!fixture) throw new Error(`Missing fixture: ${kind}`);
  return structuredClone(fixture);
}

describe("保存Schemaとidentity", () => {
  it("全24種別・35 ItemとS3代替形を検証し、FixtureのKey重複を検出する", () => {
    expect(items).toHaveLength(35);
    expect(new Set(items.map((entry) => entry.kind))).toEqual(
      new Set(Object.keys(payloadSchemas)),
    );
    expect(
      new Set(items.map((entry) => `${entry.table}/${entry.PK}/${entry.SK}`))
        .size,
    ).toBe(items.length);
    for (const fixture of [...items, s3Content])
      expect(validateDynamoItem(fixture)).toBe(fixture);
    expect(validateQuestionRevisionDocument(revision)).toBe(revision);
  });

  it("必須Field・未知Field・未知kind・独立APPROVED状態を拒否する", () => {
    const missingKey = item("CERTIFICATION");
    delete missingKey.PK;
    expect(() => validateDynamoItem(missingKey)).toThrow(
      PersistenceValidationError,
    );
    expect(() =>
      validateDynamoItem({ ...item("CERTIFICATION"), kind: "UNKNOWN" }),
    ).toThrow(PersistenceValidationError);
    const unknownField = item("CERTIFICATION");
    unknownField.payload.unvalidated = "value";
    expect(() => validateDynamoItem(unknownField)).toThrow(
      PersistenceValidationError,
    );
    const state = item("QUESTION_STATE");
    state.payload.status = "APPROVED";
    expect(() => validateDynamoItem(state)).toThrow(PersistenceValidationError);
  });

  it.each(["PK", "SK"])("%sとpayload identityの不一致を拒否する", (key) => {
    expect(() =>
      validateDynamoItem({ ...item("QUESTION_CONTENT"), [key]: "unrelated" }),
    ).toThrow(/address/);
  });

  it("sparse Indexの誤参照と本来ないIndexを拒否する", () => {
    expect(() =>
      validateDynamoItem({
        ...item("QUESTION_HEAD"),
        GSI1SK: "wrong-question",
      }),
    ).toThrow(/Sparse index/);
    expect(() =>
      validateDynamoItem({
        ...item("CERTIFICATION"),
        GSI1PK: "unexpected-index",
      }),
    ).toThrow(/Sparse index/);
  });

  it("Policy用途別pointerとSource identityの不一致を拒否する", () => {
    const current = item("POLICY_CURRENT");
    current.payload.decision.sourceDocumentId = "another-source";
    expect(() => validateDynamoItem(current)).toThrow(/policy pointer/);
  });

  it("未試行StageをRUNNINGとする不整合を拒否する", () => {
    const stage = item("PIPELINE_STAGE");
    stage.payload.attempt = 0;
    stage.payload.status = "RUNNING";
    delete stage.GSI1PK;
    delete stage.GSI1SK;
    expect(() => validateDynamoItem(stage)).toThrow(/Unattempted Stage/);
  });

  it.each([
    "SOURCE_REVISION",
    "QUESTION_CONTENT",
    "QUESTION_REVIEW",
    "ARTIFACT_MANIFEST",
  ])("長期事実%sへのTTLを拒否する", (kind) => {
    expect(() => validateDynamoItem({ ...item(kind), expiresAt: 1 })).toThrow(
      /not TTL eligible/,
    );
  });

  it.each(["PIPELINE_EVENT", "OPERATION_RECEIPT"])(
    "TTL候補%sのみ期限属性を許す",
    (kind) => {
      expect(() =>
        validateDynamoItem({ ...item(kind), expiresAt: 1 }),
      ).not.toThrow();
    },
  );

  it("400KBを超えるinline Contentを拒否する", () => {
    const content = item("QUESTION_CONTENT");
    content.payload.revision.question.stem = "x".repeat(401 * 1024);
    expect(() => validateDynamoItem(content)).toThrow(/inline storage budget/);
  });

  it("同じCandidate IDを別Runで使ってもQueue Keyが衝突しない", () => {
    const first = item("REVIEW_TARGET").payload;
    const second = { ...first, pipelineRunId: "another-run" };
    expect(itemAddress("REVIEW_TARGET", first).PK).not.toBe(
      itemAddress("REVIEW_TARGET", second).PK,
    );
    expect(expectedIndexes("REVIEW_TARGET", first).GSI2SK).not.toBe(
      expectedIndexes("REVIEW_TARGET", second).GSI2SK,
    );
  });

  it("opaque IDの区切り衝突を避け、ordinal 2を10より前に並べる", () => {
    expect(keyPart("a#b")).not.toBe(keyPart("a%23b"));
    expect(ordinalPart(2) < ordinalPart(10)).toBe(true);
  });
});

describe("Revision内容・Provenanceと日時Field", () => {
  it("未知正答・重複Option・説明不足・exact Provenance不一致を拒否する", () => {
    const unknownCorrect = structuredClone(revision);
    unknownCorrect.question.correctOptionIds = ["missing-option"];
    expect(() => validateQuestionRevisionDocument(unknownCorrect)).toThrow(
      /Unknown correct option/,
    );
    const duplicate = structuredClone(revision);
    duplicate.question.options[1].id = "A";
    expect(() => validateQuestionRevisionDocument(duplicate)).toThrow(
      /Duplicate option/,
    );
    const missingExplanation = structuredClone(revision);
    missingExplanation.question.optionExplanations["missing-option"] =
      missingExplanation.question.optionExplanations.A;
    delete missingExplanation.question.optionExplanations.A;
    expect(() => validateQuestionRevisionDocument(missingExplanation)).toThrow(
      /explanation identity/,
    );
    const mismatch = structuredClone(revision);
    mismatch.questionSources[0].questionRevisionId = "another-revision";
    expect(() => validateQuestionRevisionDocument(mismatch)).toThrow(
      /exact Revision/,
    );
  });

  it.each(["optionCreatedAt", "retrievedAt"])(
    "有効なOption ID %sの説明文を日時と扱わない",
    (optionId) => {
      const valid = structuredClone(revision);
      valid.question.options[0].id = optionId;
      valid.question.correctOptionIds = [optionId];
      valid.question.optionExplanations[optionId] =
        valid.question.optionExplanations.A;
      delete valid.question.optionExplanations.A;
      expect(validateQuestionRevisionDocument(valid)).toBe(valid);
      const content = item("QUESTION_CONTENT");
      content.payload.revision = valid;
      expect(validateDynamoItem(content)).toBe(content);
    },
  );

  it("実際の日時Fieldと不正な暦日を引き続き拒否する", () => {
    expect(() =>
      validateQuestionRevisionDocument({
        ...revision,
        createdAt: "2026-02-30T00:00:00Z",
      }),
    ).toThrow(/Invalid timestamp/);
    const current = item("POLICY_CURRENT");
    current.payload.decision.termsMetadataSnapshot.checkedAt = "not-a-date";
    expect(() => validateDynamoItem(current)).toThrow(/Invalid timestamp/);
    const review = item("QUESTION_REVIEW");
    review.payload.reviewedAt = "not-a-date";
    expect(() => validateDynamoItem(review)).toThrow(/Invalid timestamp/);
    const manifest = item("ARTIFACT_MANIFEST");
    manifest.payload.artifact.createdAt = "2026-02-30T00:00:00Z";
    expect(() => validateDynamoItem(manifest)).toThrow(/Invalid timestamp/);
  });

  it("Domain日時のoffset表記を変換・上書きしない", () => {
    const current = item("POLICY_CURRENT");
    current.payload.decision.evaluatedAt = "2026-10-04T09:00:00+09:00";
    expect(validateDynamoItem(current).payload.decision.evaluatedAt).toBe(
      "2026-10-04T09:00:00+09:00",
    );
  });
});

describe("Artifact参照と本文", () => {
  const bodies = {
    "synthetic-original1": "source-original.txt",
    "synthetic-normalized1": "source-normalized.json",
    "synthetic-question-content1": "question-revision.json",
    "synthetic-run-input1": "pipeline-input.json",
    "synthetic-evaluation1": "pipeline-evaluation.json",
    "synthetic-candidate1": "pipeline-candidate.json",
  };
  const manifests = items.filter((entry) => entry.kind === "ARTIFACT_MANIFEST");

  it.each(manifests)(
    "Fixture本文のchecksum / sizeを照合: $payload.artifact.artifactId",
    async (manifest) => {
      const reference = manifest.payload.artifact;
      const body = await readFile(
        new URL(
          `../../../fixtures/persistence/${bodies[reference.artifactId]}`,
          import.meta.url,
        ),
      );
      await expect(
        verifyArtifactBody(reference, body),
      ).resolves.toBeUndefined();
      const modified = new Uint8Array(body);
      modified[0] ^= 1;
      await expect(verifyArtifactBody(reference, modified)).rejects.toThrow(
        /checksum/,
      );
      await expect(
        verifyArtifactBody(reference, body.subarray(1)),
      ).rejects.toThrow(/byte size/);
    },
  );

  it("不正checksumとmutable objectKeyを持つmanifestを拒否する", () => {
    const manifest = item("ARTIFACT_MANIFEST");
    expect(() =>
      validateArtifactReference({
        ...manifest.payload.artifact,
        checksum: { algorithm: "SHA-256", value: "invalid" },
      }),
    ).toThrow(PersistenceValidationError);
    manifest.payload.objectKey = "source/title/input.txt";
    expect(() => validateDynamoItem(manifest)).toThrow(/immutable object key/);
  });

  it("S3 KeyにURL等を直接連結せず、別Revisionの同Artifact IDを区別する", () => {
    const owner = {
      kind: "QUESTION_CONTENT",
      questionId: "q#/1",
      questionRevisionId: "qr1",
    };
    const first = artifactObjectKey(owner, "opaque-artifact");
    expect(first).toContain("q%23%2F1");
    expect(first).not.toBe(
      artifactObjectKey(
        { ...owner, questionRevisionId: "qr2" },
        "opaque-artifact",
      ),
    );
  });
});
