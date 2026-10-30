/**
 * The site header never has vertical padding on phones (owner, 2026-10-20,
 * asked again 2026-10-23): the header's root section gets padding-top and
 * padding-bottom 0 at the mobile breakpoint, whatever the design or the seller
 * set. Stored sites from before `0084` still carry the section's 40px mobile
 * default, and the DB copies of templates are the master copy, so this runs
 * on save (`sanitizeSiteConfig`) and wherever a header is drawn. Desktop and
 * tablet padding are kept. Never mutates its input.
 *
 * Header rows are centred on the cross axis (owner, 2026-10-27): a row that
 * sets no `alignItems` stretched its children, so menu links, the logo and the
 * cart or search icons sat at different heights. A row that sets one keeps it.
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
  const children = centerRows(root.children);
  if (breakpointStyles === root.breakpointStyles && children === root.children) return header;
  return { ...header, componentTree: [{ ...root, breakpointStyles, children }, ...rest] };
}

type TreeNode = NonNullable<SectionInstance["componentTree"]>[number];

/** Rows (`hFlex`) with no `alignItems` get `center`; the same array back when nothing changes. */
function centerRows(nodes: TreeNode[]): TreeNode[] {
  let changed = false;
  const next = nodes.map((node) => {
    const children = centerRows(node.children ?? []);
    const style = node.style as Record<string, unknown> | undefined;
    const center = node.type === "hFlex" && style?.alignItems === undefined;
    if (!center && children === node.children) return node;
    changed = true;
    return { ...node, children, ...(center && { style: { ...style, alignItems: "center" } }) };
  });
  return changed ? next : nodes;
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

/**
 * Header and footer options (owner, 2026-10-24): the builder's Content tab
 * turns the store logo, the store name, the language switcher, a light/dark
 * theme toggle and a sign-in button on or off for the header and for the
 * footer. Each is stored on the instance's props only when it differs from
 * the default, and drawn where the header or footer is rendered
 * (`drawChrome`), never saved into the tree, so every template and existing
 * site gets them.
 *
 * - Logo: the store logo uploaded in Website › Design (`storeLogo` node, drawn
 *   from the store profile). In the header's logo link it takes the place of
 *   the design's mark (the first non-text piece before the store name), else
 *   it goes before the store name. Without a drawn logo the mark is dropped,
 *   so the brand is the store name alone (owner, 2026-10-24).
 * - Store name: beside an uploaded logo only when turned on (off by default:
 *   the logo replaces the name; owner, 2026-10-24). Never leaves the link empty.
 * - Bottom navigation (header only, on by default; owner, 2026-10-27): the
 *   phone bar Home, Shop, Cart, Profile, drawn by the host after the footer
 *   (ender/bottom-nav.tsx), never inside the header tree.
 * - Language switcher, theme toggle, sign-in: in the header beside the cart
 *   (as `withLanguageSwitcher` places the switcher); in the footer as one row
 *   after the social links, else at the end of the footer's container.
 */
export type ChromePart = "header" | "footer";
export const CHROME_OPTIONS = ["logo", "storeName", "languageSwitcher", "themeToggle", "account", "bottomNav"] as const;
export type ChromeOption = (typeof CHROME_OPTIONS)[number];

const CHROME_DEFAULTS: Record<ChromePart, Record<ChromeOption, boolean>> = {
  header: { logo: true, storeName: false, languageSwitcher: true, themeToggle: false, account: false, bottomNav: true },
  footer: { logo: true, storeName: false, languageSwitcher: false, themeToggle: false, account: false, bottomNav: false },
};

/** Whether an option is on for this header or footer (its default when the seller never changed it). */
export function chromeOptionOn(instance: SectionInstance | null | undefined, part: ChromePart, option: ChromeOption): boolean {
  const value = instance?.props[option];
  return typeof value === "boolean" ? value : CHROME_DEFAULTS[part][option];
}

/** The instance with the option set; the prop is dropped when it matches the default. */
export function setChromeOption(instance: SectionInstance, part: ChromePart, option: ChromeOption, on: boolean): SectionInstance {
  const { [option]: _, ...props } = instance.props;
  return { ...instance, props: on === CHROME_DEFAULTS[part][option] ? props : { ...props, [option]: on } };
}

const TEXT_TYPES = new Set(["text", "heading", "paragraph", "span"]);

function contains(nodes: readonly Node[], match: (node: Node) => boolean): boolean {
  return nodes.some((node) => match(node) || contains(node.children, match));
}

/**
 * Puts the logo before the store name inside `nodes`, in place of a mark
 * beside it; with no logo, drops the mark. Null when there is no store name.
 */
function placeLogo(nodes: Node[], logo: Node | null, showName: boolean): Node[] | null {
  const index = nodes.findIndex(hasRole("storeName"));
  if (index >= 0) {
    const before = nodes.slice(0, index);
    const markAt = before.findIndex((node) => !TEXT_TYPES.has(node.type));
    const kept =
      markAt >= 0
        ? before.flatMap((node, i) => (i !== markAt ? [node] : logo ? [logo] : []))
        : logo
          ? [...before, logo]
          : before;
    return [...kept, ...(showName ? [nodes[index]!] : []), ...nodes.slice(index + 1)];
  }
  for (const [i, node] of nodes.entries()) {
    const children = placeLogo(node.children, logo, showName);
    if (children) return nodes.map((n, j) => (j === i ? { ...node, children } : n));
  }
  return null;
}

/** Replaces the first node matching `match` (depth first); null when none matches. */
function replaceFirst(nodes: Node[], match: (node: Node) => boolean, replace: (node: Node) => Node): Node[] | null {
  for (const [i, node] of nodes.entries()) {
    if (match(node)) return nodes.map((n, j) => (j === i ? replace(node) : n));
    const children = replaceFirst(node.children, match, replace);
    if (children) return nodes.map((n, j) => (j === i ? { ...node, children } : n));
  }
  return null;
}

function withStoreLogo(tree: Node[], id: string, part: ChromePart, showName: boolean): Node[] {
  if (contains(tree, (node) => node.type === "storeLogo")) return tree;
  const logo: Node = { id: `${id}-logo`, type: "storeLogo", props: { size: part === "footer" ? "lg" : "md" }, children: [] };
  // The header's logo link first; else the first store name (a footer's heading).
  return (
    replaceFirst(tree, hasRole("logo"), (link) => ({ ...link, children: placeLogo(link.children, logo, showName) ?? [logo, ...link.children] })) ??
    placeLogo(tree, logo, showName) ??
    tree
  );
}

/** The store name alone: the design's mark beside it is dropped (header logo link first, else the first store name). */
function withoutMark(tree: Node[]): Node[] {
  const out =
    replaceFirst(tree, hasRole("logo"), (link) => ({ ...link, children: placeLogo(link.children, null, true) ?? link.children })) ??
    placeLogo(tree, null, true) ??
    tree;
  // It only removes: the same count means there was no mark, so keep the input as is.
  return countNodes(out) === countNodes(tree) ? tree : out;
}

function countNodes(nodes: readonly Node[]): number {
  return nodes.reduce((sum, node) => sum + 1 + countNodes(node.children), 0);
}

/** The footer's tools row: after the social links, else at the end of its first container, else of the root section. */
function appendFooterTools(tree: Node[], row: Node): Node[] {
  return insertBeside(tree, hasRole("social"), row, true) ?? appendToFooter(tree, row);
}

/** Appends `row` at the end of the footer's first container, else of its root section. */
function appendToFooter(tree: Node[], row: Node): Node[] {
  const container = replaceFirst(tree, (node) => node.type === "container", (node) => ({ ...node, children: [...node.children, row] }));
  if (container) return container;
  const [root, ...rest] = tree;
  return root!.type === "section" ? [{ ...root!, children: [...root!.children, row] }, ...rest] : [...tree, row];
}

/**
 * The mobile burger menu (owner, 2026-10-27; docs/section-rules.md §5.6):
 * every header gets a `mobileMenu` node, shown under 768px, holding a copy of
 * the header's menu links (unstyled; the menu's look is drawn by the
 * renderer). The header's own menus are marked `collapse: "mobile"` so they
 * hide on phones. The burger goes first in the header's bar (the nearest row
 * or grid around the logo); in a grid it shares the first cell, so the column
 * count stays. Drawn, never saved.
 */
export const MOBILE_COLLAPSE = "mobile";

const LINK_TYPES = new Set(["linkBlock", "textLink"]);

/** Plain copies of the links inside the header's menus, deduped by href and text. */
function menuLinks(nodes: readonly Node[], id: string): Node[] {
  const out: Node[] = [];
  const seen = new Set<string>();
  const strip = (node: Node, prefix: string): Node => ({
    id: `${prefix}-${node.id}`,
    type: node.type,
    props: node.props,
    children: node.children.map((child) => strip(child, prefix)),
  });
  const collect = (list: readonly Node[], inMenu: boolean) => {
    for (const node of list) {
      const menu = inMenu || node.props.role === "menu";
      if (menu && LINK_TYPES.has(node.type)) {
        const key = `${String(node.props.href)}|${JSON.stringify(node.props.text ?? node.children.map((c) => c.props.text))}`;
        if (!seen.has(key)) {
          seen.add(key);
          out.push(strip(node, `${id}-mm`));
        }
        continue;
      }
      collect(node.children, menu);
    }
  };
  collect(nodes, false);
  return out;
}

function collapseMenus(nodes: Node[]): Node[] {
  return nodes.map((node) => ({
    ...node,
    ...(node.props.role === "menu" && { props: { ...node.props, collapse: MOBILE_COLLAPSE } }),
    children: collapseMenus(node.children),
  }));
}

/** The path (ancestors, outermost first) to the first node matching `match`. */
function pathTo(nodes: readonly Node[], match: (node: Node) => boolean, trail: Node[] = []): Node[] | null {
  for (const node of nodes) {
    if (match(node)) return [...trail, node];
    const found = pathTo(node.children, match, [...trail, node]);
    if (found) return found;
  }
  return null;
}

/**
 * The header on phones is one row (docs/section-rules.md §5.6; owner,
 * 2026-10-27 "fix navbars on templates mobile screen", 2026-10-29 "cart on a
 * side, logo centred, burger + search + language on the other side"):
 * [burger · search · language] · logo · [cart]. The bar is the outermost row
 * or grid around the logo. Under 768px (breakpoint `hidden`, so desktop and
 * tablet are untouched):
 * - rows after the bar (category chips, department links, a second search or
 *   menu row) are hidden; rows before it (announcement bars) stay;
 * - in the bar, a wide search box or a search icon is hidden and a search icon
 *   goes into the start cell beside the burger, as do the language switch and
 *   theme toggle (copies; the ones by the cart hide); wishlist and account
 *   icons and a design's own menu icon are hidden (the burger sheet holds the
 *   account; Tallaby Classic keeps its account icon);
 * - the start cell (`<id>-mobile-start`) shows only on phones; a row bar is
 *   drawn as three columns (`split`: start, the logo in the middle, the rest
 *   in an end cell that is transparent from 768px up); a grid bar gets one
 *   column per cell still shown, the logo spanning the middle two of four;
 * - a tagline beside the store name in the logo is hidden;
 * - the bar's vertical padding is at most 10px (44px icons: a 64px header).
 */
const MOBILE_BAR_PADDING = 10;
/** `props.split` on a header bar: three columns on phones (start, logo, end). */
export const MOBILE_SPLIT = "mobile";
/** `props.group` on a drawn cell: a real box on phones only (`display: contents` from 768px up). */
export const MOBILE_GROUP = "mobile";

/** The style a node has on phones (mobile, else tablet, else desktop: tablet and mobile are max-width overrides). */
function mobileValue(node: Node, key: string): unknown {
  const bps = node.breakpointStyles;
  return bps?.mobile?.[key] ?? bps?.tablet?.[key] ?? (node.style as Record<string, unknown> | undefined)?.[key];
}

function withMobileStyle(node: Node, mobile: Record<string, unknown>): Node {
  return { ...node, breakpointStyles: { ...node.breakpointStyles, mobile: { ...node.breakpointStyles?.mobile, ...mobile } } };
}

const hideOnMobile = (node: Node): Node => (node.breakpointStyles?.mobile?.hidden === true ? node : withMobileStyle(node, { hidden: true }));
/** Shown on phones: not hidden there (`hidden` is per device) and not a collapsed menu. */
const shownOnMobile = (node: Node) => node.breakpointStyles?.mobile?.hidden !== true && node.props.collapse !== MOBILE_COLLAPSE;

function iconsIn(node: Node): string[] {
  const out: string[] = [];
  const walk = (n: Node) => {
    if (n.type === "icon" && typeof n.props.name === "string") out.push(n.props.name);
    n.children.forEach(walk);
  };
  walk(node);
  return out;
}
function textsIn(node: Node): unknown[] {
  return TEXT_TYPES.has(node.type) ? [node.props.text] : node.children.flatMap(textsIn);
}
const hasText = (node: Node): boolean => node.children.some((c) => TEXT_TYPES.has(c.type) || hasText(c));
const isLink = (node: Node) => node.type === "linkBlock";
/** A search box drawn wide (an icon and a placeholder), not a search icon. */
const isWideSearch = (node: Node) => isLink(node) && iconsIn(node).includes("search") && hasText(node);
const isSearchIcon = (node: Node) => isLink(node) && iconsIn(node).join() === "search" && !hasText(node);
/** Icons that move into the burger sheet on phones: wishlist, account and a design's own (non-working) menu button. */
const SHEET_ICONS = new Set(["heart", "user", "menu"]);
const isSheetIcon = (node: Node) =>
  node.type === "accountLink" || (isLink(node) && !hasText(node) && iconsIn(node).length === 1 && SHEET_ICONS.has(iconsIn(node)[0]!));
/** Tallaby Classic's header (templates/classic/chrome.ts) keeps its account icon on phones (owner, 2026-10-27). */
const KEEPS_ACCOUNT_ON_MOBILE = new Set(["tallaby-header"]);
const isAccount = (node: Node) => node.type === "accountLink" || (isLink(node) && !hasText(node) && iconsIn(node).join() === "user");

/** Drawn tools that move into the phone start cell, beside the burger. */
const START_TOOLS = new Set(["languageSwitcher", "themeToggle"]);
const BOXES = new Set(["hFlex", "vFlex", "grid", "div", "container"]);
/** Something is still drawn on phones: shown there, and a box only when something inside it is. */
const visibleOnMobile = (node: Node): boolean =>
  shownOnMobile(node) && (!BOXES.has(node.type) || node.children.some(visibleOnMobile));
const holdsLogo = (node: Node) => node.props.role === "logo" || contains(node.children, hasRole("logo"));

/**
 * Rewrites the bar's subtree for phones (see above). Returns the bar and what
 * moves into the start cell: a search icon (when the bar had a search) and
 * copies of the drawn language switch and theme toggle.
 */
function compactBar(bar: Node, id: string, locale: string): { bar: Node; start: Node[] } {
  const keepAccount = KEEPS_ACCOUNT_ON_MOBILE.has(id);
  let hadSearch = false;
  const tools: Node[] = [];
  const walk = (node: Node): Node => {
    if (!shownOnMobile(node)) return node;
    if (isWideSearch(node) || isSearchIcon(node)) {
      hadSearch = true;
      return hideOnMobile(node);
    }
    if (START_TOOLS.has(node.type)) {
      tools.push({ id: `${node.id}-mobile`, type: node.type, props: node.props, children: [] });
      return hideOnMobile(node);
    }
    if (isSheetIcon(node) && !(keepAccount && isAccount(node))) return hideOnMobile(node);
    // A box left with nothing shown (a wide search's sized wrapper) hides with it, so no empty slot or
    // second line is left.
    const children = node.children.map(walk);
    if (
      node !== bar &&
      children.some((c, i) => c !== node.children[i]) &&
      children.every((c) => !shownOnMobile(c)) &&
      !contains(children, hasRole("logo"))
    ) {
      return hideOnMobile({ ...node, children });
    }
    // A tagline beside the store name goes on phones.
    if (node.children.some(hasRole("storeName"))) {
      return { ...node, children: children.map((c) => (TEXT_TYPES.has(c.type) && c.props.role !== "storeName" ? hideOnMobile(c) : c)) };
    }
    return children.some((c, i) => c !== node.children[i]) ? { ...node, children } : node;
  };
  const out = walk(bar);
  const search: Node[] = hadSearch
    ? [
        {
          id: `${id}-mobile-search`,
          type: "linkBlock",
          props: { href: "/products", label: locale === "en" ? "Search" : "بحث" },
          style: { width: "44px", paddingTop: 11, paddingBottom: 9, paddingStart: 0, paddingEnd: 0, radius: 999, textAlign: "center" },
          children: [{ id: `${id}-mobile-search-icon`, type: "icon", props: { name: "search" }, style: { fontSize: "lg" }, children: [] }],
        },
      ]
    : [];
  const mobile: Record<string, unknown> = {};
  for (const key of ["paddingTop", "paddingBottom"] as const) {
    const value = mobileValue(out, key);
    if (typeof value === "number" && value > MOBILE_BAR_PADDING) mobile[key] = MOBILE_BAR_PADDING;
  }
  return { bar: Object.keys(mobile).length ? withMobileStyle(out, mobile) : out, start: [...search, ...tools] };
}

/** Puts the phone start cell first in the bar and lays the bar out as start · logo · end (see above). */
function splitBar(bar: Node, startCell: Node, id: string): Node {
  // Cells with nothing left on phones hide, so they take no column or gap.
  const cells = bar.children.map((c) => (visibleOnMobile(c) || holdsLogo(c) ? c : hideOnMobile(c)));
  const logoAt = cells.findIndex(holdsLogo);
  if (bar.type === "grid") {
    let children = [startCell, ...cells];
    const shown = children.filter(shownOnMobile);
    const mobile: Record<string, unknown> = { columns: Math.max(1, shown.length) };
    // A logo between two cells gets the middle half (4 columns, the logo spans 2), so a longer store
    // name stays on one line between the start icons and the cart.
    if (shown.length === 3 && holdsLogo(shown[1]!)) {
      mobile.columns = 4;
      // A link is drawn inside an <a> (the grid item), so a link logo gets a centred cell around it.
      const middle = shown[1]!;
      const cell: Node =
        middle.type === "linkBlock"
          ? { id: `${id}-logo-cell`, type: "hFlex", props: {}, style: { justifyContent: "center", alignItems: "center", wrap: false }, children: [middle] }
          : middle;
      children = children.map((c) => (c === middle ? withMobileStyle(cell, { colSpan: 2 }) : c));
    }
    return withMobileStyle({ ...bar, children }, mobile);
  }
  // A row: three columns when nothing but the start cell comes before the logo.
  if (logoAt < 0 || cells.slice(0, logoAt).some(shownOnMobile)) return { ...bar, children: [startCell, ...cells] };
  const end: Node = {
    id: `${id}-mobile-end`,
    type: "hFlex",
    props: { group: MOBILE_GROUP },
    style: { justifyContent: "end", alignItems: "center", gap: 4, wrap: false },
    children: cells.slice(logoAt + 1),
  };
  return withMobileStyle(
    { ...bar, props: { ...bar.props, split: MOBILE_SPLIT }, children: [startCell, ...cells.slice(0, logoAt + 1), end] },
    { gap: 8 },
  );
}

/** Hides, on phones, what follows the bar at every level up to the header's root (dividers stay). */
function hideAfter(nodes: Node[], path: readonly Node[]): Node[] {
  const [head, ...rest] = path;
  if (!head) return nodes;
  const at = nodes.indexOf(head);
  if (at < 0) return nodes;
  return nodes.map((node, i) => {
    if (i < at) return node;
    if (i === at) return rest.length ? { ...node, children: hideAfter(node.children, rest) } : node;
    return node.type === "divider" || !shownOnMobile(node) ? node : hideOnMobile(node);
  });
}

/** Links shown in the header only on larger screens (a row after the bar), for the burger sheet. */
function hiddenRowLinks(nodes: readonly Node[], path: readonly Node[], id: string): Node[] {
  const [head, ...rest] = path;
  if (!head) return [];
  const at = nodes.indexOf(head);
  const after = nodes.slice(at + 1).filter((node) => node.type !== "divider");
  const own = rest.length ? hiddenRowLinks(head.children, rest, id) : [];
  // Bound links (category chips) render only inside their list: leave them to the shop page.
  const plain = (node: Node): boolean => node.props.bind === undefined && node.children.every(plain);
  const links = menuLinks(
    after.map((node) => ({ ...node, props: { ...node.props, role: "menu" } })),
    id,
  ).filter((link) => plain(link) && hasText(link) && !isWideSearch(link) && !isCart(link));
  return [...own, ...links];
}

function withMobileMenu(tree: Node[], id: string, locale: string): Node[] {
  if (contains(tree, (node) => node.type === "mobileMenu")) return tree;
  const own = menuLinks(tree, id);
  let nodes = collapseMenus(tree);
  const path = pathTo(nodes, hasRole("logo"));
  const barAt = path?.findIndex((node) => node.type === "hFlex" || node.type === "grid") ?? -1;
  const extra = path && barAt >= 0 ? hiddenRowLinks(nodes, path.slice(0, barAt + 1), `${id}-x`) : [];
  const key = (link: Node) => `${String(link.props.href)}|${JSON.stringify(textsIn(link))}`;
  const seen = new Set(own.map(key));
  const links = [...own, ...extra.filter((link) => !seen.has(key(link)))];
  const burger: Node = { id: `${id}-mobile-menu`, type: "mobileMenu", props: {}, children: links };
  if (path && barAt >= 0) {
    const old = path[barAt]!;
    nodes = hideAfter(nodes, path.slice(0, barAt + 1));
    const { bar, start } = compactBar(pathTo(nodes, (node) => node.id === old.id)!.at(-1)!, id, locale);
    // Phones only: the burger, then the search icon and the language switch.
    const startCell: Node = {
      id: `${id}-mobile-start`,
      type: "hFlex",
      props: {},
      style: { hidden: true, gap: 0, alignItems: "center", wrap: false },
      breakpointStyles: { tablet: { hidden: true }, mobile: { hidden: false } },
      children: [burger, ...start],
    };
    return replaceFirst(nodes, (node) => node.id === old.id, () => splitBar(bar, startCell, id))!;
  }
  const [root, ...rest] = nodes;
  return root!.type === "section" ? [{ ...root!, children: [burger, ...root!.children] }, ...rest] : [burger, ...nodes];
}

/**
 * The header's tools beside a cart whose row spreads its items (`between` or
 * `around`) or is a grid: they go into one group with the cart, so each one
 * does not take an equal share of the free space or a cell of its own (owner,
 * 2026-10-29: a big gap between the language switch and the cart). Null when
 * the cart's row packs its items (they go in as siblings) or there is no cart.
 */
const SPREAD = new Set(["between", "around"]);

function groupWithCart(nodes: Node[], tools: Node[], id: string): Node[] | null {
  const path = pathTo(nodes, isCart);
  const cart = path?.at(-1);
  const parent = path?.at(-2);
  if (!cart || !parent) return null;
  const spreads = parent.type === "grid" || (parent.type === "hFlex" && SPREAD.has(String((parent.style as Record<string, unknown> | undefined)?.justifyContent)));
  if (!spreads) return null;
  const group: Node = { id: `${id}-tools`, type: "hFlex", props: {}, style: { gap: 8, alignItems: "center", wrap: false }, children: [...tools, cart] };
  return replaceFirst(nodes, (node) => node === cart, () => group);
}

/** Where the platform credit links. */
export const TALLABY_HOME = "https://tallaby.com";
const TALLABY_HREF_RE = /^https?:\/\/(www\.)?tallaby\.com\/?$/i;
const POWERED_BY: Record<string, readonly [string, string]> = { ar: ["مدعوم من", "طلبي"], en: ["Powered by", "Tallaby"] };
const COPYRIGHT_RE = /©|حقوق|rights reserved/i;

/** A credit the tree carries itself (older templates): a tallaby.com link or the `poweredBy` role. */
const isTallabyCredit = (node: Node) =>
  node.props.role === "poweredBy" || (typeof node.props.href === "string" && TALLABY_HREF_RE.test(node.props.href.trim()));
const isCopyright = (node: Node) =>
  node.props.role === "copyright" ||
  ((node.type === "text" || node.type === "paragraph") && typeof node.props.text === "string" && COPYRIGHT_RE.test(node.props.text));

function withoutNodes(nodes: Node[], match: (node: Node) => boolean): Node[] {
  return nodes.filter((node) => !match(node)).map((node) => ({ ...node, children: withoutNodes(node.children, match) }));
}

function findFirst(nodes: readonly Node[], match: (node: Node) => boolean): Node | null {
  for (const node of nodes) {
    if (match(node)) return node;
    const found = findFirst(node.children, match);
    if (found) return found;
  }
  return null;
}

/**
 * "Powered by Tallaby" («مدعوم من طلبي») in every footer (owner, 2026-10-26):
 * "Tallaby" underlined and linking to tallaby.com, beside the copyright line
 * (else in its own row at the end of the footer). It is drawn here and never
 * saved, so a seller cannot remove or edit it in the builder; a credit the
 * tree carries itself is dropped so it never shows twice. Its text is in
 * `locale`, the language shown.
 */
function withTallabyCredit(tree: Node[], id: string, locale: string): Node[] {
  const [lead, brand] = POWERED_BY[locale] ?? POWERED_BY.en!;
  const nodes = withoutNodes(tree, isTallabyCredit);
  const copyright = findFirst(nodes, isCopyright);
  const from = copyright?.style ?? {};
  const textStyle = {
    fontSize: from.fontSize ?? "xs",
    ...(from.color !== undefined && { color: from.color }),
    ...(from.opacity !== undefined && { opacity: from.opacity }),
  };
  const credit: Node = {
    id: `${id}-powered-by`,
    type: "hFlex",
    props: {},
    style: { gap: 4, alignItems: "center" },
    children: [
      { id: `${id}-powered-by-text`, type: "text", props: { text: lead }, style: textStyle, children: [] },
      {
        id: `${id}-powered-by-link`,
        type: "linkBlock",
        props: { href: TALLABY_HOME, label: brand },
        style: { paddingTop: 0, paddingBottom: 0, paddingStart: 0, paddingEnd: 0 },
        children: [
          { id: `${id}-powered-by-brand`, type: "text", props: { text: brand }, style: { ...textStyle, fontWeight: "semibold", underline: true }, children: [] },
        ],
      },
    ],
  };
  if (copyright) {
    const align = from.textAlign === "center" ? "center" : from.textAlign === "end" ? "end" : undefined;
    const legal: Node = {
      id: `${id}-legal`,
      type: "hFlex",
      props: {},
      style: { gap: 8, alignItems: "center", wrap: true, ...(align && { justifyContent: align }) },
      children: [copyright, credit],
    };
    return replaceFirst(nodes, (node) => node === copyright, () => legal)!;
  }
  return appendToFooter(nodes, { id: `${id}-legal`, type: "hFlex", props: {}, style: { justifyContent: "center", marginTop: 16 }, children: [credit] });
}

/**
 * The header or footer as it is drawn: its logo, store name and tools as the
 * seller set them (see above). `translated`: the store has more than one
 * language. `hasLogo`: the store uploaded a logo. `logoPlaceholder` (editor
 * only): without a logo, the logo node still goes in, beside the store name,
 * so the canvas can show its uploader there. `locale`: the language shown
 * (the footer's Powered by Tallaby line; Arabic when not given). `appInstall`:
 * the footer gets the store app's Download application button. Never
 * mutates its input, and returns a header unchanged when nothing applies.
 */
export function drawChrome(
  instance: SectionInstance | null | undefined,
  part: ChromePart,
  opts: { translated: boolean; hasLogo: boolean; logoPlaceholder?: boolean; locale?: string; appInstall?: boolean },
): SectionInstance | null | undefined {
  const tree = instance?.componentTree;
  if (!instance || !tree?.length) return instance;
  const on = (option: ChromeOption) => chromeOptionOn(instance, part, option);
  let nodes = tree;
  if (opts.hasLogo && on("logo")) nodes = withStoreLogo(nodes, instance.id, part, on("storeName"));
  else if (opts.logoPlaceholder && on("logo")) nodes = withStoreLogo(nodes, instance.id, part, true);
  else nodes = withoutMark(nodes);
  const tools: Node[] = [];
  const tool = (type: Node["type"], suffix: string) => {
    if (!contains(nodes, (node) => node.type === type)) tools.push({ id: `${instance.id}-${suffix}`, type, props: {}, children: [] });
  };
  if (opts.translated && on("languageSwitcher")) tool("languageSwitcher", "language");
  if (on("themeToggle")) tool("themeToggle", "theme");
  if (on("account")) tool("accountLink", "account");
  // The store app's "Download application" button (ROADMAP.md F-36): every footer, unless the store hid it.
  if (part === "footer" && opts.appInstall) tool("appInstall", "app");
  if (tools.length && part === "header") {
    // Before the cart (in this order), else after the menu, else after the logo, else at the end.
    const [root, ...rest] = nodes;
    const group = (list: Node[], at: (node: Node) => boolean, after: boolean): Node[] | null => {
      let out = insertBeside(list, at, tools[0]!, after);
      for (const [i, next] of tools.slice(1).entries()) out = out && insertBeside(out, (node) => node.id === tools[i]!.id, next, true);
      return out;
    };
    nodes =
      groupWithCart(nodes, tools, instance.id) ??
      group(nodes, isCart, false) ??
      group(nodes, hasRole("menu"), true) ??
      group(nodes, hasRole("logo"), true) ??
      (root!.type === "section" ? [{ ...root!, children: [...root!.children, ...tools] }, ...rest] : [...nodes, ...tools]);
  } else if (tools.length) {
    const row: Node = { id: `${instance.id}-tools`, type: "hFlex", props: {}, style: { gap: 8, alignItems: "center", marginTop: 16 }, children: tools };
    nodes = appendFooterTools(nodes, row);
  }
  if (part === "header") nodes = withMobileMenu(nodes, instance.id, opts.locale ?? "ar");
  if (part === "footer") nodes = withTallabyCredit(nodes, instance.id, opts.locale ?? "ar");
  return nodes === tree ? instance : { ...instance, componentTree: nodes };
}

/** Whether the header or footer offers the theme toggle (the storefront then loads the dark theme). */
export function chromeHasThemeToggle(header: SectionInstance | null | undefined, footer: SectionInstance | null | undefined): boolean {
  return (
    Boolean(header?.componentTree?.length && chromeOptionOn(header, "header", "themeToggle")) ||
    Boolean(footer?.componentTree?.length && chromeOptionOn(footer, "footer", "themeToggle"))
  );
}

/**
 * Whether the stored footer itself links to tallaby.com (docs/template-rules.md
 * §4.3). Every footer is drawn with the credit anyway (`drawChrome`).
 */
export function footerCreditsTallaby(footer: SectionInstance | null | undefined): boolean {
  const walk = (nodes: readonly { props: Record<string, unknown>; children: readonly unknown[] }[] | undefined): boolean =>
    (nodes ?? []).some((n) => {
      const href = n.props.href;
      return (typeof href === "string" && TALLABY_HREF_RE.test(href.trim())) || walk(n.children as typeof nodes);
    });
  return walk(footer?.componentTree);
}
