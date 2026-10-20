/**
 * Byte-identical guard for the section library (P4B-05, docs/website-builder.md
 * §4.3): every section's defaults, as stored before layouts, presets and the
 * section shell existed, must render exactly as recorded here. New props must
 * default to the old look. Update the snapshot only for a deliberate change.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { SectionInstance } from "../config/schema";
import type { RenderContext } from "../core/types";
import { STORE_SECTIONS, storeSectionRegistry } from "../sections";
import { SectionRenderer } from "./render";

const P1 = "11111111-1111-4111-8111-111111111111";
const P2 = "33333333-3333-4333-8333-333333333333";
const C1 = "22222222-2222-4222-8222-222222222222";

function ctxFor(locale: "ar" | "en", mode: "public" | "edit", withData: boolean, instanceId: string): RenderContext {
  return {
    mode,
    locale,
    dir: locale === "ar" ? "rtl" : "ltr",
    store: {
      name: "متجر سارة",
      description: "ملابس قطنية مصنوعة في مصر.",
      logoUrl: "logo.png",
      url: "https://sara.tallaby.com",
      contact: { phone: "01012345678", email: "hi@sara.test", whatsapp: "01012345678" },
      social: [{ platform: "instagram", url: "https://instagram.com/sara" }],
      policies: [{ key: "return", href: "/returns" }],
    },
    pages: [
      { name: "الرئيسية", href: "/", isHome: true },
      { name: "من نحن", href: "/about", isHome: false },
    ],
    catalog: withData
      ? {
          products: {
            [instanceId]: [
              { id: P1, title: "قميص قطن", href: "/products/qamis", image: "p1.jpg", price: 450, compareAtPrice: 600, rating: 4.5, inStock: true },
              { id: P2, title: "بنطلون", href: "/products/pant", image: null, price: 700, compareAtPrice: null, inStock: false },
            ],
          },
          categories: [{ id: C1, key: "c1", name: "ملابس", href: "/products?category=c1", image: "c1.jpg", productCount: 2 }],
        }
      : { products: {}, categories: [] },
    Link: ({ href, className, children, ...rest }) => (
      <a href={href} className={className} data-part={rest["data-part"]}>
        {children}
      </a>
    ),
    imageUrl: (src) => (src ? (src.startsWith("http") ? src : `https://cdn.test/${src}`) : null),
    formatPrice: (n) => `${n.toFixed(2)} EGP`,
  };
}

// The copyright line prints the current year; pin it so snapshots stay stable.
const YEAR = new Date().getFullYear();
const stable = (markup: string) => markup.replaceAll(String(YEAR), "{year}");

describe("default render is unchanged", () => {
  it.each(STORE_SECTIONS.map((d) => d.id))("%s", (id) => {
    const definition = storeSectionRegistry.get(id)!;
    const instance: SectionInstance = { id: `s-${id}`, sectionId: id, version: 1, props: { ...definition.defaultProps } };
    const out: Record<string, string> = {};
    for (const locale of ["ar", "en"] as const) {
      for (const mode of ["public", "edit"] as const) {
        for (const withData of [false, true]) {
          const ctx = ctxFor(locale, mode, withData, instance.id);
          out[`${locale}/${mode}/${withData ? "data" : "empty"}`] = stable(
            renderToStaticMarkup(<SectionRenderer instance={instance} registry={storeSectionRegistry} ctx={ctx} />),
          );
        }
      }
    }
    expect(out).toMatchSnapshot();
  });
});
