import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { formInputSchema } from "./store-forms.lib";
import { STARTER_FORM_COPY, starterFormInput } from "./starter-forms.lib";

// The form templates' copy lives with the website editor (@workspace/store-editor messages, merged into the dashboard's).
const messages = (locale: "ar" | "en") =>
  JSON.parse(readFileSync(join(__dirname, `../../../store-editor/src/messages/${locale}.json`), "utf8")).storeForms.templates as Record<string, unknown>;

describe("starter forms (a new store's newsletter and contact forms)", () => {
  it("uses the same copy as the dashboard's form templates", () => {
    for (const locale of ["ar", "en"] as const) {
      for (const kind of ["contact", "newsletter"] as const) {
        const dashboard = messages(locale)[kind] as Record<string, unknown>;
        expect(STARTER_FORM_COPY[kind][locale]).toEqual({
          name: dashboard.name,
          description: dashboard.description,
          submit: dashboard.submit,
          success: dashboard.success,
          fields: dashboard.fields,
        });
      }
    }
  });

  it("builds valid form inputs in both languages, and nothing for other kinds", () => {
    for (const locale of ["ar", "en"] as const) {
      for (const kind of ["contact", "newsletter"]) {
        const input = starterFormInput(kind, locale)!;
        expect(formInputSchema.safeParse(input).success).toBe(true);
        expect(input.fields.every((f) => f.label)).toBe(true);
      }
    }
    expect(starterFormInput("newsletter", "ar")!.name).toBe("اشتراك في النشرة");
    expect(starterFormInput("booking", "ar")).toBeUndefined();
  });
});
