import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { SectionInstance } from "../config/schema";
import { movePartToSlot } from "../core/slots";
import type { RenderContext } from "../core/types";
import { STORE_SECTIONS, storeSectionRegistry } from "../sections";
import { SectionRenderer } from "./render";

const ctx = (mode: RenderContext["mode"] = "public"): RenderContext => ({
  mode,
  locale: "ar",
  dir: "rtl",
  store: { name: "S", url: "https://s.test", contact: {} },
  pages: [],
  catalog: { products: {}, categories: [] },
  Link: ({ href, className, children, ...rest }) => (
    <a href={href} className={className} data-part={rest["data-part"]}>
      {children}
    </a>
  ),
  imageUrl: (src) => (src ? `https://cdn/${src}` : null),
  formatPrice: (n) => `${n}`,
});

const html = (instance: SectionInstance, mode?: RenderContext["mode"]) =>
  renderToStaticMarkup(<SectionRenderer instance={instance} registry={storeSectionRegistry} ctx={ctx(mode)} />);

/** Part keys in document order. */
const partOrder = (markup: string, id = "s1") => [...markup.matchAll(new RegExp(`data-part="${id}::([^"]+)"`, "g"))].map((m) => m[1]);

const withSlots = STORE_SECTIONS.filter((d) => d.slots?.length);

describe("slot contract (P4B-16)", () => {
  it("covers the Content sections with movable parts", () => {
    expect(withSlots.map((d) => d.id).sort()).toEqual(["cta-banner", "image-with-text", "rich-text"]);
  });

  for (const definition of withSlots) {
    it(`${definition.id}: slots name real props, each part has one home, and each slot renders`, () => {
      const homes = definition.slots!.flatMap((s) => s.parts);
      expect(new Set(homes).size, "a part listed in two slots").toBe(homes.length);
      for (const slot of definition.slots!) {
        for (const key of [...slot.parts, ...(slot.accepts ?? [])]) {
          expect(definition.propDefinitions.some((p) => p.key === key), `${slot.key}.${key}`).toBe(true);
          expect(homes, `${slot.key} accepts unmanaged ${key}`).toContain(key);
        }
      }
      const props = { ...definition.defaultProps, ctaLabel: "Go", ctaHref: "/x", image: "a.jpg" };
      const markup = html({ id: "s1", sectionId: definition.id, version: definition.version, props }, "edit");
      for (const slot of definition.slots!) expect(markup).toContain(`data-slot="s1::${slot.key}"`);
    });
  }
});

describe("slot layouts render", () => {
  const imageText = (slots?: SectionInstance["slots"]): SectionInstance => ({
    id: "s1",
    sectionId: "image-with-text",
    version: 1,
    props: { title: "T", body: "B", image: "a.jpg", ctaLabel: "Go", ctaHref: "/x" },
    ...(slots && { slots }),
  });

  it("keeps the default order without a stored layout", () => {
    expect(partOrder(html(imageText()))).toEqual(["image", "title", "body", "ctaLabel"]);
  });

  it("follows a reordered and moved layout", () => {
    const definition = storeSectionRegistry.get("image-with-text")!;
    let instance = movePartToSlot(imageText(), definition.slots!, "ctaLabel", "text", 0);
    instance = movePartToSlot(instance, definition.slots!, "title", "media", 0);
    expect(partOrder(html(instance))).toEqual(["title", "image", "ctaLabel", "body"]);
  });

  it("an emptied column is a drop area in the editor and gone on the storefront", () => {
    const definition = storeSectionRegistry.get("image-with-text")!;
    const instance = movePartToSlot(imageText(), definition.slots!, "image", "text", 0);
    const pub = html(instance);
    expect(pub).not.toContain('data-slot="s1::media"');
    expect(pub).not.toContain("md:grid-cols-2");
    const edit = html(instance, "edit");
    expect(edit).toMatch(/data-slot="s1::media" class="[^"]*border-dashed/);
    expect(edit).toContain("md:grid-cols-2");
  });

  it("reorders rich text and call to action", () => {
    const rich = storeSectionRegistry.get("rich-text")!;
    const cta = storeSectionRegistry.get("cta-banner")!;
    const r = movePartToSlot<SectionInstance>({ id: "s1", sectionId: "rich-text", version: 1, props: { title: "T", body: "B" } }, rich.slots!, "body", "content", 0);
    expect(partOrder(html(r))).toEqual(["body", "title"]);
    const c = movePartToSlot<SectionInstance>(
      { id: "s1", sectionId: "cta-banner", version: 1, props: { title: "T", text: "X", ctaLabel: "Go", ctaHref: "/x" } },
      cta.slots!,
      "ctaLabel",
      "content",
      0,
    );
    expect(partOrder(html(c))).toEqual(["ctaLabel", "title", "text"]);
  });

  it("marks highlight items for reordering", () => {
    const markup = html({ id: "s1", sectionId: "features", version: 1, props: {} });
    expect(markup).toContain('data-item="s1::items.0"');
    expect(markup).toContain('data-item="s1::items.2"');
  });

  it("marks FAQ items, and every item marker names a real collection", () => {
    expect(html({ id: "s1", sectionId: "faq", version: 1, props: {} })).toContain('data-item="s1::items.0"');
    for (const definition of STORE_SECTIONS) {
      const props: Record<string, unknown> = { ...definition.defaultProps };
      for (const collection of definition.itemCollections ?? []) props[collection.key] = [collection.newItemTemplate()];
      const markup = html({ id: "s1", sectionId: definition.id, version: definition.version, props }, "edit");
      for (const [, key] of markup.matchAll(/data-item="s1::([^".]+).d+"/g)) {
        expect(definition.itemCollections?.some((c) => c.key === key), `${definition.id}: ${key}`).toBe(true);
      }
    }
  });
});
