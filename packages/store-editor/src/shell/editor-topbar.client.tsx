"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  Check,
  ChevronsUpDown,
  CircleHelp,
  Ellipsis,
  ExternalLink,
  Eye,
  Grid3x3,
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
 * Top bar (P4B-03, like the reference navbar): back, page switcher and store
 * address; device sizes in the middle; history, language, grid, preview,
 * help, save state and publish on the end side. Below sm, language, grid,
 * preview, store link and help move into a "More" menu.
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
    <header className="flex h-12 shrink-0 items-center gap-1.5 border-b bg-background px-2">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {links.back && (
          <IconAction label={t("back")} asChild>
            <Link href={links.back}>
              <ArrowRight className="size-4 ltr:rotate-180" aria-hidden />
            </Link>
          </IconAction>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 max-w-44 gap-1.5 px-2.5 max-sm:max-w-28" aria-label={t("pageLabel")}>
              <span className="truncate">{nameOf(page.name, uiLocale) || page.slug}</span>
              <ChevronsUpDown className="size-3.5 opacity-60" aria-hidden />
            </Button>
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
            className="hidden min-w-0 items-center gap-1 truncate text-sm text-muted-foreground hover:text-foreground lg:inline-flex"
          >
            <span className="truncate">{host}</span>
            <ExternalLink className="size-3.5 shrink-0" aria-hidden />
          </a>
        )}
        {capabilities.industrySwitcher && <IndustrySwitcher store={store} uiLocale={uiLocale} />}
      </div>

      <div role="group" aria-label={t("device")} className="hidden items-center rounded-lg border bg-muted/40 p-0.5 sm:flex">
        {DEVICES.map(([value, Icon]) => (
          <Tooltip key={value}>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-pressed={device === value}
                aria-label={t(`devices.${value}`)}
                onClick={() => state.setDevice(value)}
                className={cn("grid h-7 w-8 place-items-center rounded-md text-muted-foreground", device === value && cn("shadow-sm", DEVICE_TONE[value].pill))}
              >
                <Icon className="size-4" aria-hidden />
              </button>
            </TooltipTrigger>
            <TooltipContent>{t(`devices.${value}`)}</TooltipContent>
          </Tooltip>
        ))}
      </div>

      <div className="flex flex-1 items-center justify-end gap-1">
        <IconAction label={t("undo")} onClick={() => state.undo()} disabled={!canUndo}>
          <Undo2 className="size-4" />
        </IconAction>
        <IconAction label={t("redo")} onClick={() => state.redo()} disabled={!canRedo}>
          <Redo2 className="size-4" />
        </IconAction>
        <Divider />
        <div className="hidden items-center gap-1 sm:flex">
          {locales.length > 1 && (
            <div role="group" aria-label={t("editingLanguage")} className="flex rounded-md border p-0.5">
              {locales.map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={locale === value}
                  onClick={() => state.setLocale(value)}
                  className={cn("rounded px-1.5 py-0.5 text-xs font-semibold uppercase text-muted-foreground", locale === value && "bg-muted text-foreground")}
                >
                  {value}
                </button>
              ))}
            </div>
          )}
          <IconAction label={t("gridOverlay")} onClick={() => state.toggleGridOverlay()} pressed={gridOverlay}>
            <Grid3x3 className="size-4" />
          </IconAction>
          <IconAction label={t("previewMotion")} onClick={() => state.togglePreviewMotion()} pressed={previewMotion}>
            <Sparkles className="size-4" />
          </IconAction>
          {previewEnabled && capabilities.preview && (
            <IconAction label={t("previewOnStore")} onClick={preview.open} disabled={preview.opening || readOnly || saveStatus === "conflict"}>
              {preview.opening ? <LoaderCircle className="size-4 animate-spin" /> : <Eye className="size-4" />}
            </IconAction>
          )}
          {hasStore && (
            <IconAction label={t("viewStore")} asChild>
              <a href={storeUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4" aria-hidden />
              </a>
            </IconAction>
          )}
          <IconAction label={t("shortcuts.title")} onClick={onShowShortcuts}>
            <CircleHelp className="size-4" />
          </IconAction>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8 sm:hidden" aria-label={t("more")}>
              <Ellipsis className="size-4" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {locales.length > 1 && (
              <>
                <DropdownMenuLabel className="text-xs text-muted-foreground">{t("editingLanguage")}</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={locale} onValueChange={(value) => state.setLocale(value as SiteLocale)}>
                  {locales.map((value) => (
                    <DropdownMenuRadioItem key={value} value={value} className="uppercase">
                      {value}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
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
              <DropdownMenuItem onSelect={preview.open} disabled={preview.opening || readOnly || saveStatus === "conflict"}>
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
        <Button size="sm" className="h-8" onClick={onPublish} disabled={publishing || readOnly || !hasChanges || saveStatus === "conflict"}>
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
  return <span aria-hidden className="mx-0.5 hidden h-5 w-px bg-border md:block" />;
}

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
          className={cn("size-8", pressed && "bg-muted text-foreground")}
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
      <Button variant="ghost" size="sm" className="h-8 text-destructive" onClick={onRetry}>
        <RotateCw aria-hidden />
        {t("retry")}
      </Button>
    );
  }
  return (
    <span
      role="status"
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap px-1 text-xs",
        status === "conflict" ? "text-destructive" : "text-muted-foreground",
      )}
    >
      {status === "saving" && <LoaderCircle className="size-3 animate-spin" aria-hidden />}
      {status === "saved" && <Check className="size-3" aria-hidden />}
      <span className="max-sm:sr-only">{t(status)}</span>
    </span>
  );
}
