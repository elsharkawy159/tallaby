import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import ar from "@/messages/marketing/home.ar.json";
import en from "@/messages/marketing/home.en.json";
import { type DirectoryStore, selectLogoStrip } from "@/lib/marketing/store-directory.lib";
import { StoreLogoStrip } from "./store-logo-strip";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const store = (name: string, productCount = 20, industry: DirectoryStore["industry"] = null): DirectoryStore => ({
  name,
  url: `https://${name.toLowerCase()}.tallaby.com`,
  logoUrl: `https://cdn.example/${name}.png`,
  industry,
  productCount,
});

function render(locale: "ar" | "en", stores: DirectoryStore[]) {
  const { title, all, listLabel } = (locale === "ar" ? ar : en).home.trusted;
  return renderToStaticMarkup(<StoreLogoStrip stores={stores} labels={{ title, all, listLabel }} locale={locale} />);
}

describe("StoreLogoStrip", () => {
  it("renders nothing under the threshold", () => {
    const few = selectLogoStrip([store("A"), store("B"), store("C")]);
    expect(render("ar", few)).toBe("");
  });

  it("links each logo to its store with the store name as alt text, and a link to all stores", () => {
    const html = render("en", selectLogoStrip([store("Alpha"), store("Beta"), store("Gamma"), store("Delta")]));
    expect(html).toContain("Stores selling on Tallaby");
    expect(html).toContain('href="/stores"');
    expect(html).toContain('href="https://alpha.tallaby.com"');
    expect(html).toContain('alt="Alpha"');
    expect(html).toContain('loading="lazy"');
    // Store logos open in a new tab (owner, 2026-11-15); "all stores" stays in this tab.
    expect(html.match(/target="_blank" rel="noopener noreferrer"/g)).toHaveLength(8);
    expect(html).not.toMatch(/href="\/stores"[^>]*target=/);
  });

  it("is a marquee with a hidden, untabbable second copy that reduced motion removes", () => {
    const html = render("ar", selectLogoStrip([store("A"), store("B"), store("C"), store("D")]));
    expect(html).toContain("متاجر تبيع على طلبي");
    expect(html).toMatch(/class="store-marquee logo-marquee[^"]*"/);
    expect(html).toContain('data-direction="rtl"');
    expect(html).toMatch(/<ul aria-hidden="true" data-marquee-copy=""/);
    // Each store once in the real list, once (out of tab order) in the loop copy.
    expect(html.match(/href="https:\/\/a\.tallaby\.com"/g)).toHaveLength(2);
    expect(html.match(/tabindex="-1"/g)).toHaveLength(4);
  });

  it("shows logos in their own colours, with a subtle hover on the card", () => {
    const html = render("en", selectLogoStrip([store("A"), store("B"), store("C"), store("D")]));
    expect(html).not.toMatch(/grayscale|opacity-70/);
    expect(html).toContain("hover:border-line-strong");
  });

  it("puts the store's listed industry under its logo in the page's language, and no line without one", () => {
    const stores = selectLogoStrip([store("A", 20, "fashion"), store("B", 20, "shoes-bags"), store("C"), store("D")]);
    const en = render("en", stores);
    expect(en).toContain(">Fashion</span>");
    expect(en).toContain(">Shoes &amp; Bags</span>");
    expect(en).toMatch(/<span dir="ltr" class="[^"]*truncate[^"]*">Fashion<\/span>/);
    const ar = render("ar", stores);
    expect(ar).toContain('<span dir="rtl"');
    expect(ar).toContain(">أزياء وملابس</span>");
    // Two stores with an industry, each in the list and in the loop copy; the other two get no line.
    expect(ar.match(/<span dir="rtl"/g)).toHaveLength(4);
    // Every card has the same fixed size, with or without the line.
    expect(ar.match(/h-\[96px\] w-\[168px\]/g)).toHaveLength(8);
  });
});
