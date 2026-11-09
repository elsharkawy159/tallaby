"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@workspace/ui/lib/utils";
import { Link } from "@/i18n/navigation";
import { BrowserBar } from "@/components/marketing/site/browser-frame";
import { CtaButton } from "@/components/marketing/site/cta-button";
import { ForwardArrow } from "@/components/marketing/site/direction-icons";
import { useInView, useReducedMotion } from "@/components/marketing/home/use-demo.client";
import { templateFrameSrc, type GalleryEntry } from "@/lib/marketing/templates.lib";
import { TemplateLiveThumb } from "./template-live-thumb.client";

export type ShowcaseEntry = Pick<GalleryEntry, "id" | "name" | "description" | "category" | "palette">;

const ROTATE_MS = 5000;

/**
 * The templates hero: a browser window showing a real template's home page,
 * with a picker under it. It moves to the next template on its own until the
 * visitor picks one, only while on screen. A frame mounts on first view and
 * stays, so going back is instant.
 */
export function TemplateShowcase({ entries }: { entries: ShowcaseEntry[] }) {
  const t = useTranslations("templates");
  const locale = useLocale();
  const reduced = useReducedMotion();
  const [ref, inView] = useInView<HTMLDivElement>(0.3);
  const [current, setCurrent] = React.useState(0);
  const [auto, setAuto] = React.useState(true);
  const [mounted, setMounted] = React.useState<ReadonlySet<number>>(() => new Set([0]));
  const entry = entries[current] ?? entries[0]!;

  const show = React.useCallback((index: number) => {
    setCurrent(index);
    setMounted((prev) => (prev.has(index) ? prev : new Set([...prev, index])));
  }, []);

  React.useEffect(() => {
    if (!auto || reduced || !inView || entries.length < 2) return;
    const id = window.setTimeout(() => show((current + 1) % entries.length), ROTATE_MS);
    return () => window.clearTimeout(id);
  }, [auto, reduced, inView, current, entries.length, show]);

  return (
    <div className="w-full">
      <div ref={ref} className="mx-auto mt-9 w-full max-w-[1080px] overflow-hidden rounded-2xl border border-line bg-white text-start shadow-stage min-[641px]:mt-[52px] min-[641px]:rounded-[22px]">
        <BrowserBar url={`${entry.id}.tallaby.com`} />
        <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100 min-[861px]:aspect-[16/10]">
          {entries.map((item, i) =>
            mounted.has(i) ? (
              <div key={item.id} className={cn("absolute inset-0 transition-opacity duration-300", i === current ? "opacity-100" : "opacity-0")}>
                <TemplateLiveThumb src={templateFrameSrc(locale, item.id, undefined, true)} className="aspect-auto h-full" frameHeight={960} />
              </div>
            ) : null,
          )}
        </div>
      </div>

      <div role="group" aria-label={t("pickerLabel")} className="no-scrollbar relative z-[2] mx-auto -mt-[22px] flex w-max max-w-full items-center gap-1 overflow-x-auto rounded-full border border-line bg-white p-1.5 shadow-[0_14px_36px_rgba(13,55,67,0.12)] min-[641px]:-mt-[26px]">
        {entries.map((item, i) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={i === current}
            onClick={() => {
              setAuto(false);
              show(i);
            }}
            className={cn(
              "flex h-9 flex-none items-center gap-2 rounded-full px-3 font-latin text-[13px] font-semibold whitespace-nowrap transition-colors duration-150 min-[641px]:h-10 min-[641px]:px-4 min-[641px]:text-sm",
              i === current ? "bg-teal-900 text-white" : "text-ink-600 hover:bg-[#f3f7f8]",
            )}
          >
            {item.palette[0] ? <i className="size-2.5 flex-none rounded-full shadow-[0_0_0_1px_rgba(0,0,0,0.08)]" style={{ background: item.palette[0] }} /> : null}
            {item.name}
          </button>
        ))}
      </div>

      <div className="mt-[18px] flex flex-wrap items-center justify-center gap-[18px] text-sm text-ink-500">
        {entry.description ? <p className="max-w-[520px] text-center text-pretty">{entry.description}</p> : null}
        {entry.palette.length ? (
          <div className="flex items-center gap-2 text-[13px] text-ink-400">
            {t("colors")}
            {entry.palette.slice(0, 4).map((color, i) => (
              <i key={`${i}-${color}`} className="size-[22px] rounded-full border-[3px] border-white shadow-[0_0_0_1px_#dfe8ea]" style={{ background: color }} />
            ))}
          </div>
        ) : null}
        <CtaButton asChild tone="outline" size="sm">
          <Link href={`/templates/${entry.id}`}>
            {t("fullPreview")}
            <ForwardArrow />
          </Link>
        </CtaButton>
      </div>
    </div>
  );
}
