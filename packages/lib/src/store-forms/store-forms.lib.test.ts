import { describe, expect, it } from "vitest";
import {
  escapeCsvCell,
  fieldKeyFromLabel,
  formInputSchema,
  parseStoredFields,
  submissionColumns,
  submissionFingerprint,
  toCsv,
  validateFormSubmission,
  type FormField,
} from "./store-forms.lib";

const fields: FormField[] = [
  { id: "f1", type: "text", key: "name", label: "الاسم", required: true, width: "half" },
  { id: "f2", type: "email", key: "email", label: "Email", required: true, width: "half" },
  { id: "f3", type: "phone", key: "phone", label: "Phone", required: false, width: "full" },
  { id: "f4", type: "select", key: "topic", label: "Topic", required: false, options: ["Order", "Other"], width: "full" },
  { id: "f5", type: "textarea", key: "body", label: "Message", required: true, width: "full" },
  { id: "f6", type: "checkbox", key: "agree", label: "I agree", required: true, width: "full" },
];

const valid = { name: " Sara ", email: "sara@example.com", phone: "+20 100 000 0000", topic: "Order", body: "Hi", agree: "on" };

describe("form definition schema", () => {
  const base = { name: "Contact", fields: [{ id: "a", type: "text", key: "name", label: "Name" }] };

  it("accepts the fixed field set and fills defaults", () => {
    const parsed = formInputSchema.parse(base);
    expect(parsed.status).toBe("active");
    expect(parsed.fields[0]).toMatchObject({ required: false, width: "full" });
    expect(parsed.settings).toEqual({ submitLabel: "", successMessage: "" });
  });

  it("rejects unknown field types, unknown properties and bad keys", () => {
    expect(formInputSchema.safeParse({ ...base, fields: [{ id: "a", type: "file", key: "x", label: "X" }] }).success).toBe(false);
    expect(formInputSchema.safeParse({ ...base, fields: [{ id: "a", type: "text", key: "x", label: "X", html: "<b>" }] }).success).toBe(false);
    expect(formInputSchema.safeParse({ ...base, fields: [{ id: "a", type: "text", key: "Bad Key", label: "X" }] }).success).toBe(false);
    expect(formInputSchema.safeParse({ ...base, fields: [{ id: "a", type: "text", key: "_hp_website", label: "X" }] }).success).toBe(false);
    expect(formInputSchema.safeParse({ ...base, storeId: "x" }).success).toBe(false);
  });

  it("requires options for select only, unique keys and at least one field", () => {
    expect(formInputSchema.safeParse({ ...base, fields: [{ id: "a", type: "select", key: "x", label: "X" }] }).success).toBe(false);
    expect(formInputSchema.safeParse({ ...base, fields: [{ id: "a", type: "text", key: "x", label: "X", options: ["a"] }] }).success).toBe(false);
    expect(
      formInputSchema.safeParse({
        ...base,
        fields: [
          { id: "a", type: "text", key: "x", label: "X" },
          { id: "b", type: "email", key: "x", label: "Y" },
        ],
      }).success,
    ).toBe(false);
    expect(formInputSchema.safeParse({ ...base, fields: [] }).success).toBe(false);
  });

  it("drops stored fields that no longer validate", () => {
    expect(parseStoredFields([{ id: "a", type: "text", key: "ok", label: "Ok" }, { type: "script" }, null, "x"]).map((f) => f.key)).toEqual(["ok"]);
    expect(parseStoredFields("nope")).toEqual([]);
  });

  it("derives field keys from labels", () => {
    expect(fieldKeyFromLabel("Full name", [], 1)).toBe("full_name");
    expect(fieldKeyFromLabel("الاسم", [], 3)).toBe("field_3");
    expect(fieldKeyFromLabel("Email", ["email"], 1)).toBe("email_2");
  });
});

describe("validateFormSubmission", () => {
  it("accepts valid values, trims them and drops unknown keys", () => {
    const result = validateFormSubmission(fields, { ...valid, storeId: "attacker", extra: "x" });
    expect(result).toEqual({
      ok: true,
      values: { name: "Sara", email: "sara@example.com", phone: "+20 100 000 0000", topic: "Order", body: "Hi", agree: "yes" },
    });
  });

  it("reports required, invalid and too-long values per field", () => {
    const result = validateFormSubmission(fields, { email: "nope", phone: "abc", topic: "Hack", body: "x".repeat(5001) });
    expect(result).toEqual({
      ok: false,
      errors: { name: "required", email: "invalid", phone: "invalid", topic: "invalid", body: "too_long", agree: "required" },
    });
  });

  it("refuses non-string values (no nested objects reach the database)", () => {
    const result = validateFormSubmission(fields, { ...valid, name: { $gt: "" }, body: ["a"] });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors).toMatchObject({ name: "invalid", body: "invalid" });
    expect(validateFormSubmission(fields, null).ok).toBe(false);
  });

  it("maps values to the inbox columns", () => {
    const result = validateFormSubmission(fields, valid);
    if (!result.ok) throw new Error("expected valid");
    expect(submissionColumns(fields, result.values)).toEqual({ name: "Sara", email: "sara@example.com", phone: "+20 100 000 0000", message: "Hi" });
  });

  it("fingerprints values independent of key order", () => {
    expect(submissionFingerprint({ a: "1", b: "2" })).toBe(submissionFingerprint({ b: "2", a: "1" }));
    expect(submissionFingerprint({ a: "1" })).not.toBe(submissionFingerprint({ a: "2" }));
  });
});

describe("CSV export", () => {
  it("neutralises formula injection", () => {
    expect(escapeCsvCell("=HYPERLINK(\"http://x\")")).toBe(`"'=HYPERLINK(""http://x"")"`);
    expect(escapeCsvCell("+201000")).toBe("'+201000");
    expect(escapeCsvCell("-1+1")).toBe("'-1+1");
    expect(escapeCsvCell("@SUM(A1)")).toBe("'@SUM(A1)");
    expect(escapeCsvCell("\tcmd")).toBe("'\tcmd");
    expect(escapeCsvCell("safe text")).toBe("safe text");
  });

  it("quotes commas, quotes and newlines", () => {
    expect(escapeCsvCell('a,"b"\nc')).toBe('"a,""b""\nc"');
    expect(escapeCsvCell(null)).toBe("");
  });

  it("writes a BOM, a header and CRLF rows", () => {
    expect(toCsv(["Name", "Note"], [["سارة", "=1+1"]])).toBe("﻿Name,Note\r\nسارة,'=1+1\r\n");
  });
});
