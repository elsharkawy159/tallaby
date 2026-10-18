"use client";

import { Printer } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@workspace/ui/lib/utils";
import { useScrollSpy } from "@/components/site/use-scroll-spy.client";

/** Numbered contents with scroll-spy and a print button. */
export function LegalToc({ sections }: { sections: { id: string; title: string }[] }) {
  const t = useTranslations("legal");
  const active = useScrollSpy(
    sections.map((s) => s.id),
    140,
  );

  return (
    <nav
      aria-label={t("contents")}
      data-print="hide"
      className="grid gap-0.5 self-start rounded-2xl border border-neutral-200 bg-white p-3 lg:sticky lg:top-[100px] lg:max-h-[calc(100vh-120px)] lg:overflow-auto lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0"
    >
      <b className="block px-3 pb-2 text-xs font-bold text-neutral-500 en:tracking-[0.08em] en:uppercase">{t("contents")}</b>
      {sections.map((s, i) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          className={cn(
            "flex gap-2.5 rounded-[10px] border-s-2 border-transparent px-3 py-2 text-sm leading-[1.45] text-slate-ink hover:bg-neutral-50 hover:no-underline",
            active === s.id && "border-amber-600 bg-teal-50 font-semibold text-teal-900",
          )}
        >
          <span className="font-latin font-semibold text-neutral-400">{String(i + 1).padStart(2, "0")}</span>
          {s.title}
        </a>
      ))}
      <button
        type="button"
        onClick={() => window.print()}
        className="mt-3.5 flex items-center gap-2 px-3 py-2 text-[13px] font-semibold text-teal-700"
      >
        <Printer className="size-4" aria-hidden />
        {t("print")}
      </button>
    </nav>
  );
}
