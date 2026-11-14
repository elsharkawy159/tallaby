"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  Check,
  ChevronsUpDown,
  CircleHelp,
  CloudCheck,
  Ellipsis,
  ExternalLink,
  Eye,
  FileText,
  Grid3x3,
  Languages,
  LoaderCircle,
  Monitor,
  Redo2,
  RotateCw,
  Smartphone,
  Sparkles,
  Tablet,
  Undo2,
  UploadCloud,
} from "lucide-react";
import { useStore } from "zustand";
import type { SiteLocale } from "@workspace/store-sections";
import { pagesPanelOrder } from "../lib/editor-pages.lib";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@workspace/ui/components/tooltip";
import { cn } from "@workspace/ui/lib/utils";
import { DEVICE_TONE } from "../lib/editor-devices.lib";
import { STORE_INDUSTRIES } from "../lib/industries.lib";
import { nameOf } from "../panels/pages-panel.client";
import type { EditorStore, SaveStatus } from "../state/editor.store";
import { useEditorAdapter, useEditorLinks } from "../adapter.client";

const DEVICES = [
  ["desktop", Monitor],
  ["tablet", Tablet],
  ["mobile", Smartphone],
] as const;

/**
 * Top bar (P4B-03, Claude Design "Seller Editor v3"): back, page switcher and
 * store address; device sizes in the middle; history, language, preview, More,
 * save state and publish on the end side. Grid, motion, store link and help
 * live in the More menu; below sm, language and preview join them.
 */
export function EditorTopbar({
  store,
  storeId,
  storeUrl,
  locales,
  uiLocale,
  saveStatus,
  onRetrySave,
  previewEnabled,
  preview,
  readOnly,
  publishing,
  isLive,
  hasChanges,
  onPublish,
  onShowShortcuts,
  fillTranslations,
}: {
  store: EditorStore;
  storeId: string;
  storeUrl: string;
  locales: SiteLocale[];
  uiLocale: string;
  saveStatus: SaveStatus;
  onRetrySave: () => void;
  previewEnabled: boolean;
  preview: { open: () => void; opening: boolean };
  readOnly: boolean;
  publishing: boolean;
  isLive: boolean;
  /** Something to publish: disabled otherwise. */
  hasChanges: boolean;
  onPublish: () => void;
  onShowShortcuts: () => void;
  /** More › Fill missing translations (hosts with store drafts only). */
  fillTranslations?: { run: () => void; running: boolean };
}) {
  const t = useTranslations("storeEditor");
  const { capabilities } = useEditorAdapter();
  const links = useEditorLinks(storeId);
  const pages = useStore(store, (s) => s.pages);
  const activePageId = useStore(store, (s) => s.activePageId);
  const locale = useStore(store, (s) => s.locale);
  const device = useStore(store, (s) => s.device);
  const canUndo = useStore(store, (s) => s.past.length > 0);
  const canRedo = useStore(store, (s) => s.future.length > 0);
  const gridOverlay = useStore(store, (s) => s.gridOverlay);
  const previewMotion = useStore(store, (s) => s.previewMotion);
  const state = store.getState();
  const page = pages.find((p) => p.id === activePageId) ?? pages[0]!;
  const host = storeUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
  // Template and section editing have no store to open.
  const hasStore = capabilities.publishLabel === "site";

  return (
    <header className="relative z-30 flex h-14 min-w-0 shrink-0 items-center gap-2 border-b border-(--s-field) bg-(--s-surface) px-2.5 max-md:h-[52px] max-md:gap-1 max-md:px-1.5">
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        {links.back && (
          <IconAction label={t("back")} asChild>
            <Link href={links.back}>
              <ArrowRight className="size-4 ltr:rotate-180" aria-hidden />
            </Link>
          </IconAction>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={t("pageLabel")}
              className="flex h-[38px] max-w-[200px] min-w-0 items-center gap-2 rounded-xl border border-(--s-field) bg-(--s-surface) px-3 text-[13px] font-bold whitespace-nowrap text-(--s-ink) transition-colors hover:bg-(--s-hover) max-md:h-9 max-md:max-w-[120px] max-md:gap-1.5 max-md:px-2.5 max-md:text-[12.5px]"
            >
              <FileText className="size-[15px] shrink-0 text-(--s-subtle) max-md:hidden" aria-hidden />
              <span className="truncate">{nameOf(page.name, uiLocale) || page.slug}</span>
              <ChevronsUpDown className="size-[15px] shrink-0 text-(--s-subtle)" aria-hidden />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {pagesPanelOrder(pages).map((p) => (
              <DropdownMenuItem key={p.id} onSelect={() => state.setActivePage(p.id)}>
                <Check className={cn("size-4", p.id !== page.id && "invisible")} aria-hidden />
                <span className="flex-1 truncate">{nameOf(p.name, uiLocale) || p.slug}</span>
                <span dir="ltr" className="text-xs text-muted-foreground">
                  /{p.isHome ? "" : p.slug}
                </span>
              </DropdownMenuItem>
            ))}
            {capabilities.pages && (
              <DropdownMenuItem onSelect={() => state.setRail("pages")} className="text-muted-foreground">
                {t("managePages")}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        {hasStore && (
          <a
            href={storeUrl}
            target="_blank"
            rel="noopener noreferrer"
            dir="ltr"
            className="ms-1.5 hidden min-w-0 items-center gap-1 truncate font-montserrat text-xs font-medium text-(--s-subtle) hover:text-(--s-ink) min-[1281px]:inline-flex"
          >
            <span className="truncate">{host}</span>
            <ExternalLink className="size-3.5 shrink-0" aria-hidden />
          </a>
        )}
        {capabilities.industrySwitcher && <IndustrySwitcher store={store} uiLocale={uiLocale} />}
      </div>

      <div role="group" aria-label={t("device")} className="hidden shrink-0 items-center gap-0.5 rounded-xl bg-(--s-fill) p-[3px] sm:flex">
        {DEVICES.map(([value, Icon]) => (
          <Tooltip key={value}>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-pressed={device === value}
                aria-label={t(`devices.${value}`)}
                onClick={() => state.setDevice(value)}
                className={cn("grid h-8 w-[38px] place-items-center rounded-[9px] text-(--s-subtle) transition-colors hover:text-(--s-ink)", device === value && cn("shadow-sm", DEVICE_TONE[value].pill))}
              >
                <Icon className="size-4" aria-hidden />
              </button>
            </TooltipTrigger>
            <TooltipContent>{t(`devices.${value}`)}</TooltipContent>
          </Tooltip>
        ))}
      </div>

      <div className="flex shrink-0 items-center justify-end gap-1.5 sm:flex-1 max-md:gap-0.5">
        <IconAction label={t("undo")} onClick={() => state.undo()} disabled={!canUndo}>
          <Undo2 className="size-4" />
        </IconAction>
        <IconAction label={t("redo")} onClick={() => state.redo()} disabled={!canRedo}>
          <Redo2 className="size-4" />
        </IconAction>
        <Divider />
        <div className="hidden items-center gap-1.5 sm:flex">
          {locales.length > 1 && (
            <div role="group" aria-label={t("editingLanguage")} className="flex shrink-0 rounded-[10px] border border-(--s-field) p-0.5">
              {locales.map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={locale === value}
                  onClick={() => state.setLocale(value)}
                  className={cn("h-7 rounded-lg px-[9px] font-montserrat text-[11px] font-bold uppercase text-(--s-subtle)", locale === value && "bg-(--s-solid) text-(--s-solid-fg)")}
                >
                  {value}
                </button>
              ))}
            </div>
          )}
          {previewEnabled && capabilities.preview && (
            <IconAction label={t("previewOnStore")} onClick={preview.open} disabled={preview.opening || readOnly || saveStatus === "conflict"}>
              {preview.opening ? <LoaderCircle className="size-4 animate-spin" /> : <Eye className="size-4" />}
            </IconAction>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className={ICON_ACTION} aria-label={t("more")}>
              <Ellipsis className="size-[17px]" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {locales.length > 1 && (
              <div className="sm:hidden">
                <DropdownMenuLabel className="text-xs text-muted-foreground">{t("editingLanguage")}</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={locale} onValueChange={(value) => state.setLocale(value as SiteLocale)}>
                  {locales.map((value) => (
                    <DropdownMenuRadioItem key={value} value={value} className="uppercase">
                      {value}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
              </div>
            )}
            {fillTranslations && (
              <>
                <DropdownMenuItem onSelect={fillTranslations.run} disabled={fillTranslations.running || readOnly || saveStatus === "conflict"}>
                  {fillTranslations.running ? <LoaderCircle className="animate-spin" aria-hidden /> : <Languages aria-hidden />}
                  {t("fillTranslations.action")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuCheckboxItem checked={gridOverlay} onCheckedChange={() => state.toggleGridOverlay()}>
              <Grid3x3 aria-hidden />
              {t("gridOverlay")}
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={previewMotion} onCheckedChange={() => state.togglePreviewMotion()}>
              <Sparkles aria-hidden />
              {t("previewMotion")}
            </DropdownMenuCheckboxItem>
            {previewEnabled && capabilities.preview && (
              <DropdownMenuItem className="sm:hidden" onSelect={preview.open} disabled={preview.opening || readOnly || saveStatus === "conflict"}>
                {preview.opening ? <LoaderCircle className="animate-spin" aria-hidden /> : <Eye aria-hidden />}
                {t("previewOnStore")}
              </DropdownMenuItem>
            )}
            {hasStore && (
              <DropdownMenuItem asChild>
                <a href={storeUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink aria-hidden />
                  {t("viewStore")}
                </a>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onSelect={onShowShortcuts}>
              <CircleHelp aria-hidden />
              {t("shortcuts.title")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Divider />
        <SaveState status={saveStatus} onRetry={onRetrySave} />
        <Button
          size="sm"
          className="h-[38px] rounded-full bg-accent px-4 text-[13px] font-bold text-(--tallaby-teal-900) shadow-(--s-shadow-amber) transition-[background-color,transform] hover:bg-(--s-amber-hover) active:scale-[.97] motion-reduce:active:scale-100 max-md:h-9 max-md:px-3.5"
          onClick={onPublish}
          disabled={publishing || readOnly || !hasChanges || saveStatus === "conflict"}
        >
          {publishing ? <LoaderCircle className="animate-spin" aria-hidden /> : <UploadCloud aria-hidden />}
          <span className={cn(isLive && capabilities.publishLabel !== "section" && "max-sm:hidden")}>
            {t(capabilities.publishLabel === "section" ? "publishSection" : isLive ? "publishChanges" : "publish")}
          </span>
          {isLive && capabilities.publishLabel !== "section" && <span className="sm:hidden">{t("publish")}</span>}
        </Button>
      </div>
    </header>
  );
}

/**
 * Section/template editing: which industry's photos the canvas shows for the
 * tree's photo slots. Preview only: it sets the render-context industry and
 * never touches the tree, so the saved section keeps its slots.
 */
function IndustrySwitcher({ store, uiLocale }: { store: EditorStore; uiLocale: string }) {
  const t = useTranslations("storeEditor.industryPreview");
  const industry = useStore(store, (s) => s.industry);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <label className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground sm:shrink-0">
          <span className="hidden xl:inline">{t("label")}</span>
          <select
            aria-label={t("label")}
            value={industry ?? ""}
            onChange={(e) => store.getState().setIndustry(e.target.value || undefined)}
            className="h-8 max-w-40 rounded-md border border-input bg-background px-2 text-xs text-foreground max-sm:max-w-24"
          >
            <option value="">{t("general")}</option>
            {STORE_INDUSTRIES.map((option) => (
              <option key={option.id} value={option.id}>
                {uiLocale === "en" ? option.en : option.ar}
              </option>
            ))}
          </select>
        </label>
      </TooltipTrigger>
      <TooltipContent className="max-w-64">{t("hint")}</TooltipContent>
    </Tooltip>
  );
}

function Divider() {
  return <span aria-hidden className="hidden h-[22px] w-px shrink-0 bg-(--s-field) md:block" />;
}

const ICON_ACTION = "size-9 rounded-[11px] text-(--s-muted) hover:bg-(--s-hover) hover:text-(--s-ink) max-md:size-[34px]";

function IconAction({
  label,
  onClick,
  disabled,
  pressed,
  asChild,
  children,
}: {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  pressed?: boolean;
  asChild?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(ICON_ACTION, pressed && "bg-(--s-hover) text-(--s-ink)")}
          aria-label={label}
          aria-pressed={pressed}
          onClick={onClick}
          disabled={disabled}
          asChild={asChild}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function SaveState({ status, onRetry }: { status: SaveStatus; onRetry: () => void }) {
  const t = useTranslations("storeEditor.save");
  if (status === "error") {
    return (
      <Button variant="ghost" size="sm" className="h-9 text-destructive" onClick={onRetry}>
        <RotateCw aria-hidden />
        {t("retry")}
      </Button>
    );
  }
  return (
    <span
      role="status"
      className={cn(
        "inline-flex items-center gap-[5px] whitespace-nowrap px-1 text-xs",
        status === "conflict" ? "text-destructive" : "text-(--s-subtle)",
      )}
    >
      {status === "saving" && <LoaderCircle className="size-3.5 animate-spin motion-reduce:animate-none" aria-hidden />}
      {status === "saved" && <CloudCheck className="size-3.5 text-success" aria-hidden />}
      <span className="max-sm:sr-only">{t(status)}</span>
    </span>
  );
}
