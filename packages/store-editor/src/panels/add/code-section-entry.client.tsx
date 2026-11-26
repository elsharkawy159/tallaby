"use client";

import { useTranslations } from "next-intl";
import { Code } from "lucide-react";
import { useEditorAdapter } from "../../adapter.client";
import { matchesSearch } from "../../lib/editor-palette.lib";

/**
 * Add › Elements › Code section (F-101e): a section with one code node and a
 * starter file. Shown only when the host previews code (`adapter.code`).
 * Inserted by click (Enter); it isn't dragged onto the canvas.
 */
export function codeSectionMatches(query: string, label: string, hint: string): boolean {
  return matchesSearch(query, label, hint, "code", "html", "liquid", "css", "كود", "برمجة");
}

export function CodeSectionEntry({ onAdd }: { onAdd: () => void }) {
  const t = useTranslations("storeEditor.code.add");
  const { code } = useEditorAdapter();
  if (!code) return null;
  return (
    <section className="mb-4">
      <h3 className="mb-2 text-xs font-bold text-(--s-subtle)">{t("group")}</h3>
      <button
        type="button"
        onClick={onAdd}
        data-palette-entry="code-section"
        className="flex w-full items-center gap-2.5 rounded-[14px] border border-(--s-line) bg-(--s-surface) px-2.5 py-2.5 text-start transition-[border-color,box-shadow] hover:border-(--s-primary) hover:shadow-[0_8px_18px_rgb(13_55_67/0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-md border bg-muted/40 font-mono text-[11px] font-bold text-muted-foreground" aria-hidden>
          <Code className="size-4" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-xs font-semibold text-(--s-body)">{t("label")}</span>
          <span className="block truncate text-[11px] text-muted-foreground">{t("hint")}</span>
        </span>
      </button>
    </section>
  );
}
