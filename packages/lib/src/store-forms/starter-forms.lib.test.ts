import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { formInputSchema } from "./store-forms.lib";
import { STARTER_FORM_COPY, localizeStarterForm, starterFormInput } from "./starter-forms.lib";

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

describe("localizeStarterForm", () => {
  const asShown = (kind: "contact" | "newsletter", locale: "ar" | "en") => {
    const parsed = formInputSchema.parse(starterFormInput(kind, locale));
    return { fields: parsed.fields, submitLabel: parsed.settings.submitLabel, successMessage: parsed.settings.successMessage };
  };

  it("shows a starter form made in one language in the other", () => {
    for (const kind of ["contact", "newsletter"] as const) {
      expect(localizeStarterForm(asShown(kind, "ar"), "en")).toEqual(asShown(kind, "en"));
      expect(localizeStarterForm(asShown(kind, "en"), "ar")).toEqual(asShown(kind, "ar"));
    }
  });

  it("keeps text the seller wrote, and the same object when nothing changes", () => {
    const form = asShown("contact", "ar");
    expect(localizeStarterForm(form, "ar")).toBe(form);
    const own = { ...form, submitLabel: "ابعت دلوقتي" };
    expect(localizeStarterForm(own, "en").submitLabel).toBe("ابعت دلوقتي");
  });
});
