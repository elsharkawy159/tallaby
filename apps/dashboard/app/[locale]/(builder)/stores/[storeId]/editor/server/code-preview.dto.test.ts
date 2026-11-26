import { describe, expect, it } from "vitest";
import { CODE_PREVIEW_MAX_FILE_BYTES, CODE_PREVIEW_MAX_VALUES_BYTES, codePreviewInputSchema } from "./code-preview.dto";

const UUID = "3f2b8c1e-4a5d-4e6f-9a7b-1c2d3e4f5a6b";
const valid = { nodeId: "code_1-A", file: "<p>{{ section.settings.title }}</p>", settings: { title: { ar: "أ", en: "A" } }, blocks: [], locale: "ar" };

const ok = (over: Record<string, unknown>) => codePreviewInputSchema.safeParse({ ...valid, ...over }).success;

describe("codePreviewInputSchema", () => {
  it("accepts a normal draft, with or without page and product ids", () => {
    expect(ok({})).toBe(true);
    expect(ok({ pageId: UUID, productId: UUID, locale: "en" })).toBe(true);
  });

  it("checks the node id", () => {
    expect(ok({ nodeId: "" })).toBe(false);
    expect(ok({ nodeId: "a b" })).toBe(false);
    expect(ok({ nodeId: 'x"]{}' })).toBe(false);
    expect(ok({ nodeId: "a".repeat(65) })).toBe(false);
    expect(ok({ nodeId: "a".repeat(64) })).toBe(true);
  });

  it("checks the locale and the ids", () => {
    expect(ok({ locale: "fr" })).toBe(false);
    expect(ok({ pageId: "home" })).toBe(false);
    expect(ok({ productId: "1; drop table" })).toBe(false);
  });

  it("caps the file in UTF-8 bytes", () => {
    expect(ok({ file: "a".repeat(CODE_PREVIEW_MAX_FILE_BYTES) })).toBe(true);
    expect(ok({ file: "a".repeat(CODE_PREVIEW_MAX_FILE_BYTES + 1) })).toBe(false);
    // Arabic letters are 2 bytes each.
    expect(ok({ file: "ب".repeat(CODE_PREVIEW_MAX_FILE_BYTES / 2 + 1) })).toBe(false);
    expect(ok({ file: 42 })).toBe(false);
  });

  it("caps settings and blocks together, and refuses values JSON can't hold", () => {
    const half = "x".repeat(CODE_PREVIEW_MAX_VALUES_BYTES / 2);
    expect(ok({ settings: { a: half }, blocks: [half] })).toBe(false);
    expect(ok({ settings: { a: "x".repeat(1000) } })).toBe(true);
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    expect(ok({ settings: cyclic })).toBe(false);
  });
});
