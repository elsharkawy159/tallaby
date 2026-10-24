"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { LoaderCircle, TriangleAlert } from "lucide-react";

import { validateShopifyConnectInput } from "@workspace/lib/integrations";
import type {
  ShopifyImportItem,
  ShopifyPreview,
  StoreIntegrationSummary,
} from "@workspace/lib/integrations/server";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { SheetFooter } from "@workspace/ui/components/sheet";
import { BUTTON_CLASS, FIELD_CLASS } from "@/components/form/form-ui";
import { disconnectStoreApp } from "./apps.server";
import { DisconnectAppButton } from "./disconnect-button.client";
import type { AppCategoryOption } from "./apps.types";
import { connectShopifyStore, importShopifyBatch, previewShopifyStore } from "./shopify-import.server";

const SELECT_CLASS = `${FIELD_CLASS} w-full appearance-none bg-background`;

/**
 * Shopify import panel (PLAN.md §9.2, P7-07): connect, preview, map product
 * types to categories, then import in batches driven from here (one server
 * action per batch; closing the sheet stops after the current batch).
 */
export function ShopifyImportPanel({
  storeId,
  current,
  categories,
  readOnly,
  onSaved,
  onRemoved,
  onClose,
}: {
  storeId: string;
  current?: StoreIntegrationSummary;
  categories: AppCategoryOption[];
  readOnly: boolean;
  onSaved: (summary: StoreIntegrationSummary) => void;
  onRemoved: () => void;
  onClose: () => void;
}) {
  const t = useTranslations("storeApps");
  const router = useRouter();
  const [shopDomain, setShopDomain] = useState(current?.details.shopDomain ?? "");
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ShopifyPreview | null>(null);
  const [defaultCategory, setDefaultCategory] = useState("");
  const [typeMap, setTypeMap] = useState<Record<string, string>>({});
  const [running, setRunning] = useState(false);
  const [items, setItems] = useState<ShopifyImportItem[]>([]);
  const stopRef = useRef(false);
  const [isPending, startTransition] = useTransition();
  const connected = Boolean(current?.credentialsSaved);

  const connect = () => {
    const check = validateShopifyConnectInput({ shopDomain, accessToken: token });
    if (!check.success) {
      setError(t(`errors.${check.error === "invalid_token" ? "invalidToken" : "invalidShopDomain"}`));
      return;
    }
    startTransition(async () => {
      const result = await connectShopifyStore(storeId, { shopDomain, accessToken: token });
      if (!result.success) {
        setError(t(`errors.${result.error}`));
        return;
      }
      setToken("");
      onSaved(result.data);
      toast.success(t("saved"));
      router.refresh();
    });
  };

  const loadPreview = () => {
    startTransition(async () => {
      const result = await previewShopifyStore(storeId);
      if (!result.success) {
        toast.error(t(`errors.${result.error}`));
        return;
      }
      setPreview(result.data);
    });
  };

  const runImport = async () => {
    if (!defaultCategory) {
      setError(t("shopify.defaultCategoryRequired"));
      return;
    }
    setError(null);
    setItems([]);
    setRunning(true);
    stopRef.current = false;
    let cursor: string | null = null;
    try {
      do {
        const result = await importShopifyBatch(storeId, { cursor, categoryMap: typeMap, defaultCategoryId: defaultCategory });
        if (!result.success) {
          toast.error(t(`errors.${result.error}`));
          break;
        }
        setItems((list) => [...list, ...result.data.items]);
        cursor = result.data.nextCursor;
      } while (cursor && !stopRef.current);
      if (!cursor) toast.success(t("shopify.done"));
    } finally {
      setRunning(false);
      router.refresh();
    }
  };

  const remove = () => {
    startTransition(async () => {
      const result = await disconnectStoreApp(storeId, "shopify_import");
      if (!result.success) {
        toast.error(t(`errors.${result.error}`));
        return;
      }
      onRemoved();
      toast.success(t("removed"));
      router.refresh();
      onClose();
    });
  };

  const created = items.filter((i) => i.status === "created").length;
  const skipped = items.filter((i) => i.status === "skipped").length;
  const problems = items.filter((i) => i.status === "failed" || i.warnings?.length);

  return (
    <>
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4">
        {!connected ? (
          <>
            <p className="text-[13px] text-muted-foreground">{t("shopify.setupHint")}</p>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="shop-domain">{t("shopify.domainLabel")}</Label>
              <Input
                id="shop-domain"
                dir="ltr"
                autoComplete="off"
                spellCheck={false}
                className={FIELD_CLASS}
                value={shopDomain}
                placeholder="my-shop.myshopify.com"
                onChange={(event) => {
                  setShopDomain(event.target.value);
                  setError(null);
                }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="shop-token">{t("shopify.tokenLabel")}</Label>
              <Input
                id="shop-token"
                type="password"
                dir="ltr"
                autoComplete="off"
                spellCheck={false}
                className={FIELD_CLASS}
                value={token}
                placeholder="shpat_…"
                aria-describedby="shop-hint"
                onChange={(event) => {
                  setToken(event.target.value);
                  setError(null);
                }}
              />
              <p id="shop-hint" className="text-xs text-muted-foreground">
                {error ? <span className="text-destructive">{error}</span> : t("shopify.tokenHint")}
              </p>
            </div>
          </>
        ) : (
          <>
            <p className="text-[13px]">
              {t("shopify.connectedTo", { shop: current?.details.shopName ?? current?.details.shopDomain ?? "" })}
              <span dir="ltr" className="ms-1 font-mono text-xs text-faint">
                {current?.details.shopDomain}
              </span>
            </p>
            {typeof current?.details.importedProducts === "number" && current.details.importedProducts > 0 && (
              <p className="text-xs text-muted-foreground">
                {t("shopify.importedSoFar", { count: current.details.importedProducts })}
              </p>
            )}
            {current?.status === "error" && current.lastError && (
              <p className="rounded-xl bg-destructive/10 p-3 text-[13px] text-destructive" dir="auto">
                {t("lastError")}: {current.lastError}
              </p>
            )}

            {preview && (
              <div className="flex flex-col gap-3 rounded-xl border p-3">
                <p className="text-sm font-medium">{t("shopify.previewCount", { count: preview.count })}</p>
                {preview.currency !== "EGP" && (
                  <p className="flex gap-2 text-[13px] text-accent-ink">
                    <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                    {t("shopify.currencyWarning", { currency: preview.currency })}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">{t("shopify.draftNote")}</p>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="shop-default-cat">{t("shopify.defaultCategory")}</Label>
                  <select
                    id="shop-default-cat"
                    className={SELECT_CLASS}
                    value={defaultCategory}
                    disabled={running}
                    onChange={(event) => {
                      setDefaultCategory(event.target.value);
                      setError(null);
                    }}
                  >
                    <option value="">{t("shopify.chooseCategory")}</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                {preview.productTypes.filter(Boolean).length > 0 && (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-medium">{t("shopify.mapTypes")}</p>
                    {preview.productTypes.filter(Boolean).map((type) => (
                      <div key={type} className="grid grid-cols-2 items-center gap-2">
                        <span className="truncate text-[13px]" dir="auto">
                          {type}
                        </span>
                        <select
                          aria-label={type}
                          className={SELECT_CLASS}
                          value={typeMap[type] ?? ""}
                          disabled={running}
                          onChange={(event) => setTypeMap((map) => ({ ...map, [type]: event.target.value }))}
                        >
                          <option value="">{t("shopify.useDefault")}</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                    {preview.typesTruncated && <p className="text-xs text-faint">{t("shopify.typesTruncated")}</p>}
                  </div>
                )}
                {error && <p className="text-xs text-destructive">{error}</p>}
              </div>
            )}

            {items.length > 0 && (
              <div className="flex flex-col gap-2 rounded-xl border p-3" aria-live="polite">
                <p className="text-sm font-medium">
                  {t("shopify.progress", { created, skipped, total: preview?.count ?? items.length })}
                </p>
                {problems.length > 0 && (
                  <ul className="flex max-h-48 flex-col gap-1 overflow-y-auto text-xs">
                    {problems.map((item) => (
                      <li key={item.shopifyId} className={item.status === "failed" ? "text-destructive" : "text-muted-foreground"}>
                        <span dir="auto">{item.title}</span>:{" "}
                        {item.status === "failed"
                          ? t("shopify.failed")
                          : item.warnings?.map((w) => t(`shopify.warnings.${w}`)).join(" · ")}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </>
        )}
      </div>
      <SheetFooter className="flex-row flex-wrap gap-2">
        {!connected ? (
          <Button type="button" className={BUTTON_CLASS} disabled={isPending || readOnly} onClick={connect}>
            {isPending && <LoaderCircle className="animate-spin" aria-hidden />}
            {t("connect")}
          </Button>
        ) : !preview ? (
          <Button type="button" className={BUTTON_CLASS} disabled={isPending || readOnly} onClick={loadPreview}>
            {isPending && <LoaderCircle className="animate-spin" aria-hidden />}
            {t("shopify.preview")}
          </Button>
        ) : running ? (
          <Button type="button" variant="secondary" className={BUTTON_CLASS} onClick={() => (stopRef.current = true)}>
            <LoaderCircle className="animate-spin" aria-hidden />
            {t("shopify.stop")}
          </Button>
        ) : (
          <Button type="button" className={BUTTON_CLASS} disabled={readOnly || preview.count === 0} onClick={runImport}>
            {t("shopify.start")}
          </Button>
        )}
        {current && !running && (
          <DisconnectAppButton className={BUTTON_CLASS} pending={isPending} onConfirm={remove} />
        )}
      </SheetFooter>
    </>
  );
}
