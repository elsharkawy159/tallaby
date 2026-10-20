import { describe, expect, it } from "vitest";
import editorAr from "@workspace/store-editor/messages/ar.json";
import editorEn from "@workspace/store-editor/messages/en.json";
import ar from "../../messages/ar.json";
import en from "../../messages/en.json";
import { mergeMessages } from "./merge-messages.lib";

const keys = (obj: object, prefix = ""): string[] =>
  Object.entries(obj).flatMap(([key, value]) => (value && typeof value === "object" ? keys(value, `${prefix}${key}.`) : [`${prefix}${key}`]));

describe("mergeMessages", () => {
  it("merges nested namespaces key by key without changing the inputs", () => {
    const app = { storeForms: { list: { title: "Forms" } }, nav: { home: "Home" } };
    const pkg = { storeForms: { templates: { contact: { name: "Contact" } } }, storeEditor: { title: "Editor" } };
    expect(mergeMessages(app, pkg)).toEqual({
      storeForms: { list: { title: "Forms" }, templates: { contact: { name: "Contact" } } },
      nav: { home: "Home" },
      storeEditor: { title: "Editor" },
    });
    expect(app).toEqual({ storeForms: { list: { title: "Forms" } }, nav: { home: "Home" } });
  });

  it("lets the later source win for the same leaf", () => {
    expect(mergeMessages({ a: { b: "1" } }, { a: { b: "2" } })).toEqual({ a: { b: "2" } });
  });

  it("the dashboard and editor messages never define the same key (nothing is silently overridden)", () => {
    for (const [app, editor] of [
      [ar, editorAr],
      [en, editorEn],
    ] as const) {
      const appKeys = new Set(keys(app));
      expect(keys(editor).filter((key) => appKeys.has(key))).toEqual([]);
    }
  });

  it("the merged dashboard messages have identical keys in ar and en", () => {
    expect(keys(mergeMessages(ar, editorAr)).sort()).toEqual(keys(mergeMessages(en, editorEn)).sort());
  });
});
