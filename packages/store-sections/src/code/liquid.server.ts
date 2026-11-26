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
 * - Limits: 64 KB of source, 50 ms per render, 1e6 memory units, and the
 *   output limits of `checkCodeOutput` (128 KB, 4,000 tags, 128 levels).
 * - Dropped tags are a parse error that names the tag, never a silent no-op.
 * - The time limit is only checked between template steps, so no single step
 *   may do much work: the filters that run an expression per item are removed
 *   (`REMOVED_FILTER_NAMES`, a parse error), and a range, a `{% for %}`
 *   list, a list printed by `{{ }}` and every list a filter takes or returns
 *   holds at most `LIQUID_MAX_LIST_ITEMS` items (a limit error).
 *
 * Parsed templates are kept in a 500-entry LRU keyed by the source's sha256.
 * `renderLiquid` is synchronous (the React renderer is) and never throws.
 */
import { createHash } from "node:crypto";
import {
  Context,
  evalToken,
  evalTokenValue,
  ForTag,
  Liquid,
  Tag,
  TokenKind,
  toValue,
  type FilterImplOptions,
  type FS,
  type Parser,
  type RangeToken,
  type Template,
  type TagToken,
  type TopLevelToken,
} from "liquidjs";
import { positionAt, type CodeIssue, type CodeIssueParams, type CodeIssueReason } from "./code-issues";
import { FILTER_CONTEXT_REGISTER, registerCodeFilters, type FilterContext } from "./liquid-filters";
import { LiquidHtml, type LiquidScope } from "./liquid-objects";
import { checkCodeOutput } from "./sanitize-code";

export const LIQUID_PARSE_LIMIT = 64 * 1024;
export const LIQUID_RENDER_LIMIT_MS = 50;
/**
 * liquidjs charges a range's length, a list filter's input length and a string
 * filter's text length. With lists capped at LIQUID_MAX_LIST_ITEMS and output
 * at 128 KB, 1e6 still leaves a real section (a few hundred products and
 * blocks, 128 KB of text) ample room while capping the text a render may build.
 */
export const LIQUID_MEMORY_LIMIT = 1e6;
export const LIQUID_CACHE_SIZE = 500;
/** Most items in a range, a `{% for %}` list, a printed list, or a list a filter takes or returns. */
export const LIQUID_MAX_LIST_ITEMS = 1000;

/**
 * Standard filters that evaluate an expression for every item. liquidjs only
 * checks the time limit between template steps, so one call over a long list
 * ran for seconds. They are removed: using one is a parse error.
 */
export const REMOVED_FILTER_NAMES = ["where_exp", "reject_exp", "group_by_exp", "has_exp", "find_index_exp", "find_exp"] as const;

/** Tags a code section may use (liquidjs names; `#` is the inline comment). */
export const ALLOWED_TAGS = [
  "if", "unless", "case", "for", "break", "continue", "assign", "capture", "comment", "#",
  "raw", "cycle", "increment", "decrement", "liquid", "echo",
] as const;

/** Tags that are a parse error, with the end tag of the block ones. */
const DROPPED_TAGS: Record<string, { block: boolean; key: CodeIssueReason; reason: string }> = {
  include: { block: false, key: "snippets", reason: "Snippets aren't available in code sections. Put the markup in this section." },
  render: { block: false, key: "snippets", reason: "Snippets aren't available in code sections. Put the markup in this section." },
  layout: { block: false, key: "layouts", reason: "Layouts aren't available in code sections." },
  block: { block: true, key: "layout_blocks", reason: "Layout blocks aren't available in code sections. Use section blocks from the schema." },
  tablerow: { block: true, key: "tablerow", reason: "Use {% for %} with an HTML table instead." },
  javascript: { block: true, key: "javascript", reason: "JavaScript isn't allowed in code sections." },
  form: { block: true, key: "forms", reason: "Forms aren't available in code sections. Use the built-in form element." },
  paginate: { block: true, key: "paging", reason: "Paging isn't available in code sections. Use the built-in product list." },
  section: { block: false, key: "sections", reason: "A code section can't include other sections." },
  sections: { block: false, key: "sections", reason: "A code section can't include other sections." },
  content_for: { block: false, key: "nested_blocks", reason: "Nested blocks aren't available in code sections. Use section blocks from the schema." },
  style: { block: true, key: "style_tag", reason: "Put CSS in the section's {% stylesheet %} block." },
  stylesheet: { block: true, key: "stylesheet_nested", reason: "{% stylesheet %} belongs once at the top level of the section file, not inside the template." },
  schema: { block: true, key: "schema_nested", reason: "{% schema %} belongs once at the top level of the section file, not inside the template." },
};
export const DROPPED_TAG_NAMES = Object.keys(DROPPED_TAGS);

/** A code-section limit reached while rendering; `issue` is the matching `CodeIssue` (without position). */
class CodeLimitError extends Error {
  constructor(readonly issue: { code: string; message: string; params: CodeIssueParams }) {
    super(issue.message);
    this.name = "CodeLimitError";
  }
}

function rangeTooLarge(): CodeLimitError {
  return new CodeLimitError({
    code: "range_too_large",
    message: `A range can have at most ${LIQUID_MAX_LIST_ITEMS} items.`,
    params: { max: LIQUID_MAX_LIST_ITEMS },
  });
}

function listTooLarge(): CodeLimitError {
  return new CodeLimitError({
    code: "list_too_large",
    message: `A list can have at most ${LIQUID_MAX_LIST_ITEMS} items.`,
    params: { max: LIQUID_MAX_LIST_ITEMS },
  });
}

/** Throws when `value` is a list longer than LIQUID_MAX_LIST_ITEMS. */
function capList(value: unknown): void {
  const v = toValue(value);
  if (Array.isArray(v) && v.length > LIQUID_MAX_LIST_ITEMS) throw listTooLarge();
}

class TagNotAllowedError extends Error {
  constructor(readonly tag: string, readonly reasonKey: CodeIssueReason, reason: string) {
    super(`The {% ${tag} %} tag isn't allowed. ${reason}`);
    this.name = "TagNotAllowedError";
  }
}

function droppedTag(name: string, block: boolean, key: CodeIssueReason, reason: string) {
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
      throw new TagNotAllowedError(name, key, reason);
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
  capList(value);
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

// ---------------------------------------------------------------------------
// List and range caps
// ---------------------------------------------------------------------------

type TokenLike = { kind: number; getText(): string; getPosition(): [number, number]; input: string; begin: number; end: number };
type Evaluate = (ctx: Context, inner: TokenLike, lenient?: boolean) => Generator<unknown, unknown, unknown>;

/**
 * A value token that runs `evaluate` with `inner` (the token it stands for).
 * liquidjs evaluates a filtered-value token as `initial.evaluate(ctx)`
 * followed by its (here: no) filters, so this is how a check runs with the
 * render context. `inner` stays a property, so `eachRange` still reaches a
 * range inside it.
 */
function guardedToken(inner: TokenLike, evaluate: Evaluate): TokenLike {
  const token = {
    kind: TokenKind.FilteredValue,
    input: inner.input,
    begin: inner.begin,
    end: inner.end,
    inner,
    getText: () => token.inner.getText(),
    getPosition: () => token.inner.getPosition(),
    initial: { evaluate: (ctx: Context, lenient?: boolean) => evaluate(ctx, token.inner, lenient) },
    filters: [],
  };
  return token;
}

/** `(a..b)`, refusing more than LIQUID_MAX_LIST_ITEMS items before liquidjs builds the list. */
function guardedRange(range: RangeToken): TokenLike {
  return guardedToken(range as unknown as TokenLike, function* (ctx) {
    const low = +((yield evalTokenValue(range.lhs, ctx)) as number);
    const high = +((yield evalTokenValue(range.rhs, ctx)) as number);
    if (high - low + 1 > LIQUID_MAX_LIST_ITEMS) throw rangeTooLarge();
    return yield evalToken(range, ctx);
  });
}

const isRangeToken = (value: unknown): value is RangeToken =>
  value != null && typeof value === "object" && (value as { kind?: unknown }).kind === TokenKind.Range;

/** Parsed-template keys that never hold a template's own value tokens (the engine, source text, handlers). */
const WALK_SKIP = new Set(["liquid", "token", "tokenizer", "handler", "input", "file"]);

/**
 * Visits every range token in parsed templates (in tag arguments, outputs,
 * filter arguments, loop collections, `{% liquid %}` bodies…) and puts
 * `replace(range)` in its place. Templates are small (64 KB of source).
 */
function eachRange(root: unknown, replace: (range: RangeToken) => unknown): void {
  const seen = new Set<object>();
  const visit = (node: unknown): void => {
    if (node == null || typeof node !== "object" || seen.has(node)) return;
    seen.add(node);
    if (Array.isArray(node)) {
      for (let i = 0; i < node.length; i++) {
        if (isRangeToken(node[i])) node[i] = replace(node[i]);
        else visit(node[i]);
      }
      return;
    }
    const record = node as Record<string, unknown>;
    for (const key of Object.keys(record)) {
      if (WALK_SKIP.has(key)) continue;
      if (isRangeToken(record[key])) record[key] = replace(record[key] as RangeToken);
      else visit(record[key]);
    }
  };
  visit(root);
}

const literalNumber = (token: unknown): number | null => {
  const content = (token as { content?: unknown } | undefined)?.content;
  if (typeof content !== "number" && typeof content !== "string") return null;
  const n = Number(content);
  return Number.isFinite(n) ? n : null;
};

/** Save-time issues for ranges with literal bounds over the cap (`(1..5000)`). */
function literalRangeIssues(templates: Template[], source: string): CodeIssue[] {
  const issues: CodeIssue[] = [];
  eachRange(templates, (range) => {
    const low = literalNumber(range.lhs);
    const high = literalNumber(range.rhs);
    if (low !== null && high !== null && high - low + 1 > LIQUID_MAX_LIST_ITEMS) {
      const at = range.input === source ? positionAt(source, range.begin) : {};
      issues.push({ ...rangeTooLarge().issue, ...at });
    }
    return range;
  });
  return issues;
}

/** `{% for %}` that refuses a list of more than LIQUID_MAX_LIST_ITEMS items. */
class CappedForTag extends ForTag {
  constructor(token: TagToken, remainTokens: TopLevelToken[], liquid: Liquid, parser: Parser) {
    super(token, remainTokens, liquid, parser);
    // A range collection is guarded by `eachRange` through `inner`, before it is built.
    this.collection = guardedToken(this.collection as unknown as TokenLike, function* (ctx, inner, lenient) {
      const value = yield evalToken(inner as never, ctx, lenient);
      capList(value);
      return value;
    }) as unknown as ForTag["collection"];
  }
}

/** The filter, refusing a list of more than LIQUID_MAX_LIST_ITEMS items as its input, an argument or its result. */
function cappedFilter(impl: FilterImplOptions): FilterImplOptions {
  const handler = typeof impl === "function" ? impl : impl.handler;
  if (typeof handler !== "function") return impl;
  const capped = function (this: unknown, value: unknown, ...args: unknown[]): unknown {
    capList(value);
    for (const arg of args) {
      capList(arg);
      // A named argument is passed as [name, value].
      if (Array.isArray(arg) && arg.length === 2 && typeof arg[0] === "string") capList(arg[1]);
    }
    const out: unknown = handler.call(this as never, value, ...args);
    if (out != null && typeof (out as { next?: unknown }).next === "function") {
      // A generator filter (sort, map, where…): liquidjs runs what is yielded.
      return (function* (): Generator<unknown, unknown, unknown> {
        const result = yield out;
        capList(result);
        return result;
      })();
    }
    capList(out);
    return out;
  };
  return typeof impl === "function" ? capped : { ...impl, handler: capped };
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
  for (const [name, { block, key, reason }] of Object.entries(DROPPED_TAGS)) engine.registerTag(name, droppedTag(name, block, key, reason));
  engine.registerTag("for", CappedForTag);
  registerCodeFilters(engine);
  for (const name of REMOVED_FILTER_NAMES) delete engine.filters[name];
  for (const [name, impl] of Object.entries(engine.filters)) engine.filters[name] = cappedFilter(impl);
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
    const templates = liquidEngine.parse(source);
    eachRange(templates, guardedRange);
    parsed = { templates };
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
  if (rootCause(error) instanceof CodeLimitError) return true;
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
    return { code: "time_limit", message: `The section took longer than ${LIQUID_RENDER_LIMIT_MS} ms to render.`, params: { ms: LIQUID_RENDER_LIMIT_MS }, ...at };
  }
  return sourceTooLarge(at);
}

function sourceTooLarge(at: { line?: number; column?: number } = {}): CodeIssue {
  const kb = LIQUID_PARSE_LIMIT / 1024;
  return { code: "source_too_large", message: `The template is too long (more than ${kb} KB).`, params: { kb }, ...at };
}

function toIssue(error: unknown): CodeIssue {
  const e = error as LiquidLikeError;
  const position = e?.token?.getPosition?.();
  const at = position ? { line: position[0], column: position[1] } : {};
  const root = rootCause(e);
  if (root instanceof TagNotAllowedError) {
    return { code: "tag_not_allowed", message: root.message, params: { tag: root.tag, reason: root.reasonKey }, ...at };
  }
  if (root instanceof CodeLimitError) return { ...root.issue, ...at };
  if (isLimitError(e)) return limitIssue(e, at);
  const message = bareMessage(e);
  const filter = /^undefined filter: (\S+)/.exec(message);
  if (filter && (REMOVED_FILTER_NAMES as readonly string[]).includes(filter[1]!)) {
    return {
      code: "filter_not_allowed",
      message: `The "${filter[1]}" filter isn't available in code sections. Use {% for %} with {% if %} instead.`,
      params: { filter: filter[1]! },
      ...at,
    };
  }
  if (filter) return { code: "unknown_filter", message: `Unknown filter "${filter[1]}".`, params: { filter: filter[1]! }, ...at };
  return { code: "liquid_syntax", message, params: { detail: message }, ...at };
}

/** Save-time check of a template (`source`, without its stylesheet and schema). */
export function checkLiquidSource(source: string): CodeIssue[] {
  if (source.length > LIQUID_PARSE_LIMIT) {
    return [sourceTooLarge()];
  }
  try {
    return literalRangeIssues(checkEngine.parse(source), source);
  } catch (error) {
    const list = (error as LiquidLikeError).errors;
    return Array.isArray(list) && list.length ? list.map(toIssue) : [toIssue(error)];
  }
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

/** `code` and `params` are those of the matching `CodeIssue` (`message` adds its position). */
export type LiquidRenderError = { kind: "parse" | "limit" | "render"; message: string; code: string; params?: CodeIssueParams };
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
      const issue = sourceTooLarge();
      return { html: "", error: { kind: "limit", message: `The template is longer than ${LIQUID_PARSE_LIMIT / 1024} KB.`, code: issue.code, params: issue.params } };
    }
    const parsed = parseCached(source);
    if ("error" in parsed) {
      const kind = isLimitError(parsed.error) ? "limit" : "parse";
      return { html: "", error: { kind, ...errorOf(parsed.error) } };
    }
    const context = new Context(scope, liquidEngine.options, { sync: true }, { liquid: liquidEngine });
    context.setRegister(FILTER_CONTEXT_REGISTER, { locale: ctx.locale, currency: ctx.currency, currencyLabel: ctx.currencyLabel });
    const rendered = liquidEngine.renderSync(parsed.templates, context);
    const html = typeof rendered === "string" ? rendered : String(rendered ?? "");
    // Refused before it reaches the cleaner, whose cost grows with tags × depth.
    const limit = checkCodeOutput(html);
    if (limit) return { html: "", error: { kind: "limit", message: limit.message, code: limit.code, params: limit.params } };
    return { html };
  } catch (error) {
    return { html: "", error: { kind: isLimitError(error) ? "limit" : "render", ...errorOf(error) } };
  }
}

function errorOf(error: unknown): Pick<LiquidRenderError, "message" | "code" | "params"> {
  const issue = toIssue(error);
  const message = issue.line ? `${issue.message} (line ${issue.line}, column ${issue.column})` : issue.message;
  return { message, code: issue.code, ...(issue.params && { params: issue.params }) };
}
