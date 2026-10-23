/**
 * The site header never has vertical padding on phones (owner, 2026-10-20,
 * asked again 2026-10-23): the header's root section gets padding-top and
 * padding-bottom 0 at the mobile breakpoint, whatever the design or the seller
 * set. Stored sites from before `0084` still carry the section's 40px mobile
 * default, and the DB copies of templates are the master copy, so this runs
 * on save (`sanitizeSiteConfig`) and wherever a header is drawn. Desktop and
 * tablet padding are kept. Never mutates its input.
 */
import type { SectionInstance } from "./schema";

const FLUSH = { paddingTop: 0, paddingBottom: 0 };

function flushMobile(breakpoints: Record<string, Record<string, unknown>> | undefined): Record<string, Record<string, unknown>> | undefined {
  const mobile = breakpoints?.mobile;
  if (mobile?.paddingTop === 0 && mobile.paddingBottom === 0) return breakpoints;
  return { ...breakpoints, mobile: { ...mobile, ...FLUSH } };
}

export function flushHeaderOnMobile(header: SectionInstance): SectionInstance;
export function flushHeaderOnMobile(header: SectionInstance | null | undefined): SectionInstance | null | undefined;
export function flushHeaderOnMobile(header: SectionInstance | null | undefined): SectionInstance | null | undefined {
  if (!header) return header;
  const [root, ...rest] = header.componentTree ?? [];
  if (root?.type !== "section") return header;
  const breakpointStyles = flushMobile(root.breakpointStyles);
  if (breakpointStyles === root.breakpointStyles) return header;
  return { ...header, componentTree: [{ ...root, breakpointStyles }, ...rest] };
}

/**
 * The language switcher of a translated store (owner, 2026-10-23): every
 * header shows it by default when the store has more than one language, and
 * the seller hides it from the builder (Navbar → Language switcher), which
 * stores `props.languageSwitcher: false` on the header. It is added where the
 * header is drawn, never saved, so every template and existing site gets it:
 * before the cart link, else after the menu, else after the logo, else at the
 * end of the header. A header that already holds one is left as it is.
 */
export const LANGUAGE_SWITCHER_PROP = "languageSwitcher";

type Node = NonNullable<SectionInstance["componentTree"]>[number];

/** Whether the seller left the switcher on (the default). */
export function languageSwitcherOn(header: SectionInstance | null | undefined): boolean {
  return header?.props[LANGUAGE_SWITCHER_PROP] !== false;
}

const isCart = (node: Node) => node.props.role === "cart" || node.props.href === "/cart";
const hasRole = (role: string) => (node: Node) => node.props.role === role;

/** Inserts `added` next to the first node matching `match` (before or after it); null when none matches. */
function insertBeside(nodes: Node[], match: (node: Node) => boolean, added: Node, after: boolean): Node[] | null {
  const index = nodes.findIndex(match);
  if (index >= 0) {
    const at = after ? index + 1 : index;
    return [...nodes.slice(0, at), added, ...nodes.slice(at)];
  }
  for (const [i, node] of nodes.entries()) {
    const children = insertBeside(node.children, match, added, after);
    if (children) return nodes.map((n, j) => (j === i ? { ...node, children } : n));
  }
  return null;
}

function hasSwitcher(nodes: Node[]): boolean {
  return nodes.some((node) => node.type === "languageSwitcher" || hasSwitcher(node.children));
}

export function withLanguageSwitcher(header: SectionInstance, translated: boolean): SectionInstance;
export function withLanguageSwitcher(header: SectionInstance | null | undefined, translated: boolean): SectionInstance | null | undefined;
export function withLanguageSwitcher(header: SectionInstance | null | undefined, translated: boolean): SectionInstance | null | undefined {
  const tree = header?.componentTree;
  if (!header || !tree?.length || !translated || !languageSwitcherOn(header) || hasSwitcher(tree)) return header;
  const switcher: Node = { id: `${header.id}-language`, type: "languageSwitcher", props: {}, children: [] };
  const [root, ...rest] = tree;
  const componentTree =
    insertBeside(tree, isCart, switcher, false) ??
    insertBeside(tree, hasRole("menu"), switcher, true) ??
    insertBeside(tree, hasRole("logo"), switcher, true) ??
    (root!.type === "section" ? [{ ...root!, children: [...root!.children, switcher] }, ...rest] : [...tree, switcher]);
  return { ...header, componentTree };
}
