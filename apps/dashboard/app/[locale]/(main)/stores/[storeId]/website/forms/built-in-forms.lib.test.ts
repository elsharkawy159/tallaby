import { describe, expect, it } from "vitest";
import { STARTER_FORM_COPY } from "@workspace/lib/store-forms/starter";
import { parseBuiltInFormPointers, resolveBuiltInForms } from "./built-in-forms.lib";

const f = (id: string, name: string, fields: [string, string][]) => ({
  id,
  name,
  fields: fields.map(([key, type]) => ({ key, type: type as "text" })),
});

const newsletter = f("n1", "Signups", [["email", "email"], ["name", "text"], ["consent", "checkbox"]]);
const contact = f("c1", "Talk to us", [["name", "text"], ["email", "email"], ["message", "textarea"]]);
const quote = f("q1", "Quote", [["name", "text"], ["email", "email"], ["product", "text"], ["message", "textarea"]]);

describe("parseBuiltInFormPointers", () => {
  it("keeps string ids of known kinds only", () => {
    expect(parseBuiltInFormPointers(null)).toEqual({});
    expect(parseBuiltInFormPointers({ builtInForms: [] })).toEqual({});
    expect(parseBuiltInFormPointers({ builtInForms: { newsletter: "a", contact: 5, evil: "x" } })).toEqual({ newsletter: "a" });
  });
});

describe("resolveBuiltInForms", () => {
  it("prefers the saved pointer", () => {
    const other = f("n2", "Other", [["email", "email"]]);
    expect(resolveBuiltInForms({ newsletter: "n2" }, [newsletter, other]).newsletter?.id).toBe("n2");
  });

  it("ignores a pointer to a form that is gone", () => {
    expect(resolveBuiltInForms({ newsletter: "gone" }, [newsletter]).newsletter?.id).toBe("n1");
  });

  it("matches the starter name in either language", () => {
    const renamedShape = f("x", STARTER_FORM_COPY.contact.ar.name as string, [["city", "text"]]);
    expect(resolveBuiltInForms({}, [renamedShape]).contact?.id).toBe("x");
    const en = f("y", STARTER_FORM_COPY.newsletter.en.name as string, [["phone", "phone"]]);
    expect(resolveBuiltInForms({}, [en]).newsletter?.id).toBe("y");
  });

  it("matches the starter shape and leaves other forms alone", () => {
    const result = resolveBuiltInForms({}, [quote, contact, newsletter]);
    expect(result.newsletter?.id).toBe("n1");
    expect(result.contact?.id).toBe("c1");
    expect(resolveBuiltInForms({}, [quote])).toEqual({});
  });

  it("never uses one form for both kinds", () => {
    const result = resolveBuiltInForms({ newsletter: "c1", contact: "c1" }, [contact]);
    expect(result.newsletter?.id).toBe("c1");
    expect(result.contact).toBeUndefined();
  });
});
