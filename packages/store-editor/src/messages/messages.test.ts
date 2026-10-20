import { describe, expect, it } from "vitest";
import ar from "./ar.json";
import en from "./en.json";

const keys = (obj: object, prefix = ""): string[] =>
  Object.entries(obj).flatMap(([key, value]) => (value && typeof value === "object" ? keys(value, `${prefix}${key}.`) : [`${prefix}${key}`]));

describe("editor messages", () => {
  it("ar.json and en.json have identical keys", () => {
    expect(keys(ar).sort()).toEqual(keys(en).sort());
  });

  it("hold the namespaces the editor UI uses", () => {
    expect(Object.keys(en).sort()).toEqual(["mediaLibrary", "storeEditor", "storeForms", "websiteDesign", "websiteTemplates"]);
    expect(Object.keys(en.storeForms)).toEqual(["templates"]);
  });
});
