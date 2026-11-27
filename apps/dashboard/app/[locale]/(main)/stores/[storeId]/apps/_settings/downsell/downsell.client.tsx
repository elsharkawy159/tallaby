"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowLeftRight, LoaderCircle, Plus, Search, Tag as TagIcon, Ticket, Trash2 } from "lucide-react";

import { DOWNSELL_LIMIT } from "@workspace/lib/downsell";
import type { StoreDownsellList } from "@workspace/lib/downsell/server";
import { searchCouponProducts, type CouponProductOption } from "@/actions/coupons";
import {
  EmptyState,
  Field,
  IconButton,
  InputGroup,
  Modal,
  NativeSelect,
  Note,
  Row,
  Rows,
  SectionCard,
  Segmented,
  SellerButton,
  SellerCard,
  StatusBadge,
  Tag,
  Toggle,
} from "@/components/seller-ui";
import { cn } from "@/lib/utils";
import { removeDownsell, saveDownsell, setDownsellAppInstalled } from "./downsell.server";
import type { DownsellCouponOption } from "./downsell.dto";

const SEARCH_DEBOUNCE_MS = 250;

/**
 * Store › Apps › Downsell (ROADMAP.md F-116). The app's on/off, then one offer
 * per product: a cheaper product of this store, or one of its coupons. The
 * store website's checkout shows it once when a shopper tries to leave.
 */
export function DownsellApp({
  storeId,
  installed,
  readOnly,
  list,
  coupons,
}: {
  storeId: string;
  installed: boolean;
  readOnly: boolean;
  list: StoreDownsellList;
  coupons: DownsellCouponOption[];
}) {
  const t = useTranslations("downsellApp");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const rows = list.available ? list.rows : [];

  const toggleApp = (next: boolean) =>
    startTransition(async () => {
      const result = await setDownsellAppInstalled(storeId, next);
      if (!result.success) {
        toast.error(t(`errors.${result.error}`));
        return;
      }
      toast.success(next ? t("install.installed") : t("install.removed"));
      router.refresh();
    });

  const remove = (productId: string) =>
    startTransition(async () => {
      const result = await removeDownsell(storeId, productId);
      if (!result.success) {
        toast.error(t(`errors.${result.error}`));
        return;
      }
      toast.success(t("offers.removed"));
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-5">
      <SellerCard className="flex flex-wrap items-center gap-4 px-6 py-5 max-[720px]:px-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <b className="text-[15px] text-(--s-ink)">{t("install.title")}</b>
            {installed ? <StatusBadge tone="success">{t("install.on")}</StatusBadge> : <Tag>{t("install.off")}</Tag>}
          </div>
          <p className="mt-1 text-pretty text-[13px] text-(--s-subtle)">{installed ? t("install.onBody") : t("install.offBody")}</p>
        </div>
        <Toggle
          checked={installed}
          disabled={pending || readOnly || !list.available}
          onCheckedChange={toggleApp}
          label={<span className="sr-only">{t("install.title")}</span>}
        />
        {pending && <LoaderCircle className="size-4 animate-spin text-(--s-subtle)" aria-hidden />}
      </SellerCard>

      {readOnly && <Note tone="amber">{t("readOnly")}</Note>}

      {!list.available ? (
        <Note tone="amber">{t("unavailable")}</Note>
      ) : (
        <SectionCard
          icon={ArrowLeftRight}
          title={t("offers.title")}
          description={t("offers.description")}
          action={
            !readOnly && (
              <SellerButton size="sm" variant="solid" disabled={rows.length >= DOWNSELL_LIMIT} onClick={() => setAdding(true)}>
                <Plus aria-hidden />
                {t("offers.add")}
              </SellerButton>
            )
          }
        >
          {rows.length === 0 ? (
            <EmptyState icon={ArrowLeftRight} title={t("offers.emptyTitle")} description={t("offers.emptyBody")} />
          ) : (
            <Rows>
              {rows.map((row) => (
                <Row
                  key={row.productId}
                  start={row.offer.kind === "product" ? <TagIcon className="size-4 shrink-0 text-(--s-primary)" aria-hidden /> : <Ticket className="size-4 shrink-0 text-(--s-primary)" aria-hidden />}
                  title={<bdi className="truncate">{row.productTitle || "—"}</bdi>}
                  description={
                    row.offer.kind === "product" ? (
                      <>
                        {t("offers.cheaperLine")} <bdi>{row.offer.title || "—"}</bdi>
                        {!row.offer.active && <> · {t("offers.notShown")}</>}
                      </>
                    ) : (
                      <>
                        {t("offers.couponLine")} <bdi dir="ltr" className="font-mono">{row.offer.code}</bdi>
                        {!row.offer.usable && <> · {t("offers.couponEnded")}</>}
                      </>
                    )
                  }
                  end={
                    !readOnly && (
                      <IconButton aria-label={t("offers.remove")} disabled={pending} onClick={() => remove(row.productId)}>
                        <Trash2 aria-hidden />
                      </IconButton>
                    )
                  }
                />
              ))}
            </Rows>
          )}
          {!installed && rows.length > 0 && <Note>{t("offers.installHint")}</Note>}
          <Note>{t("offers.howItShows")}</Note>
        </SectionCard>
      )}

      {adding && (
        <AddOfferModal
          storeId={storeId}
          coupons={coupons}
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

/** Searches this store's products (the coupon picker's search: only this store's). */
function useProductSearch(storeId: string, query: string) {
  const [found, setFound] = useState<CouponProductOption[] | null>(null);
  const search = query.trim();
  useEffect(() => {
    let live = true;
    const timer = setTimeout(
      () => {
        searchCouponProducts({ storeId, query: search })
          .then((rows) => live && setFound(rows))
          .catch(() => live && setFound([]));
      },
      search ? SEARCH_DEBOUNCE_MS : 0,
    );
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [search, storeId]);
  return found;
}

function ProductPicker({
  storeId,
  label,
  note,
  chosen,
  onChoose,
  activeOnly = false,
  excludeId,
}: {
  storeId: string;
  label: string;
  note?: string;
  chosen: CouponProductOption | null;
  onChoose: (product: CouponProductOption | null) => void;
  activeOnly?: boolean;
  excludeId?: string;
}) {
  const t = useTranslations("downsellApp.add");
  const [query, setQuery] = useState("");
  const found = useProductSearch(storeId, query);
  const options = (found ?? []).filter((product) => (!activeOnly || product.isActive) && product.id !== excludeId);

  if (chosen) {
    return (
      <Field label={label} note={note}>
        <div className="flex items-center gap-2 rounded-2xl border border-(--s-line) px-3.5 py-2.5 text-[13px]">
          <bdi className="min-w-0 flex-1 truncate font-semibold text-(--s-ink)">{chosen.title || "—"}</bdi>
          <SellerButton size="sm" variant="outline" onClick={() => onChoose(null)}>
            {t("change")}
          </SellerButton>
        </div>
      </Field>
    );
  }

  return (
    <Field label={label} note={note}>
      <InputGroup start={<Search aria-hidden />} value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("search")} aria-label={t("search")} />
      <ul className="flex max-h-56 flex-col divide-y divide-(--s-line-soft) overflow-y-auto rounded-2xl border border-(--s-line)">
        {found === null ? (
          <li className="grid place-items-center p-4">
            <LoaderCircle className="size-4 animate-spin text-(--s-subtle)" aria-hidden />
          </li>
        ) : options.length === 0 ? (
          <li className="p-4 text-center text-xs text-(--s-subtle)">{t("noProducts")}</li>
        ) : (
          options.map((product) => (
            <li key={product.id}>
              <button
                type="button"
                onClick={() => onChoose(product)}
                className="flex w-full cursor-pointer items-center gap-3 px-3.5 py-2.5 text-start text-[13px] hover:bg-(--s-fill)"
              >
                <bdi className="min-w-0 flex-1 truncate text-(--s-ink)">{product.title || "—"}</bdi>
                {!product.isActive && <small className="text-xs text-(--s-faint)">{t("draft")}</small>}
              </button>
            </li>
          ))
        )}
      </ul>
    </Field>
  );
}

function AddOfferModal({
  storeId,
  coupons,
  onClose,
  onSaved,
}: {
  storeId: string;
  coupons: DownsellCouponOption[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations("downsellApp");
  const [main, setMain] = useState<CouponProductOption | null>(null);
  const [kind, setKind] = useState<"product" | "coupon">("product");
  const [cheaper, setCheaper] = useState<CouponProductOption | null>(null);
  const [couponId, setCouponId] = useState("");
  const [saving, startSave] = useTransition();
  const ready = Boolean(main && (kind === "product" ? cheaper : couponId));

  const save = () => {
    if (!main) return;
    startSave(async () => {
      const offer = kind === "product" ? { kind, productId: cheaper?.id } : { kind, couponId };
      const result = await saveDownsell(storeId, { productId: main.id, offer });
      if (!result.success) {
        toast.error(t(`errors.${result.error}`));
        return;
      }
      toast.success(t("add.saved"));
      onSaved();
    });
  };

  return (
    <Modal
      open
      onOpenChange={(next) => !next && onClose()}
      title={t("add.title")}
      description={t("add.description")}
      width={600}
      footer={
        <>
          <SellerButton variant="outline" onClick={onClose}>
            {t("add.cancel")}
          </SellerButton>
          <SellerButton variant="solid" onClick={save} disabled={saving || !ready}>
            {saving && <LoaderCircle className="animate-spin" aria-hidden />}
            {t("add.save")}
          </SellerButton>
        </>
      }
    >
      <div className="flex max-h-[60dvh] flex-col gap-5 overflow-y-auto pe-1">
        <ProductPicker storeId={storeId} label={t("add.mainLabel")} note={t("add.mainNote")} chosen={main} onChoose={setMain} />

        <Field label={t("add.offerLabel")}>
          <Segmented
            value={kind}
            onChange={setKind}
            label={t("add.offerLabel")}
            options={[
              { value: "product", label: t("add.kindProduct") },
              { value: "coupon", label: t("add.kindCoupon") },
            ]}
          />
        </Field>

        {kind === "product" ? (
          <ProductPicker
            storeId={storeId}
            label={t("add.cheaperLabel")}
            note={t("add.cheaperNote")}
            chosen={cheaper}
            onChoose={setCheaper}
            activeOnly
            excludeId={main?.id}
          />
        ) : coupons.length === 0 ? (
          <Note tone="amber">{t("add.noCoupons")}</Note>
        ) : (
          <Field label={t("add.couponLabel")} htmlFor="downsell-coupon" note={t("add.couponNote")}>
            <NativeSelect id="downsell-coupon" value={couponId} onChange={(e) => setCouponId(e.target.value)} className={cn(!couponId && "text-(--s-faint)")}>
              <option value="">{t("add.couponPlaceholder")}</option>
              {coupons.map((coupon) => (
                <option key={coupon.id} value={coupon.id}>
                  {coupon.code} · {coupon.name}
                </option>
              ))}
            </NativeSelect>
          </Field>
        )}
      </div>
    </Modal>
  );
}
