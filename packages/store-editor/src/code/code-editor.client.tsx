"use client";

/**
 * The Code tab's editor: CodeMirror 6 in Liquid mode (HTML and CSS inside it
 * are highlighted too). Loaded only when the Code tab opens
 * (`code-inspector.client.tsx` imports it with `React.lazy`), so CodeMirror
 * stays out of the editor's first bundle. Always left to right.
 */
import { useEffect, useRef } from "react";
import { basicSetup } from "codemirror";
import { liquid } from "@codemirror/lang-liquid";
import { lintGutter, setDiagnostics, type Diagnostic } from "@codemirror/lint";
import { EditorState, type Text } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import type { CodeIssueView } from "../adapter.types";

/** A diagnostic range for an issue at (1-based) line and column, clamped to the document. */
export function issueRange(doc: Text, issue: CodeIssueView): { from: number; to: number } {
  if (!issue.line) return { from: 0, to: 0 };
  const line = doc.line(Math.min(Math.max(1, issue.line), doc.lines));
  const from = Math.min(line.from + Math.max(0, (issue.column ?? 1) - 1), line.to);
  return { from, to: from === line.to ? from : line.to };
}

export function issueDiagnostics(doc: Text, issues: readonly CodeIssueView[]): Diagnostic[] {
  return issues.map((issue) => ({ ...issueRange(doc, issue), severity: "error", message: issue.message, source: issue.code }));
}

const theme = EditorView.theme({
  "&": { height: "100%", fontSize: "12.5px" },
  ".cm-scroller": { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace", lineHeight: "1.55" },
  ".cm-gutters": { background: "transparent" },
});

export default function CodeEditor({
  value,
  onChange,
  issues,
  readOnly,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  issues: readonly CodeIssueView[];
  readOnly: boolean;
  label: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const changeRef = useRef(onChange);
  changeRef.current = onChange;
  const issuesRef = useRef(issues);
  issuesRef.current = issues;
  // True while the document is replaced from outside, so that change isn't reported back as an edit.
  const syncing = useRef(false);

  useEffect(() => {
    if (!host.current) return;
    const editor = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          basicSetup,
          liquid(),
          lintGutter(),
          theme,
          EditorView.lineWrapping,
          EditorState.readOnly.of(readOnly),
          EditorView.contentAttributes.of({ "aria-label": label, dir: "ltr" }),
          EditorView.updateListener.of((update) => {
            if (update.docChanged && !syncing.current) changeRef.current(update.state.doc.toString());
          }),
        ],
      }),
    });
    view.current = editor;
    editor.dispatch(setDiagnostics(editor.state, issueDiagnostics(editor.state.doc, issuesRef.current)));
    return () => {
      editor.destroy();
      view.current = null;
    };
    // The editor is created once; value and issues are pushed in below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readOnly, label]);

  // The file changed outside the editor (undo, another tab): replace the document.
  useEffect(() => {
    const editor = view.current;
    if (!editor || editor.state.doc.toString() === value) return;
    syncing.current = true;
    try {
      editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: value } });
    } finally {
      syncing.current = false;
    }
  }, [value]);

  useEffect(() => {
    const editor = view.current;
    if (!editor) return;
    editor.dispatch(setDiagnostics(editor.state, issueDiagnostics(editor.state.doc, issues)));
  }, [issues]);

  return <div ref={host} dir="ltr" className="h-full min-h-0 overflow-hidden text-start" />;
}
