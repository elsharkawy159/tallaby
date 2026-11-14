/**
 * A new element starts in the store's default language: Arabic-first
 * defaults stay as they are in an Arabic store, and an English store gets
 * English in `props` with the Arabic in `translations.ar`, the way inserted
 * designs are stored.
 */
import { describe, expect, it } from "vitest";
import type { ComponentNode } from "../config/schema";
import { getDesign, instantiateDesign } from "../designs";
import { textScript } from "../templates/fill-translations";
import { ELEMENT_DEFINITIONS, getElementDefinition, type ElementType } from "./registry";
import { createNode } from "./tree";

const ids = () => {
  let n = 0;
  return () => `n${++n}`;
};

type Overlay = Record<string, Record<string, unknown> | undefined>;
const overlays = (node: ComponentNode) => (node.props.translations ?? {}) as Overlay;

/** Every translatable text of a tree: `[type.key, main value, other-language overlay]`. */
function texts(node: ComponentNode, other: "ar" | "en", out: [string, string, unknown][] = []) {
  for (const field of getElementDefinition(node.type)?.fields ?? []) {
    const value = node.props[field.key];
    if (field.translatable && typeof value === "string" && value.trim()) out.push([`${node.type}.${field.key}`, value, overlays(node)[other]?.[field.key]]);
  }
  for (const child of node.children) texts(child, other, out);
  return out;
}

const TYPES = ELEMENT_DEFINITIONS.map((definition) => definition.type as ElementType);

describe("createNode in the store's default language", () => {
  it("leaves every element exactly as before in an Arabic store", () => {
    for (const type of TYPES) expect(createNode(type, ids(), "ar"), type).toEqual(createNode(type, ids()));
  });

  it("writes every element's text in English in an English store, with its Arabic in the overlay", () => {
    const problems: string[] = [];
    for (const type of TYPES) {
      const arabic = createNode(type, ids());
      const english = createNode(type, ids(), "en");
      for (const [where, main, ar] of texts(english, "ar")) {
        if (textScript(main) === "ar") problems.push(`${type} ${where}: main text is Arabic "${main}"`);
        if (textScript(main) === "en" && (typeof ar !== "string" || textScript(ar) !== "ar")) problems.push(`${type} ${where}: no Arabic overlay for "${main}"`);
      }
      // Nothing is lost: the Arabic texts are the Arabic store's, in the same order.
      const arabicTexts = texts(arabic, "en").map(([where, main]) => [where, main]);
      const overlayTexts = texts(english, "ar").map(([where, main, ar]) => [where, typeof ar === "string" ? ar : main]);
      expect(overlayTexts, type).toEqual(arabicTexts);
    }
    expect(problems).toEqual([]);
  });

  it("gives a heading English text and keeps its other props", () => {
    const heading = createNode("heading", ids(), "en");
    expect(heading.props).toMatchObject({ text: "New heading", translations: { ar: { text: "عنوان جديد" } } });
    expect(overlays(heading).en).toBeUndefined();
    const { text: _ar, ...rest } = createNode("heading", ids()).props;
    const { text: _en, translations: _t, ...englishRest } = heading.props;
    expect(englishRest).toEqual(rest);
  });

  it("rebases children that already carry both languages (carousel slides)", () => {
    const carousel = createNode("carousel", ids(), "en");
    const slideHeading = carousel.children[0]!.children[0]!;
    expect(slideHeading.props).toMatchObject({ text: "Slide 1", translations: { ar: { text: "الشريحة 1" } } });
  });
});

describe("design insertion in the store's default language", () => {
  it("starts an English store's design with English text and the Arabic in the overlay", () => {
    const design = getDesign("hero-carousel");
    expect(design).toBeTruthy();
    const instance = instantiateDesign(design!, { id: "s1", defaultLocale: "en" });
    const found = texts(instance.componentTree![0]!, "ar");
    expect(found.length).toBeGreaterThan(0);
    for (const [where, main, ar] of found) {
      expect(textScript(main), where).not.toBe("ar");
      if (textScript(main) === "en") expect(typeof ar === "string" && textScript(ar) === "ar", `${where}: ${main}`).toBe(true);
    }
  });
});
