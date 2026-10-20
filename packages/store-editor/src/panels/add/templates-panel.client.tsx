"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, LayoutTemplate, Lock } from "lucide-react";
import { Badge } from "@workspace/ui/components/badge";
import { cn } from "@workspace/ui/lib/utils";
import type { TemplateCardView } from "../../templates.dto";
import { TemplatePreviewDialog, type TemplatePreviewHost } from "./template-preview-dialog.client";
import { TemplatePageThumbnail } from "./template-thumbnail.client";

type Localized = { ar?: string; en?: string };

/**
 * Templates tab (owner request 2026-10-18): the same gallery as Website ›
 * Templates. A card opens the preview dialog, which applies the template.
 */
export function TemplatesPanel({
  templates,
  currentKey,
  uiLocale,
  host,
}: {
  templates: TemplateCardView[];
  currentKey: string;
  uiLocale: string;
  host: TemplatePreviewHost;
}) {
  const t = useTranslations("storeEditor.templates");
  const [open, setOpen] = useState<TemplateCardView | null>(null);
  const text = (value: Localized) => (uiLocale === "en" ? value.en || value.ar : value.ar || value.en) || "";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b p-3">
        <p className="text-sm font-semibold">{t("title")}</p>
        <p className="text-xs text-muted-foreground">{t("description")}</p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {templates.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">{t("empty")}</p>
        ) : (
          <ul className="space-y-3">
            {templates.map((template) => {
              const current = template.key === currentKey;
              const home = template.pages.find((p) => p.isHome) ?? template.pages[0];
              return (
                <li key={template.key}>
                  <button
                    type="button"
                    onClick={() => setOpen(template)}
                    className={cn(
                      "group w-full overflow-hidden rounded-xl border bg-card text-start transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      current && "border-primary",
                    )}
                  >
                    {template.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- admin-managed template image
                      <img src={template.thumbnailUrl} alt="" className="aspect-[16/10] w-full border-b object-cover" />
                    ) : home ? (
                      <TemplatePageThumbnail templateKey={template.key} page={home} host={host} className="border-b" />
                    ) : (
                      <span className="grid aspect-[16/10] w-full place-items-center border-b bg-muted/50 text-muted-foreground">
                        <LayoutTemplate className="size-6 opacity-50" />
                      </span>
                    )}
                    <span className="flex flex-col gap-1 p-2.5">
                      <span className="flex flex-wrap items-center gap-1.5">
                        <span className="text-sm font-semibold">{text(template.name)}</span>
                        {current && (
                          <Badge className="h-5 gap-1 px-1.5 text-[10px]">
                            <Check className="size-2.5" />
                            {t("current")}
                          </Badge>
                        )}
                        {template.isPremium && (
                          <Badge variant="outline" className="h-5 gap-1 px-1.5 text-[10px]">
                            <Lock className="size-2.5" />
                            {t("soon")}
                          </Badge>
                        )}
                      </span>
                      <span className="text-[11px] text-muted-foreground">{t("pagesCount", { count: template.pages.length })}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <TemplatePreviewDialog
        template={open}
        current={open?.key === currentKey}
        uiLocale={uiLocale}
        host={host}
        onOpenChange={(next) => !next && setOpen(null)}
      />
    </div>
  );
}
