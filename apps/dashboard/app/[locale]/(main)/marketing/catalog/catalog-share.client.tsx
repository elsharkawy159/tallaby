"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, Copy, ExternalLink, FileDown, Link2, Loader2, MessageCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Field, IconButton, Note, OptionCard, OptionCards, SellerButton, TextAction, TextInput, fieldClass } from "@/components/seller-ui";
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
    <div className="flex flex-col gap-4">
      <Field label={t("store")}>
        {stores === null ? (
          <div className="h-[46px] animate-pulse rounded-[14px] bg-(--s-fill)" />
        ) : stores.length === 0 ? (
          <p className="text-[13px] text-(--s-muted)">{t("noStores")}</p>
        ) : (
          <Select value={storeId} onValueChange={(value) => { setStoreId(value); setCreated(null); }}>
            <SelectTrigger className={fieldClass} aria-label={t("store")}>
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
        {store && !store.published && <Note tone="amber">{t("offlineWarning")}</Note>}
        {store?.selectedCatalog && <p className="text-xs text-(--s-faint)">{t("selectedCatalogNote")}</p>}
      </Field>

      {picking ? (
        <Note>{t("pickedProducts", { count: productIds!.length })}</Note>
      ) : (
        <Field label={t("show")}>
          <OptionCards>
            {(["category", "newest"] as const).map((value) => (
              <OptionCard
                key={value}
                name="catalog-mode"
                value={value}
                title={t(value === "category" ? "modeCategory" : "modeNewest", { max: 48 })}
                checked={mode === value}
                onChange={() => setMode(value)}
                disabled={value === "category" && categories !== null && categories.length === 0}
              />
            ))}
          </OptionCards>
          {mode === "category" && (
            categories === null ? (
              <div className="h-[46px] animate-pulse rounded-[14px] bg-(--s-fill)" />
            ) : (
              <Select value={categoryKey} onValueChange={setCategoryKey}>
                <SelectTrigger className={fieldClass} aria-label={t("pickCategory")}>
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
        </Field>
      )}

      <Field label={t("titleLabel")} htmlFor="catalog-title">
        <TextInput id="catalog-title" value={title} maxLength={80} placeholder={t("titlePlaceholder")} onChange={(e) => setTitle(e.target.value)} />
      </Field>

      <SellerButton type="button" className="w-full" disabled={!canCreate || pending} onClick={create}>
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Link2 aria-hidden />}
        {t("create")}
      </SellerButton>
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
    <div className="flex flex-col gap-4">
      {created.count > 0 && <p className="text-[13.5px] font-semibold text-(--s-text)">{t("ready", { count: created.count })}</p>}
      {created.skipped > 0 && <Note tone="amber">{t("skipped", { count: created.skipped, max: created.max })}</Note>}
      {!created.published && <Note tone="amber">{t("offlineWarning")}</Note>}

      <div className="flex items-center gap-2">
        <TextInput readOnly dir="ltr" value={created.url} onFocus={(e) => e.currentTarget.select()} className="min-w-0 flex-1 font-montserrat text-xs" />
        <IconButton aria-label={t("copy")} onClick={() => copy(created.url)}>
          {copied === created.url ? <Check aria-hidden /> : <Copy aria-hidden />}
        </IconButton>
      </div>

      <div className="flex flex-wrap gap-2 [&>*]:flex-[1_1_auto]">
        <SellerButton asChild variant="whatsapp">
          <a href={catalogWhatsAppHref(message, created.url)} target="_blank" rel="noopener noreferrer">
            <MessageCircle aria-hidden />
            {t("whatsapp")}
          </a>
        </SellerButton>
        <SellerButton asChild variant="outline">
          <a href={created.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink aria-hidden />
            {t("open")}
          </a>
        </SellerButton>
        <SellerButton asChild variant="outline">
          <a href={created.printUrl} target="_blank" rel="noopener noreferrer">
            <FileDown aria-hidden />
            {t("pdf")}
          </a>
        </SellerButton>
      </div>

      {created.altUrl && created.altLocale && (
        <TextAction type="button" onClick={() => copy(created.altUrl!)} className="self-start">
          {t(created.altLocale === "en" ? "copyEnglish" : "copyArabic")}
        </TextAction>
      )}

      <p className="text-xs text-(--s-faint)">{t("liveNote")}</p>
      <SellerButton type="button" variant="mini" size="sm" onClick={onBack} className="self-start">
        {t("another")}
      </SellerButton>
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
