import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { findNode } from "../elements/tree";
import type { RenderContext } from "../core/types";
import { SectionRenderer } from "../render/render";
import { storeSectionRegistry } from "../sections";
import { drawChrome } from "./header";
import { clampLogoHeight, defaultLogoHeight, logoHeightOf, logoMaxWidth, readLogoHeights, setLogoHeight } from "./logo-size";
import type { ComponentNode, SectionInstance } from "./schema";

const n = (id: string, type: string, props: Record<string, unknown> = {}, children: ComponentNode[] = []): ComponentNode =>
  ({ id, type, props, children }) as ComponentNode;
const header = (props: Record<string, unknown> = {}): SectionInstance => ({
  id: "hdr",
  sectionId: "custom-section",
  version: 1,
  props,
  componentTree: [n("root", "section", {}, [n("bar", "hFlex", {}, [n("logo", "linkBlock", { role: "logo", href: "/" }, [n("name", "text", { role: "storeName", text: "S" })])])])],
});

describe("logo size props", () => {
  it("reads nothing from an instance that never set a size, and draws the defaults", () => {
    expect(readLogoHeights(header())).toEqual({});
    expect(logoHeightOf(header(), "header", "desktop")).toBe(40);
    expect(logoHeightOf(header(), "header", "mobile")).toBe(36);
    expect(logoHeightOf(header(), "footer", "desktop")).toBe(48);
  });

  it("stores only a value that differs from the default, clamped and rounded", () => {
    expect(setLogoHeight(header(), "header", "desktop", 64.4).props).toEqual({ logoHeight: 64 });
    expect(setLogoHeight(header(), "header", "desktop", 999).props).toEqual({ logoHeight: 120 });
    expect(setLogoHeight(header(), "header", "mobile", 1).props).toEqual({ logoHeightMobile: 20 });
    expect(setLogoHeight(header({ logoHeight: 64 }), "header", "desktop", 40).props).toEqual({});
    expect(setLogoHeight(header({ logoHeight: 64, logo: false }), "header", "desktop", null).props).toEqual({ logo: false });
  });

  it("never trusts a stored value", () => {
    expect(readLogoHeights(header({ logoHeight: "80px", logoHeightMobile: Number.NaN }))).toEqual({});
    expect(readLogoHeights(header({ logoHeight: 500, logoHeightMobile: 50 }))).toEqual({ desktop: 120, mobile: 50 });
    expect(clampLogoHeight(Infinity, "desktop")).toBeNull();
  });

  it("grows the width cap with the height from the old 160px", () => {
    expect(logoMaxWidth(40)).toBe(160);
    expect(logoMaxWidth(30)).toBe(160);
    expect(logoMaxWidth(80)).toBe(320);
    expect(defaultLogoHeight("footer", "mobile")).toBe(48);
  });
});

describe("drawChrome with a logo size", () => {
  const draw = (h: SectionInstance) => findNode(drawChrome(h, "header", { translated: false, hasLogo: true })!.componentTree!, "hdr-logo")!;

  it("keeps the drawn logo's props as before when no size is set", () => {
    expect(draw(header()).props).toEqual({ size: "md" });
  });

  it("passes the seller's heights to the drawn logo", () => {
    expect(draw(header({ logoHeight: 72 })).props).toEqual({ size: "md", height: 72 });
    expect(draw(header({ logoHeight: 72, logoHeightMobile: 44 })).props).toEqual({ size: "md", height: 72, heightMobile: 44 });
  });
});

describe("rendering a sized logo", () => {
  const ctx = {
    mode: "public",
    locale: "ar",
    dir: "rtl",
    store: { name: "S", url: "https://s.test", logoUrl: "https://cdn.test/logo.png" },
    Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
    imageUrl: (src: string | null | undefined) => src ?? null,
    formatPrice: (amount: number) => String(amount),
    pages: [],
  } as unknown as RenderContext;
  const html = (h: SectionInstance) =>
    renderToStaticMarkup(<SectionRenderer instance={drawChrome(h, "header", { translated: false, hasLogo: true })!} registry={storeSectionRegistry} ctx={ctx} defaultLocale="ar" />);

  it("draws the old classes without a size", () => {
    const out = html(header());
    expect(out).toContain("max-w-40");
    expect(out).toContain("h-9 md:h-10");
    expect(out).not.toContain("--sf-logo-h");
  });

  it("draws the seller's heights per device through CSS variables", () => {
    const out = html(header({ logoHeight: 80, logoHeightMobile: 44 }));
    expect(out).toContain("--sf-logo-h:80px");
    expect(out).toContain("--sf-logo-w:320px");
    expect(out).toContain("--sf-logo-hm:44px");
    expect(out).toContain("max-md:h-(--sf-logo-hm)");
    expect(out).not.toContain("max-w-40");
  });

  it("keeps the phone default when only the desktop height is set", () => {
    expect(html(header({ logoHeight: 80 }))).toContain("--sf-logo-hm:36px");
  });
});
