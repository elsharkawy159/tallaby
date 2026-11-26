/**
 * The stored props of a `code` element (ROADMAP F-101, code-sections design
 * §3.1 and §11.6). `normalizeCodeNodeProps` turns untrusted builder JSON into
 * that shape on every save: it sets `apiVersion`, caps sizes, parses the
 * schema and cleans settings and blocks against it, and drops unknown keys.
 *
 * Pure and browser-safe: it never imports the Liquid engine (`node:crypto`).
 * The full save-time check (Liquid parse, blocked constructs, CSS) lives in
 * `code-node.server.ts`.
 */
import { findBlockedConstructs } from "./blocked";
import type { CodeIssue } from "./code-issues";
import { LIQUID_API_VERSION, type LiquidApiVersion } from "./liquid-objects";
import { splitSectionFile } from "./section-file";
import {
  type LocalizedText,
  type SectionSchema,
  type SettingDef,
  type StoredBlock,
  normalizeBlocks,
  normalizeSettings,
  parseSectionSchema,
} from "./section-schema";

/** Liquid source cap (same as the engine's parse limit, `LIQUID_PARSE_LIMIT`). */
export const MAX_CODE_SOURCE_BYTES = 64 * 1024;
/** Stylesheet cap (same as `DEFAULT_MAX_CSS_BYTES` in `scope-css.ts`). */
export const MAX_CODE_CSS_BYTES = 32 * 1024;
export const MAX_CODE_NAME_LENGTH = 80;

export type CodeNodeProps = {
  apiVersion: LiquidApiVersion;
  name?: string;
  source: string;
  css?: string;
  schema: SectionSchema;
  settings: Record<string, unknown>;
  blocks: StoredBlock[];
};

/** A code-node issue, with the prop it is about (positions are relative to that prop's text). */
export type CodeNodeIssue = CodeIssue & { field?: "source" | "css" | "schema" | "name" };

export type NormalizeCodeNodeOptions = {
  /**
   * Cleans the HTML of `richtext` and `inline_richtext` values. The site
   * sanitizer passes `sanitizeRichText`; this module stays free of it to
   * avoid an import cycle with `config/sanitize.ts`.
   */
  cleanRichText?: (html: string) => string;
};

const encoder = new TextEncoder();

export function utf8Length(value: string): number {
  return encoder.encode(value).length;
}

/** `value` cut to at most `max` UTF-8 bytes, never in the middle of a character. */
export function capUtf8(value: string, max: number): string {
  // One UTF-16 unit is at most 3 UTF-8 bytes.
  if (value.length * 3 <= max || utf8Length(value) <= max) return value;
  let bytes = 0;
  let end = 0;
  for (const ch of value) {
    const size = utf8Length(ch);
    if (bytes + size > max) break;
    bytes += size;
    end += ch.length;
  }
  return value.slice(0, end);
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === "object" && !Array.isArray(v);
}

function own(obj: Record<string, unknown>, key: string): unknown {
  return Object.hasOwn(obj, key) ? obj[key] : undefined;
}

// Control characters other than tab, newline and carriage return never belong in a template.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;

function plainName(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const name = value.replace(CONTROL_CHARS, "").replace(/\s+/g, " ").trim().slice(0, MAX_CODE_NAME_LENGTH);
  return name || undefined;
}

function cleanLocalized(value: unknown, clean: (html: string) => string): unknown {
  if (!isPlainObject(value)) return value;
  const text = value as LocalizedText;
  return { ar: clean(text.ar), en: clean(text.en) };
}

function cleanRichValues(defs: readonly SettingDef[], values: Record<string, unknown>, clean: (html: string) => string) {
  for (const def of defs) {
    if ((def.type === "richtext" || def.type === "inline_richtext") && Object.hasOwn(values, def.id)) {
      values[def.id] = cleanLocalized(values[def.id], clean);
    }
  }
  return values;
}

function normalizeSource(raw: unknown, issues: CodeNodeIssue[]): string {
  let source = typeof raw === "string" ? raw.replace(CONTROL_CHARS, "") : "";
  if (utf8Length(source) > MAX_CODE_SOURCE_BYTES) {
    issues.push({ code: "source_too_large", field: "source", message: `The template is too long (more than ${MAX_CODE_SOURCE_BYTES / 1024} KB).` });
    source = capUtf8(source, MAX_CODE_SOURCE_BYTES);
  }
  // The stylesheet and schema are stored apart; a block left in the template would never run.
  const split = splitSectionFile(source);
  if (split.source !== source.trimEnd()) {
    issues.push({
      code: "embedded_block",
      field: "source",
      message: "The template can't contain {% stylesheet %}, {% schema %} or {% javascript %} blocks here. They were removed.",
    });
    source = split.source;
  }
  return source;
}

function normalizeCss(raw: unknown, issues: CodeNodeIssue[]): string | undefined {
  if (typeof raw !== "string") return undefined;
  let css = raw.replace(CONTROL_CHARS, "").trim();
  if (utf8Length(css) > MAX_CODE_CSS_BYTES) {
    issues.push({ code: "css_too_large", field: "css", message: `The stylesheet is too long (more than ${MAX_CODE_CSS_BYTES / 1024} KB).` });
    css = capUtf8(css, MAX_CODE_CSS_BYTES).trim();
  }
  return css || undefined;
}

/**
 * The stored shape of a code node's props. Never trusts `apiVersion` from the
 * client, keeps only the known keys, and reports what the author must fix
 * (an invalid schema, a template or stylesheet over its cap) as issues.
 */
export function normalizeCodeNodeProps(
  props: unknown,
  options: NormalizeCodeNodeOptions = {},
): { props: CodeNodeProps; issues: CodeNodeIssue[] } {
  const input = isPlainObject(props) ? props : {};
  const issues: CodeNodeIssue[] = [];

  const source = normalizeSource(own(input, "source"), issues);
  const css = normalizeCss(own(input, "css"), issues);
  const parsed = parseSectionSchema(own(input, "schema"));
  issues.push(...parsed.issues.map((issue): CodeNodeIssue => ({ ...issue, field: "schema" })));
  const schema = parsed.schema;

  const settings = normalizeSettings(schema.settings, own(input, "settings"));
  const blocks = normalizeBlocks(schema, own(input, "blocks"));
  const clean = options.cleanRichText;
  if (clean) {
    cleanRichValues(schema.settings, settings, clean);
    const blockDefs = new Map(schema.blocks.map((b) => [b.type, b.settings]));
    for (const block of blocks) cleanRichValues(blockDefs.get(block.type) ?? [], block.settings, clean);
  }

  const name = plainName(own(input, "name"));
  return {
    props: {
      apiVersion: LIQUID_API_VERSION,
      ...(name && { name }),
      source,
      ...(css && { css }),
      schema,
      settings,
      blocks,
    },
    issues,
  };
}

/**
 * The checks that need no Liquid engine or CSS parser: blocked constructs in
 * the template (with line and column). Used where the server checks are not
 * available; the server runs `checkCodeNode`, which includes these.
 */
export function blockedCodeIssues(props: Pick<CodeNodeProps, "source">): CodeNodeIssue[] {
  return findBlockedConstructs(props.source).map(({ kind, line, column, message }) => ({
    code: `blocked_${kind}`,
    field: "source",
    message,
    line,
    column,
  }));
}
