/**
 * The editor canvas's preview of one `code` node (ROADMAP F-101e,
 * code-sections design §5.2). Server only: it runs the same Liquid engine,
 * HTML cleaner and CSS scoper as the storefront (`render-code.server.tsx`),
 * with `request.design_mode = true`, on the draft file and values the Code tab
 * sends. The host (the dashboard action) checks the store against the session
 * seller and loads the catalog rows `codePreviewQueries` asks for, of that
 * store only (rule 5).
 *
 * - Never cached (rule 8, design §4.7): every call renders afresh.
 * - Never throws: on any problem `html` is '' and `issues` says why.
 * - Every issue position is in the joined file the Code tab shows.
 * - Logs nothing: the template and values are the seller's.
 */
import type { CatalogQuery, ProductDetail } from "../core/types";
import { DEMO_PRODUCT } from "../core/demo-product";
import { SITE_ROOT_CLASS } from "../core/theme";
import { nodeCodeCatalogQueries, type DataRecord } from "../elements/data";
import { codeKeyframePrefix } from "../elements/style";
import type { CodeIssue } from "./code-issues";
import type { CodeNodeIssue, CodeNodeProps } from "./code-node";
import { codeNodeFromFile } from "./code-node.server";
import { readCodeProps } from "./code-props";
import { renderLiquid } from "./liquid.server";
import { buildCodeScope, type CodeScopeContext } from "./render-code.server";
import { sanitizeCodeHtml } from "./sanitize-code";
import { scopeCss } from "./scope-css";
import { sectionFilePositions } from "./section-file";

const NODE_ID = /^[A-Za-z0-9_-]{1,64}$/;

export type CodePreviewDraft = {
  nodeId: string;
  /** The joined section file (Liquid, `{% stylesheet %}`, `{% schema %}`). */
  file: string;
  name?: unknown;
  settings: unknown;
  blocks: unknown;
};

/** The draft, normalised against its own schema, with every issue positioned in the file. */
export type PreparedCodePreview = {
  nodeId: string;
  props: CodeNodeProps;
  issues: CodeIssue[];
};

export type CodePreviewEnv = {
  locale: "ar" | "en";
  pageType: "page" | "product";
  /** The store (already checked by the host); only for the result's shape, never in a cache key. */
  storeId: string;
  store: { name: string; url: string; logoUrl?: string | null };
  currency: string;
  currencyLabel?: string;
  /** The store's design-system draft (`{ colors, typography, spacing }`); anything else is ignored. */
  designSystem?: unknown;
  /** The rows `codePreviewQueries` asked for, of this store only: an id of another store is simply absent. */
  catalog: CodeScopeContext["catalog"];
  /** The product page canvas's product; on the product page without one, the demo product (as the canvas draws). */
  product?: ProductDetail | null;
  /** A stored image path or URL to a URL. */
  imageUrl: (path: string) => string | null;
};

export type CodePreviewResult = {
  props: CodeNodeProps;
  issues: CodeIssue[];
  /** Cleaned HTML; '' when the node can't render. */
  html: string;
  /** The node's stylesheet scoped to `.sf-site [data-node-id="<nodeId>"]`; '' when none. */
  css: string;
};

const isPlainObject = (v: unknown): v is Record<string, unknown> => v != null && typeof v === "object" && !Array.isArray(v);

/** An issue without its field, positioned in the joined file. */
function inFile(issue: CodeNodeIssue, positions: ReturnType<typeof sectionFilePositions>): CodeIssue {
  const { field, line, column, ...rest } = issue;
  if (line == null || column == null) return rest;
  // Split issues carry no field and are already positioned in the file.
  if (field === undefined) return { ...rest, line, column };
  if (field === "source") return { ...rest, ...positions.fromSource(line, column) };
  if (field === "css") return { ...rest, ...positions.fromCss(line, column) };
  // Schema and name issues point at no text of the file.
  return rest;
}

/** Normalises the draft (`codeNodeFromFile`) and maps its issues into the file. Never throws. */
export function prepareCodePreview(draft: CodePreviewDraft): PreparedCodePreview {
  const file = typeof draft.file === "string" ? draft.file : "";
  const { props, issues } = codeNodeFromFile(file, { name: draft.name, settings: draft.settings, blocks: draft.blocks });
  const positions = sectionFilePositions(file);
  return { nodeId: draft.nodeId, props, issues: issues.map((issue) => inFile(issue, positions)) };
}

/**
 * The catalog queries the prepared node's picks need (picked products, picked
 * categories and their products), keyed as the renderer reads them. The host
 * resolves them for its own store, in one load.
 */
export function codePreviewQueries(prepared: PreparedCodePreview): Record<string, CatalogQuery> {
  if (!NODE_ID.test(prepared.nodeId)) return {};
  return nodeCodeCatalogQueries({ id: prepared.nodeId, type: "code", props: prepared.props, children: [] });
}

function designSystemOf(value: unknown): { colors?: Record<string, unknown>; typography?: Record<string, unknown>; spacing?: Record<string, unknown> } | null {
  if (!isPlainObject(value)) return null;
  const part = (key: string) => (isPlainObject(value[key]) ? (value[key] as Record<string, unknown>) : undefined);
  return { colors: part("colors"), typography: part("typography"), spacing: part("spacing") };
}

/** "(line 3, column 7)" that `renderLiquid` appends, relative to the stored source. */
const RENDER_POSITION = /\s*\(line (\d+), column (\d+)\)$/;

/** Renders a prepared draft for the canvas. Never caches, never throws. */
export function renderPreparedCodePreview(prepared: PreparedCodePreview, file: string, env: CodePreviewEnv): CodePreviewResult {
  const { nodeId, props } = prepared;
  const issues = [...prepared.issues];
  const empty = { props, issues, html: "", css: "" };
  if (!NODE_ID.test(nodeId)) return { ...empty, issues: [...issues, { code: "invalid_node", message: "The section id is invalid." }] };
  try {
    const code = readCodeProps(props);
    let html = "";
    if (code) {
      const product = env.pageType === "product" ? (env.product ?? DEMO_PRODUCT) : null;
      const scope: DataRecord | undefined = product ? { kind: "product", record: product } : undefined;
      const ctx: CodeScopeContext = {
        locale: env.locale,
        dir: env.locale === "ar" ? "rtl" : "ltr",
        imageUrl: (src) => (typeof src === "string" && src ? env.imageUrl(src) : null),
        store: { name: env.store.name, url: env.store.url, logoUrl: env.store.logoUrl ?? null },
        catalog: env.catalog,
      };
      const cs = { pageType: env.pageType, currency: env.currency, designSystem: designSystemOf(env.designSystem) };
      const data = buildCodeScope({ id: nodeId }, code, ctx, cs, scope, { designMode: true });
      const result = renderLiquid(code.source, data, { locale: env.locale, currency: env.currency, currencyLabel: env.currencyLabel });
      if (result.error) {
        // A parse error is already an issue from the check; limits and render errors are new.
        if (result.error.kind !== "parse") {
          const match = RENDER_POSITION.exec(result.error.message);
          const message = result.error.message.replace(RENDER_POSITION, "");
          const at = match ? sectionFilePositions(file).fromSource(Number(match[1]), Number(match[2])) : {};
          issues.push({ code: result.error.kind === "limit" ? "render_limit" : "render_failed", message, ...at });
        }
      } else {
        html = sanitizeCodeHtml(result.html, { nodeId });
      }
    }
    let css = "";
    if (props.css) {
      try {
        css = scopeCss(props.css, { scope: `.${SITE_ROOT_CLASS} [data-node-id="${nodeId}"]`, keyframePrefix: codeKeyframePrefix(nodeId) }).css;
      } catch {
        css = "";
      }
    }
    return { props, issues, html, css };
  } catch {
    return { ...empty, issues: [...issues, { code: "render_failed", message: "The section couldn't be drawn." }] };
  }
}

/** `prepareCodePreview` then `renderPreparedCodePreview`: the whole preview of one draft. Never caches, never throws. */
export function renderCodePreview(input: CodePreviewDraft & CodePreviewEnv): CodePreviewResult {
  let prepared: PreparedCodePreview;
  try {
    prepared = prepareCodePreview(input);
  } catch {
    const { props } = codeNodeFromFile("");
    return { props, issues: [{ code: "render_failed", message: "The section couldn't be drawn." }], html: "", css: "" };
  }
  return renderPreparedCodePreview(prepared, typeof input.file === "string" ? input.file : "", input);
}
