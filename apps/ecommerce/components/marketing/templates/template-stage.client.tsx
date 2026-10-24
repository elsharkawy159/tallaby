"use client";

import * as React from "react";
import { Monitor, Smartphone } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@workspace/ui/lib/utils";
import { BrowserBar } from "@/components/marketing/site/browser-frame";
import { templateFrameSrc, type GalleryPage } from "@/lib/marketing/templates.lib";

/**
 * The template page's stage: every page of the real template with its demo
 * store (the /template-preview frame), on a desktop or a phone.
 */
export function TemplateStage({ templateKey, pages }: { templateKey: string; pages: GalleryPage[] }) {
  const t = useTranslations("templates.detail");
  const locale = useLocale();
  const [slug, setSlug] = React.useState(pages[0]?.slug);
  const [device, setDevice] = React.useState<"desktop" | "mobile">("desktop");
  const [loaded, setLoaded] = React.useState<string | null>(null);
  const src = templateFrameSrc(locale, templateKey, slug);

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-lift">
      <BrowserBar url={`${templateKey}.tallaby.com`} />
      <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 px-3 py-2">
        <div role="group" aria-label={t("pages")} className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
          {pages.map((page) => (
            <button
              key={page.slug}
              type="button"
              aria-pressed={page.slug === slug}
              onClick={() => setSlug(page.slug)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-[13px] transition-colors",
                page.slug === slug ? "bg-teal-50 font-bold text-teal-900" : "text-neutral-600 hover:bg-neutral-100",
              )}
            >
              {page.name}
            </button>
          ))}
        </div>
        <div role="group" aria-label={t("device")} className="flex gap-1">
          {(["desktop", "mobile"] as const).map((d) => {
            const Icon = d === "desktop" ? Monitor : Smartphone;
            return (
              <button
                key={d}
                type="button"
                aria-pressed={device === d}
                aria-label={t(d)}
                title={t(d)}
                onClick={() => setDevice(d)}
                className={cn(
                  "grid size-8 place-items-center rounded-lg transition-colors",
                  device === d ? "bg-teal-50 text-teal-900" : "text-neutral-600 hover:bg-neutral-100",
                )}
              >
                <Icon className="size-4" aria-hidden />
              </button>
            );
          })}
        </div>
      </div>
      <div className="relative h-[min(78vh,820px)] bg-neutral-100 p-2">
        <iframe
          key={src}
          src={src}
          title={pages.find((p) => p.slug === slug)?.name ?? templateKey}
          onLoad={() => setLoaded(src)}
          className={cn(
            "mx-auto block h-full max-w-full rounded-lg border-0 bg-white shadow-sm transition-opacity duration-300",
            loaded === src ? "opacity-100" : "opacity-0",
          )}
          style={{ width: device === "mobile" ? 390 : "100%" }}
        />
        {loaded === src ? null : <div className="absolute inset-2 animate-pulse rounded-lg bg-neutral-200/60" />}
      </div>
    </div>
  );
}
