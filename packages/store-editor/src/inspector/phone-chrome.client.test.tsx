import { renderToString } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import type { SectionInstance } from "@workspace/store-sections";
import { setBottomNavItems, setMobileMenu } from "@workspace/store-sections/render";
import en from "../messages/en.json";
import type { EditorPage } from "../state/editor.store";
import { BottomNavEditor, MobileMenuEditor } from "./phone-chrome.client";

type Tree = NonNullable<SectionInstance["componentTree"]>;
const n = (id: string, type: string, props: Record<string, unknown> = {}, children: Tree = []): Tree[number] => ({ id, type, props, children }) as Tree[number];
const header: SectionInstance = {
  id: "c",
  sectionId: "custom-section",
  version: 1,
  props: {},
  componentTree: [
    n("root", "section", {}, [
      n("bar", "hFlex", {}, [
        n("logo", "linkBlock", { role: "logo", href: "/" }, [n("name", "text", { role: "storeName" })]),
        n("menu", "hFlex", { role: "menu" }, [n("shop", "linkBlock", { href: "/products" }, [n("shop-t", "text", { text: "Shop" })])]),
      ]),
    ]),
  ],
};
const pages: EditorPage[] = [
  { id: "home", slug: "", isHome: true, name: { en: "Home" }, seo: {}, showInNav: true, content: { sections: [] }, version: 1 },
  { id: "p1", slug: "about", isHome: false, name: { en: "About us", ar: "من نحن" }, seo: {}, showInNav: true, content: { sections: [] }, version: 1 },
];
const render = (node: React.ReactNode) =>
  renderToString(
    <NextIntlClientProvider locale="en" messages={en}>
      {node}
    </NextIntlClientProvider>,
  );

describe("phone chrome cards (F-74)", () => {
  it("lists the default bottom bar, removable down to one item", () => {
    const html = render(<BottomNavEditor instance={header} onChange={() => {}} pages={pages} locale="en" focused={false} enabled />);
    for (const label of ["Home", "Shop", "Cart", "Profile"]) expect(html).toContain(`>${label}<`);
    expect(html).not.toContain("Back to the default");
  });

  it("shows the seller's bar with its page and offers a reset", () => {
    const custom = setBottomNavItems(header, [{ type: "home" }, { type: "page", pageId: "p1", slug: "about", label: { en: "About us" } }]);
    const html = render(<BottomNavEditor instance={custom} onChange={() => {}} pages={pages} locale="en" focused={false} enabled />);
    expect(html).toContain(">About us<");
    expect(html).not.toContain(">Cart<");
    expect(html).toContain("Back to the default");
  });

  it("lists the burger sheet's rows, hidden ones marked", () => {
    const hidden = setMobileMenu(header, { order: [], hidden: ["c-mm-shop"], labels: {}, added: [] });
    const html = render(<MobileMenuEditor instance={hidden} onChange={() => {}} pages={pages} locale="en" focused={false} />);
    expect(html).toContain('value="Shop"');
    expect(html).toContain('aria-label="Show Shop on phones"');
  });
});
