/** Default category names for the category designs; the seller renames them and picks the photos. */
import type { StyleValues } from "../../elements/style";
import type { NodeTemplate } from "../../elements/tree";
import type { DesignText, TreeBuilder } from "../builder";
import { L } from "../_kit";
import { HEAD_GAP, PRODUCTS_SECTION, productsHead } from "../products/_shared";

export const CATEGORY_NAMES = [
  L("وصل حديثًا", "New in"),
  L("الأكثر مبيعًا", "Best sellers"),
  L("العروض", "Offers"),
  L("هدايا", "Gifts"),
  L("إكسسوارات", "Accessories"),
  L("أساسيات", "Essentials"),
  L("مجموعات", "Bundles"),
  L("الموسم الجديد", "New season"),
] as const;

export const CATEGORY_LINK = "/products";

/**
 * The rhythm of the category designs rebuilt in the look-first pilot
 * (docs/systems/plan.md §10 L7): the product sections' root padding and the
 * same space between the heading (`productsHead`) and the list, so a category
 * row and a product row read as one system.
 */
export const CATEGORY_SECTION: { style: StyleValues; mobile: StyleValues } = PRODUCTS_SECTION;

/** A column holding the heading and the list. */
export const HEAD_TO_LIST: { style: StyleValues; mobile: StyleValues } = {
  style: { gap: HEAD_GAP.desktop },
  mobile: { gap: HEAD_GAP.mobile },
};

type HeadFieldRoles = { head?: string; link?: string; linkRow?: string; linkText?: string; linkIcon?: string };

/** Roles for the heading's new nodes, so they get field names of their own (`templates/library-fields.ts`). */
const HEAD_ROLES: HeadFieldRoles = { head: "head", link: "viewAll", linkRow: "viewAllRow", linkText: "viewAllText", linkIcon: "viewAllIcon" };

const withRole = (node: NodeTemplate, role: string | undefined, children?: NodeTemplate[]): NodeTemplate => ({
  ...node,
  props: role ? { ...node.props, role } : node.props,
  ...(children && { children }),
});

/**
 * The heading of a category section: the product sections' heading
 * (`productsHead`: optional small eyebrow, quiet title, "View all" at the
 * end), so every row of a page shares one heading. Its "View all" link is new
 * in these designs and sits before the list in the tree, so its nodes carry
 * roles of their own: without them they would take the field names (`link`,
 * `box-3`, `text`…) that the category card's nodes have had since v1. `roles`
 * leaves out the ones a design's old names need unnamed.
 */
export function categoryHead(t: TreeBuilder, o: Parameters<typeof productsHead>[1] & { link: { href: string; text?: DesignText } }, roles: HeadFieldRoles = HEAD_ROLES): NodeTemplate {
  const head = productsHead(t, o);
  const [copy, link] = head.children ?? [];
  const row = link?.children?.[0];
  if (!copy || !link || !row) return head;
  const [text, icon] = row.children ?? [];
  const parts = [...(text ? [withRole(text, roles.linkText)] : []), ...(icon ? [withRole(icon, roles.linkIcon)] : [])];
  return withRole(head, roles.head, [copy, withRole(link, roles.link, [withRole(row, roles.linkRow, parts)])]);
}
