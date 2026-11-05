"use client";

import { useEffect, useId, useState, useTransition } from "react";
import { Shuffle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet";
import { Spinner } from "@workspace/ui/components/spinner";
import {
  saveSellerCoupon,
  type SellerCouponRow,
} from "@/actions/coupons";
import { formatDate } from "@/lib/i18n/format";
import { CurrencyInput } from "@/components/form/currency-input";
import { MixedCurrencyNote, useAccountMoney } from "@/components/account-money.client";
import { Field, FieldRow, OptionCard, OptionCards, Segmented, SellerButton, TextInput, Toggle } from "@/components/seller-ui";
import { CouponProductPicker } from "./coupon-product-picker";
import { CouponTicketStub } from "./coupon-ticket";
import {
  channelsKey,
  couponToForm,
  emptyCouponForm,
  toDateInput,
  generateCode,
  POPUP_UNITS,
  normalizeCode,
  validateCouponForm,
  type CouponFormErrors,
  type CouponFormState,
} from "./coupons.lib";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The coupon being edited; null opens a blank form. */
  coupon: SellerCouponRow | null;
  /** Unused while "Where it works" is hidden (owner, 2026-10-28). */
  storeHost: string | null;
  onSaved: () => void;
};

export function CouponEditor({ open, onOpenChange, coupon, onSaved }: Props) {
  const { unit } = useAccountMoney();
  const t = useTranslations("coupons.form");
  const tErrors = useTranslations("coupons.errors");
  const tRow = useTranslations("coupons.row");
  const locale = useLocale();
  const ids = useId();
  const [form, setForm] = useState<CouponFormState>(emptyCouponForm);
  const [errors, setErrors] = useState<CouponFormErrors>({});
  const [isSaving, startSaving] = useTransition();

  // Each open starts from the coupon being edited (or a fresh form).
  useEffect(() => {
    if (!open) return;
    setForm(coupon ? couponToForm(coupon) : emptyCouponForm());
    setErrors({});
  }, [open, coupon]);

  const set = <K extends keyof CouponFormState>(key: K, value: CouponFormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    // Editing a field clears its message; the rest stay until the next save.
    const field = key === "startDate" || key === "endDate" ? "dates" : key;
    setErrors((e) => (field in e ? { ...e, [field]: undefined } : e));
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const { errors: found, input } = validateCouponForm(form);
    setErrors(found);
    if (!input) return;

    startSaving(async () => {
      const result = await saveSellerCoupon(input, coupon?.id);
      if (result.success) {
        toast.success(coupon ? t("updated") : t("created"));
        onSaved();
        onOpenChange(false);
        return;
      }
      if (result.error === "code_taken") {
        setErrors((e) => ({ ...e, code: "code_taken" }));
      } else if (result.error === "invalid_dates") {
        setErrors((e) => ({ ...e, dates: "invalid_dates" }));
      } else {
        toast.error(tErrors(result.error));
      }
    });
  };

  const fieldError = (key: keyof CouponFormErrors) => (errors[key] ? tErrors(errors[key]!) : undefined);

  const isPercent = form.discountType === "percentage";
  const previewValue = Number(form.discountValue.replace(",", ".")) || 0;
  const previewStatus =
    form.startDate && form.startDate > toDateInput(Date.now()) ? "scheduled" : "running";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={locale.startsWith("ar") ? "left" : "right"}
        className="flex w-full flex-col gap-0 p-0 sm:max-w-4xl"
      >
        <SheetHeader className="border-b border-(--s-line-soft) px-6 py-4 max-[600px]:px-4">
          <SheetTitle className="text-lg font-bold text-(--s-ink)">{coupon ? t("editTitle") : t("createTitle")}</SheetTitle>
          <SheetDescription className="text-[13px] text-(--s-muted)">{t("description")}</SheetDescription>
        </SheetHeader>

        <form
          id={`${ids}-form`}
          onSubmit={submit}
          noValidate
          className="grid flex-1 content-start gap-8 overflow-y-auto px-6 py-6 max-[600px]:px-4 lg:grid-cols-[minmax(0,1fr)_18rem]"
        >
          <div className="flex min-w-0 flex-col gap-7">
            {/* Code and name */}
            <FieldRow>
              <Field label={t("code")} htmlFor={`${ids}-code`} note={t("codeHint")} error={fieldError("code")}>
                <div className="flex gap-2">
                  <TextInput
                    id={`${ids}-code`}
                    value={form.code}
                    onChange={(e) => set("code", normalizeCode(e.target.value))}
                    maxLength={24}
                    autoComplete="off"
                    spellCheck={false}
                    dir="ltr"
                    aria-invalid={!!errors.code}
                    className="min-w-0 flex-1 font-montserrat uppercase tracking-wider"
                    placeholder="EID15"
                  />
                  <SellerButton type="button" variant="mini" className="h-[46px]" onClick={() => set("code", generateCode(form.name))}>
                    <Shuffle aria-hidden />
                    {t("generate")}
                  </SellerButton>
                </div>
              </Field>

              <Field label={t("name")} htmlFor={`${ids}-name`} note={t("nameHint")} error={fieldError("name")}>
                <TextInput
                  id={`${ids}-name`}
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  maxLength={80}
                  placeholder={t("namePlaceholder")}
                  aria-invalid={!!errors.name}
                />
              </Field>
            </FieldRow>

            {/* Discount */}
            <fieldset className="flex min-w-0 flex-col gap-3">
              <legend className="mb-3 text-[14.5px] font-bold text-(--s-ink)">{t("discount")}</legend>
              <Segmented
                label={t("discount")}
                value={form.discountType}
                onChange={(type) => set("discountType", type)}
                options={[
                  { value: "percentage", label: t("percentage") },
                  { value: "fixed_amount", label: t("fixed") },
                ]}
                className="self-start max-[600px]:w-full"
              />
              <FieldRow>
                <Field label={isPercent ? t("percentValue") : t("amountValue")} htmlFor={`${ids}-value`} error={fieldError("discountValue")}>
                  {isPercent ? (
                    <TextInput
                      id={`${ids}-value`}
                      type="number"
                      inputMode="decimal"
                      min={0}
                      max={90}
                      step="any"
                      dir="ltr"
                      value={form.discountValue}
                      onChange={(e) => set("discountValue", e.target.value)}
                      aria-invalid={!!errors.discountValue}
                    />
                  ) : (
                    <CurrencyInput
                      {...unit}
                      id={`${ids}-value`}
                      value={form.discountValue}
                      onChange={(v) => set("discountValue", v)}
                      invalid={!!errors.discountValue}
                    />
                  )}
                </Field>
                {isPercent && (
                  <Field label={t("maxDiscount")} htmlFor={`${ids}-max`} note={t("maxDiscountHint")}>
                    <CurrencyInput
                      {...unit}
                      id={`${ids}-max`}
                      value={form.maximumDiscount}
                      onChange={(v) => set("maximumDiscount", v)}
                    />
                  </Field>
                )}
              </FieldRow>
              <MixedCurrencyNote />
            </fieldset>

            {/* Products */}
            <fieldset className="flex min-w-0 flex-col gap-3">
              <legend className="mb-3 text-[14.5px] font-bold text-(--s-ink)">{t("products")}</legend>
              <OptionCards>
                <OptionCard
                  name={`${ids}-scope`}
                  value="all"
                  title={t("allProducts")}
                  description={t("allProductsHint")}
                  checked={form.productScope === "all"}
                  onChange={() => set("productScope", "all")}
                />
                <OptionCard
                  name={`${ids}-scope`}
                  value="selected"
                  title={t("selectedProducts")}
                  description={t("selectedProductsHint")}
                  checked={form.productScope === "selected"}
                  onChange={() => set("productScope", "selected")}
                />
              </OptionCards>
              {form.productScope === "selected" && (
                <CouponProductPicker
                  selectedIds={form.productIds}
                  onChange={(next) => set("productIds", next)}
                  invalid={!!errors.productIds}
                />
              )}
              {errors.productIds && (
                <p role="alert" className="text-xs font-semibold text-destructive">
                  {fieldError("productIds")}
                </p>
              )}
            </fieldset>

            {/* Conditions */}
            <fieldset className="flex min-w-0 flex-col gap-3">
              <legend className="mb-3 text-[14.5px] font-bold text-(--s-ink)">{t("limits")}</legend>
              <div className="grid grid-cols-3 gap-3 max-[720px]:grid-cols-1">
                <NumberField
                  id={`${ids}-min`}
                  label={t("minPurchase")}
                  value={form.minimumPurchase}
                  onChange={(v) => set("minimumPurchase", v)}
                  placeholder="0"
                  decimal
                />
                <NumberField
                  id={`${ids}-limit`}
                  label={t("usageLimit")}
                  value={form.usageLimit}
                  onChange={(v) => set("usageLimit", v)}
                  placeholder={t("unlimited")}
                />
                <NumberField
                  id={`${ids}-per-user`}
                  label={t("perUserLimit")}
                  value={form.perUserLimit}
                  onChange={(v) => set("perUserLimit", v)}
                  placeholder={t("unlimited")}
                />
              </div>
              <p className="text-pretty text-xs text-(--s-faint)">{t("minPurchaseHint")}</p>
            </fieldset>

            {/* Active dates */}
            <fieldset className="flex min-w-0 flex-col gap-3">
              <legend className="mb-3 text-[14.5px] font-bold text-(--s-ink)">{t("dates")}</legend>
              <FieldRow>
                <Field label={t("startsAt")} htmlFor={`${ids}-start`}>
                  <TextInput
                    id={`${ids}-start`}
                    type="date"
                    value={form.startDate}
                    onChange={(e) => set("startDate", e.target.value)}
                    aria-invalid={!!errors.dates}
                  />
                </Field>
                <Field label={t("expiresAt")} htmlFor={`${ids}-end`}>
                  <TextInput
                    id={`${ids}-end`}
                    type="date"
                    min={form.startDate || undefined}
                    value={form.endDate}
                    onChange={(e) => set("endDate", e.target.value)}
                    aria-invalid={!!errors.dates}
                  />
                </Field>
              </FieldRow>
              {errors.dates && (
                <p role="alert" className="text-xs font-semibold text-destructive">
                  {fieldError("dates")}
                </p>
              )}
            </fieldset>

            {/* Listed in the store's cart (0149, F-13c) */}
            <div className="flex items-start justify-between gap-3 rounded-2xl border-[1.5px] border-(--s-field) bg-(--s-surface) p-3.5">
              <div className="min-w-0">
                <label htmlFor={`${ids}-show-in-cart`} className="text-[13.5px] font-bold text-(--s-text)">
                  {t("showInCart")}
                </label>
                <p className="mt-1 text-pretty text-xs text-(--s-subtle)">{t("showInCartHint")}</p>
              </div>
              <Toggle id={`${ids}-show-in-cart`} checked={form.showInCart} onCheckedChange={(checked) => set("showInCart", checked)} />
            </div>

            {/* Store pop-up (0114) */}
            <fieldset className="flex min-w-0 flex-col gap-3">
              <legend className="mb-1 text-[14.5px] font-bold text-(--s-ink)">{t("popup")}</legend>
              <p className="text-xs text-(--s-subtle)">{t("popupHint")}</p>
              <OptionCards className="grid-cols-2 max-[600px]:grid-cols-1">
                {(["off", "enter", "exit", "random"] as const).map((trigger) => (
                  <OptionCard
                    key={trigger}
                    name={`${ids}-popup`}
                    value={trigger}
                    title={t(`popupTriggers.${trigger}`)}
                    description={t(`popupTriggers.${trigger}Hint`)}
                    checked={form.popupTrigger === trigger}
                    onChange={() => set("popupTrigger", trigger)}
                  />
                ))}
              </OptionCards>
              {form.popupTrigger !== "off" && (
                <Field label={t("popupDuration")} htmlFor={`${ids}-popup-duration`} note={t("popupDurationHint")} error={fieldError("popupDuration")}>
                  <div className="flex flex-wrap items-center gap-2">
                    <TextInput
                      id={`${ids}-popup-duration`}
                      type="number"
                      inputMode="numeric"
                      min={1}
                      step={1}
                      dir="ltr"
                      value={form.popupDuration}
                      onChange={(e) => set("popupDuration", e.target.value)}
                      aria-invalid={!!errors.popupDuration}
                      className="w-28"
                    />
                    <Segmented
                      label={t("popupDuration")}
                      value={form.popupUnit}
                      onChange={(value) => set("popupUnit", value)}
                      options={POPUP_UNITS.map((value) => ({ value, label: t(`popupUnits.${value}`) }))}
                    />
                  </div>
                </Field>
              )}
            </fieldset>
          </div>

          {/* Live preview: what the customer is handed. */}
          <aside className="order-first lg:order-none">
            <div className="flex flex-col gap-3 lg:sticky lg:top-0">
              <p className="text-[14.5px] font-bold text-(--s-ink)">{t("previewLabel")}</p>
              <div className="rounded-2xl bg-(--s-fill) p-4">
                <div className="flex overflow-visible rounded-lg shadow-sm">
                  <CouponTicketStub
                    discountType={form.discountType}
                    discountValue={previewValue}
                    status={previewStatus}
                    notchClassName="bg-(--s-fill)"
                    className="w-28 rounded-e-none py-5"
                  />
                  <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 rounded-e-lg bg-(--s-surface) px-4 py-3">
                    <bdi dir="ltr" className="truncate font-montserrat text-lg font-bold tracking-wider text-(--s-ink)">
                      {normalizeCode(form.code) || "CODE"}
                    </bdi>
                    <span className="truncate text-[13px] text-(--s-muted)">
                      {form.name.trim() || t("previewName")}
                    </span>
                  </div>
                </div>
                <dl className="mt-4 space-y-1 text-xs text-(--s-muted)">
                  {form.channels.length > 0 && (
                    <div>
                      <dt className="sr-only">{t("channels")}</dt>
                      <dd>{t("worksOn", { places: tRow(`channels.${channelsKey(form.channels)}`) })}</dd>
                    </div>
                  )}
                  {form.endDate && (
                    <div>
                      <dt className="sr-only">{t("expiresAt")}</dt>
                      <dd>
                        {t("validUntil", {
                          date: formatDate(`${form.endDate}T23:59:59`, locale),
                        })}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
              <p className="text-[13px] leading-relaxed text-(--s-muted)">{t("scope")}</p>
            </div>
          </aside>
        </form>

        <SheetFooter className="flex-row justify-end gap-2 border-t border-(--s-line-soft) px-6 py-4 max-[600px]:px-4">
          <SellerButton type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </SellerButton>
          <SellerButton type="submit" form={`${ids}-form`} disabled={isSaving}>
            {isSaving && <Spinner className="size-4" />}
            {coupon ? t("save") : t("createAction")}
          </SellerButton>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function NumberField({
  id,
  label,
  value,
  onChange,
  placeholder,
  decimal,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** An amount (static currency addon) rather than a count. */
  decimal?: boolean;
}) {
  const { unit } = useAccountMoney();
  return (
    <Field label={label} htmlFor={id}>
      {decimal ? (
        <CurrencyInput {...unit} id={id} value={value} onChange={onChange} placeholder={placeholder} />
      ) : (
        <TextInput
          id={id}
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          dir="ltr"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
    </Field>
  );
}
