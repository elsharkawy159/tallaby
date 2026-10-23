"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Paintbrush, Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { ADMIN_DEFAULT_REASON } from "@workspace/lib/admin";
import { cn } from "@workspace/ui/lib/utils";
import { RemoteImage } from "@/components/media/remote-image";
import { applyStoreThemeAction } from "./website-actions.server";

/** One offered theme (a `templates` row), as the store page shows it. */
export type ThemeOption = {
  key: string;
  name: string;
  category: string;
  thumbnailUrl: string | null;
  isPremium: boolean;
  isDefault: boolean;
  palette: string[];
  pageCount: number;
};

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

const categoryLabel = (category: string) => (category ? category.charAt(0).toUpperCase() + category.slice(1).replace(/[-_]/g, " ") : "Other");

/**
 * "Change theme": every offered theme with its colours, then, on a live site, whether to publish at once.
 */
export function ChangeThemeButton({
  storeId,
  storeName,
  currentKey,
  themes,
  siteLive,
}: {
  storeId: string;
  storeName: string;
  currentKey: string;
  themes: ThemeOption[];
  siteLive: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [publishNow, setPublishNow] = useState(false);
  const [pending, startTransition] = useTransition();

  const categories = useMemo(() => [...new Set(themes.map((theme) => theme.category))].sort(), [themes]);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return themes.filter(
      (theme) => (!category || theme.category === category) && (!q || theme.name.toLowerCase().includes(q) || theme.key.includes(q)),
    );
  }, [themes, query, category]);
  const choice = themes.find((theme) => theme.key === selected) ?? null;

  const reset = () => {
    setSelected(null);
    setPublishNow(false);
  };

  const apply = () =>
    startTransition(async () => {
      if (!choice) return;
      const result = await applyStoreThemeAction({ storeId, templateKey: choice.key, reason: ADMIN_DEFAULT_REASON, publishNow: siteLive && publishNow });
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
    <>
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
          <DialogHeader className="border-b p-5">
            <DialogTitle>Choose a theme for {storeName}</DialogTitle>
            <DialogDescription>
              The theme replaces the pages, design, header and footer in the store&apos;s drafts. You can undo the change afterwards.
            </DialogDescription>
            <div className="flex flex-col gap-3 pt-3 sm:flex-row sm:items-center">
              <div className="relative sm:w-64">
                <Search className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search themes"
                  aria-label="Search themes"
                  className="ps-8"
                />
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0" role="group" aria-label="Filter by category">
                {[null, ...categories].map((value) => (
                  <Button
                    key={value ?? "all"}
                    type="button"
                    size="sm"
                    variant={category === value ? "secondary" : "ghost"}
                    aria-pressed={category === value}
                    className="h-7 shrink-0 rounded-full px-3 text-xs"
                    onClick={() => setCategory(value)}
                  >
                    {value === null ? `All (${themes.length})` : categoryLabel(value)}
                  </Button>
                ))}
              </div>
            </div>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            {visible.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No theme matches. Clear the search or pick another category.</p>
            ) : (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {visible.map((theme) => {
                  const isCurrent = theme.key === currentKey;
                  const isSelected = theme.key === selected;
                  return (
                    <li key={theme.key}>
                      <button
                        type="button"
                        disabled={theme.isPremium}
                        aria-pressed={isSelected}
                        onClick={() => setSelected(isSelected ? null : theme.key)}
                        className={cn(
                          "group w-full overflow-hidden rounded-lg border bg-background text-start transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                          isSelected ? "border-primary ring-2 ring-primary" : "hover:border-foreground/30",
                        )}
                      >
                        <div className="relative aspect-[4/3] w-full border-b bg-muted">
                          {theme.thumbnailUrl ? (
                            <RemoteImage src={theme.thumbnailUrl} alt="" fill sizes="(min-width: 1024px) 240px, 45vw" className="object-cover object-top" />
                          ) : (
                            <PaletteBand palette={theme.palette} className="absolute inset-0" />
                          )}
                          {isSelected && (
                            <span className="absolute end-2 top-2 grid size-6 place-items-center rounded-full bg-primary text-primary-foreground shadow">
                              <Check className="size-3.5" aria-hidden />
                            </span>
                          )}
                        </div>
                        {theme.thumbnailUrl && <PaletteBand palette={theme.palette} className="h-1.5" />}
                        <div className="space-y-1 p-2.5">
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
                          <p className="text-xs text-muted-foreground">
                            {categoryLabel(theme.category)}, {theme.pageCount} {theme.pageCount === 1 ? "page" : "pages"}
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="space-y-3 border-t bg-muted/40 p-5">
            {choice ? (
              <>
                <div className="flex items-center gap-3">
                  <PaletteBand palette={choice.palette} className="h-8 w-16 shrink-0 rounded border" />
                  <p className="text-sm">
                    Apply <span className="font-medium">{choice.name}</span>
                    {choice.key === currentKey ? " again. The store's edits to this theme are replaced." : "."}
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
    </>
  );
}
