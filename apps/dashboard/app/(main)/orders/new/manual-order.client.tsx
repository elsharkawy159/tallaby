"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { moneyNumberOptions, moneyParams, type MoneyUnit } from "@/lib/i18n/format";
import { LoaderCircle, MessageCircle, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { MANUAL_PAID_VIA, type ManualOrderTotals, type ManualPaidVia } from "@workspace/lib/orders/manual";
import { EGYPT_GOVERNORATES, getGovernorateLabel } from "@workspace/lib/shipping";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
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
};

const FIELD = "h-10 w-full rounded-[10px] border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

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
  const format = useFormatter();
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

  const money = (piastres: number) => format.number(piastres / 100, moneyNumberOptions(unit));

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
              stock: variant ? variant.stock : product.stock,
              quantity: 1,
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
      <div className="mx-auto max-w-lg rounded-2xl border bg-card p-6 text-center">
        <h1 className="text-lg font-bold">{t("linkReadyTitle", { number: link.orderNumber })}</h1>
        <p className="mt-2 text-pretty text-sm text-muted-foreground">{t("linkReadyBody")}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Button asChild>
            <a href={whatsapp} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="size-4" aria-hidden />
              {t("sendWhatsapp")}
            </a>
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              void navigator.clipboard?.writeText(link.url);
              toast.success(t("linkCopied"));
            }}
          >
            {t("copyLink")}
          </Button>
          <Button variant="ghost" onClick={() => router.push("/orders")}>
            {t("backToOrders")}
          </Button>
        </div>
      </div>
    );
  }

  const canSubmit =
    lines.length > 0 && name.trim().length >= 2 && phone.trim() !== "" && state && city.trim() && addressLine1.trim().length >= 3;

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-5">
        <section className="rounded-2xl border bg-card p-4 sm:p-5">
          <h2 className="mb-3 font-semibold">{t("products")}</h2>
          <ProductSearch storeId={storeId} onPick={addProduct} />
          {lines.length > 0 && (
            <ul className="mt-3 divide-y">
              {lines.map((line) => (
                <li key={line.key} className="flex items-center gap-3 py-3">
                  {line.image ? (
                    <Image src={line.image} alt="" width={44} height={44} className="size-11 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <div className="size-11 shrink-0 rounded-lg bg-muted" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{line.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {line.variantTitle ? `${line.variantTitle} · ` : ""}
                      {money(Math.round(line.price * 100))}
                    </p>
                  </div>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={99}
                    aria-label={t("quantity")}
                    className="h-9 w-16 text-center"
                    value={line.quantity}
                    onChange={(event) => {
                      const quantity = Math.max(1, Math.min(99, Number(event.target.value) || 1));
                      setLines((current) => current.map((l) => (l.key === line.key ? { ...l, quantity } : l)));
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={t("removeProduct")}
                    onClick={() => setLines((current) => current.filter((l) => l.key !== line.key))}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-3 rounded-2xl border bg-card p-4 sm:p-5">
          <h2 className="font-semibold">{t("customer")}</h2>
          <CustomerSearch storeId={storeId} onPick={fillCustomer} />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor={`${ids}-name`}>{t("name")}</Label>
              <Input id={`${ids}-name`} value={name} maxLength={120} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={`${ids}-phone`}>{t("phone")}</Label>
              <Input id={`${ids}-phone`} dir="ltr" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={`${ids}-state`}>{t("governorate")}</Label>
              <select id={`${ids}-state`} className={FIELD} value={state} onChange={(e) => setState(e.target.value)}>
                <option value="" disabled>
                  {t("governoratePlaceholder")}
                </option>
                {EGYPT_GOVERNORATES.map((code) => (
                  <option key={code} value={code}>
                    {getGovernorateLabel(code, locale)}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={`${ids}-city`}>{t("city")}</Label>
              <Input id={`${ids}-city`} value={city} maxLength={120} onChange={(e) => setCity(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`${ids}-address`}>{t("address")}</Label>
            <Input id={`${ids}-address`} value={addressLine1} maxLength={300} onChange={(e) => setAddressLine1(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`${ids}-notes`}>{t("notes")}</Label>
            <Textarea id={`${ids}-notes`} rows={2} value={notes} maxLength={1000} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </section>
      </div>

      <aside className="h-fit space-y-4 rounded-2xl border bg-card p-4 sm:p-5 lg:sticky lg:top-20">
        <fieldset className="space-y-2">
          <legend className="mb-1.5 text-sm font-semibold">{t("payment")}</legend>
          {(["cod", "paid"] as const).map((value) => (
            <label
              key={value}
              className={cn(
                "flex cursor-pointer items-center gap-2.5 rounded-[10px] border p-3 text-sm focus-within:ring-2 focus-within:ring-ring",
                payment === value && "border-primary bg-primary/5",
              )}
            >
              <input type="radio" name={`${ids}-payment`} checked={payment === value} onChange={() => setPayment(value)} />
              {t(`paymentOptions.${value}`)}
            </label>
          ))}
          {payment === "paid" && (
            <div className="grid gap-1.5 pt-1">
              <Label htmlFor={`${ids}-via`}>{t("paidVia")}</Label>
              <select id={`${ids}-via`} className={FIELD} value={paidVia} onChange={(e) => setPaidVia(e.target.value as ManualPaidVia)}>
                {MANUAL_PAID_VIA.map((via) => (
                  <option key={via} value={via}>
                    {t(`paidViaOptions.${via}`)}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">{t("paidHint")}</p>
            </div>
          )}
        </fieldset>

        <div className="grid gap-1.5">
          <Label htmlFor={`${ids}-discount`}>{t("discount", moneyParams(locale, unit))}</Label>
          <Input id={`${ids}-discount`} inputMode="decimal" dir="ltr" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="0" />
          <p className="text-xs text-muted-foreground">{t("discountHint")}</p>
        </div>

        <dl className="space-y-1.5 border-t pt-3 text-sm">
          {totals ? (
            <>
              <Row label={t("goods")} value={money(totals.goodsPiastres)} />
              {totals.discountPiastres > 0 && <Row label={t("discountLine")} value={`−${money(totals.discountPiastres)}`} />}
              <Row label={t("shipping")} value={money(totals.shippingPiastres)} />
              <Row label={t("total")} value={money(totals.totalPiastres)} strong />
            </>
          ) : (
            <p className={cn("text-xs", previewError ? "text-destructive" : "text-muted-foreground")}>
              {previewError ?? t("totalsHint")}
            </p>
          )}
        </dl>

        <div className="grid gap-2">
          <Button type="button" disabled={!canSubmit || pending} onClick={() => submit(false)}>
            {pending && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
            {t("create")}
          </Button>
          {payment === "cod" && (
            <Button type="button" variant="outline" disabled={!canSubmit || pending} onClick={() => submit(true)}>
              {t("sendLink")}
            </Button>
          )}
          {payment === "cod" && <p className="text-xs text-muted-foreground">{t("sendLinkHint")}</p>}
        </div>
      </aside>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={cn("flex justify-between gap-3", strong && "border-t pt-1.5 font-bold")}>
      <dt className={strong ? undefined : "text-muted-foreground"}>{label}</dt>
      <dd className="tabular-nums" dir="ltr">
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
      <Search className="pointer-events-none absolute start-3 top-3 size-4 text-muted-foreground" aria-hidden />
      <Input
        className="ps-9"
        placeholder={t("searchProducts")}
        aria-label={t("searchProducts")}
        value={query}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onChange={(event) => setQuery(event.target.value)}
      />
      {open && (
        <ul className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border bg-popover p-1 shadow-lg">
          {options.length === 0 && <li className="p-3 text-sm text-muted-foreground">{t("noProducts")}</li>}
          {options.flatMap((product) =>
            (product.variants.length ? product.variants : [null]).map((variant) => {
              const stock = variant ? variant.stock : product.stock;
              const out = stock !== null && stock <= 0;
              return (
                <li key={`${product.id}:${variant?.id ?? ""}`}>
                  <button
                    type="button"
                    disabled={out}
                    className="flex w-full items-center justify-between gap-3 rounded-lg p-2 text-start text-sm hover:bg-muted disabled:opacity-50"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      onPick(product, variant ?? undefined);
                      setQuery("");
                      setOpen(false);
                    }}
                  >
                    <span className="min-w-0 truncate">
                      {product.title}
                      {variant?.title ? ` · ${variant.title}` : ""}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
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
      <Input placeholder={t("searchCustomers")} aria-label={t("searchCustomers")} value={query} onChange={(e) => setQuery(e.target.value)} />
      {shown.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border bg-popover p-1 shadow-lg">
          {shown.map((customer) => (
            <li key={customer.key}>
              <button
                type="button"
                className="flex w-full justify-between gap-3 rounded-lg p-2 text-start text-sm hover:bg-muted"
                onClick={() => {
                  onPick(customer);
                  setQuery("");
                  setOptions([]);
                }}
              >
                <span className="min-w-0 truncate">{customer.name}</span>
                <span dir="ltr" className="shrink-0 text-xs text-muted-foreground">
                  {customer.phone}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
