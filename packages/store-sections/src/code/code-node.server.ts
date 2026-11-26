/**
 * The full save-time check of a code node (ROADMAP F-101, code-sections design
 * §5.1). Server only: it parses the template with the restricted Liquid engine
 * (`node:crypto`). `validateSiteConfig` and `validatePageContent` take it as
 * `serverChecks: CODE_SERVER_CHECKS`, so the browser bundle never loads it.
 */
import { sanitizeRichText } from "../config/sanitize";
import type { CodeServerChecks } from "../config/validate";
import { blockedCodeIssues, normalizeCodeNodeProps, type CodeNodeIssue, type CodeNodeProps } from "./code-node";
import { checkLiquidSource } from "./liquid.server";
import { checkCss } from "./scope-css";
import { splitSectionFile } from "./section-file";

/** Liquid parse errors, blocked constructs and stylesheet problems, each with its field, line and column. */
export function checkCodeNode(props: CodeNodeProps): CodeNodeIssue[] {
  const issues: CodeNodeIssue[] = [];
  issues.push(...checkLiquidSource(props.source).map((issue): CodeNodeIssue => ({ ...issue, field: "source" })));
  issues.push(...blockedCodeIssues(props));
  if (props.css) {
    issues.push(...checkCss(props.css).map(({ line, column, message }): CodeNodeIssue => ({ code: "css_invalid", field: "css", message, line, column })));
  }
  return issues;
}

/**
 * A code node's props from the one-file format the Code tab edits (HTML and
 * Liquid, `{% stylesheet %}`, `{% schema %}`), normalised and fully checked.
 * `rest` carries the node's current `name`, `settings` and `blocks`, which
 * the file doesn't hold. Issues from splitting the file are positioned in the
 * file; the others in the stored `source` or `css`.
 */
export function codeNodeFromFile(file: string, rest: { name?: unknown; settings?: unknown; blocks?: unknown } = {}): {
  props: CodeNodeProps;
  issues: CodeNodeIssue[];
} {
  const split = splitSectionFile(file);
  const normalized = normalizeCodeNodeProps(
    { name: rest.name, settings: rest.settings, blocks: rest.blocks, source: split.source, css: split.css, schema: split.schema },
    { cleanRichText: sanitizeRichText },
  );
  return {
    props: normalized.props,
    issues: [...split.issues, ...normalized.issues, ...checkCodeNode(normalized.props)],
  };
}

/** What the server save and publish paths pass to `validateSiteConfig` / `validatePageContent`. */
export const CODE_SERVER_CHECKS: CodeServerChecks = {
  checkCodeNode,
  checkCss: (css, maxBytes) => checkCss(css, maxBytes),
};
