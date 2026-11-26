/**
 * CSS scoper for code sections and per-element custom CSS (ROADMAP F-101,
 * docs/superpowers/specs/2026-11-20-code-sections-design.md §6).
 *
 * Seller-written CSS is parsed with postcss, cleaned and confined so it can only
 * style one element (the `scope` selector) and what is inside it, before it
 * reaches the storefront's single `<style>` block. `scopeCss` never throws on bad
 * input: a syntax error gives empty output plus an issue, anything else that is
 * unsafe is dropped and reported in `issues`. `checkCss` is the save-time check
 * shown to the author (syntax errors and blocked at-rules).
 */
import postcss, { CssSyntaxError } from "postcss";
import type { AtRule, ChildNode, Container, Declaration, Node, Root, Rule } from "postcss";
import selectorParser from "postcss-selector-parser";
import { isSafeStyleString } from "../config/sanitize";
import type { CodeIssueParams, CodeIssueReason } from "./code-issues";

/**
 * `code` (one of `CODE_ISSUE_CODES`, `css_*`) and `params` let the editor show
 * the issue in the seller's language; `message` is the English fallback.
 * Optional so older readers of `{ line, column, message }` keep working.
 */
export type CssIssue = { line: number; column: number; message: string; code?: string; params?: CodeIssueParams };

export type ScopeCssOptions = {
  /** e.g. `.site-root [data-node-id="n_abc"]`; built and trusted by the caller. */
  scope: string;
  /** e.g. `cn_abc-`; must match KEYFRAME_PREFIX, else `scopeCss` throws. */
  keyframePrefix: string;
  /** Default 32 KB. Larger input gives empty css plus one issue. */
  maxBytes?: number;
};

export const DEFAULT_MAX_CSS_BYTES = 32 * 1024;

const KEYFRAME_PREFIX = /^[a-z][a-z0-9_-]{0,40}$/i;
const IDENT = /^-?[A-Za-z_][A-Za-z0-9_-]*$/;
const PROPERTY = /^(?:--[A-Za-z0-9_-]+|-?[A-Za-z][A-Za-z0-9-]*)$/;
const BLOCKED_PROPERTY = /(?:^|-)behavior$|^-moz-binding$/i;
const KEYFRAME_SELECTOR = /^(?:from|to|\d+(?:\.\d+)?%)$/i;
const HTML_BREAKOUT = /<\/style|<!--/i;
const HTML_BREAKOUT_LOOSE = /<\/|<!--/;

/** At-rules always removed (§6). Any other at-rule that isn't kept is removed as unknown. */
const BLOCKED_AT_RULES = new Set([
  "import", "charset", "namespace", "font-face", "document", "page", "layer", "property", "container",
]);
const CONDITIONAL_AT_RULES = new Set(["media", "supports"]);

/** Keywords of the `animation` shorthand that are never treated as keyframe names. */
const ANIMATION_KEYWORDS = new Set([
  "none", "initial", "inherit", "unset", "revert", "revert-layer", "infinite",
  "normal", "reverse", "alternate", "alternate-reverse", "forwards", "backwards", "both",
  "running", "paused", "ease", "ease-in", "ease-out", "ease-in-out", "linear", "step-start", "step-end",
  "auto",
]);

function byteLength(input: string): number {
  return new TextEncoder().encode(input).length;
}

function position(node: Node | undefined): { line: number; column: number } {
  const start = node?.source?.start;
  return { line: start?.line ?? 1, column: start?.column ?? 1 };
}

function issueAt(node: Node | undefined, code: string, message: string, params?: CodeIssueParams): CssIssue {
  return { ...position(node), message, code, ...(params && { params }) };
}

function sizeIssue(max: number): CssIssue {
  // KB rounded up to one decimal: the editor says "more than {kb} KB".
  return { line: 1, column: 1, message: `CSS is larger than ${max} bytes`, code: "css_too_large", params: { kb: Math.ceil((max / 1024) * 10) / 10 } };
}

/** Parses or returns the syntax issue. */
function parse(input: string): { root: Root } | { issue: CssIssue } {
  try {
    return { root: postcss.parse(input) };
  } catch (error) {
    if (error instanceof CssSyntaxError) {
      return { issue: { line: error.line ?? 1, column: error.column ?? 1, message: error.reason, code: "css_syntax", params: { detail: error.reason } } };
    }
    return { issue: { line: 1, column: 1, message: "CSS could not be parsed", code: "css_syntax", params: { detail: "CSS could not be parsed" } } };
  }
}

/** The issue of an at-rule that is removed, or null when it is one we keep. */
function blockedAtRuleIssue(atRule: AtRule): CssIssue | null {
  const name = atRule.name.toLowerCase();
  if (CONDITIONAL_AT_RULES.has(name) || name === "keyframes") return null;
  if (BLOCKED_AT_RULES.has(name)) return issueAt(atRule, "css_at_rule_blocked", `@${name} is not allowed`, { at: name });
  return issueAt(atRule, "css_at_rule_unknown", `Unknown at-rule @${name} is not allowed`, { at: name });
}

/** `@media`/`@supports` conditions: the value rules, with range operators (`<`, `>=`) allowed. */
function isSafeCondition(params: string): boolean {
  if (params.includes("\\") || HTML_BREAKOUT_LOOSE.test(params)) return false;
  return isSafeStyleString(params.replace(/[<>]/g, " "));
}

function isSafeDeclaration(decl: Declaration): boolean {
  if (!PROPERTY.test(decl.prop) || BLOCKED_PROPERTY.test(decl.prop)) return false;
  if (decl.value.includes("\\")) return false;
  return isSafeStyleString(decl.value);
}

/**
 * Renames keyframe identifiers in a value. Only top-level identifiers (outside
 * functions and strings) that this input defines are renamed; in the shorthand
 * the animation keywords are left alone.
 */
function renameAnimationNames(
  value: string,
  rename: Map<string, string>,
  shorthand: boolean,
): string {
  let out = "";
  let depth = 0;
  let i = 0;
  while (i < value.length) {
    const ch = value[i]!;
    if (ch === '"' || ch === "'") {
      const end = value.indexOf(ch, i + 1);
      const stop = end === -1 ? value.length : end + 1;
      out += value.slice(i, stop);
      i = stop;
      continue;
    }
    if (ch === "(") depth++;
    if (ch === ")") depth = Math.max(0, depth - 1);
    const word = /^-?[A-Za-z_][A-Za-z0-9_-]*/.exec(value.slice(i));
    const prev = i > 0 ? value[i - 1]! : "";
    if (word && !/[A-Za-z0-9_.-]/.test(prev)) {
      const token = word[0];
      const next = value[i + token.length];
      const isFunction = next === "(";
      const renamed = rename.get(token);
      const keyword = shorthand && ANIMATION_KEYWORDS.has(token.toLowerCase());
      out += depth === 0 && !isFunction && renamed && !keyword ? renamed : token;
      i += token.length;
      continue;
    }
    out += ch;
    i++;
  }
  return out;
}

type ScopeResult = { selector: string } | Dropped;
type Dropped = { dropped: string; reason: CodeIssueReason; pseudo?: string };

function isRootLike(node: selectorParser.Node): boolean {
  if (node.type === "tag") {
    const tag = node.value.toLowerCase();
    return tag === "html" || tag === "body";
  }
  if (node.type === "pseudo") {
    const pseudo = node.value.toLowerCase();
    return pseudo === ":root" || pseudo === ":scope" || (pseudo === ":host" && node.nodes.length === 0);
  }
  return false;
}

function unscopable(selector: selectorParser.Selector): Dropped | null {
  let reason: Dropped | null = null;
  selector.walk((node) => {
    if (reason) return;
    if (node.type === "nesting") reason = { dropped: "uses &", reason: "nesting" };
    if (node.type === "pseudo") {
      const pseudo = node.value.toLowerCase();
      if (pseudo === ":has") reason = { dropped: "uses :has()", reason: "has" };
      else if (pseudo === ":host" && node.nodes.length > 0) reason = { dropped: "uses :host()", reason: "host_function" };
      else if (pseudo === ":host-context" || pseudo === "::slotted" || pseudo === "::part") reason = { dropped: `uses ${pseudo}`, reason: "shadow_dom", pseudo };
    }
  });
  return reason;
}

function scopeSelector(selector: selectorParser.Selector, scope: string): ScopeResult {
  const reason = unscopable(selector);
  if (reason) return reason;
  const nodes = selector.nodes;
  if (nodes.length === 0) return { dropped: "is empty", reason: "empty" };
  if (nodes[0]!.type === "combinator") return { dropped: "starts with a combinator", reason: "leading_combinator" };

  const firstCombinator = nodes.findIndex((n) => n.type === "combinator");
  const compound = firstCombinator === -1 ? nodes : nodes.slice(0, firstCombinator);
  const tail = firstCombinator === -1 ? [] : nodes.slice(firstCombinator);

  if (!compound.some(isRootLike)) {
    const text = selector.toString().trim();
    return text ? { selector: `${scope} ${text}` } : { dropped: "is empty", reason: "empty" };
  }

  // `html`, `body`, `:root`, `:scope`, `:host` become the scope itself.
  const next = tail[0];
  if (next?.type === "combinator" && /[+~]/.test(next.value)) return { dropped: "reaches siblings of the scope", reason: "siblings" };
  const rest = compound.filter((n) => !isRootLike(n));
  if (rest[0] && (rest[0].type === "tag" || rest[0].type === "universal")) {
    return { dropped: "can't be scoped", reason: "unscopable" };
  }
  const restText = rest.map(String).join("").trim();
  return { selector: `${scope}${restText}${tail.map(String).join("")}`.trim() };
}

/** Scopes a rule's selector list; returns the issues for the dropped parts. */
function scopeRuleSelectors(rule: Rule, scope: string): { selector: string | null; issues: CssIssue[] } {
  const issues: CssIssue[] = [];
  const kept: string[] = [];
  if (HTML_BREAKOUT_LOOSE.test(rule.selector)) {
    return { selector: null, issues: [issueAt(rule, "css_markup", "Selector contains markup")] };
  }
  try {
    const root = selectorParser().astSync(rule.selector);
    for (const selector of root.nodes) {
      const result = scopeSelector(selector, scope);
      if ("selector" in result) kept.push(result.selector);
      else {
        const text = selector.toString().trim();
        const params: CodeIssueParams = { selector: text, reason: result.reason, ...(result.pseudo && { pseudo: result.pseudo }) };
        issues.push(issueAt(rule, "css_selector_removed", `Selector "${text}" was removed: it ${result.dropped}`, params));
      }
    }
  } catch {
    return { selector: null, issues: [issueAt(rule, "css_selector_invalid", `Selector "${rule.selector}" is not valid`, { selector: rule.selector })] };
  }
  return { selector: kept.length ? kept.join(", ") : null, issues };
}

type Context = {
  scope: string;
  rename: Map<string, string>;
  issues: CssIssue[];
};

function cleanDeclarations(container: Rule, ctx: Context, inKeyframes: boolean): void {
  for (const child of [...(container.nodes ?? [])]) {
    if (child.type === "comment") {
      child.remove();
    } else if (child.type === "decl") {
      if (!isSafeDeclaration(child)) {
        ctx.issues.push(issueAt(child, "css_value_removed", `Declaration "${child.prop}" was removed: its value is not allowed`, { property: child.prop }));
        child.remove();
        continue;
      }
      child.value = child.value.trim();
      if (!inKeyframes && ctx.rename.size > 0) {
        const prop = child.prop.toLowerCase().replace(/^-(?:webkit|moz|o)-/, "");
        if (prop === "animation" || prop === "animation-name") {
          child.value = renameAnimationNames(child.value, ctx.rename, prop === "animation");
        }
      }
    } else {
      // Nested rules and at-rules inside a rule (CSS nesting) could reach outside the scope.
      ctx.issues.push(issueAt(child, "css_nested_rule", "Nested rules are not supported"));
      child.remove();
    }
  }
}

function processKeyframes(atRule: AtRule, ctx: Context): void {
  const name = atRule.params.trim();
  const renamed = ctx.rename.get(name);
  if (!renamed) {
    ctx.issues.push(issueAt(atRule, "css_keyframes_name", `@keyframes "${name}" was removed: the name is not valid`, { name }));
    atRule.remove();
    return;
  }
  atRule.name = "keyframes";
  atRule.params = renamed;
  for (const child of [...(atRule.nodes ?? [])]) {
    if (child.type === "comment") {
      child.remove();
    } else if (child.type === "rule") {
      const parts = child.selector.split(",").map((s) => s.trim());
      if (!parts.every((p) => KEYFRAME_SELECTOR.test(p))) {
        ctx.issues.push(issueAt(child, "css_keyframe_selector", `Keyframe selector "${child.selector}" is not valid`, { selector: child.selector }));
        child.remove();
        continue;
      }
      child.selector = parts.map((p) => p.toLowerCase()).join(", ");
      cleanDeclarations(child, ctx, true);
      if (!child.nodes?.length) child.remove();
    } else {
      ctx.issues.push(issueAt(child, "css_keyframes_content", "Only keyframe blocks are allowed inside @keyframes"));
      child.remove();
    }
  }
}

function processContainer(container: Container<ChildNode>, ctx: Context): void {
  for (const child of [...(container.nodes ?? [])]) {
    if (child.type === "comment") {
      child.remove();
    } else if (child.type === "decl") {
      ctx.issues.push(issueAt(child, "css_declaration_outside", `Declaration "${child.prop}" outside a rule was removed`, { property: child.prop }));
      child.remove();
    } else if (child.type === "atrule") {
      const blocked = blockedAtRuleIssue(child);
      if (blocked) {
        ctx.issues.push(blocked);
        child.remove();
      } else if (child.name.toLowerCase() === "keyframes") {
        processKeyframes(child, ctx);
      } else if (!child.nodes) {
        ctx.issues.push(issueAt(child, "css_at_rule_no_block", `@${child.name} needs a block`, { at: child.name }));
        child.remove();
      } else if (!isSafeCondition(child.params)) {
        ctx.issues.push(issueAt(child, "css_condition_blocked", `@${child.name} condition is not allowed`, { at: child.name }));
        child.remove();
      } else {
        child.name = child.name.toLowerCase();
        processContainer(child, ctx);
        if (!child.nodes.length) child.remove();
      }
    } else if (child.type === "rule") {
      const { selector, issues } = scopeRuleSelectors(child, ctx.scope);
      ctx.issues.push(...issues);
      if (!selector) {
        child.remove();
        continue;
      }
      child.selector = selector;
      cleanDeclarations(child, ctx, false);
      if (!child.nodes.length) child.remove();
    }
  }
}

/** Collects the keyframe names this input defines, mapped to their prefixed names. */
function keyframeNames(root: Root, prefix: string): Map<string, string> {
  const names = new Map<string, string>();
  root.walkAtRules((atRule) => {
    if (atRule.name.toLowerCase() !== "keyframes") return;
    const name = atRule.params.trim();
    if (IDENT.test(name) && !ANIMATION_KEYWORDS.has(name.toLowerCase())) names.set(name, `${prefix}${name}`);
  });
  return names;
}

/** Drops every raw (comments in values, selectors and params live there) so output is rebuilt from clean values. */
function resetRaws(root: Root): void {
  root.raws = {};
  root.walk((node) => {
    node.raws = {};
  });
}

export function scopeCss(input: string, options: ScopeCssOptions): { css: string; issues: CssIssue[] } {
  if (!KEYFRAME_PREFIX.test(options.keyframePrefix)) {
    throw new Error(`scopeCss: invalid keyframePrefix "${options.keyframePrefix}"`);
  }
  const max = options.maxBytes ?? DEFAULT_MAX_CSS_BYTES;
  if (byteLength(input) > max) return { css: "", issues: [sizeIssue(max)] };

  const parsed = parse(input);
  if ("issue" in parsed) return { css: "", issues: [parsed.issue] };
  const { root } = parsed;

  const ctx: Context = { scope: options.scope, rename: keyframeNames(root, options.keyframePrefix), issues: [] };
  processContainer(root, ctx);
  resetRaws(root);

  const css = root.toString().trim();
  if (HTML_BREAKOUT.test(css)) {
    return { css: "", issues: [...ctx.issues, { line: 1, column: 1, message: "CSS contains markup", code: "css_markup" }] };
  }
  return { css, issues: ctx.issues };
}

export function checkCss(input: string, maxBytes: number = DEFAULT_MAX_CSS_BYTES): CssIssue[] {
  if (byteLength(input) > maxBytes) return [sizeIssue(maxBytes)];
  const parsed = parse(input);
  if ("issue" in parsed) return [parsed.issue];
  const issues: CssIssue[] = [];
  parsed.root.walkAtRules((atRule) => {
    const blocked = blockedAtRuleIssue(atRule);
    if (blocked) issues.push(blocked);
  });
  return issues;
}
