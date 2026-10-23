"use client";

import { useTranslations } from "next-intl";
import { LoaderCircle, Package } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import type { EditorProduct } from "../editor.dto";

const DEMO = "demo";

/**
 * Strip above the product page canvas (template product page spec §5.5):
 * which product the page is drawn with. Lists the products this store shows
 * (the editor's catalog); with none, the built-in demo product is drawn and
 * the strip says so. Only changes the canvas, never the drafts.
 */
export function PreviewProductPicker({
  products,
  current,
  busy,
  onPick,
  uiLocale,
}: {
  products: readonly EditorProduct[];
  /** The drawn real product, or null while the demo product is drawn. */
  current: { id: string; title: string } | null;
  busy: boolean;
  /** Null: the host has no preview products (the demo product is always drawn). */
  onPick: ((productId: string) => void) | null;
  uiLocale: string;
}) {
  const t = useTranslations("storeEditor.canvas.previewProduct");
  const name = (p: EditorProduct) => (uiLocale === "en" ? p.title.en || p.title.ar : p.title.ar || p.title.en) || p.slug;
  const value = current?.id ?? DEMO;
  // The drawn product may be past the editor's list (it holds the newest products only).
  const missing = current && !products.some((p) => p.id === current.id) ? current : null;

  return (
    <div className="flex h-10 shrink-0 items-center gap-2 border-b bg-muted/40 px-3 text-xs">
      <Package className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <span className="shrink-0 font-medium">{t("label")}</span>
      {onPick && products.length > 0 ? (
        <Select value={value} disabled={busy} onValueChange={(next) => next !== DEMO && onPick(next)}>
          <SelectTrigger size="sm" className="h-7 max-w-64 min-w-0 flex-1 text-xs" aria-label={t("label")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {value === DEMO && <SelectItem value={DEMO}>{t("demo")}</SelectItem>}
            {missing && <SelectItem value={missing.id}>{missing.title}</SelectItem>}
            {products.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                {name(product)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <span className="truncate text-muted-foreground">{onPick ? t("noProducts") : t("demo")}</span>
      )}
      {busy && <LoaderCircle className="size-3.5 shrink-0 animate-spin text-muted-foreground" aria-hidden />}
      <span className="ms-auto hidden truncate text-muted-foreground lg:inline">{t("hint")}</span>
    </div>
  );
}
