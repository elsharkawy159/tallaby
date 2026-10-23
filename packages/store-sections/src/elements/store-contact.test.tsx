import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ComponentNode, SectionInstance } from "../config/schema";
import type { RenderContext, StoreProfile } from "../core/types";
import { SectionRenderer } from "../render/render";
import { storeSectionRegistry } from "../sections";
import { contactHref, contactText } from "./store-contact";

let n = 0;
const node = (type: string, props: Record<string, unknown> = {}, children: ComponentNode[] = []): ComponentNode => ({
  id: `n${++n}`,
  type: type as ComponentNode["type"],
  props,
  children,
});

const STORE: StoreProfile = {
  name: "S",
  url: "https://s.test",
  contact: { phone: "01112223334", whatsapp: "@mystore", email: "shop@mystore.com" },
  social: [
    { platform: "instagram", url: "https://www.instagram.com/mystore" },
    { platform: "tiktok", url: "https://www.tiktok.com/@mystore" },
  ],
};

const ctx = (over: Partial<RenderContext> = {}): RenderContext => ({
  mode: "public",
  locale: "ar",
  dir: "rtl",
  store: STORE,
  pages: [],
  catalog: { products: {}, categories: [] },
  Link: ({ href, className, children }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
  imageUrl: (src) => (src ? `https://cdn/${src}` : null),
  formatPrice: (v) => `${v}`,
  ...over,
});

const render = (tree: ComponentNode[], over: Partial<RenderContext> = {}) => {
  const instance: SectionInstance = { id: "c1", sectionId: "custom-section", version: 1, props: {}, componentTree: tree };
  return renderToStaticMarkup(<SectionRenderer instance={instance} registry={storeSectionRegistry} ctx={ctx(over)} defaultLocale="ar" />);
};

const socialRow = () =>
  node("hFlex", { role: "social" }, [
    node("linkBlock", { href: "https://www.facebook.com/" }, [node("icon", { name: "facebook" })]),
    node("linkBlock", { href: "https://wa.me/" }, [node("icon", { name: "chat" })]),
  ]);

const bare = { name: "S", url: "https://s.test" };

describe("store contact in element trees", () => {
  it("swaps demo phone, email and WhatsApp values for the store's", () => {
    expect(contactText("٠١٠٠ ١٢٣ ٤٥٦٧", ctx())).toBe("01112223334");
    expect(contactText("+20 100 000 0000", ctx())).toBe("01112223334");
    expect(contactText("‏hello@store.com", ctx())).toBe("shop@mystore.com");
    expect(contactText("Call us any time", ctx())).toBeUndefined();
    expect(contactHref("https://wa.me/", ctx())).toBe("https://wa.me/@mystore");
    expect(contactHref("https://wa.me/201001234567?text=hi", ctx())).toBe("https://wa.me/@mystore?text=hi");
    expect(contactHref("tel:+201001234567", ctx())).toBe("tel:+201112223334");
    expect(contactHref("mailto:hello@example.com", ctx())).toBe("mailto:shop@mystore.com");
    expect(contactHref("https://www.instagram.com/", ctx())).toBe("https://www.instagram.com/mystore");
    expect(contactHref("https://www.youtube.com/", ctx())).toBeNull();
  });

  it("keeps values the seller typed", () => {
    expect(contactText("0122 555 6666", ctx())).toBeUndefined();
    expect(contactHref("https://wa.me/201225556666", ctx())).toBeUndefined();
    expect(contactHref("https://www.instagram.com/someone", ctx())).toBeUndefined();
    expect(contactHref("/contact", ctx())).toBeUndefined();
  });

  it("draws the store's social links in the row's style", () => {
    const html = render([node("section", {}, [socialRow()])]);
    expect(html).toContain('href="https://www.instagram.com/mystore"');
    expect(html).toContain('href="https://www.tiktok.com/@mystore"');
    expect(html).not.toContain("facebook.com");
    expect(html).not.toContain("wa.me");
    expect(html.match(/data-node-type="linkBlock"/g)).toHaveLength(2);
  });

  it("hides the row publicly without links, keeps it in the editor", () => {
    expect(render([node("section", {}, [socialRow(), node("text", { text: "x" })])], { store: bare })).not.toContain('data-node-type="hFlex"');
    expect(render([node("section", {}, [socialRow()])], { store: bare, mode: "edit" })).toContain("facebook.com");
  });

  it("hides a demo contact line the store has no data for, with its icon", () => {
    const line = node("hFlex", {}, [node("icon", { name: "phone" }), node("text", { text: "+20 100 123 4567" })]);
    const tree = [node("section", {}, [line, node("text", { text: "keep" })])];
    expect(render(tree)).toContain("01112223334");
    const html = render(tree, { store: bare });
    expect(html).not.toContain("+20 100 123 4567");
    expect(html).not.toContain(`data-node-id="${line.id}"`);
    expect(html).toContain("keep");
  });

  it("unlinks a photo linking to a demo profile instead of hiding it", () => {
    const photo = node("linkBlock", { href: "https://www.instagram.com/" }, [node("image", { src: "a.jpg", alt: "" })]);
    const html = render([node("section", {}, [photo])], { store: bare });
    expect(html).toContain("https://cdn/a.jpg");
    expect(html).not.toContain("instagram.com");
  });
});
