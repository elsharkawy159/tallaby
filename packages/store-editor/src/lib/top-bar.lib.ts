/**
 * Sections above the header (owner, 2026-11-26: "allow moving sections above
 * the header. I made a top bar with auto-swipe text but can't move it above
 * the header"). The header is the store's shared chrome, drawn above every
 * page, so a page section can never sit above it; instead the section's tree
 * moves INTO the header as its first row:
 *
 * - The section's root `section` node becomes a Box (`div`) with the same id,
 *   props, styles and custom CSS (a section root is never nested,
 *   `canContain`); every element inside keeps its id and `props.field`.
 * - The row is marked with `props.pageSection` (`TOP_BAR_PROP`, a
 *   `TopBarOrigin`): the section's id, design source, and its section-level
 *   Animation / Scroll effect, which do nothing in the header (it never
 *   reveals) but come back with "Move to page".
 * - The section's own custom CSS goes onto the row (scoped to the row instead
 *   of the section wrapper that held only that root).
 *
 * Only element-tree sections move, and only when nothing visible would be
 * lost: section-level colours, background, width or padding (the section
 * shell, `style.parts`, device styles) have no place on a row, so such a
 * section is refused. "Move to page" takes any top row back (a marked row,
 * or an announcement bar before the header's bar) as a page section. Pure.
 */
import {
  MAX_CUSTOM_CSS_BYTES,
  TOP_BAR_PROP,
  isTopBarRow,
  validatePageContent,
  type ComponentNode,
  type SectionInstance,
  type TopBarOrigin,
} from "@workspace/store-sections";
import { findNode, findPath, insertNode, normalizeBreakpointStyles, normalizeSectionBreakpointStyle, normalizeSectionStyle } from "@workspace/store-sections/render";

const CUSTOM = "custom-section";
/** The custom section's version (sections/custom.tsx); a moved-back row is one again. */
const CUSTOM_VERSION = 1;

/** Section-level settings that do nothing in the header; kept in the origin for the way back. */
const DORMANT_SHELL_KEYS = new Set(["animation", "scrollEffect"]);

const utf8 = (value: string) => new TextEncoder().encode(value).length;
const isBag = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const hasKeys = (value: unknown) => isBag(value) && Object.keys(value).length > 0;

/** The header's root section (top rows are its children); null for a header without one. */
function headerRoot(header: SectionInstance | null | undefined): ComponentNode | null {
  const root = header?.componentTree?.[0];
  return root?.type === "section" ? root : null;
}

/** Whether nothing visible of the section lives outside its tree (see the file note). */
function onlyTree(section: SectionInstance): boolean {
  const { shell, parts, ...plain } = normalizeSectionStyle(section.style);
  if (Object.keys(plain).length || parts) return false;
  if (shell && Object.keys(shell).some((key) => !DORMANT_SHELL_KEYS.has(key))) return false;
  const devices = normalizeBreakpointStyles(section.breakpointStyles, normalizeSectionBreakpointStyle);
  if (Object.values(devices).some((style) => style && Object.keys(style).length)) return false;
  return !hasKeys(section.props) && !hasKeys(section.translations) && !hasKeys(section.slots) && !section.libraryRef && !section.savedBlockRef;
}

/** The section's root with its own custom CSS on it, or null when the two together are over the cap. */
function rootWithCss(section: SectionInstance, root: ComponentNode): ComponentNode | null {
  const css = [section.customCss?.trim(), root.customCss?.trim()].filter(Boolean).join("\n");
  if (utf8(css) > MAX_CUSTOM_CSS_BYTES) return null;
  const { customCss: _drop, ...rest } = root;
  return css ? { ...rest, customCss: css } : rest;
}

function treeIds(nodes: readonly ComponentNode[], out = new Set<string>()): Set<string> {
  for (const node of nodes) {
    out.add(node.id);
    treeIds(node.children, out);
  }
  return out;
}

/** The section's tree as a header row: its root as a Box, marked with where it came from. */
function rowOf(section: SectionInstance): ComponentNode | null {
  const tree = section.componentTree ?? [];
  const root = tree.length === 1 && tree[0]!.type === "section" ? tree[0]! : null;
  const withCss = root && rootWithCss(section, root);
  if (!withCss) return null;
  const shell = normalizeSectionStyle(section.style).shell;
  const dormant = shell && Object.fromEntries(Object.entries(shell).filter(([key]) => DORMANT_SHELL_KEYS.has(key)));
  const origin: TopBarOrigin = {
    id: section.id,
    ...(section.source && { source: section.source }),
    ...(dormant && Object.keys(dormant).length && { style: { shell: dormant } }),
    ...(hasKeys(section.animation) && { animation: section.animation }),
  };
  return { ...withCss, type: "div", props: { ...withCss.props, [TOP_BAR_PROP]: origin } };
}

/** The header with the section as its first row (no save check; see `sectionToTopBar`). */
function buildTopBar(section: SectionInstance, header: SectionInstance | null | undefined): SectionInstance | null {
  const root = headerRoot(header);
  if (!header || !root || section.sectionId !== CUSTOM || !onlyTree(section)) return null;
  const row = rowOf(section);
  if (!row) return null;
  const taken = treeIds(header.componentTree ?? []);
  if ([...treeIds([row])].some((id) => taken.has(id))) return null;
  const tree = insertNode(header.componentTree ?? [], root.id, row, 0);
  if (headerRoot({ ...header, componentTree: tree })?.children[0]?.id !== row.id) return null;
  return { ...header, componentTree: tree };
}

/**
 * The header with `section` as its new first row, or null when it can't go
 * there: no header (or one without a root section), not an element-tree
 * section, section-level styles that would be lost, an element id the header
 * already uses, over the header's element or depth limits, or a header the
 * chrome save would refuse (the same check `saveStoreChrome` runs, without
 * the server's CSS parser), so the page never loses a section the header
 * can't keep.
 */
export function sectionToTopBar(section: SectionInstance, header: SectionInstance | null | undefined): SectionInstance | null {
  const next = buildTopBar(section, header);
  return next && headerSaves(next) ? next : null;
}

/** Whether "Move above header" is offered for this section (the quick checks of `sectionToTopBar`, for menus and drags). */
export function canMoveAboveHeader(section: SectionInstance | null | undefined, header: SectionInstance | null | undefined): boolean {
  return Boolean(section && buildTopBar(section, header));
}

/** Whether a header passes the chrome save's validation. */
export function headerSaves(header: SectionInstance): boolean {
  return validatePageContent({ sections: [header] }).success;
}

/**
 * The header's top rows that "Move to page" takes: every moved section, and
 * each row before the header's bar (the root's child that holds the logo),
 * such as a template's announcement bar.
 */
export function topBarRowIds(header: SectionInstance | null | undefined): string[] {
  const root = headerRoot(header);
  if (!root) return [];
  const holdsLogo = (node: ComponentNode): boolean => node.props.role === "logo" || node.children.some(holdsLogo);
  const bar = root.children.findIndex(holdsLogo);
  return root.children.filter((child, index) => isTopBarRow(child) || (bar >= 0 && index < bar)).map((child) => child.id);
}

/** The top row holding `nodeId` (the row itself or an element inside it), or null. */
export function topBarRowOf(header: SectionInstance | null | undefined, nodeId: string | undefined): string | null {
  const root = headerRoot(header);
  if (!root || !nodeId) return null;
  const path = findPath(header!.componentTree ?? [], nodeId);
  const rowId = path && path[0] === root.id ? path[1] : undefined;
  return rowId && topBarRowIds(header).includes(rowId) ? rowId : null;
}

export type TopBarToSectionDeps = {
  /** Whether the target page already has a section with this id (a moved row keeps its old id when free). */
  sectionTaken: (id: string) => boolean;
  makeSectionId: () => string;
  makeNodeId: () => string;
};

/**
 * The header without the top row `rowId`, and that row as a page section: a
 * moved section comes back as it was (its root a section again, its id when
 * free, its source and section-level motion); any other top row goes inside
 * a new section root with no padding. Null when `rowId` is not a top row.
 */
export function topBarToSection(
  header: SectionInstance | null | undefined,
  rowId: string,
  deps: TopBarToSectionDeps,
): { header: SectionInstance; section: SectionInstance } | null {
  const root = headerRoot(header);
  const row = root && topBarRowIds(header).includes(rowId) ? findNode(root.children, rowId) : null;
  if (!header || !root || !row) return null;
  const [, ...others] = header.componentTree ?? [];
  const nextHeader: SectionInstance = { ...header, componentTree: [{ ...root, children: root.children.filter((child) => child.id !== rowId) }, ...others] };
  const origin = isTopBarRow(row) ? (row.props[TOP_BAR_PROP] as TopBarOrigin) : null;
  let sectionRoot: ComponentNode;
  if (origin) {
    const { [TOP_BAR_PROP]: _origin, ...props } = row.props;
    sectionRoot = { ...row, type: "section", props };
  } else {
    sectionRoot = {
      id: deps.makeNodeId(),
      type: "section",
      props: {},
      style: { paddingTop: 0, paddingBottom: 0 },
      breakpointStyles: { mobile: { paddingTop: 0, paddingBottom: 0 } },
      children: [row],
    };
  }
  const id = origin && !deps.sectionTaken(origin.id) ? origin.id : deps.makeSectionId();
  const section: SectionInstance = {
    id,
    sectionId: CUSTOM,
    version: CUSTOM_VERSION,
    props: {},
    ...(origin?.source && { source: origin.source }),
    ...(isBag(origin?.style) && { style: origin.style }),
    ...(isBag(origin?.animation) && { animation: origin.animation }),
    componentTree: [sectionRoot],
  };
  return { header: nextHeader, section };
}
