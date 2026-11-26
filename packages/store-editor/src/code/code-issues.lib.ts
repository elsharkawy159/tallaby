/**
 * A code-section issue in the seller's language (ROADMAP F-101): the host's
 * stable `code` and `params` pick `storeEditor.code.issues.<code>`, a
 * `params.reason` adds `storeEditor.code.issueReasons.<reason>`, and a
 * `params.detail` (liquidjs's, postcss's or the JSON parser's English text)
 * is kept apart to show after the line. A code this editor doesn't know shows
 * a generic line plus the host's English `message`.
 */
import type { CodeIssueView } from "../adapter.types";

/** The subset of next-intl's `t` (namespace `storeEditor.code`) this needs. */
export type CodeIssueTranslator = {
  (key: string, values?: Record<string, string | number>): string;
  has(key: string): boolean;
};

export type CodeIssueText = {
  /** The localized line. */
  text: string;
  /** Untranslated technical detail, shown after the line (left to right). */
  detail?: string;
  /** The host's English message, when the code is unknown here. */
  fallback?: string;
};

export function codeIssueText(t: CodeIssueTranslator, issue: Pick<CodeIssueView, "code" | "message" | "params">): CodeIssueText {
  const key = `issues.${issue.code}`;
  if (!issue.code || !/^[a-z0-9_]+$/.test(issue.code) || !t.has(key)) return { text: t("issueUnknown"), fallback: issue.message };
  const values = issue.params ?? {};
  let text = t(key, values);
  const reason = values.reason;
  if (typeof reason === "string" && /^[a-z0-9_]+$/.test(reason) && t.has(`issueReasons.${reason}`)) {
    text = `${text} ${t(`issueReasons.${reason}`, values)}`;
  }
  const detail = values.detail;
  return { text, ...(detail !== undefined && String(detail) !== "" && { detail: String(detail) }) };
}

/** The issue as one plain line (the canvas box, the editor's lint tooltip). */
export function codeIssueLine(t: CodeIssueTranslator, issue: Pick<CodeIssueView, "code" | "message" | "params">): string {
  const { text, detail, fallback } = codeIssueText(t, issue);
  const extra = detail ?? fallback;
  return extra ? `${text} ${extra}` : text;
}
