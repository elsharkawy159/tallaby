"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { formatPriceMarked } from "@workspace/lib";
import {
  CUSTOMER_UPLOAD_BUCKET,
  CUSTOMER_UPLOAD_MAX_BYTES,
  CUSTOMER_UPLOAD_TYPES,
  localizedText,
  type CustomerField,
} from "@workspace/lib/products/customer-fields";
import { createCustomerUploadUrl } from "@/actions/customer-upload";
import { PriceText } from "@/components/storefront/price-text";
import { useCurrencyLabel } from "@/lib/currency-label.client";
import { cn } from "@/lib/utils";
import { createClient } from "@/supabase/client";
import { useProductPage, type CustomerInputsState } from "./product-page-provider.client";

/**
 * "Customer requirements" (F-91) on the product page, right above the add
 * buttons: the seller's fields (text, photos, a choice) with their extra price.
 * Values live in `ProductPageProvider`, so the live price and every add button
 * (the in-page box and the phone dock) read the same ones; the server checks
 * them again on add. Drawn in the store's tokens (`--sf-*`, with fallbacks for
 * the plain layout). Customer text is only ever rendered as text.
 */
export function CustomerFieldsForm({ className }: { className?: string }) {
  const { product, customer } = useProductPage();
  const t = useTranslations("customerFields");
  if (!customer.fields.length) return null;
  return (
    <fieldset className={cn("grid min-w-0 gap-5 border-0 p-0", className)}>
      <legend className="mb-3 text-[15px] font-bold text-(--sf-ink,inherit)">{t("title")}</legend>
      {customer.fields.map((field) => (
        <FieldBlock key={field.id} field={field} productId={product.id} customer={customer} />
      ))}
    </fieldset>
  );
}

function ExtraPrice({ amount }: { amount: number | null | undefined }) {
  const locale = useLocale();
  const currencyLabel = useCurrencyLabel();
  if (!amount || amount <= 0) return null;
  return (
    <span className="shrink-0 rounded-full bg-[color-mix(in_srgb,var(--sf-brand,#111)_10%,transparent)] px-2 py-0.5 text-xs font-bold text-(--sf-brand,inherit)">
      <PriceText locale={locale}>{`+${formatPriceMarked(amount, locale, currencyLabel)}`}</PriceText>
    </span>
  );
}

function FieldBlock({ field, productId, customer }: { field: CustomerField; productId: string; customer: CustomerInputsState }) {
  const locale = useLocale();
  const t = useTranslations("customerFields");
  const error = customer.errors[field.id];
  const labelId = `customer-field-${field.id}-label`;
  const help = localizedText(field.help, locale);
  const errorText = error
    ? t(`errors.${error}`, {
        max: field.type === "text" ? field.maxLength : field.type === "image" ? field.maxFiles : 0,
      })
    : null;

  return (
    <div id={`customer-field-${field.id}`} className="grid min-w-0 gap-2" role="group" aria-labelledby={labelId}>
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span id={labelId} className="text-sm font-semibold text-(--sf-ink,inherit)">
          {localizedText(field.label, locale)}
          {field.required ? (
            <span aria-hidden className="ms-0.5 text-(--destructive,#dc2626)">
              *
            </span>
          ) : (
            <span className="ms-1.5 text-xs font-normal text-(--sf-muted,#6b7280)">({t("optional")})</span>
          )}
          {field.required && <span className="sr-only">{t("required")}</span>}
        </span>
        {field.type !== "choice" && <ExtraPrice amount={field.extraPrice} />}
      </div>
      {help && <p className="-mt-1 text-xs leading-relaxed text-(--sf-muted,#6b7280)">{help}</p>}

      {field.type === "text" && <TextInput field={field} customer={customer} invalid={Boolean(error)} labelId={labelId} />}
      {field.type === "choice" && <ChoiceInput field={field} customer={customer} invalid={Boolean(error)} labelId={labelId} />}
      {field.type === "image" && <ImageInput field={field} productId={productId} customer={customer} invalid={Boolean(error)} />}

      {errorText && (
        <p role="alert" className="text-xs font-medium text-(--destructive,#dc2626)">
          {errorText}
        </p>
      )}
    </div>
  );
}

const BOX =
  "w-full rounded-(--sf-radius,12px) border-[1.5px] bg-(--sf-paper,#fff) px-3.5 py-3 text-base text-(--sf-ink,inherit) outline-none transition-colors placeholder:text-(--sf-muted,#9ca3af) focus-visible:border-(--sf-ink,#111) motion-reduce:transition-none md:text-sm";

function TextInput({
  field,
  customer,
  invalid,
  labelId,
}: {
  field: Extract<CustomerField, { type: "text" }>;
  customer: CustomerInputsState;
  invalid: boolean;
  labelId: string;
}) {
  const t = useTranslations("customerFields");
  const value = customer.values[field.id]?.text ?? "";
  return (
    <div className="grid gap-1">
      <textarea
        aria-labelledby={labelId}
        aria-invalid={invalid || undefined}
        aria-required={field.required || undefined}
        value={value}
        maxLength={field.maxLength}
        rows={field.maxLength > 120 ? 3 : 2}
        placeholder={t("textPlaceholder")}
        onChange={(event) => customer.setValue(field.id, { text: event.target.value })}
        className={cn(BOX, "min-h-[72px] resize-y", invalid ? "border-(--destructive,#dc2626)" : "border-(--sf-line,#e5e7eb)")}
      />
      <span className="text-end text-[11px] tabular-nums text-(--sf-muted,#6b7280)" aria-live="polite">
        {t("charCount", { count: value.length, max: field.maxLength })}
      </span>
    </div>
  );
}

function ChoiceInput({
  field,
  customer,
  invalid,
  labelId,
}: {
  field: Extract<CustomerField, { type: "choice" }>;
  customer: CustomerInputsState;
  invalid: boolean;
  labelId: string;
}) {
  const locale = useLocale();
  const selected = customer.values[field.id]?.optionId;
  return (
    <div role="radiogroup" aria-labelledby={labelId} aria-required={field.required || undefined} className="flex flex-wrap gap-2">
      {field.options.map((option) => {
        const on = option.id === selected;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => customer.setValue(field.id, on && !field.required ? {} : { optionId: option.id })}
            className={cn(
              "inline-flex min-h-11 items-center gap-2 rounded-full border-[1.5px] px-4 text-sm font-semibold transition-colors motion-reduce:transition-none",
              on
                ? "border-(--sf-ink,#111) bg-(--sf-ink,#111) text-(--sf-paper,#fff)"
                : cn("bg-(--sf-paper,#fff) text-(--sf-ink,inherit)", invalid ? "border-(--destructive,#dc2626)" : "border-(--sf-line,#e5e7eb)"),
            )}
          >
            <span>{localizedText(option.label, locale)}</span>
            {option.extraPrice ? (
              <span className={cn("text-xs font-bold", on ? "opacity-80" : "text-(--sf-brand,inherit)")}>
                <ExtraPriceText amount={option.extraPrice} />
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function ExtraPriceText({ amount }: { amount: number }) {
  const locale = useLocale();
  const currencyLabel = useCurrencyLabel();
  return <PriceText locale={locale}>{`+${formatPriceMarked(amount, locale, currencyLabel)}`}</PriceText>;
}

const ACCEPT = Object.keys(CUSTOMER_UPLOAD_TYPES).join(",");

function ImageInput({
  field,
  productId,
  customer,
  invalid,
}: {
  field: Extract<CustomerField, { type: "image" }>;
  productId: string;
  customer: CustomerInputsState;
  invalid: boolean;
}) {
  const t = useTranslations("customerFields");
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  // Local previews of what this visitor picked (the files themselves are private).
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const files = customer.values[field.id]?.files ?? [];
  const room = field.maxFiles - files.length;

  const made = useRef<string[]>([]);
  useEffect(() => () => made.current.forEach((url) => URL.revokeObjectURL(url)), []);

  const upload = async (picked: File[]) => {
    const chosen = picked.slice(0, Math.max(0, room));
    if (!chosen.length) return;
    for (const file of chosen) {
      if (!(file.type in CUSTOMER_UPLOAD_TYPES) || file.size > CUSTOMER_UPLOAD_MAX_BYTES) {
        toast.error(t("errors.invalidFile"));
        return;
      }
    }
    setBusy(true);
    customer.setUploading(field.id, true);
    const added: string[] = [];
    const urls: Record<string, string> = {};
    try {
      const supabase = createClient();
      for (const file of chosen) {
        const signed = await createCustomerUploadUrl({ productId, mime: file.type, size: file.size });
        if (!signed.success) {
          toast.error(t(signed.error === "rateLimited" ? "errors.rateLimited" : signed.error === "invalidFile" ? "errors.invalidFile" : "errors.uploadFailed"));
          break;
        }
        const { error } = await supabase.storage.from(CUSTOMER_UPLOAD_BUCKET).uploadToSignedUrl(signed.path, signed.token, file, { contentType: file.type });
        if (error) {
          toast.error(t("errors.uploadFailed"));
          break;
        }
        added.push(signed.path);
        urls[signed.path] = URL.createObjectURL(file);
        made.current.push(urls[signed.path]!);
      }
    } catch {
      toast.error(t("errors.uploadFailed"));
    } finally {
      if (added.length) {
        setPreviews((current) => ({ ...current, ...urls }));
        customer.setValue(field.id, { files: [...files, ...added] });
      }
      customer.setUploading(field.id, false);
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  const remove = (path: string) => customer.setValue(field.id, { files: files.filter((candidate) => candidate !== path) });

  return (
    <div className="grid gap-2">
      {files.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {files.map((path, index) => (
            <li key={path} className="relative size-[72px] overflow-hidden rounded-(--sf-radius,12px) border border-(--sf-line,#e5e7eb) bg-(--sf-paper,#fff)">
              {previews[path] ? (
                // eslint-disable-next-line @next/next/no-img-element -- a local blob preview, not a hosted image
                <img src={previews[path]} alt={t("photoAlt", { number: index + 1 })} className="size-full object-cover" />
              ) : (
                <span className="grid size-full place-items-center text-xs text-(--sf-muted,#6b7280)">{index + 1}</span>
              )}
              <button
                type="button"
                onClick={() => remove(path)}
                aria-label={t("removePhoto", { number: index + 1 })}
                className="absolute end-1 top-1 grid size-6 place-items-center rounded-full bg-black/60 text-white"
              >
                <X className="size-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
      {room > 0 && (
        <label
          className={cn(
            "flex min-h-[64px] cursor-pointer items-center gap-3 rounded-(--sf-radius,12px) border-[1.5px] border-dashed bg-(--sf-paper,#fff) px-4 py-3 text-sm text-(--sf-ink,inherit) transition-colors hover:border-(--sf-ink,#111) motion-reduce:transition-none",
            invalid ? "border-(--destructive,#dc2626)" : "border-(--sf-line,#d1d5db)",
            busy && "pointer-events-none opacity-70",
          )}
        >
          {busy ? <Loader2 className="size-5 shrink-0 animate-spin" aria-hidden /> : <ImagePlus className="size-5 shrink-0" aria-hidden />}
          <span className="grid min-w-0">
            <span className="font-semibold">{busy ? t("uploading") : files.length ? t("addAnotherPhoto") : t("uploadPhoto")}</span>
            <span className="text-xs text-(--sf-muted,#6b7280)">
              {t("photoHint")}
              {field.maxFiles > 1 && ` · ${t("photosCount", { count: files.length, max: field.maxFiles })}`}
            </span>
          </span>
          <input
            ref={input}
            type="file"
            accept={ACCEPT}
            multiple={room > 1}
            className="sr-only"
            disabled={busy}
            onChange={(event) => void upload(Array.from(event.target.files ?? []))}
          />
        </label>
      )}
    </div>
  );
}
