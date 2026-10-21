"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, ChevronLeft, ChevronRight, Eye, LayoutTemplate, LoaderCircle, Lock, Pencil, RotateCcw, Sparkles } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { BUTTON_CLASS, SMALL_BUTTON_CLASS } from "@/components/form/form-ui";
import { cn } from "@/lib/utils";
import { TemplateLiveThumbnail, TemplatePreview } from "./template-preview.client";
import { applyTemplate, undoTemplate } from "./templates.server";
import type { TemplateCardView, TemplateInstallView } from "./templates.dto";
import { RemoteImage } from "@/components/media/remote-image";

type Localized = { ar?: string; en?: string };

/** Cards per page: fills whole rows of the 2, 3 and 4-column grids. */
const PAGE_SIZE = 12;

/**
 * Website › Templates gallery (PLAN.md §8.1, P4-05). Works with a single
 * template too. Each card shows the template's home page live, and Preview
 * opens every page with the template's demo store (storefront templates).
 */
export function TemplateGallery({
  storeId,
  currentKey,
  templates,
  lastInstall,
  readOnly,
  fontClassName,
}: {
  storeId: string;
  currentKey: string;
  templates: TemplateCardView[];
  lastInstall: TemplateInstallView | null;
  readOnly: boolean;
  /** Class names defining the store font variables (store-fonts.ts). */
  fontClassName: string;
}) {
  const t = useTranslations("websiteTemplates");
  const locale = useLocale() === "en" ? "en" : "ar";
  const format = useFormatter();
  const router = useRouter();
  const [category, setCategory] = useState<string>("all");
  const [page, setPage] = useState(1);
  const listRef = useRef<HTMLDivElement>(null);
  const [confirming, setConfirming] = useState<TemplateCardView | null>(null);
  const [previewing, setPreviewing] = useState<TemplateCardView | null>(null);
  const [confirmUndo, setConfirmUndo] = useState(false);
  const [isPending, startTransition] = useTransition();

  const text = (value: Localized) => value[locale] || value.ar || value.en || "";
  const categories = useMemo(() => [...new Set(templates.map((tpl) => tpl.category))], [templates]);
  const filtered = category === "all" ? templates : templates.filter((tpl) => tpl.category === category);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  // Clamped: a refresh can shrink the list under the current page.
  const currentPage = Math.min(page, pageCount);
  const shown = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const goToPage = (next: number) => {
    setPage(next);
    listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const nameOf = (key: string) => text(templates.find((tpl) => tpl.key === key)?.name ?? {}) || key;

  const onApply = (template: TemplateCardView) =>
    startTransition(async () => {
      const result = await applyTemplate(storeId, template.key);
      setConfirming(null);
      if (!result.success) {
        toast.error(t(`errors.${result.error}`));
        return;
      }
      toast.success(t("applied", { name: text(template.name) }));
      router.refresh();
    });

  const onUndo = () =>
    startTransition(async () => {
      const result = await undoTemplate(storeId);
      setConfirmUndo(false);
      if (!result.success) {
        toast.error(t(`errors.${result.error}`));
        return;
      }
      toast.success(t("undone"));
      router.refresh();
    });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">{t("title")}</h2>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <Button asChild variant="outline" className={cn(BUTTON_CLASS, "max-sm:w-full")}>
          <Link href={`/stores/${storeId}/editor`}>
            <Pencil />
            {t("openEditor")}
          </Link>
        </Button>
      </div>

      {readOnly && <p className="rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">{t("readOnly")}</p>}

      {lastInstall?.canUndo && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/40 px-4 py-3 text-sm">
          <span>
            {t("lastApplied", {
              name: nameOf(lastInstall.templateKey),
              date: format.dateTime(new Date(lastInstall.installedAt), { dateStyle: "medium", timeStyle: "short" }),
            })}
          </span>
          <Button type="button" variant="neutral" className={SMALL_BUTTON_CLASS} disabled={readOnly || isPending} onClick={() => setConfirmUndo(true)}>
            <RotateCcw />
            {t("undo")}
          </Button>
        </div>
      )}

      {categories.length > 1 && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0" role="tablist" aria-label={t("categories.label")}>
          {["all", ...categories].map((value) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={category === value}
              onClick={() => {
                setCategory(value);
                setPage(1);
              }}
              className={cn(
                "shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm transition-colors",
                category === value ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
              )}
            >
              {value === "all" ? t("categories.all") : t.has(`categories.${value}`) ? t(`categories.${value}`) : value}
            </button>
          ))}
        </div>
      )}

      {shown.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <div ref={listRef} className="scroll-mt-4 space-y-4">
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {shown.map((template) => {
            const current = template.key === currentKey;
            return (
              <li key={template.key} className={cn("flex flex-col overflow-hidden rounded-2xl border bg-card", current && "border-primary")}>
                <button
                  type="button"
                  className="block w-full text-start focus-visible:outline-2 focus-visible:outline-primary"
                  onClick={() => setPreviewing(template)}
                  aria-label={t("preview.open", { name: text(template.name) })}
                >
                  {template.thumbnailUrl ? (
                    <TemplateThumbnail template={template} text={text} />
                  ) : (
                    <TemplateLiveThumbnail
                      storeId={storeId}
                      template={template}
                      fontClassName={fontClassName}
                      fallback={<TemplateThumbnail template={template} text={text} />}
                    />
                  )}
                </button>
                <div className="flex min-w-0 flex-1 flex-col gap-2 p-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h3 className="min-w-0 truncate font-bold">{text(template.name)}</h3>
                    {current && (
                      <Badge className="gap-1">
                        <Check className="size-3" />
                        {t("current")}
                      </Badge>
                    )}
                    {template.isDefault && !current && <Badge variant="outline">{t("default")}</Badge>}
                    {template.isPremium && (
                      <Badge variant="outline" className="gap-1">
                        <Lock className="size-3" />
                        {t("soon")}
                      </Badge>
                    )}
                  </div>
                  {text(template.description) && <p className="line-clamp-2 text-sm text-muted-foreground">{text(template.description)}</p>}
                  {template.palette.length > 0 && (
                    <div className="flex h-5 w-28 overflow-hidden rounded-md border" aria-hidden>
                      {template.palette.map((color) => (
                        <span key={color} className="flex-1" style={{ background: color }} />
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {t("pagesCount", { count: template.pages.length })} · {t("version", { number: template.version })}
                  </p>
                  <div className="mt-auto grid grid-cols-2 gap-2 pt-1">
                    <Button type="button" variant="outline" className={cn(SMALL_BUTTON_CLASS, "w-full")} onClick={() => setPreviewing(template)}>
                      <Eye />
                      {t("preview.action")}
                    </Button>
                    <Button
                      type="button"
                      variant={current ? "neutral" : "default"}
                      className={cn(SMALL_BUTTON_CLASS, "w-full")}
                      disabled={readOnly || isPending || template.isPremium}
                      onClick={() => setConfirming(template)}
                    >
                      {current ? <RotateCcw /> : <Sparkles />}
                      {current ? t("reapply") : t("use")}
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        {pageCount > 1 && (
          <nav className="flex items-center justify-center gap-3" aria-label={t("pagination.label")}>
            <Button
              type="button"
              variant="outline"
              className={SMALL_BUTTON_CLASS}
              disabled={currentPage <= 1}
              onClick={() => goToPage(currentPage - 1)}
            >
              <ChevronLeft className="rtl:rotate-180" />
              {t("pagination.previous")}
            </Button>
            <span className="text-sm text-muted-foreground" aria-live="polite">
              {t("pagination.page", { page: currentPage, pageCount })}
            </span>
            <Button
              type="button"
              variant="outline"
              className={SMALL_BUTTON_CLASS}
              disabled={currentPage >= pageCount}
              onClick={() => goToPage(currentPage + 1)}
            >
              {t("pagination.next")}
              <ChevronRight className="rtl:rotate-180" />
            </Button>
          </nav>
        )}
        </div>
      )}

      <p className="text-xs text-muted-foreground">{t("moreSoon")}</p>

      <TemplatePreview
        storeId={storeId}
        template={previewing}
        current={previewing?.key === currentKey}
        disabled={readOnly || isPending || Boolean(previewing?.isPremium)}
        uiLocale={locale}
        fontClassName={fontClassName}
        onUse={(template) => {
          setPreviewing(null);
          setConfirming(template);
        }}
        onOpenChange={(open) => !open && setPreviewing(null)}
      />

      <AlertDialog open={confirming !== null} onOpenChange={(open) => !open && !isPending && setConfirming(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirm.title", { name: text(confirming?.name ?? {}) })}</AlertDialogTitle>
            <AlertDialogDescription>{t("confirm.description")}</AlertDialogDescription>
          </AlertDialogHeader>
          <ul className="list-disc space-y-1 ps-5 text-sm text-muted-foreground">
            <li>{t("confirm.keeps")}</li>
            <li>{t("confirm.draft")}</li>
            <li>{t("confirm.untouched")}</li>
            {(confirming?.formKinds.length ?? 0) > 0 && <li>{t("confirm.forms")}</li>}
          </ul>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={(event) => {
                event.preventDefault();
                if (confirming) onApply(confirming);
              }}
            >
              {isPending && <LoaderCircle className="animate-spin" />}
              {t("confirm.action")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmUndo} onOpenChange={(open) => !open && !isPending && setConfirmUndo(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("undoConfirm.title")}</AlertDialogTitle>
            <AlertDialogDescription>{t("undoConfirm.description")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={(event) => {
                event.preventDefault();
                onUndo();
              }}
            >
              {isPending && <LoaderCircle className="animate-spin" />}
              {t("undoConfirm.action")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** The template's image, or an outline of its pages and sections when it has none. */
function TemplateThumbnail({ template, text }: { template: TemplateCardView; text: (value: Localized) => string }) {
  if (template.thumbnailUrl) {
    return (
      <div className="relative aspect-[7/6] w-full border-b">
        <RemoteImage
          src={template.thumbnailUrl}
          alt=""
          fill
          sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover"
        />
      </div>
    );
  }
  return (
    <div className="flex aspect-[16/9] w-full flex-col gap-1.5 overflow-hidden border-b bg-muted/50 p-4">
      <span className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <LayoutTemplate className="size-3.5" />
        {template.pages.find((page) => page.isHome)?.name ?? template.pages[0]?.name}
      </span>
      {(template.pages.find((page) => page.isHome) ?? template.pages[0])?.sections.slice(0, 5).map((section, index) => (
        <span key={index} className="truncate rounded-md border bg-background px-2.5 py-1.5 text-xs">
          {text(section)}
        </span>
      ))}
    </div>
  );
}
