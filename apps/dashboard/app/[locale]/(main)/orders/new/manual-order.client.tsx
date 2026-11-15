"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { formatMoney, moneyParams, type MoneyUnit } from "@/lib/i18n/format";
import { LoaderCircle, MessageCircle, Package, Search, Trash2, User } from "lucide-react";
import { toast } from "sonner";
import { MANUAL_PAID_VIA, type ManualOrderTotals, type ManualPaidVia } from "@workspace/lib/orders/manual";
import { minOrderShortfalls, normalUnitsInCart } from "@workspace/lib/orders/min-order-quantity";
import { useWholeNumberInput } from "@/components/form/whole-number.client";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { EGYPT_GOVERNORATES, getGovernorateLabel } from "@workspace/lib/shipping";
import { Field, FieldRow, IconButton, NativeSelect, OptionCard, OptionCards, SectionCard, SellerButton, SellerCard, TextArea, TextInput } from "@/components/seller-ui";
import { cn } from "@/lib/utils";
import {
  createManualOrderAction,
  previewManualOrderAction,
  searchManualOrderCustomers,
  searchManualOrderProducts,
  type ManualCustomerOption,
  type ManualProductOption,
} from "./manual-order.server";

type Line = {
  key: string;
  productId: string;
  variantId?: string;
  title: string;
  variantTitle?: string;
  image: string | null;
  price: number;
  stock: number | null;
  quantity: number;
  minOrderQuantity: number;
};

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return debounced;
}

export function ManualOrderForm({ money: unit, storeId, storeName }: { money?: MoneyUnit; storeId: string; storeName: string }) {
  const t = useTranslations("manualOrder");
  const locale = useLocale();
  const router = useRouter();
  const ids = useId();

  const [lines, setLines] = useState<Line[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [discount, setDiscount] = useState("");
  const [payment, setPayment] = useState<"cod" | "paid">("cod");
  const [paidVia, setPaidVia] = useState<ManualPaidVia>("instapay");
  const [notes, setNotes] = useState("");
  const [totals, setTotals] = useState<ManualOrderTotals | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [link, setLink] = useState<{ url: string; phone: string; orderNumber: string } | null>(null);
  const [pending, startTransition] = useTransition();
  // One id per attempt, so a double click can't make two orders.
  const requestId = useRef(crypto.randomUUID());

  const money = (piastres: number) => formatMoney(piastres / 100, locale, unit);

  // The seller's minimum (0151): a warning, and their explicit yes for exactly these
  // numbers lets the order through. The server asks for the same yes.
  const shortfalls = minOrderShortfalls(lines);
  const shortfallKey = JSON.stringify(shortfalls);
  const [allowedKey, setAllowedKey] = useState<string | null>(null);
  const belowMinimumAllowed = shortfalls.length > 0 && allowedKey === shortfallKey;

  const buildInput = (sendLink: boolean) => ({
    requestId: requestId.current,
    lines: lines.map(({ productId, variantId, quantity }) => ({ productId, ...(variantId ? { variantId } : {}), quantity })),
    customer: { name, phone },
    address: { state, city, addressLine1 },
    discountEgp: Number(discount.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))) || 0,
    payment: sendLink ? ("cod" as const) : payment,
    ...(!sendLink && payment === "paid" ? { paidVia } : {}),
    notes: notes.trim() || undefined,
    sendLink,
    allowBelowMinimum: belowMinimumAllowed,
  });

  // The totals come from the server, from the same shipping rules the order uses.
  const previewKey = JSON.stringify([lines.map((l) => [l.key, l.quantity]), state, city, addressLine1, discount, payment]);
  const debouncedKey = useDebounced(previewKey, 400);
  useEffect(() => {
    if (lines.length === 0 || !state || !city.trim()) {
      setTotals(null);
      setPreviewError(null);
      return;
    }
    let stale = false;
    previewManualOrderAction(storeId, {
      ...buildInput(false),
      // The customer may not be typed yet; the preview doesn't use them.
      customer: { name: name.trim().length >= 2 ? name : "--", phone: "01000000000" },
      address: { state, city, addressLine1: addressLine1.trim().length >= 3 ? addressLine1 : "---" },
    }).then((result) => {
      if (stale) return;
      if (result.success) {
        setTotals(result.totals);
        setPreviewError(null);
      } else {
        setTotals(null);
        setPreviewError(result.error === "invalid" ? null : t(`errors.${result.error}`));
      }
    });
    return () => {
      stale = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debouncedKey carries the inputs.
  }, [debouncedKey]);

  const addProduct = (product: ManualProductOption, variant?: ManualProductOption["variants"][number]) => {
    const key = `${product.id}:${variant?.id ?? ""}`;
    const stock = variant ? variant.stock : product.stock;
    // A new line starts at what the minimum still needs, as far as the stock goes.
    const firstQuantity = (current: Line[]) =>
      Math.max(1, Math.min(99, stock ?? 99, product.minOrderQuantity - normalUnitsInCart(product.id, current)));
    setLines((current) =>
      current.some((line) => line.key === key)
        ? current.map((line) => (line.key === key ? { ...line, quantity: Math.min(99, line.quantity + 1) } : line))
        : [
            ...current,
            {
              key,
              productId: product.id,
              variantId: variant?.id,
              title: product.title,
              variantTitle: variant?.title,
              image: product.image,
              price: variant?.price ?? product.price,
              stock,
              quantity: firstQuantity(current),
              minOrderQuantity: product.minOrderQuantity,
            },
          ],
    );
  };

  const fillCustomer = (customer: ManualCustomerOption) => {
    setName(customer.name);
    setPhone(customer.phone);
    if (customer.governorate) setState(customer.governorate);
    if (customer.city) setCity(customer.city);
  };

  const submit = (sendLink: boolean) =>
    startTransition(async () => {
      const result = await createManualOrderAction(storeId, buildInput(sendLink));
      if (!result.success) {
        // The next try is a new attempt: this cart can't be placed again.
        requestId.current = crypto.randomUUID();
        toast.error(t(`errors.${result.error}`));
        return;
      }
      toast.success(t("created", { number: result.orderNumber }));
      if (result.linkUrl) {
        setLink({ url: result.linkUrl, phone: result.phone, orderNumber: result.orderNumber });
        return;
      }
      router.push(`/orders?order=${result.orderId}`);
    });

  if (link) {
    const message = t("linkMessage", { store: storeName, number: link.orderNumber, link: link.url });
    const whatsapp = `https://wa.me/2${link.phone}?text=${encodeURIComponent(message)}`;
    return (
      <SellerCard className="mx-auto w-full max-w-lg p-6 text-center">
        <h2 className="text-lg font-bold text-(--s-ink)">{t("linkReadyTitle", { number: link.orderNumber })}</h2>
        <p className="mt-2 text-pretty text-[13.5px] text-(--s-muted)">{t("linkReadyBody")}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <SellerButton asChild variant="whatsapp">
            <a href={whatsapp} target="_blank" rel="noopener noreferrer">
              <MessageCircle aria-hidden />
              {t("sendWhatsapp")}
            </a>
          </SellerButton>
          <SellerButton
            variant="outline"
            onClick={() => {
              void navigator.clipboard?.writeText(link.url);
              toast.success(t("linkCopied"));
            }}
          >
            {t("copyLink")}
          </SellerButton>
          <SellerButton variant="mini" onClick={() => router.push("/orders")}>
            {t("backToOrders")}
          </SellerButton>
        </div>
      </SellerCard>
    );
  }

  const canSubmit =
    (shortfalls.length === 0 || belowMinimumAllowed) && lines.length > 0 && name.trim().length >= 2 && phone.trim() !== "" && state && city.trim() && addressLine1.trim().length >= 3;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_340px] items-start gap-3.5 max-[1020px]:grid-cols-1">
      <div className="flex min-w-0 flex-col gap-3.5">
        <SectionCard icon={Package} title={t("products")}>
          <ProductSearch storeId={storeId} onPick={addProduct} />
          {lines.length > 0 && (
            <ul className="divide-y divide-(--s-line-soft)">
              {lines.map((line) => (
                <li key={line.key} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  {line.image ? (
                    <Image src={line.image} alt="" width={44} height={44} className="size-11 shrink-0 rounded-xl object-cover" />
                  ) : (
                    <div className="size-11 shrink-0 rounded-xl bg-(--s-fill)" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 break-words text-[13.5px] font-semibold text-(--s-text)">{line.title}</p>
                    <p className="break-words text-xs text-(--s-subtle)">
                      {line.variantTitle ? `${line.variantTitle}: ` : ""}
                      <bdi>{money(Math.round(line.price * 100))}</bdi>
                    </p>
                  </div>
                  <QuantityInput
                    label={t("quantity")}
                    value={line.quantity}
                    onCommit={(quantity) => setLines((current) => current.map((l) => (l.key === line.key ? { ...l, quantity } : l)))}
                  />
                  <IconButton
                    aria-label={t("removeProduct")}
                    onClick={() => setLines((current) => current.filter((l) => l.key !== line.key))}
                  >
                    <Trash2 aria-hidden />
                  </IconButton>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard icon={User} title={t("customer")}>
          <CustomerSearch storeId={storeId} onPick={fillCustomer} />
          <FieldRow>
            <Field label={t("name")} htmlFor={`${ids}-name`}>
              <TextInput id={`${ids}-name`} value={name} maxLength={120} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label={t("phone")} htmlFor={`${ids}-phone`}>
              <TextInput id={`${ids}-phone`} dir="ltr" inputMode="tel" className="font-montserrat" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Field>
            <Field label={t("governorate")} htmlFor={`${ids}-state`}>
              <NativeSelect id={`${ids}-state`} value={state} onChange={(e) => setState(e.target.value)}>
                <option value="" disabled>
                  {t("governoratePlaceholder")}
                </option>
                {EGYPT_GOVERNORATES.map((code) => (
                  <option key={code} value={code}>
                    {getGovernorateLabel(code, locale)}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label={t("city")} htmlFor={`${ids}-city`}>
              <TextInput id={`${ids}-city`} value={city} maxLength={120} onChange={(e) => setCity(e.target.value)} />
            </Field>
          </FieldRow>
          <Field label={t("address")} htmlFor={`${ids}-address`}>
            <TextInput id={`${ids}-address`} value={addressLine1} maxLength={300} onChange={(e) => setAddressLine1(e.target.value)} />
          </Field>
          <Field label={t("notes")} htmlFor={`${ids}-notes`}>
            <TextArea id={`${ids}-notes`} rows={2} value={notes} maxLength={1000} onChange={(e) => setNotes(e.target.value)} />
          </Field>
        </SectionCard>
      </div>

      <SellerCard className="sticky top-[84px] flex flex-col gap-4 p-5 max-[1020px]:static max-[720px]:p-4">
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-[13.5px] font-bold text-(--s-text)">{t("payment")}</legend>
          <OptionCards className="grid-cols-1">
            {(["cod", "paid"] as const).map((value) => (
              <OptionCard
                key={value}
                name={`${ids}-payment`}
                title={t(`paymentOptions.${value}`)}
                checked={payment === value}
                onChange={() => setPayment(value)}
              />
            ))}
          </OptionCards>
          {payment === "paid" && (
            <Field label={t("paidVia")} htmlFor={`${ids}-via`} note={t("paidHint")} className="pt-1">
              <NativeSelect id={`${ids}-via`} value={paidVia} onChange={(e) => setPaidVia(e.target.value as ManualPaidVia)}>
                {MANUAL_PAID_VIA.map((via) => (
                  <option key={via} value={via}>
                    {t(`paidViaOptions.${via}`)}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          )}
        </fieldset>

        <Field label={t("discount", moneyParams(locale, unit))} htmlFor={`${ids}-discount`} note={t("discountHint")}>
          <TextInput id={`${ids}-discount`} inputMode="decimal" dir="ltr" className="font-montserrat" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="0" />
        </Field>

        <dl className="flex flex-col gap-1.5 border-t border-(--s-line-soft) pt-3 text-[13px]">
          {totals ? (
            <>
              <Row label={t("goods")} value={money(totals.goodsPiastres)} />
              {totals.discountPiastres > 0 && <Row label={t("discountLine")} value={`−${money(totals.discountPiastres)}`} />}
              <Row label={t("shipping")} value={money(totals.shippingPiastres)} />
              <Row label={t("total")} value={money(totals.totalPiastres)} strong />
            </>
          ) : (
            <p className={cn("text-xs", previewError ? "text-destructive" : "text-(--s-subtle)")}>
              {previewError ?? t("totalsHint")}
            </p>
          )}
        </dl>

        {shortfalls.length > 0 && (
          <div role="alert" className="flex flex-col gap-2 rounded-2xl bg-accent-soft p-3 text-[13px] text-accent-ink">
            <p className="font-bold">{t("belowMinimumTitle")}</p>
            <ul className="flex flex-col gap-1">
              {shortfalls.map((shortfall) => (
                <li key={shortfall.productId} className="break-words">
                  {t("belowMinimumLine", {
                    title: lines.find((line) => line.productId === shortfall.productId)?.title ?? "",
                    minimum: shortfall.minimum,
                    current: shortfall.current,
                  })}
                </li>
              ))}
            </ul>
            <label className="flex cursor-pointer items-start gap-2 font-semibold">
              <Checkbox className="mt-0.5" checked={belowMinimumAllowed} onCheckedChange={(checked) => setAllowedKey(checked === true ? shortfallKey : null)} />
              <span>{t("belowMinimumConfirm")}</span>
            </label>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <SellerButton disabled={!canSubmit || pending} onClick={() => submit(false)}>
            {pending && <LoaderCircle className="animate-spin" aria-hidden />}
            {t("create")}
          </SellerButton>
          {payment === "cod" && (
            <SellerButton variant="outline" disabled={!canSubmit || pending} onClick={() => submit(true)}>
              {t("sendLink")}
            </SellerButton>
          )}
          {payment === "cod" && <p className="text-pretty text-xs text-(--s-subtle)">{t("sendLinkHint")}</p>}
        </div>
      </SellerCard>
    </div>
  );
}

const QUANTITY_RANGE = { min: 1, max: 99, fallback: 1 };

/** 1–99, Arabic digits accepted; a cleared or half-typed field never sets 0 or NaN. */
function QuantityInput({ label, value, onCommit }: { label: string; value: number; onCommit: (quantity: number) => void }) {
  const input = useWholeNumberInput(value, onCommit, QUANTITY_RANGE);
  return <TextInput dir="ltr" aria-label={label} className="h-10 w-16 shrink-0 px-1 text-center font-montserrat" {...input} />;
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={cn("flex flex-wrap justify-between gap-x-3", strong && "border-t border-(--s-line-soft) pt-1.5")}>
      <dt className={strong ? "font-bold text-(--s-ink)" : "text-(--s-subtle)"}>{label}</dt>
      <dd className={cn("font-montserrat tabular-nums", strong ? "text-base font-bold text-(--s-ink)" : "font-semibold text-(--s-text)")} dir="ltr">
        {value}
      </dd>
    </div>
  );
}

function ProductSearch({
  storeId,
  onPick,
}: {
  storeId: string;
  onPick: (product: ManualProductOption, variant?: ManualProductOption["variants"][number]) => void;
}) {
  const t = useTranslations("manualOrder");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ManualProductOption[]>([]);
  const debounced = useDebounced(query, 250);

  useEffect(() => {
    if (!open) return;
    let stale = false;
    searchManualOrderProducts(storeId, debounced).then((rows) => {
      if (!stale) setOptions(rows);
    });
    return () => {
      stale = true;
    };
  }, [debounced, open, storeId]);

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute start-3.5 top-[15px] size-4 text-(--s-subtle)" aria-hidden />
      <TextInput
        className="ps-10"
        placeholder={t("searchProducts")}
        aria-label={t("searchProducts")}
        value={query}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onChange={(event) => setQuery(event.target.value)}
      />
      {open && (
        <ul className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-[18px] border border-(--s-field) bg-(--s-surface) p-1 shadow-(--s-shadow-menu)">
          {options.length === 0 && <li className="p-3 text-[13px] text-(--s-subtle)">{t("noProducts")}</li>}
          {options.flatMap((product) =>
            (product.variants.length ? product.variants : [null]).map((variant) => {
              const stock = variant ? variant.stock : product.stock;
              const out = stock !== null && stock <= 0;
              return (
                <li key={`${product.id}:${variant?.id ?? ""}`}>
                  <button
                    type="button"
                    disabled={out}
                    className="flex min-h-10 w-full cursor-pointer items-center justify-between gap-3 rounded-[11px] p-2 text-start text-[13px] text-(--s-text) hover:bg-(--s-hover) disabled:cursor-not-allowed disabled:opacity-50"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      onPick(product, variant ?? undefined);
                      setQuery("");
                      setOpen(false);
                    }}
                  >
                    <span className="min-w-0 break-words">
                      {product.title}
                      {variant?.title ? ` (${variant.title})` : ""}
                    </span>
                    <span className="shrink-0 text-xs text-(--s-subtle)">
                      {out ? t("outOfStock") : stock === null ? "" : t("inStock", { count: stock })}
                    </span>
                  </button>
                </li>
              );
            }),
          )}
        </ul>
      )}
    </div>
  );
}

function CustomerSearch({ storeId, onPick }: { storeId: string; onPick: (customer: ManualCustomerOption) => void }) {
  const t = useTranslations("manualOrder");
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<ManualCustomerOption[]>([]);
  const debounced = useDebounced(query, 300);
  const searching = debounced.trim().length >= 2;
  const shown = searching ? options : [];

  useEffect(() => {
    if (!searching) return;
    let stale = false;
    searchManualOrderCustomers(storeId, debounced).then((rows) => {
      if (!stale) setOptions(rows);
    });
    return () => {
      stale = true;
    };
  }, [debounced, searching, storeId]);

  return (
    <div className="relative">
      <TextInput placeholder={t("searchCustomers")} aria-label={t("searchCustomers")} value={query} onChange={(e) => setQuery(e.target.value)} />
      {shown.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-[18px] border border-(--s-field) bg-(--s-surface) p-1 shadow-(--s-shadow-menu)">
          {shown.map((customer) => (
            <li key={customer.key}>
              <button
                type="button"
                className="flex min-h-10 w-full cursor-pointer items-center justify-between gap-3 rounded-[11px] p-2 text-start text-[13px] text-(--s-text) hover:bg-(--s-hover)"
                onClick={() => {
                  onPick(customer);
                  setQuery("");
                  setOptions([]);
                }}
              >
                <span className="min-w-0 break-words">{customer.name}</span>
                <bdi dir="ltr" className="shrink-0 font-montserrat text-xs text-(--s-subtle) tabular-nums">
                  {customer.phone}
                </bdi>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
