"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, Copy, ExternalLink, FileDown, Link2, Loader2, MessageCircle } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { cn } from "@workspace/ui/lib/utils";
import {
  createCatalogLinkAction,
  listCatalogShareCategoriesAction,
  listCatalogShareStoresAction,
} from "./catalog-share.server";
import type { CatalogLinkResult, CatalogShareCategory, CatalogShareStore } from "./catalog-share.dto";

// wa.me link, as catalogWhatsAppHref in @workspace/lib/catalog-share (that module uses node:crypto, server only).
const catalogWhatsAppHref = (message: string, url: string) =>
  `https://wa.me/?text=${encodeURIComponent(`${message.trim()}\n${url}`.trim())}`;

type Created = Extract<CatalogLinkResult, { success: true }>;
type Mode = "category" | "newest";

/**
 * Easy Catalog (ROADMAP.md F-11c): pick a store (and, without a product
 * selection, a category or the newest products), get a link for WhatsApp and
 * a printable PDF page. Used by the products list's selection bar (dialog)
 * and by Marketing › Share catalog (page).
 */
export function CatalogShareForm({ productIds }: { productIds?: string[] }) {
  const t = useTranslations("catalogShare");
  const [stores, setStores] = useState<CatalogShareStore[] | null>(null);
  const [storeId, setStoreId] = useState("");
  const [categories, setCategories] = useState<CatalogShareCategory[] | null>(null);
  const [mode, setMode] = useState<Mode>("category");
  const [categoryKey, setCategoryKey] = useState("");
  const [title, setTitle] = useState("");
  const [created, setCreated] = useState<Created | null>(null);
  const [pending, startTransition] = useTransition();
  const picking = Boolean(productIds?.length);

  useEffect(() => {
    let live = true;
    void listCatalogShareStoresAction().then((list) => {
      if (!live) return;
      setStores(list);
      setStoreId((current) => current || list[0]?.id || "");
    });
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    if (picking || !storeId) return;
    let live = true;
    setCategories(null);
    setCategoryKey("");
    void listCatalogShareCategoriesAction(storeId).then((list) => {
      if (!live) return;
      setCategories(list);
      if (!list.length) setMode("newest");
    });
    return () => {
      live = false;
    };
  }, [storeId, picking]);

  const store = stores?.find((s) => s.id === storeId) ?? null;
  const canCreate = Boolean(storeId) && (picking || mode === "newest" || Boolean(categoryKey));

  const create = () =>
    startTransition(async () => {
      const source = picking
        ? { kind: "products" as const, productIds: productIds ?? [] }
        : mode === "category"
          ? { kind: "category" as const, categoryKey }
          : { kind: "newest" as const };
      const result = await createCatalogLinkAction({ storeId, title: title.trim() || undefined, source });
      if (!result.success) {
        toast.error(t(`errors.${result.error}`));
        return;
      }
      setCreated(result);
    });

  if (created) return <CatalogLinkView created={created} title={title} onBack={() => setCreated(null)} />;

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>{t("store")}</Label>
        {stores === null ? (
          <div className="bg-muted h-9 animate-pulse rounded-md" />
        ) : stores.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("noStores")}</p>
        ) : (
          <Select value={storeId} onValueChange={(value) => { setStoreId(value); setCreated(null); }}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {stores.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                  {!s.published && ` · ${t("offlineBadge")}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {store && !store.published && <p className="text-xs text-amber-700 dark:text-amber-400">{t("offlineWarning")}</p>}
        {store?.selectedCatalog && <p className="text-muted-foreground text-xs">{t("selectedCatalogNote")}</p>}
      </div>

      {picking ? (
        <p className="bg-muted/60 rounded-lg px-3 py-2 text-sm">{t("pickedProducts", { count: productIds!.length })}</p>
      ) : (
        <div className="space-y-2">
          <Label>{t("show")}</Label>
          <div className="grid grid-cols-2 gap-2">
            {(["category", "newest"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                disabled={value === "category" && categories !== null && categories.length === 0}
                className={cn(
                  "rounded-lg border px-3 py-2 text-start text-sm transition-colors disabled:opacity-50",
                  mode === value ? "border-primary bg-primary-soft text-primary-ink" : "hover:bg-muted",
                )}
              >
                {t(value === "category" ? "modeCategory" : "modeNewest", { max: 48 })}
              </button>
            ))}
          </div>
          {mode === "category" && (
            categories === null ? (
              <div className="bg-muted h-9 animate-pulse rounded-md" />
            ) : (
              <Select value={categoryKey} onValueChange={setCategoryKey}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("pickCategory")} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.key} value={c.key}>
                      {c.name} ({c.productCount})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )
          )}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="catalog-title">{t("titleLabel")}</Label>
        <Input id="catalog-title" value={title} maxLength={80} placeholder={t("titlePlaceholder")} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <Button type="button" className="w-full" disabled={!canCreate || pending} onClick={create}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Link2 className="size-4" />}
        {t("create")}
      </Button>
    </div>
  );
}

function CatalogLinkView({ created, title, onBack }: { created: Created; title: string; onBack: () => void }) {
  const t = useTranslations("catalogShare");
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      toast.success(t("copied"));
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error(t("copyFailed"));
    }
  };

  const message = title.trim() || t("whatsappMessage");

  return (
    <div className="space-y-4">
      {created.count > 0 && <p className="text-sm">{t("ready", { count: created.count })}</p>}
      {created.skipped > 0 && <p className="text-xs text-amber-700 dark:text-amber-400">{t("skipped", { count: created.skipped, max: created.max })}</p>}
      {!created.published && <p className="text-xs text-amber-700 dark:text-amber-400">{t("offlineWarning")}</p>}

      <div className="flex gap-2">
        <Input readOnly dir="ltr" value={created.url} onFocus={(e) => e.currentTarget.select()} className="font-mono text-xs" />
        <Button type="button" variant="outline" size="icon" aria-label={t("copy")} onClick={() => copy(created.url)}>
          {copied === created.url ? <Check className="size-4" /> : <Copy className="size-4" />}
        </Button>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <Button asChild className="bg-[#25D366] text-white hover:bg-[#1fb857]">
          <a href={catalogWhatsAppHref(message, created.url)} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="size-4" />
            {t("whatsapp")}
          </a>
        </Button>
        <Button asChild variant="outline">
          <a href={created.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="size-4" />
            {t("open")}
          </a>
        </Button>
        <Button asChild variant="outline">
          <a href={created.printUrl} target="_blank" rel="noopener noreferrer">
            <FileDown className="size-4" />
            {t("pdf")}
          </a>
        </Button>
      </div>

      {created.altUrl && created.altLocale && (
        <button type="button" onClick={() => copy(created.altUrl!)} className="text-muted-foreground text-xs underline underline-offset-4">
          {t(created.altLocale === "en" ? "copyEnglish" : "copyArabic")}
        </button>
      )}

      <p className="text-muted-foreground text-xs">{t("liveNote")}</p>
      <Button type="button" variant="ghost" size="sm" onClick={onBack}>
        {t("another")}
      </Button>
    </div>
  );
}

/** The products list's "Share catalog" (selection bar). */
export function ShareCatalogDialog({
  open,
  onOpenChange,
  productIds,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productIds: string[];
}) {
  const t = useTranslations("catalogShare");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        {/* Remount per opening so a new selection starts a new link. */}
        {open && <CatalogShareForm productIds={productIds} />}
      </DialogContent>
    </Dialog>
  );
}
