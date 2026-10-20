import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { sectionInstanceSchema } from "../config/schema";
import type { RenderContext } from "../core/types";
import type { NodeTemplate } from "../elements/tree";
import { SectionRenderer } from "../render/render";
import { storeSectionRegistry } from "../sections";
import { DESIGNS, STOCK_INDUSTRIES, createTreeBuilder, instantiateDesign } from ".";
import { instantiateTemplate } from "./builder";
import { PHOTO_SLOT_RE, designSlotTree, photoSlot, resolvePhotoSlot, resolvePhotoSlots } from "./photo-slots";
import { stockPhoto } from "./stock-photos";

const INDUSTRIES = [...STOCK_INDUSTRIES, undefined];
const json = (value: unknown) => JSON.stringify(value);

describe("photo slots", () => {
  it("formats and matches slots", () => {
    expect(photoSlot("photo", 3)).toBe("stock:photo:3");
    expect(photoSlot("person", 0)).toBe("stock:person:0");
    expect(PHOTO_SLOT_RE.test("stock:photo:3")).toBe(true);
    expect(PHOTO_SLOT_RE.test("stock:other:3")).toBe(false);
    expect(PHOTO_SLOT_RE.test("stock:photo:3x")).toBe(false);
  });

  it("leaves a non-slot src alone", () => {
    expect(resolvePhotoSlot("https://a/b.jpg")).toBe("https://a/b.jpg");
    expect(resolvePhotoSlot("stock:photo:2", "fashion")).toBe(stockPhoto("fashion", 2));
  });

  it("resolving a slot tree equals the direct tree, for every design and industry", () => {
    for (const d of DESIGNS) {
      const slots = designSlotTree(d);
      for (const industry of INDUSTRIES) {
        const resolved = resolvePhotoSlots(slots, industry);
        expect(resolved, `${d.id} ${industry}`).toEqual(d.tree(createTreeBuilder(industry)));
        expect(json(resolved)).not.toMatch(/"stock:/);
      }
    }
  }, 60_000);

  it("instantiateTemplate matches instantiateDesign for every design, industry and locale", () => {
    for (const d of DESIGNS) {
      const slots = designSlotTree(d);
      for (const industry of INDUSTRIES) {
        for (const defaultLocale of ["ar", "en"] as const) {
          const viaTemplate = { ...instantiateTemplate(slots, { id: "x", industry, defaultLocale }), source: `${d.id}@${d.version}` };
          expect(viaTemplate, `${d.id} ${industry} ${defaultLocale}`).toEqual(instantiateDesign(d, { id: "x", industry, defaultLocale }));
        }
      }
    }
  }, 120_000);

  it("keepSlots keeps the placeholders", () => {
    const d = DESIGNS.find((x) => json(designSlotTree(x)).includes('"stock:'))!;
    const instance = instantiateTemplate(designSlotTree(d), { id: "x", industry: "fashion", keepSlots: true });
    expect(json(instance)).toMatch(/"stock:/);
    expect(instance.source).toBeUndefined();
    expect(sectionInstanceSchema.safeParse(instance).success).toBe(true);
  });

  it("the image renderer resolves a slot with the context industry, never emitting stock:", () => {
    const tree: NodeTemplate = { type: "section", props: {}, children: [{ type: "image", props: { src: photoSlot("photo", 1), alt: "x" }, children: [] }] };
    const instance = instantiateTemplate(tree, { id: "s", keepSlots: true });
    const ctx = {
      mode: "edit",
      locale: "ar",
      dir: "rtl",
      store: { name: "m", url: "https://x.tallaby.com" },
      pages: [],
      catalog: { products: {}, categories: [] },
      Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
      imageUrl: (src: string | null | undefined) => src ?? null,
      formatPrice: (n: number) => String(n),
      industry: "fashion",
    } as RenderContext;
    const html = (c: RenderContext) => renderToStaticMarkup(<SectionRenderer instance={instance} registry={storeSectionRegistry} ctx={c} />);
    expect(html(ctx)).toContain(stockPhoto("fashion", 1).replace(/&/g, "&amp;"));
    const noIndustry = html({ ...ctx, industry: undefined });
    expect(noIndustry).toContain(stockPhoto(undefined, 1).replace(/&/g, "&amp;"));
    expect(noIndustry).not.toContain("stock:");
  });
});
