/**
 * A template's "products by category" rows (2026-10-28): the
 * `products-category-carousel` design once per category place (1 = the
 * store's first category), so each row shows that category's name, its
 * View all link and its products. `muted` rows sit on the secondary colour
 * with their photo frames on the page colour, so neighbouring rows alternate.
 * No React here.
 */
import type { Design, DesignText } from "../designs/builder";
import type { LibraryPatch, NodePatch } from "./_library";
import type { Lib } from "./_pages";

export type CategoryRowsOptions = {
  /** Rows to make (default 4), one per category place from 1. */
  count?: number;
  /** The View all label. */
  viewAll: DesignText;
  /** Which rows sit on the secondary colour (by place; default the 2nd and 4th). */
  muted?: readonly number[];
  /** Extra layer patches for every row (the card's look). */
  nodes?: Readonly<Record<string, NodePatch>>;
};

export function categoryRows(lib: Lib, o: CategoryRowsOptions): Design[] {
  const muted = new Set(o.muted ?? [2, 4]);
  return Array.from({ length: o.count ?? 4 }, (_, i) => {
    const place = i + 1;
    const shade = muted.has(place);
    const nodes: Record<string, NodePatch> = {
      ...o.nodes,
      ...(shade && {
        "منتجات قسم": { style: { background: "secondary" } },
        "صورة المنتج": { ...o.nodes?.["صورة المنتج"], style: { ...o.nodes?.["صورة المنتج"]?.style, background: "background" } },
      }),
    };
    const patch: LibraryPatch = {
      as: `category-row-${place}`,
      text: { "عرض الكل": o.viewAll },
      lists: [{ offset: i }, { categoryIndex: place }],
      ...(Object.keys(nodes).length && { nodes }),
    };
    return lib("products-category-carousel", patch);
  });
}
