/**
 * A problem found in a code section (ROADMAP F-101): a Liquid parse error, a
 * dropped tag, a bad `{% schema %}`… `line` and `column` are 1-based and, when
 * set, point into the text the check ran on (the section file for
 * `splitSectionFile`, the stored `source` for `checkLiquidSource`).
 *
 * `code` is stable and the editor shows it in the seller's language
 * (`storeEditor.code.issues.<code>`, filled from `params`). `message` is the
 * plain English fallback for an unknown code. Neither ever names another
 * platform (code-sections design §11.8).
 *
 * `params` keys the editor reads specially: `reason` (one of
 * `CODE_ISSUE_REASONS`, shown after the line as
 * `storeEditor.code.issueReasons.<reason>`) and `detail` (an untranslated
 * English detail from liquidjs, postcss, JSON or zod, shown after the line).
 */
import { BLOCKED_KINDS } from "./blocked";

export type CodeIssueParams = Record<string, string | number>;

export type CodeIssue = { code: string; message: string; params?: CodeIssueParams; line?: number; column?: number };

/** Every `code` the core checks can give (Liquid, section file, schema, blocked constructs, CSS, preview). */
export const CODE_ISSUE_CODES = [
  // liquid.server.ts
  "tag_not_allowed",
  "unknown_filter",
  "liquid_syntax",
  "memory_limit",
  "time_limit",
  "source_too_large",
  "filter_not_allowed",
  "range_too_large",
  "list_too_large",
  // sanitize-code.ts (checkCodeOutput, refused by liquid.server.ts before cleaning)
  "output_too_large",
  "output_too_many_tags",
  "output_too_deep",
  // section-file.ts
  "unclosed_stylesheet",
  "unclosed_schema",
  "unclosed_javascript",
  "javascript_not_allowed",
  "duplicate_stylesheet",
  "duplicate_schema",
  "schema_empty",
  "schema_json",
  // section-schema.ts
  "schema_invalid",
  // code-node.ts
  "embedded_block",
  ...BLOCKED_KINDS.map((kind) => `blocked_${kind}` as const),
  // scope-css.ts (and code-node.ts for `css_too_large`)
  "css_too_large",
  "css_syntax",
  "css_at_rule_blocked",
  "css_at_rule_unknown",
  "css_at_rule_no_block",
  "css_condition_blocked",
  "css_value_removed",
  "css_declaration_outside",
  "css_nested_rule",
  "css_selector_removed",
  "css_selector_invalid",
  "css_markup",
  "css_keyframes_name",
  "css_keyframe_selector",
  "css_keyframes_content",
  "css_invalid",
  // preview-code.server.ts
  "invalid_node",
  "render_limit",
  "render_failed",
] as const;

export type CodeIssueCode = (typeof CODE_ISSUE_CODES)[number];

/** Every `params.reason` the core checks can give. */
export const CODE_ISSUE_REASONS = [
  // A dropped Liquid tag (`tag_not_allowed`).
  "snippets",
  "layouts",
  "layout_blocks",
  "tablerow",
  "javascript",
  "forms",
  "paging",
  "sections",
  "nested_blocks",
  "style_tag",
  "stylesheet_nested",
  "schema_nested",
  // A removed CSS selector (`css_selector_removed`).
  "nesting",
  "has",
  "host_function",
  "shadow_dom",
  "empty",
  "leading_combinator",
  "siblings",
  "unscopable",
  // A render limit (`render_limit`).
  "memory",
  "time",
  "size",
  "range",
  "list",
  "output",
  "tags",
  "depth",
] as const;

export type CodeIssueReason = (typeof CODE_ISSUE_REASONS)[number];

/** 1-based line and column of `offset` in `text`. */
export function positionAt(text: string, offset: number): { line: number; column: number } {
  let line = 1;
  let column = 1;
  const end = Math.min(Math.max(offset, 0), text.length);
  for (let i = 0; i < end; i++) {
    if (text.charCodeAt(i) === 10) {
      line++;
      column = 1;
    } else {
      column++;
    }
  }
  return { line, column };
}
