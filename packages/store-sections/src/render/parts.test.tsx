import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { RenderContext } from "../core/types";
import { PART_KEY_RE } from "../elements/style";
import { STORE_SECTIONS } from "../sections";

const ctx: RenderContext = {
  mode: "edit",
  locale: "ar",
  dir: "rtl",
  store: { name: "S", url: "https://s.test", description: "d", contact: {} },
  pages: [],
  catalog: { products: {}, categories: [{ id: "c", key: "c", name: "C", href: "/c", image: null }] },
  Link: ({ href, className, children, ...rest }) => (
    <a href={href} className={className} data-part={rest["data-part"]}>
      {children}
    </a>
  ),
  imageUrl: (src) => (src ? `https://cdn/${src}` : null),
  formatPrice: (n) => `${n}`,
};

// The editor maps a clicked part back to the field it edits (P4B-04), so
// every marked part must name a prop or an item field of its section.
describe("editable parts", () => {
  for (const definition of STORE_SECTIONS) {
    it(`${definition.id} marks only real fields`, () => {
      const props: Record<string, unknown> = { ...definition.defaultProps };
      for (const collection of definition.itemCollections ?? []) props[collection.key] = [collection.newItemTemplate()];
      const instance = { id: "s1", sectionId: definition.id, version: 1, props };
      const html = renderToStaticMarkup(
        <definition.Component instance={instance} props={definition.propsSchema.parse(props)} ctx={ctx} />,
      );
      for (const [, key] of html.matchAll(/data-part="s1::([^"]+)"/g)) {
        expect(key, definition.id).toMatch(PART_KEY_RE);
        const [first, , field] = key!.split(".");
        const collection = definition.itemCollections?.find((c) => c.key === first);
        if (field) expect(collection?.itemPropDefinitions.some((p) => p.key === field), key).toBe(true);
        else expect(definition.propDefinitions.some((p) => p.key === first), key).toBe(true);
      }
    });
  }
});
