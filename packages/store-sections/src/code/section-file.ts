/**
 * The one-file format of a code section (ROADMAP F-101, code-sections design
 * §11.2): HTML and Liquid, plus at most one `{% stylesheet %}…{% endstylesheet %}`
 * and one `{% schema %}{json}{% endschema %}` block. On save the file is split
 * into the stored props (`source`, `css`, `schema`); the Code tab shows them
 * joined again. Pure: no I/O, safe in the browser and on the server.
 *
 * - The blocks are found at any depth of the template, except inside
 *   `{% raw %}` and `{% comment %}`, whose content Liquid never parses.
 * - `{% javascript %}` is refused (rule 9): it is reported and removed.
 * - `source` keeps its leading text as written (so Liquid error lines match the
 *   top of the file) and loses its trailing whitespace; `css` is trimmed.
 *
 * Round trip: `splitSectionFile(joinSectionFile(x))` gives back `x` when
 * `x.source` has no trailing whitespace and `x.css` is trimmed (both are what a
 * split returns).
 */
import { positionAt, type CodeIssue } from "./code-issues";

export const DEFAULT_SECTION_SCHEMA = Object.freeze({ name: "Custom section", settings: [] as unknown[] });

export type SectionFileParts = { source: string; css: string; schema: unknown };

const BLOCK_NAMES = ["raw", "comment", "stylesheet", "schema", "javascript"] as const;
type BlockName = (typeof BLOCK_NAMES)[number];

/** `{% name %}` / `{%- name -%}`, no arguments. */
const OPEN_TAG = /\{%-?\s*(raw|comment|stylesheet|schema|javascript)\s*-?%\}/g;

function closeTag(name: BlockName): RegExp {
  return new RegExp(`\\{%-?\\s*end${name}\\s*-?%\\}`, "g");
}

type Found = { name: "stylesheet" | "schema" | "javascript"; start: number; end: number; contentStart: number; content: string };

/** The stylesheet, schema and javascript blocks of a file, in order (not those inside raw or comment). */
function scanSectionFile(text: string): { found: Found[]; issues: CodeIssue[] } {
  const issues: CodeIssue[] = [];
  const found: Found[] = [];

  OPEN_TAG.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = OPEN_TAG.exec(text))) {
    const name = match[1] as BlockName;
    const open = match.index;
    const contentStart = open + match[0].length;
    const close = closeTag(name);
    close.lastIndex = contentStart;
    const end = close.exec(text);
    if (!end) {
      // Liquid's own check reports unclosed raw/comment; ours need a message here.
      if (name === "stylesheet" || name === "schema" || name === "javascript") {
        issues.push({ code: `unclosed_${name}`, message: `{% ${name} %} is not closed: add {% end${name} %}.`, ...positionAt(text, open) });
        found.push({ name, start: open, end: text.length, contentStart, content: "" });
      }
      break;
    }
    const blockEnd = end.index + end[0].length;
    OPEN_TAG.lastIndex = blockEnd;
    if (name === "raw" || name === "comment") continue;
    found.push({ name, start: open, end: blockEnd, contentStart, content: text.slice(contentStart, end.index) });
  }
  return { found, issues };
}

export function splitSectionFile(file: string): SectionFileParts & { issues: CodeIssue[] } {
  const text = String(file ?? "");
  const { found, issues } = scanSectionFile(text);

  let css = "";
  let schema: unknown = { ...DEFAULT_SECTION_SCHEMA, settings: [] };
  let seenCss = false;
  let seenSchema = false;
  for (const block of found) {
    const at = positionAt(text, block.start);
    if (block.name === "javascript") {
      issues.push({ code: "javascript_not_allowed", message: "JavaScript isn't allowed in code sections. The {% javascript %} block was removed.", ...at });
      continue;
    }
    if (block.name === "stylesheet") {
      if (seenCss) {
        issues.push({ code: "duplicate_stylesheet", message: "A section can have only one {% stylesheet %} block. Only the first one is kept.", ...at });
        continue;
      }
      seenCss = true;
      css = block.content.trim();
      continue;
    }
    if (seenSchema) {
      issues.push({ code: "duplicate_schema", message: "A section can have only one {% schema %} block. Only the first one is kept.", ...at });
      continue;
    }
    seenSchema = true;
    const parsed = parseSchemaJson(text, block);
    if (parsed.issue) issues.push(parsed.issue);
    else schema = parsed.value;
  }

  let source = "";
  let cursor = 0;
  for (const block of found) {
    source += text.slice(cursor, block.start);
    cursor = block.end;
  }
  source += text.slice(cursor);

  return { source: source.trimEnd(), css, schema, issues };
}

function parseSchemaJson(text: string, block: Found): { value?: unknown; issue?: CodeIssue } {
  if (!block.content.trim()) {
    return { issue: { code: "schema_empty", message: "The {% schema %} block is empty. Write a JSON object, e.g. { \"name\": \"Hero\", \"settings\": [] }.", ...positionAt(text, block.start) } };
  }
  try {
    return { value: JSON.parse(block.content) };
  } catch (error) {
    const raw = error instanceof Error ? error.message : String(error);
    const offset = jsonErrorOffset(raw, block.content);
    const at = offset == null ? positionAt(text, block.start) : positionAt(text, block.contentStart + offset);
    // V8 appends its own "(line 2 column 3)" relative to the JSON; ours is relative to the file.
    const ch = offset == null ? undefined : block.content[offset];
    const message = /^Unexpected token/.test(raw) && ch
      ? `unexpected "${ch}"` // V8's own text quotes a slice of the JSON; keep it short
      : raw.replace(/\s*\(line \d+ column \d+\)/, "").replace(/ in JSON at position \d+/, "");
    return { issue: { code: "schema_json", message: `The {% schema %} JSON is invalid: ${message}.`, ...at } };
  }
}

/** Offset into the JSON text from a `JSON.parse` message, else from our own scan (V8 omits it for "Unexpected token"). */
function jsonErrorOffset(message: string, json: string): number | null {
  const position = /at position (\d+)/.exec(message);
  if (position) return Number(position[1]);
  if (/Unexpected end of JSON input/.test(message)) return json.length;
  return findJsonError(json);
}

/** A minimal JSON scanner that returns the offset of the first syntax error, or null. Only runs after JSON.parse failed. */
function findJsonError(json: string): number | null {
  let i = 0;
  const ws = () => {
    while (i < json.length && " \t\n\r".includes(json[i] as string)) i++;
  };
  const fail = (): never => {
    throw i;
  };
  const literal = (word: string) => {
    if (json.startsWith(word, i)) i += word.length;
    else fail();
  };
  const string = () => {
    i++; // opening quote
    while (i < json.length) {
      const c = json[i] as string;
      if (c === '"') return void i++;
      if (c === "\\") {
        const n = json[i + 1];
        if (n === "u") {
          if (!/^[0-9a-fA-F]{4}$/.test(json.slice(i + 2, i + 6))) fail();
          i += 6;
        } else if (n != null && '"\\/bfnrt'.includes(n)) i += 2;
        else fail();
        continue;
      }
      if (c < " ") fail();
      i++;
    }
    fail();
  };
  const number = () => {
    const m = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(json.slice(i));
    if (!m) fail();
    i += (m as RegExpExecArray)[0].length;
  };
  const value = (depth: number): void => {
    if (depth > 512) fail();
    ws();
    const c = json[i];
    if (c === "{") {
      i++;
      ws();
      if (json[i] === "}") return void i++;
      for (;;) {
        ws();
        if (json[i] !== '"') fail();
        string();
        ws();
        if (json[i] !== ":") fail();
        i++;
        value(depth + 1);
        ws();
        if (json[i] === ",") {
          i++;
          continue;
        }
        if (json[i] === "}") return void i++;
        fail();
      }
    }
    if (c === "[") {
      i++;
      ws();
      if (json[i] === "]") return void i++;
      for (;;) {
        value(depth + 1);
        ws();
        if (json[i] === ",") {
          i++;
          continue;
        }
        if (json[i] === "]") return void i++;
        fail();
      }
    }
    if (c === '"') return string();
    if (c === "t") return literal("true");
    if (c === "f") return literal("false");
    if (c === "n") return literal("null");
    if (c === "-" || (c != null && c >= "0" && c <= "9")) return number();
    fail();
  };
  try {
    value(0);
    ws();
    return i < json.length ? i : null;
  } catch (offset) {
    return typeof offset === "number" ? offset : null;
  }
}

/** 0-based offset of a 1-based line and column in `text` (the inverse of `positionAt`), clamped to the text. */
function offsetAt(text: string, line: number, column: number): number {
  let offset = 0;
  for (let l = 1; l < line; l++) {
    const next = text.indexOf("\n", offset);
    if (next < 0) return text.length;
    offset = next + 1;
  }
  return Math.min(offset + Math.max(column - 1, 0), text.length);
}

type FilePosition = { line: number; column: number };

/**
 * Maps positions in the parts `splitSectionFile` returns back to the file, so
 * an editor can underline a Liquid or stylesheet problem in the file it shows
 * (`checkCodeNode` positions issues in the stored `source` and `css`). Both
 * take and return 1-based lines and columns.
 */
export function sectionFilePositions(file: string): {
  fromSource(line: number, column: number): FilePosition;
  fromCss(line: number, column: number): FilePosition;
} {
  const text = String(file ?? "");
  const { found } = scanSectionFile(text);
  // `source` is the file with every found block cut out: where each kept piece starts in both.
  const pieces: Array<{ sourceStart: number; fileStart: number }> = [];
  let source = "";
  let cursor = 0;
  for (const block of found) {
    pieces.push({ sourceStart: source.length, fileStart: cursor });
    source += text.slice(cursor, block.start);
    cursor = block.end;
  }
  pieces.push({ sourceStart: source.length, fileStart: cursor });
  source += text.slice(cursor);
  const stylesheet = found.find((block) => block.name === "stylesheet");
  const css = stylesheet ? stylesheet.content.trim() : "";
  const cssStart = stylesheet ? stylesheet.contentStart + (stylesheet.content.length - stylesheet.content.trimStart().length) : 0;
  return {
    fromSource(line, column) {
      const offset = offsetAt(source, line, column);
      // The last piece starting at or before the offset (a cut block sits between two pieces).
      let piece = pieces[0] as { sourceStart: number; fileStart: number };
      for (const p of pieces) if (p.sourceStart <= offset) piece = p;
      return positionAt(text, piece.fileStart + (offset - piece.sourceStart));
    },
    fromCss(line, column) {
      return positionAt(text, cssStart + offsetAt(css, line, column));
    },
  };
}

export function joinSectionFile(parts: SectionFileParts): string {
  const out: string[] = [];
  const source = String(parts.source ?? "").trimEnd();
  const css = String(parts.css ?? "").trim();
  if (source) out.push(source);
  if (css) out.push(`{% stylesheet %}\n${css}\n{% endstylesheet %}`);
  // `{%` and `%}` can only occur inside JSON strings; escape them so a value
  // like "{% endschema %}" can't close the block early. JSON.parse undoes it.
  const json = JSON.stringify(parts.schema ?? DEFAULT_SECTION_SCHEMA, null, 2).replace(/\{%/g, "\\u007b%").replace(/%\}/g, "%\\u007d");
  out.push(`{% schema %}\n${json}\n{% endschema %}`);
  return `${out.join("\n\n")}\n`;
}
