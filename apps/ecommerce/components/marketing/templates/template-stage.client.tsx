"use client";

import * as React from "react";
import { Monitor, Smartphone } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@workspace/ui/lib/utils";
import { BrowserBar } from "@/components/marketing/site/browser-frame";
import { SignupTrigger } from "@/components/marketing/signup/signup-trigger.client";
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
  const mobile = device === "mobile";

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 rounded-t-card border border-b-0 border-line bg-white px-3.5 py-3">
        <div role="group" aria-label={t("device")} className="flex rounded-full bg-[#f1f5f6] p-[3px]">
          {(["desktop", "mobile"] as const).map((d) => {
            const Icon = d === "desktop" ? Monitor : Smartphone;
            return (
              <button
                key={d}
                type="button"
                aria-pressed={device === d}
                onClick={() => setDevice(d)}
                className={cn(
                  "flex h-[34px] items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold transition-colors",
                  device === d ? "bg-white text-teal-900 shadow-[0_1px_2px_rgba(0,0,0,0.08)]" : "text-ink-600",
                )}
              >
                <Icon className="size-[15px]" aria-hidden />
                {t(d)}
              </button>
            );
          })}
        </div>
        {pages.length > 1 ? (
          <div role="group" aria-label={t("pages")} className="no-scrollbar flex min-w-0 flex-1 gap-1 overflow-x-auto">
            {pages.map((page) => (
              <button
                key={page.slug}
                type="button"
                aria-pressed={page.slug === slug}
                onClick={() => setSlug(page.slug)}
                className={cn(
                  "h-[34px] flex-none rounded-full px-3 text-[13px] whitespace-nowrap transition-colors",
                  page.slug === slug ? "bg-teal-50 font-bold text-teal-900" : "text-ink-600 hover:bg-neutral-100",
                )}
              >
                {page.name}
              </button>
            ))}
          </div>
        ) : (
          <span className="flex-1" />
        )}
        <SignupTrigger size="sm" className="max-[600px]:w-full">{t("startWith")}</SignupTrigger>
      </div>
      <div className="grid place-items-center rounded-b-card border border-line bg-[#eef3f4] p-3.5 shadow-[0_30px_70px_rgba(13,55,67,0.1)] min-[901px]:p-7">
        <div className={cn("w-full overflow-hidden bg-white shadow-raise transition-[max-width] duration-300", mobile ? "max-w-[360px] rounded-[32px] border-8 border-[#0b0f10]" : "max-w-[1040px] rounded-xl")}>
          {mobile ? null : <BrowserBar url={`${templateKey}.tallaby.com`} />}
          <div className="relative h-[min(78vh,820px)] bg-white">
            <iframe
              key={src}
              src={src}
              title={pages.find((p) => p.slug === slug)?.name ?? templateKey}
              onLoad={() => setLoaded(src)}
              className={cn("block size-full border-0 bg-white transition-opacity duration-300", loaded === src ? "opacity-100" : "opacity-0")}
            />
            {loaded === src ? null : <div className="absolute inset-0 animate-pulse bg-neutral-100" />}
          </div>
        </div>
      </div>
    </div>
  );
}
