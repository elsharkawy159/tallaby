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
 * - Language switcher, theme toggle, sign-in: in the header beside the cart
 *   (as `withLanguageSwitcher` places the switcher); in the footer as one row
 *   after the social links, else at the end of the footer's container.
 */
export type ChromePart = "header" | "footer";
export const CHROME_OPTIONS = ["logo", "storeName", "languageSwitcher", "themeToggle", "account"] as const;
export type ChromeOption = (typeof CHROME_OPTIONS)[number];

const CHROME_DEFAULTS: Record<ChromePart, Record<ChromeOption, boolean>> = {
  header: { logo: true, storeName: false, languageSwitcher: true, themeToggle: false, account: false },
  footer: { logo: true, storeName: false, languageSwitcher: false, themeToggle: false, account: false },
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
  const social = insertBeside(tree, hasRole("social"), row, true);
  if (social) return social;
  const container = replaceFirst(tree, (node) => node.type === "container", (node) => ({ ...node, children: [...node.children, row] }));
  if (container) return container;
  const [root, ...rest] = tree;
  return root!.type === "section" ? [{ ...root!, children: [...root!.children, row] }, ...rest] : [...tree, row];
}

/**
 * The header or footer as it is drawn: its logo, store name and tools as the
 * seller set them (see above). `translated`: the store has more than one
 * language. `hasLogo`: the store uploaded a logo. `logoPlaceholder` (editor
 * only): without a logo, the logo node still goes in, beside the store name,
 * so the canvas can show its uploader there. Never mutates its input, and
 * returns it unchanged when nothing applies.
 */
export function drawChrome(
  instance: SectionInstance | null | undefined,
  part: ChromePart,
  opts: { translated: boolean; hasLogo: boolean; logoPlaceholder?: boolean },
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
  if (tools.length && part === "header") {
    // Before the cart (in this order), else after the menu, else after the logo, else at the end.
    const [root, ...rest] = nodes;
    const group = (list: Node[], at: (node: Node) => boolean, after: boolean): Node[] | null => {
      let out = insertBeside(list, at, tools[0]!, after);
      for (const [i, next] of tools.slice(1).entries()) out = out && insertBeside(out, (node) => node.id === tools[i]!.id, next, true);
      return out;
    };
    nodes =
      group(nodes, isCart, false) ??
      group(nodes, hasRole("menu"), true) ??
      group(nodes, hasRole("logo"), true) ??
      (root!.type === "section" ? [{ ...root!, children: [...root!.children, ...tools] }, ...rest] : [...nodes, ...tools]);
  } else if (tools.length) {
    const row: Node = { id: `${instance.id}-tools`, type: "hFlex", props: {}, style: { gap: 8, alignItems: "center", marginTop: 16 }, children: tools };
    nodes = appendFooterTools(nodes, row);
  }
  return nodes === tree ? instance : { ...instance, componentTree: nodes };
}

/** Whether the header or footer offers the theme toggle (the storefront then loads the dark theme). */
export function chromeHasThemeToggle(header: SectionInstance | null | undefined, footer: SectionInstance | null | undefined): boolean {
  return (
    Boolean(header?.componentTree?.length && chromeOptionOn(header, "header", "themeToggle")) ||
    Boolean(footer?.componentTree?.length && chromeOptionOn(footer, "footer", "themeToggle"))
  );
}
