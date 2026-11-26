"use client";

import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useStore } from "zustand";
import type { ComponentNode, SiteLocale } from "@workspace/store-sections";
import type { RenderContext } from "@workspace/store-sections/render";
import type { EditorAdapter } from "../adapter.types";
import { codeIssueLine, type CodeIssueTranslator } from "./code-issues.lib";
import {
  codePreviewInput,
  createCodePreviewRunner,
  createCodePreviewStore,
  previewKey,
  type CodePreviewRunner,
  type CodePreviewStore,
  type CodePreviewTarget,
} from "./code-preview.lib";

type CodePreviewValue = { runner: CodePreviewRunner; store: CodePreviewStore; target: CodePreviewTarget };

const CodePreviewContext = createContext<CodePreviewValue | null>(null);

/** An empty preview store for hooks rendered without a code preview host (it never changes). */
export const IDLE_PREVIEW_STORE = createCodePreviewStore();

/** Provides a ready preview runner (tests); the editor uses `CodePreviewProvider`. */
export const CodePreviewValueProvider = CodePreviewContext.Provider;

/** The code preview runner of this editor; null when the host has no `code` (no code editing). */
export function useCodePreview(): CodePreviewValue | null {
  return useContext(CodePreviewContext);
}

/**
 * Code node previews for one editor mount (F-101e). Renders its children
 * as they are when the host has no `code.preview`.
 */
export function CodePreviewProvider({
  code,
  locale,
  pageId,
  productId,
  children,
}: {
  code: EditorAdapter["code"];
  locale: SiteLocale;
  pageId?: string;
  productId?: string;
  children: ReactNode;
}) {
  const preview = code?.preview;
  const engine = useMemo(() => {
    if (!preview) return null;
    const store = createCodePreviewStore();
    return { store, runner: createCodePreviewRunner({ preview: (input) => preview(input), store }) };
  }, [preview]);
  useEffect(() => () => engine?.runner.dispose(), [engine]);
  const value = useMemo<CodePreviewValue | null>(
    () => (engine ? { ...engine, target: { locale, ...(pageId && { pageId }), ...(productId && { productId }) } } : null),
    [engine, locale, pageId, productId],
  );
  return <CodePreviewContext.Provider value={value}>{children}</CodePreviewContext.Provider>;
}

/** `ctx.renderCodeNode` for the editor canvas: the node's server preview. */
export const renderCanvasCodeNode: NonNullable<RenderContext["renderCodeNode"]> = (node) => <CanvasCodeNode key={node.id} node={node} />;

const BOX = "flex min-h-24 items-center justify-center gap-2 rounded-(--sf-radius,12px) border border-dashed p-4 text-center font-mono text-xs";

/**
 * A code node on the canvas. Only the host's cleaned `html` and scoped `css`
 * are ever put into the frame; the placeholder and error box are plain text.
 * A leaf: its wrapper carries `data-node-id`, so a click anywhere inside
 * selects the node.
 */
function CanvasCodeNode({ node }: { node: ComponentNode }) {
  const t = useTranslations("storeEditor.code.canvas");
  const tCode = useTranslations("storeEditor.code") as unknown as CodeIssueTranslator;
  const preview = useCodePreview();
  const input = useMemo(() => (preview ? codePreviewInput(node, preview.target) : null), [node, preview]);
  const runner = preview?.runner;
  const latest = useRef(input);
  latest.current = input;
  const key = input ? previewKey(input) : "";
  useEffect(() => {
    if (runner && latest.current) runner.request(latest.current);
  }, [runner, key]);

  const entry = useStore(preview?.store ?? IDLE_PREVIEW_STORE, (s) => s.entries[node.id]);

  if (entry?.status === "error") {
    const issue = entry.issues[0];
    const text = issue ? codeIssueLine(tCode, issue) : "";
    const message = issue ? (issue.line ? t("errorLine", { line: issue.line, message: text }) : text) : t("errorGeneric");
    return (
      <div data-node-id={node.id} data-node-type="code" role="alert" className={`${BOX} border-red-400 bg-red-50 text-red-700`}>
        <span aria-hidden>{"</>"}</span>
        <span className="min-w-0 break-words">{message}</span>
      </div>
    );
  }
  if (!entry?.html) {
    return (
      <div data-node-id={node.id} data-node-type="code" aria-busy={entry?.status === "loading"} className={`${BOX} border-(--sf-line) text-(--sf-muted)`}>
        <span aria-hidden>{"</>"}</span>
        {t(entry?.status === "ready" ? "empty" : "loading")}
      </div>
    );
  }
  return (
    <>
      {entry.css ? <style data-code-node-css={node.id}>{entry.css}</style> : null}
      {/* Cleaned on the server (the same cleaner as the live store); never built or changed here. */}
      <div data-node-id={node.id} data-node-type="code" className="code-node" dangerouslySetInnerHTML={{ __html: entry.html }} />
    </>
  );
}
