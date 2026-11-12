"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ExternalLink, Paintbrush, Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { ADMIN_DEFAULT_REASON } from "@workspace/lib/admin";
import { cn } from "@workspace/ui/lib/utils";
import { templatePreviewPageUrl } from "@workspace/store-editor/lib/template-edition.lib";
import { TemplateLiveThumbnail } from "@workspace/store-editor/preview/template-live-thumbnail.client";
import type { TemplatePreviewView } from "@workspace/store-editor/templates.dto";
import { TemplateShot } from "@workspace/ui/components/template-shot";
import { previewShot, templatePreviewUrl } from "@workspace/store-sections/template-preview";
import { RemoteImage } from "@/components/media/remote-image";
import { BuilderIntl } from "@/app/(builder)/builder-intl.client";
import { templatePreview } from "@/app/(builder)/stores/[storeId]/editor/admin-store-editor.server";
import { storeFontVariables } from "@/app/(builder)/stores/[storeId]/editor/store-fonts";
import type { ThemeGallery } from "./store-theme.data";
import { themeCards, themeNicheName } from "./store-theme.lib";
import { applyStoreThemeAction } from "./website-actions.server";

export type { ThemeOption } from "./store-theme.lib";

/** tallaby.com, where the full-page template preview lives. */
const PREVIEW_ORIGIN = `https://${process.env.NEXT_PUBLIC_ROOT_DOMAIN || "tallaby.com"}`;

const HEX = /^#[0-9a-f]{3,8}$/i;

/** The theme's colours as one band, the quickest way to tell themes apart. */
export function PaletteBand({ palette, className }: { palette: readonly string[]; className?: string }) {
  const colors = palette.filter((color) => HEX.test(color));
  if (colors.length === 0) return <div className={cn("bg-muted", className)} aria-hidden />;
  return (
    <div className={cn("flex overflow-hidden", className)} aria-hidden>
      {colors.map((color, i) => (
        <span key={`${color}-${i}`} className="h-full flex-1" style={{ background: color }} />
      ))}
    </div>
  );
}

/** Loaded theme content by store, key and edition, shared by the dialog's cards; a failed load is retried next time. */
const PREVIEWS = new Map<string, Promise<TemplatePreviewView | null>>();

function loadThemePreview(storeId: string, key: string, edition: string | null): Promise<TemplatePreviewView | null> {
  const id = `${storeId}:${key}:${edition ?? ""}`;
  let pending = PREVIEWS.get(id);
  if (!pending) {
    pending = templatePreview(storeId, key, edition).then((result) => (result.success ? result.data : null));
    void pending.then(
      (data) => data ?? PREVIEWS.delete(id),
      () => PREVIEWS.delete(id),
    );
    PREVIEWS.set(id, pending);
  }
  return pending;
}

const categoryLabel = (category: string) => (category ? category.charAt(0).toUpperCase() + category.slice(1).replace(/[-_]/g, " ") : "Other");

type Choice = { key: string; edition: string | null };

/**
 * "Change theme": every offered theme with its colours, by industry and then
 * by niche (as the seller's Website › Templates), then, on a live site,
 * whether to publish at once. A niche tab's cards preview and apply that
 * niche's edition, so the store gets the niche's look.
 */
export function ChangeThemeButton({
  storeId,
  storeName,
  currentKey,
  gallery,
  previewLocale,
  siteLive,
}: {
  storeId: string;
  storeName: string;
  currentKey: string;
  gallery: ThemeGallery;
  previewLocale: "ar" | "en";
  siteLive: boolean;
}) {
  const { themes, tabs, initial } = gallery;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(initial.category);
  const [niche, setNiche] = useState<string | null>(initial.niche);
  const [selected, setSelected] = useState<Choice | null>(null);
  const [publishNow, setPublishNow] = useState(false);
  const [pending, startTransition] = useTransition();

  const categories = useMemo(() => [...new Set(themes.map((theme) => theme.category))].sort(), [themes]);
  const cards = useMemo(() => themeCards(themes, tabs, { category, niche, query }), [themes, tabs, category, niche, query]);
  const nicheTab = !query.trim() && category ? tabs[category] : undefined;
  const choice = selected ? (themes.find((theme) => theme.key === selected.key) ?? null) : null;
  const choiceNiche = choice ? themeNicheName(choice, selected!.edition) : null;

  // One loader per edition, so a card's live thumbnail shows the niche's look.
  const loaders = useMemo(() => new Map<string, (key: string) => Promise<TemplatePreviewView | null>>(), []);
  const loaderFor = useCallback(
    (edition: string | null) => {
      const id = edition ?? "";
      let load = loaders.get(id);
      if (!load) {
        load = (key: string) => loadThemePreview(storeId, key, edition);
        loaders.set(id, load);
      }
      return load;
    },
    [loaders, storeId],
  );
  const previewHref = (key: string, edition: string | null) => templatePreviewPageUrl(PREVIEW_ORIGIN, previewLocale, key, edition);

  const reset = () => {
    setSelected(null);
    setPublishNow(false);
  };

  const pickCategory = (value: string | null) => {
    setCategory(value);
    // Back on the store's own industry, its own niche again; another tab starts at all of its niches.
    setNiche(value !== null && value === initial.category ? initial.niche : null);
  };

  const apply = () =>
    startTransition(async () => {
      if (!choice || !selected) return;
      const result = await applyStoreThemeAction({
        storeId,
        templateKey: choice.key,
        editionId: selected.edition,
        reason: ADMIN_DEFAULT_REASON,
        publishNow: siteLive && publishNow,
      });
      if (result.success) {
        toast.success(result.message);
        setOpen(false);
        reset();
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });

  return (
    // The live theme cards (SitePreview) read the builder strings.
    <BuilderIntl>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Paintbrush className="mr-1 h-3.5 w-3.5" />
        Change theme
      </Button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) reset();
        }}
      >
        <DialogContent className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-5xl">
          <DialogHeader className="border-b p-5 pb-0">
            <DialogTitle>Choose a theme for {storeName}</DialogTitle>
            <DialogDescription>
              The theme replaces the pages, design, header and footer in the store&apos;s drafts. Pick a niche to apply the
              theme with that niche&apos;s look. You can undo the change afterwards.
            </DialogDescription>
            <div className="flex flex-col gap-3 pt-3 sm:flex-row sm:items-center">
              <div className="relative sm:w-64 sm:shrink-0">
                <Search className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search themes"
                  aria-label="Search themes"
                  className="ps-8"
                />
              </div>
              <div className="flex min-w-0 gap-1.5 overflow-x-auto pb-1 sm:pb-0" role="group" aria-label="Filter by industry">
                {[null, ...categories].map((value) => (
                  <Button
                    key={value ?? "all"}
                    type="button"
                    size="sm"
                    variant={category === value ? "secondary" : "ghost"}
                    aria-pressed={category === value}
                    className="h-7 shrink-0 rounded-full px-3 text-xs"
                    onClick={() => pickCategory(value)}
                  >
                    {value === null ? `All (${themes.length})` : categoryLabel(value)}
                    {value !== null && tabs[value] && <span className="ms-1 size-1.5 rounded-full bg-primary/70" aria-hidden />}
                  </Button>
                ))}
              </div>
            </div>
            {/* The industry's niches, a second row under its tab; a search looks everywhere, so it hides them. */}
            <div className="min-h-3">
              {nicheTab && category && (
                <div
                  className="-mx-5 mt-3 flex gap-1.5 overflow-x-auto border-t bg-muted/50 px-5 py-2"
                  role="group"
                  aria-label={`${categoryLabel(category)} niches`}
                >
                  {[{ id: null as string | null, label: `All ${categoryLabel(category).toLowerCase()}` }, ...nicheTab.niches.map((option) => ({ id: option.id as string | null, label: option.name.en }))].map(
                    (option) => (
                      <button
                        key={option.id ?? "all"}
                        type="button"
                        aria-pressed={niche === option.id}
                        onClick={() => setNiche(option.id)}
                        className={cn(
                          "h-7 shrink-0 rounded-md border px-2.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          niche === option.id
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-transparent text-muted-foreground hover:border-border hover:bg-background hover:text-foreground",
                        )}
                      >
                        {option.label}
                        {option.id !== null && option.id === initial.niche && category === initial.category && (
                          <span className={cn("ms-1.5", niche === option.id ? "opacity-80" : "text-primary")}>(this store)</span>
                        )}
                      </button>
                    ),
                  )}
                </div>
              )}
            </div>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            {cards.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No theme matches. Clear the search or pick another industry.</p>
            ) : (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {cards.map(({ theme, edition }) => {
                  const isCurrent = theme.key === currentKey;
                  const isSelected = selected?.key === theme.key && selected.edition === edition;
                  const nicheName = themeNicheName(theme, edition);
                  // Its home page screenshot, served by tallaby.com, when it shows this card's edition (owner, 2026-11-12).
                  const shot = previewShot(theme.preview, previewLocale, edition);
                  return (
                    <li
                      key={`${theme.key}:${edition ?? ""}`}
                      className={cn(
                        "tpl-shot-trigger overflow-hidden rounded-lg border bg-background transition-shadow",
                        isSelected ? "border-primary ring-2 ring-primary" : "hover:border-foreground/30",
                        theme.isPremium && "opacity-50",
                      )}
                    >
                      <button
                        type="button"
                        disabled={theme.isPremium}
                        aria-pressed={isSelected}
                        onClick={() => setSelected(isSelected ? null : { key: theme.key, edition })}
                        className="group block w-full text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:cursor-not-allowed"
                      >
                        <div className="relative w-full bg-muted">
                          {shot ? (
                            <TemplateShot src={templatePreviewUrl(shot.src, PREVIEW_ORIGIN)} width={shot.width} height={shot.height} sizes="(min-width: 1024px) 240px, 45vw" className="border-b bg-muted" />
                          ) : theme.thumbnailUrl && !edition ? (
                            <div className="relative aspect-[3/4] w-full border-b">
                              <RemoteImage src={theme.thumbnailUrl} alt="" fill sizes="(min-width: 1024px) 240px, 45vw" className="object-cover object-top" />
                            </div>
                          ) : (
                            // The theme's home page, live with its demo store (the niche's, on a niche card).
                            <TemplateLiveThumbnail
                              templateKey={theme.key}
                              load={loaderFor(edition)}
                              fontClassName={storeFontVariables}
                              fallback={<PaletteBand palette={theme.palette} className="absolute inset-0" />}
                              tall
                            />
                          )}
                          {nicheName && (
                            <span className="absolute start-2 bottom-2 max-w-[calc(100%-1rem)] truncate rounded bg-background/95 px-1.5 py-0.5 text-[11px] font-medium shadow-sm ring-1 ring-border">
                              {nicheName}
                            </span>
                          )}
                          {isSelected && (
                            <span className="absolute end-2 top-2 grid size-6 place-items-center rounded-full bg-primary text-primary-foreground shadow">
                              <Check className="size-3.5" aria-hidden />
                            </span>
                          )}
                        </div>
                        <PaletteBand palette={theme.palette} className="h-1.5" />
                        <div className="space-y-1 px-2.5 pt-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-sm font-medium">{theme.name}</span>
                            {isCurrent ? (
                              <Badge variant="outline" className="shrink-0 font-normal">
                                Current
                              </Badge>
                            ) : theme.isPremium ? (
                              <Badge variant="secondary" className="shrink-0 font-normal">
                                Premium
                              </Badge>
                            ) : null}
                          </div>
                        </div>
                      </button>
                      <div className="flex items-center justify-between gap-2 px-2.5 pb-2.5 pt-1">
                        <p className="truncate text-xs text-muted-foreground">
                          {categoryLabel(theme.category)}, {theme.pageCount} {theme.pageCount === 1 ? "page" : "pages"}
                        </p>
                        <a
                          href={previewHref(theme.key, edition)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex shrink-0 items-center gap-1 rounded text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          aria-label={`Preview ${theme.name}${nicheName ? ` (${nicheName})` : ""} in a new tab`}
                        >
                          Preview
                          <ExternalLink className="size-3" aria-hidden />
                        </a>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="space-y-3 border-t bg-muted/40 p-5">
            {choice && selected ? (
              <>
                <div className="flex items-center gap-3">
                  <PaletteBand palette={choice.palette} className="h-8 w-16 shrink-0 rounded border" />
                  <p className="text-sm">
                    Apply <span className="font-medium">{choice.name}</span>
                    {choiceNiche && selected.edition ? (
                      <>
                        {" "}
                        with the <span className="font-medium">{choiceNiche}</span> look (its demo pages and photos)
                      </>
                    ) : null}
                    {choice.key === currentKey ? ". The store's edits to this theme are replaced." : "."}{" "}
                    <a
                      href={previewHref(choice.key, selected.edition)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline"
                    >
                      Open the preview
                      <ExternalLink className="size-3" aria-hidden />
                    </a>
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  {siteLive ? (
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox checked={publishNow} onCheckedChange={(value) => setPublishNow(value === true)} />
                      Publish now, so visitors see the new theme
                    </label>
                  ) : (
                    <p className="text-xs text-muted-foreground">The website is offline, so the theme stays in the drafts until it is published.</p>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
                      Cancel
                    </Button>
                    <Button onClick={apply} disabled={pending}>
                      {pending ? "Applying…" : publishNow && siteLive ? "Apply and publish" : "Apply theme"}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Pick a theme to apply it.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </BuilderIntl>
  );
}
