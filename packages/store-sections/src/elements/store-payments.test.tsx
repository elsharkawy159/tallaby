import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ComponentNode, SectionInstance } from "../config/schema";
import type { RenderContext, StoreProfile } from "../core/types";
import { SectionRenderer } from "../render/render";
import { storeSectionRegistry } from "../sections";
import { CODE_TEMPLATES } from "../templates/catalog";

let n = 0;
const node = (type: string, props: Record<string, unknown> = {}, children: ComponentNode[] = []): ComponentNode => ({
  id: `n${++n}`,
  type: type as ComponentNode["type"],
  props,
  children,
});

const ctx = (store: Partial<StoreProfile>, over: Partial<RenderContext> = {}): RenderContext => ({
  mode: "public",
  locale: "ar",
  dir: "rtl",
  store: { name: "S", url: "https://s.test", ...store },
  pages: [],
  catalog: { products: {}, categories: [] },
  Link: ({ href, className, children }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
  imageUrl: (src) => src ?? null,
  formatPrice: (v) => `${v}`,
  ...over,
});

const render = (tree: ComponentNode[], c: RenderContext) => {
  const instance: SectionInstance = { id: "f1", sectionId: "custom-section", version: 1, props: {}, componentTree: tree };
  return renderToStaticMarkup(<SectionRenderer instance={instance} registry={storeSectionRegistry} ctx={c} defaultLocale="ar" />);
};

const paymentsRow = () =>
  node("hFlex", { role: "payments" }, [
    node("badge", { text: "فيزا", translations: { en: { text: "VISA" } } }),
    node("badge", { text: "ميزة", translations: { en: { text: "Meeza" } } }),
    node("badge", { text: "الدفع عند الاستلام", translations: { en: { text: "Cash on delivery" } } }),
  ]);

const COD_INSTAPAY = { paymentMethods: [{ key: "cash_on_delivery" }, { key: "instapay" }] };

describe("store payment methods in footers", () => {
  it("shows the store's checkout methods as logo cards instead of the demo chips", () => {
    const row = paymentsRow();
    const html = render([node("section", {}, [row])], ctx(COD_INSTAPAY));
    expect(html).not.toContain("فيزا");
    expect(html).not.toContain("ميزة");
    // InstaPay is its logo (named by alt/title); cash on delivery has no brand, so an icon and its name.
    expect(html).toMatch(/<img src="\/icons\/payments\/instapay\.png" alt="إنستاباي"/);
    expect(html).toMatch(/data-payment="cash_on_delivery"[^>]*>.*الدفع عند الاستلام/);
    expect(html.match(/data-payment="/g)).toHaveLength(2);
    // The row keeps its node id, so its own scoped CSS (gap, alignment) still applies.
    expect(html).toContain(`data-node-id="${row.id}"`);
  });

  it("draws every method a store can offer, with a logo for each wallet", () => {
    const all = { paymentMethods: ["cash_on_delivery", "instapay", "vodafone_cash", "e_cash"].map((key) => ({ key })) };
    const html = render([node("section", {}, [paymentsRow()])], ctx(all));
    for (const file of ["instapay", "vodafone-cash", "e-cash"]) expect(html).toContain(`/icons/payments/${file}.png`);
    expect(html.match(/data-payment="/g)).toHaveLength(4);
  });

  it("names the methods in the page's language", () => {
    const html = render([node("section", {}, [paymentsRow()])], ctx(COD_INSTAPAY, { locale: "en", dir: "ltr" }));
    expect(html).toContain("Cash on delivery");
    expect(html).toContain('alt="InstaPay"');
    expect(html).not.toContain("VISA");
  });

  it("keeps a method the package has no logo for as its name", () => {
    const html = render([node("section", {}, [paymentsRow()])], ctx({ paymentMethods: [{ key: "fawry", label: "Fawry" }] }));
    expect(html).toMatch(/data-payment="fawry"[^>]*>.*Fawry/);
    expect(html).not.toContain("<img");
  });

  it("keeps the row as authored when the host passes no payment data", () => {
    const html = render([node("section", {}, [paymentsRow()])], ctx({}));
    expect(html).toContain("فيزا");
  });

  it("hides the row publicly for a store with no methods, and keeps the demo in the editor", () => {
    expect(render([node("section", {}, [node("text", { text: "x" }), paymentsRow()])], ctx({ paymentMethods: [] }))).not.toContain("فيزا");
    expect(render([node("section", {}, [paymentsRow()])], ctx({ paymentMethods: [] }, { mode: "edit" }))).toContain("فيزا");
  });

  it("covers every template footer: its payment chips sit in a payments row", () => {
    const PAYMENT_WORDS = /visa|mastercard|meeza|فيزا|ماستركارد|ميزة|الدفع عند الاستلام/i;
    const walk = (nodes: readonly ComponentNode[], inRow: boolean): ComponentNode[] =>
      nodes.flatMap((child) => {
        const row = inRow || child.props.role === "payments";
        const text = child.props.text;
        return [...(!row && typeof text === "string" && PAYMENT_WORDS.test(text) ? [child] : []), ...walk(child.children, row)];
      });
    for (const template of CODE_TEMPLATES) {
      expect(walk(template.config().footer?.componentTree ?? [], false), template.key).toEqual([]);
    }
  });
});
