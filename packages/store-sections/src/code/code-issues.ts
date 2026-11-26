/**
 * A problem found in a code section (ROADMAP F-101): a Liquid parse error, a
 * dropped tag, a bad `{% schema %}`… `line` and `column` are 1-based and, when
 * set, point into the text the check ran on (the section file for
 * `splitSectionFile`, the stored `source` for `checkLiquidSource`).
 *
 * Messages are shown to sellers and their developers: plain English, and they
 * never name another platform (code-sections design §11.8).
 */
export type CodeIssue = { code: string; message: string; line?: number; column?: number };

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
