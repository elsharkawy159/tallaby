"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ExternalLink, LoaderCircle, Search, Settings2 } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { cn } from "@workspace/ui/lib/utils";
import { findIndustry, industryQueries } from "@/lib/stores/industries.lib";
import type { StockPhoto } from "@/lib/stock-photos/stock-photos.lib";
import { useDragData } from "../dnd/editor-dnd.client";
import type { EditorCommands } from "../editor-commands.lib";
import { importStockPhoto, searchStockPhotos, type ExploreErrorKey } from "../explore.server";

/**
 * Explore tab (owner request 2026-10-18, like the reference
 * `explore/explore-panel.tsx`): free Pexels photos, with searches suggested
 * from the store's industry (Store settings › General). Clicking a photo
 * copies it into this store's media library, then replaces the selected
 * image or adds an Image element, like the Images tab. A photo can also be
 * dragged onto the canvas (P4B-12): onto an image to replace it, or between
 * elements and sections to add it. To use one on another page, switch page
 * first and then click or drag it (no drag survives a page change).
 */
export function ExplorePanel({
  storeId,
  readOnly,
  category,
  uiLocale,
  commands,
}: {
  storeId: string;
  readOnly: boolean;
  category: { en: string | null; ar: string | null };
  uiLocale: string;
  commands: EditorCommands;
}) {
  const t = useTranslations("storeEditor.explore");
  const suggestions = useMemo(() => industryQueries(category), [category]);
  const industry = findIndustry(category);
  const categoryLabel = industry ? (uiLocale === "en" ? industry.en : industry.ar) : (uiLocale === "en" ? category.en || category.ar : category.ar || category.en);
  const [input, setInput] = useState("");
  const [query, setQuery] = useState(suggestions[0]!);
  const [photos, setPhotos] = useState<StockPhoto[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ExploreErrorKey | null>(null);
  const [importing, setImporting] = useState<string | null>(null);
  const request = useRef(0);

  // Debounced typing; an empty box goes back to the industry suggestion.
  useEffect(() => {
    const next = input.trim() || suggestions[0]!;
    const timer = setTimeout(() => setQuery(next), 400);
    return () => clearTimeout(timer);
  }, [input, suggestions]);

  const load = async (q: string, p: number) => {
    const id = ++request.current;
    setLoading(true);
    setError(null);
    const result = await searchStockPhotos(storeId, q, p);
    if (id !== request.current) return;
    setLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setPhotos((prev) => (p === 1 ? result.data.photos : [...prev, ...result.data.photos.filter((ph) => !prev.some((x) => x.id === ph.id))]));
    setHasMore(result.data.hasMore);
    setPage(p);
  };

  useEffect(() => {
    void load(query, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload only when the search changes
  }, [query, storeId]);

  const onPick = async (photo: StockPhoto) => {
    if (readOnly || importing) return;
    setImporting(photo.id);
    try {
      const result = await importStockPhoto(storeId, photo.id);
      if (!result.success) {
        toast.error(t(`errors.${result.error}`));
        return;
      }
      commands.applyImage(result.data.url);
      toast.success(t("imported"));
    } finally {
      setImporting(null);
    }
  };

  const columns = [photos.filter((_, i) => i % 2 === 0), photos.filter((_, i) => i % 2 === 1)];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="space-y-2.5 border-b p-3">
        <div>
          <p className="text-sm font-semibold">{t("title")}</p>
          <p className="text-xs text-muted-foreground">{categoryLabel ? t("forIndustry", { industry: categoryLabel }) : t("intro")}</p>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input dir="auto" value={input} onChange={(e) => setInput(e.target.value)} placeholder={t("search")} aria-label={t("search")} className="ps-8" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              dir="ltr"
              onClick={() => {
                setInput("");
                setQuery(s);
              }}
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-[11px] transition-colors",
                query === s ? "border-primary bg-primary/5 text-primary" : "text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              {s}
            </button>
          ))}
        </div>
        {!categoryLabel && (
          <Link href={`/stores/${storeId}/settings`} target="_blank" className="flex items-center gap-1.5 text-[11px] font-medium text-primary hover:underline">
            <Settings2 className="size-3.5" />
            {t("setIndustry")}
          </Link>
        )}
        <p className="text-[11px] text-muted-foreground">{readOnly ? t("readOnly") : t("howTo")}</p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {error ? (
          <p className="p-4 text-center text-xs text-muted-foreground">{t(`errors.${error}`)}</p>
        ) : !loading && photos.length === 0 ? (
          <p className="p-4 text-center text-xs text-muted-foreground">{t("noResults")}</p>
        ) : (
          <div className="flex gap-1.5">
            {columns.map((column, ci) => (
              <div key={ci} className="flex min-w-0 flex-1 flex-col gap-1.5">
                {column.map((photo) => (
                  <div key={photo.id} className="group relative overflow-hidden rounded-md" style={{ aspectRatio: `${photo.width}/${photo.height}`, background: photo.avgColor ?? "var(--muted)" }}>
                    <PhotoButton
                      photo={photo}
                      disabled={readOnly || importing !== null}
                      label={photo.alt || t("photoBy", { name: photo.photographer })}
                      onPick={() => void onPick(photo)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- Pexels CDN thumbnail */}
                      <img src={photo.thumbUrl} alt="" loading="lazy" className="size-full object-cover transition-transform duration-200 group-hover:scale-105" />
                      <span className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/25" />
                      {!readOnly && (
                        <span className="absolute inset-x-0 top-1/2 mx-auto w-fit -translate-y-1/2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground opacity-0 shadow transition-opacity group-hover:opacity-100">
                          {t("use")}
                        </span>
                      )}
                    </PhotoButton>
                    <a
                      href={photo.pageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={t("photoBy", { name: photo.photographer })}
                      className="absolute inset-x-0 bottom-0 flex items-center gap-1 truncate bg-gradient-to-t from-black/60 to-transparent px-1.5 pt-3 pb-1 text-[9px] text-white opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <ExternalLink className="size-2.5 shrink-0" />
                      <span className="truncate">{photo.photographer}</span>
                    </a>
                    {importing === photo.id && (
                      <span className="absolute inset-0 grid place-items-center bg-black/45">
                        <LoaderCircle className="size-5 animate-spin text-white" aria-label={t("importing")} />
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
        {loading && (
          <div className="grid place-items-center py-6">
            <LoaderCircle className="size-5 animate-spin text-muted-foreground" aria-label={t("loading")} />
          </div>
        )}
        {!loading && !error && hasMore && (
          <Button type="button" variant="outline" size="sm" className="mt-2 w-full" onClick={() => void load(query, page + 1)}>
            {t("more")}
          </Button>
        )}
      </div>

      <a
        href="https://www.pexels.com"
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 border-t px-3 py-2 text-center text-[11px] text-muted-foreground hover:text-foreground"
      >
        {t("attribution")}
      </a>
    </div>
  );
}

/** A photo tile: click to use it on the selection, or drag it onto the canvas. */
function PhotoButton({
  photo,
  disabled,
  label,
  onPick,
  children,
}: {
  photo: StockPhoto;
  disabled: boolean;
  label: string;
  onPick: () => void;
  children: React.ReactNode;
}) {
  const data = useDragData({ kind: "photo", photo: { photoId: photo.id, thumbUrl: photo.thumbUrl, alt: photo.alt ?? "" } }, label);
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({ id: `photo:${photo.id}`, data, disabled });
  // Enter/Space click the photo (use it); keyboard dragging across the frame is not offered.
  const { onKeyDown: _keyboard, ...pointer } = listeners ?? {};
  void _keyboard;
  return (
    <button
      ref={setNodeRef}
      type="button"
      {...attributes}
      {...pointer}
      disabled={disabled}
      onClick={onPick}
      aria-label={label}
      className={cn("block size-full cursor-grab active:cursor-grabbing disabled:cursor-not-allowed", isDragging && "opacity-40")}
    >
      {children}
    </button>
  );
}
