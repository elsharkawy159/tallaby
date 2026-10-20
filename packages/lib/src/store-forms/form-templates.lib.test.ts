import { describe, expect, it } from "vitest";
import { FORM_TEMPLATES, buildTemplateForm, getFormTemplate } from "./form-templates.lib";
import { formInputSchema, submissionColumns } from "./store-forms.lib";

const echo = (key: string) => `[${key}]`;

describe("form templates", () => {
  it("has unique ids and finds them by id only", () => {
    expect(new Set(FORM_TEMPLATES.map((t) => t.id)).size).toBe(FORM_TEMPLATES.length);
    expect(getFormTemplate("contact")?.id).toBe("contact");
    expect(getFormTemplate("__proto__")).toBeUndefined();
    expect(getFormTemplate(42)).toBeUndefined();
  });

  it.each(FORM_TEMPLATES.map((t) => [t.id, t] as const))("%s builds a valid form", (_id, template) => {
    const parsed = formInputSchema.safeParse(buildTemplateForm(template, echo));
    expect(parsed.success).toBe(true);
  });

  it("labels fields, placeholders, options and settings through the translate function", () => {
    const form = buildTemplateForm(getFormTemplate("returns")!, echo);
    expect(form.name).toBe("[name]");
    expect(form.settings).toEqual({ submitLabel: "[submit]", successMessage: "[success]" });
    const reason = form.fields.find((f) => f.key === "reason")!;
    expect(reason.label).toBe("[fields.reason]");
    expect(reason.options).toContain("[options.damaged]");
    expect(form.fields.find((f) => f.key === "order_number")!.placeholder).toBe("[placeholders.order_number]");
  });

  it("fills the inbox columns for a typical lead", () => {
    const template = getFormTemplate("quote")!;
    const { fields } = formInputSchema.parse(buildTemplateForm(template, echo));
    const columns = submissionColumns(fields, { name: "Mona", phone: "+201001234567", email: "m@x.com", product: "Sofa", message: "Two pieces" });
    expect(columns).toEqual({ name: "Mona", email: "m@x.com", phone: "+201001234567", message: "Two pieces" });
  });
});
