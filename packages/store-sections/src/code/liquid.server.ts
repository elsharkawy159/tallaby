/**
 * The restricted Liquid engine of code sections (ROADMAP F-101, code-sections
 * design §4.1, §4.6 and §11.4). Server only. One shared liquidjs instance:
 *
 * - No file system: `fs` is a stub that throws, and `include`, `render` and
 *   `layout` are replaced by tags that refuse to parse.
 * - `ownPropertyOnly`, so no `constructor` or `__proto__` walking.
 * - `strictFilters`: an unknown filter is a parse error. `strictVariables` off:
 *   a missing field renders empty.
 * - Every `{{ }}`, `{% echo %}` and `{% cycle %}` value is HTML-escaped;
 *   `| raw` opts out (the output is still cleaned by `sanitize-code.ts`).
 * - Limits: 64 KB of source, 50 ms per render, 1e6 memory units.
 * - Dropped tags are a parse error that names the tag, never a silent no-op.
 *
 * Parsed templates are kept in a 500-entry LRU keyed by the source's sha256.
 * `renderLiquid` is synchronous (the React renderer is) and never throws.
 */
import { createHash } from "node:crypto";
import { Context, Liquid, Tag, type FS, type Template, type TagToken, type TopLevelToken } from "liquidjs";
import type { CodeIssue } from "./code-issues";
import { FILTER_CONTEXT_REGISTER, registerCodeFilters, type FilterContext } from "./liquid-filters";
import { LiquidHtml, type LiquidScope } from "./liquid-objects";

export const LIQUID_PARSE_LIMIT = 64 * 1024;
export const LIQUID_RENDER_LIMIT_MS = 50;
export const LIQUID_MEMORY_LIMIT = 1e6;
export const LIQUID_CACHE_SIZE = 500;

/** Tags a code section may use (liquidjs names; `#` is the inline comment). */
export const ALLOWED_TAGS = [
  "if", "unless", "case", "for", "break", "continue", "assign", "capture", "comment", "#",
  "raw", "cycle", "increment", "decrement", "liquid", "echo",
] as const;

/** Tags that are a parse error, with the end tag of the block ones. */
const DROPPED_TAGS: Record<string, { block: boolean; reason: string }> = {
  include: { block: false, reason: "Snippets aren't available in code sections. Put the markup in this section." },
  render: { block: false, reason: "Snippets aren't available in code sections. Put the markup in this section." },
  layout: { block: false, reason: "Layouts aren't available in code sections." },
  block: { block: true, reason: "Layout blocks aren't available in code sections. Use section blocks from the schema." },
  tablerow: { block: true, reason: "Use {% for %} with an HTML table instead." },
  javascript: { block: true, reason: "JavaScript isn't allowed in code sections." },
  form: { block: true, reason: "Forms aren't available in code sections. Use the built-in form element." },
  paginate: { block: true, reason: "Paging isn't available in code sections. Use the built-in product list." },
  section: { block: false, reason: "A code section can't include other sections." },
  sections: { block: false, reason: "A code section can't include other sections." },
  content_for: { block: false, reason: "Nested blocks aren't available in code sections. Use section blocks from the schema." },
  style: { block: true, reason: "Put CSS in the section's {% stylesheet %} block." },
  stylesheet: { block: true, reason: "{% stylesheet %} belongs once at the top level of the section file, not inside the template." },
  schema: { block: true, reason: "{% schema %} belongs once at the top level of the section file, not inside the template." },
};
export const DROPPED_TAG_NAMES = Object.keys(DROPPED_TAGS);

class TagNotAllowedError extends Error {
  constructor(readonly tag: string, reason: string) {
    super(`The {% ${tag} %} tag isn't allowed. ${reason}`);
    this.name = "TagNotAllowedError";
  }
}

function droppedTag(name: string, block: boolean, reason: string) {
  return class extends Tag {
    constructor(token: TagToken, remainTokens: TopLevelToken[], liquid: Liquid) {
      super(token, remainTokens, liquid);
      // Swallow the block's body and end tag, so one dropped block is one error.
      if (block) {
        while (remainTokens.length) {
          const next = remainTokens.shift() as TopLevelToken & { name?: string };
          if (next.name === `end${name}`) break;
        }
      }
      throw new TagNotAllowedError(name, reason);
    }
    // eslint-disable-next-line require-yield
    *render(): Generator<unknown, void, unknown> {
      // Never reached: the constructor always throws.
    }
  };
}

const NO_FS: FS = {
  exists: async () => false,
  existsSync: () => false,
  readFile: async () => {
    throw new Error("No file access in code sections");
  },
  readFileSync: () => {
    throw new Error("No file access in code sections");
  },
  resolve: () => {
    throw new Error("No file access in code sections");
  },
  contains: async () => false,
  containsSync: () => false,
};

/** Escapes every output value except `LiquidHtml`, charging the memory limit like liquidjs's own `escape`. */
function escapeOutput(this: { context: Context }, value: unknown): string {
  if (value instanceof LiquidHtml) return value.html;
  const text = stringify(value);
  this.context.memoryLimit.use(text.length);
  return text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}

function stringify(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(stringify).join("");
  if (typeof value === "object" && typeof (value as { valueOf?: unknown }).valueOf === "function") {
    const v = (value as { valueOf(): unknown }).valueOf();
    if (v !== value) return stringify(v);
  }
  return String(value);
}

function createEngine(catchAllErrors: boolean): Liquid {
  const engine = new Liquid({
    fs: NO_FS,
    relativeReference: false,
    dynamicPartials: false,
    cache: false,
    ownPropertyOnly: true,
    strictFilters: true,
    strictVariables: false,
    jsTruthy: false,
    catchAllErrors,
    outputEscape: escapeOutput as (value: unknown) => string,
    parseLimit: LIQUID_PARSE_LIMIT,
    renderLimit: LIQUID_RENDER_LIMIT_MS,
    memoryLimit: LIQUID_MEMORY_LIMIT,
  });
  // liquidjs has no unregisterTag; `tags` is its own registry object.
  for (const name of Object.keys(engine.tags)) {
    if (!(ALLOWED_TAGS as readonly string[]).includes(name)) delete engine.tags[name];
  }
  for (const [name, { block, reason }] of Object.entries(DROPPED_TAGS)) engine.registerTag(name, droppedTag(name, block, reason));
  registerCodeFilters(engine);
  return engine;
}

/** Renders. Exported for tests that check the registries. */
export const liquidEngine = createEngine(false);
/** Save-time checks: the same rules, but every parse error is collected. */
const checkEngine = createEngine(true);

// ---------------------------------------------------------------------------
// Parse cache
// ---------------------------------------------------------------------------

type Parsed = { templates: Template[] } | { error: unknown };
const cache = new Map<string, Parsed>();

function parseCached(source: string): Parsed {
  const key = createHash("sha256").update(source).digest("hex");
  const hit = cache.get(key);
  if (hit) {
    cache.delete(key);
    cache.set(key, hit);
    return hit;
  }
  let parsed: Parsed;
  try {
    parsed = { templates: liquidEngine.parse(source) };
  } catch (error) {
    parsed = { error };
  }
  cache.set(key, parsed);
  if (cache.size > LIQUID_CACHE_SIZE) cache.delete(cache.keys().next().value as string);
  return parsed;
}

/** For tests. */
export function clearLiquidCache(): void {
  cache.clear();
}
export function liquidCacheSize(): number {
  return cache.size;
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

type LiquidLikeError = Error & {
  token?: { getPosition(): [number, number] };
  originalError?: unknown;
  errors?: unknown[];
};

function isLimitError(error: unknown): boolean {
  const e = error as LiquidLikeError;
  const messages = [e?.message, (e?.originalError as Error | undefined)?.message];
  return messages.some((m) => typeof m === "string" && /limit exceeded/.test(m));
}

/** liquidjs appends ", line:3, col:7"; issues carry the position separately. */
function bareMessage(error: LiquidLikeError): string {
  const root = rootCause(error);
  const original = root instanceof Error ? root.message : error.message;
  return String(original ?? "Liquid error").replace(/, line:\d+, col:\d+$/, "");
}

/** The first non-liquidjs error under `error` (a tag inside `{% liquid %}` is wrapped twice). */
function rootCause(error: unknown): unknown {
  let e = error as LiquidLikeError | undefined;
  for (let i = 0; i < 5 && e?.originalError; i++) e = e.originalError as LiquidLikeError;
  return e;
}

function limitIssue(e: LiquidLikeError, at: { line?: number; column?: number }): CodeIssue {
  const text = `${e.message} ${(e.originalError as Error | undefined)?.message ?? ""}`;
  if (/memory alloc/.test(text)) {
    return { code: "memory_limit", message: "The section builds too much text or too big a list (memory limit reached).", ...at };
  }
  if (/template render/.test(text)) {
    return { code: "time_limit", message: `The section took longer than ${LIQUID_RENDER_LIMIT_MS} ms to render.`, ...at };
  }
  return { code: "source_too_large", message: `The template is too long (more than ${LIQUID_PARSE_LIMIT / 1024} KB).`, ...at };
}

function toIssue(error: unknown): CodeIssue {
  const e = error as LiquidLikeError;
  const position = e?.token?.getPosition?.();
  const at = position ? { line: position[0], column: position[1] } : {};
  const dropped = rootCause(e);
  if (dropped instanceof TagNotAllowedError) return { code: "tag_not_allowed", message: dropped.message, ...at };
  if (isLimitError(e)) return limitIssue(e, at);
  const message = bareMessage(e);
  const filter = /^undefined filter: (\S+)/.exec(message);
  if (filter) return { code: "unknown_filter", message: `Unknown filter "${filter[1]}".`, ...at };
  return { code: "liquid_syntax", message, ...at };
}

/** Save-time check of a template (`source`, without its stylesheet and schema). */
export function checkLiquidSource(source: string): CodeIssue[] {
  if (source.length > LIQUID_PARSE_LIMIT) {
    return [{ code: "source_too_large", message: `The template is too long (more than ${LIQUID_PARSE_LIMIT / 1024} KB).` }];
  }
  try {
    checkEngine.parse(source);
    return [];
  } catch (error) {
    const list = (error as LiquidLikeError).errors;
    return Array.isArray(list) && list.length ? list.map(toIssue) : [toIssue(error)];
  }
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export type LiquidRenderError = { kind: "parse" | "limit" | "render"; message: string };
export type LiquidRenderContext = FilterContext;

/**
 * Renders `source` with `scope`. Never throws: on any error `html` is empty and
 * `error` says why (the live store drops the node and logs `kind`; the builder
 * shows `message`).
 */
export function renderLiquid(
  source: string,
  scope: LiquidScope,
  ctx: LiquidRenderContext,
): { html: string; error?: LiquidRenderError } {
  try {
    if (source.length > LIQUID_PARSE_LIMIT) {
      return { html: "", error: { kind: "limit", message: `The template is longer than ${LIQUID_PARSE_LIMIT / 1024} KB.` } };
    }
    const parsed = parseCached(source);
    if ("error" in parsed) {
      const kind = isLimitError(parsed.error) ? "limit" : "parse";
      return { html: "", error: { kind, message: errorMessage(parsed.error) } };
    }
    const context = new Context(scope, liquidEngine.options, { sync: true }, { liquid: liquidEngine });
    context.setRegister(FILTER_CONTEXT_REGISTER, { locale: ctx.locale, currency: ctx.currency, currencyLabel: ctx.currencyLabel });
    const html = liquidEngine.renderSync(parsed.templates, context);
    return { html: typeof html === "string" ? html : String(html ?? "") };
  } catch (error) {
    return { html: "", error: { kind: isLimitError(error) ? "limit" : "render", message: errorMessage(error) } };
  }
}

function errorMessage(error: unknown): string {
  const issue = toIssue(error);
  return issue.line ? `${issue.message} (line ${issue.line}, column ${issue.column})` : issue.message;
}
