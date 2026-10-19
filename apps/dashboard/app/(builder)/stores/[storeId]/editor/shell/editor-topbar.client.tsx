"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  Check,
  ChevronsUpDown,
  CircleHelp,
  ExternalLink,
  Eye,
  Grid3x3,
  LoaderCircle,
  Monitor,
  Redo2,
  RotateCw,
  Smartphone,
  Tablet,
  Undo2,
  UploadCloud,
} from "lucide-react";
import { useStore } from "zustand";
import type { SiteLocale } from "@workspace/store-sections";
import { Button } from "@workspace/ui/components/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@workspace/ui/components/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@workspace/ui/components/tooltip";
import { cn } from "@workspace/ui/lib/utils";
import { DEVICE_TONE } from "../lib/editor-devices.lib";
import { nameOf } from "../panels/pages-panel.client";
import type { EditorStore, SaveStatus } from "../state/editor.store";

const DEVICES = [
  ["desktop", Monitor],
  ["tablet", Tablet],
  ["mobile", Smartphone],
] as const;

/**
 * Top bar (P4B-03, like the reference navbar): back, page switcher and store
 * address; device sizes in the middle; history, language, grid, preview,
 * help, save state and publish on the end side.
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
  onPublish: () => void;
  onShowShortcuts: () => void;
}) {
  const t = useTranslations("storeEditor");
  const pages = useStore(store, (s) => s.pages);
  const activePageId = useStore(store, (s) => s.activePageId);
  const locale = useStore(store, (s) => s.locale);
  const device = useStore(store, (s) => s.device);
  const canUndo = useStore(store, (s) => s.past.length > 0);
  const canRedo = useStore(store, (s) => s.future.length > 0);
  const gridOverlay = useStore(store, (s) => s.gridOverlay);
  const state = store.getState();
  const page = pages.find((p) => p.id === activePageId) ?? pages[0]!;
  const host = storeUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return (
    <header className="flex h-12 shrink-0 items-center gap-1.5 border-b bg-background px-2">
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        <IconAction label={t("back")} asChild>
          <Link href={`/stores/${storeId}/website`}>
            <ArrowRight className="size-4 ltr:rotate-180" aria-hidden />
          </Link>
        </IconAction>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 max-w-44 gap-1.5 px-2.5" aria-label={t("pageLabel")}>
              <span className="truncate">{nameOf(page.name, uiLocale) || page.slug}</span>
              <ChevronsUpDown className="size-3.5 opacity-60" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {pages.map((p) => (
              <DropdownMenuItem key={p.id} onSelect={() => state.setActivePage(p.id)}>
                <Check className={cn("size-4", p.id !== page.id && "invisible")} aria-hidden />
                <span className="flex-1 truncate">{nameOf(p.name, uiLocale) || p.slug}</span>
                <span dir="ltr" className="text-xs text-muted-foreground">
                  /{p.isHome ? "" : p.slug}
                </span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem onSelect={() => state.setRail("pages")} className="text-muted-foreground">
              {t("managePages")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
        {previewEnabled && (
          <IconAction label={t("previewOnStore")} onClick={preview.open} disabled={preview.opening || readOnly || saveStatus === "conflict"}>
            {preview.opening ? <LoaderCircle className="size-4 animate-spin" /> : <Eye className="size-4" />}
          </IconAction>
        )}
        <IconAction label={t("viewStore")} asChild>
          <a href={storeUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="size-4" aria-hidden />
          </a>
        </IconAction>
        <IconAction label={t("shortcuts.title")} onClick={onShowShortcuts}>
          <CircleHelp className="size-4" />
        </IconAction>
        <Divider />
        <SaveState status={saveStatus} onRetry={onRetrySave} />
        <Button size="sm" className="h-8" onClick={onPublish} disabled={publishing || readOnly || saveStatus === "conflict"}>
          {publishing ? <LoaderCircle className="animate-spin" aria-hidden /> : <UploadCloud aria-hidden />}
          {t(isLive ? "publishChanges" : "publish")}
        </Button>
      </div>
    </header>
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
        "hidden items-center gap-1 whitespace-nowrap px-1 text-xs sm:inline-flex",
        status === "conflict" ? "text-destructive" : "text-muted-foreground",
      )}
    >
      {status === "saving" && <LoaderCircle className="size-3 animate-spin" aria-hidden />}
      {status === "saved" && <Check className="size-3" aria-hidden />}
      {t(status)}
    </span>
  );
}
