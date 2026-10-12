"use client";

import { useEffect, useId, useState, useTransition } from "react";
import { Shuffle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { RadioGroup, RadioGroupItem } from "@workspace/ui/components/radio-group";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet";
import { Spinner } from "@workspace/ui/components/spinner";
import { cn } from "@workspace/ui/lib/utils";
import type { CouponChannel } from "@workspace/lib/orders/coupon-scope";
import {
  saveSellerCoupon,
  type CouponProductOption,
  type SellerCouponRow,
} from "@/actions/coupons";
import { formatDate } from "@/lib/i18n/format";
import { CouponProductPicker } from "./coupon-product-picker";
import { CouponTicketStub } from "./coupon-ticket";
import {
  channelsKey,
  couponToForm,
  emptyCouponForm,
  toDateInput,
  generateCode,
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
  products: CouponProductOption[];
  storeHost: string | null;
  onSaved: () => void;
};

export function CouponEditor({ open, onOpenChange, coupon, products, storeHost, onSaved }: Props) {
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

  const toggleChannel = (channel: CouponChannel, checked: boolean) =>
    set(
      "channels",
      checked
        ? [...new Set([...form.channels, channel])]
        : form.channels.filter((c) => c !== channel)
    );

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

  const fieldError = (key: keyof CouponFormErrors) =>
    errors[key] ? (
      <p id={`${ids}-${key}-error`} className="text-sm text-destructive">
        {tErrors(errors[key]!)}
      </p>
    ) : null;

  const describedBy = (key: keyof CouponFormErrors, hint?: boolean) =>
    [errors[key] && `${ids}-${key}-error`, hint && `${ids}-${key}-hint`].filter(Boolean).join(" ") ||
    undefined;

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
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle>{coupon ? t("editTitle") : t("createTitle")}</SheetTitle>
          <SheetDescription>{t("description")}</SheetDescription>
        </SheetHeader>

        <form
          id={`${ids}-form`}
          onSubmit={submit}
          noValidate
          className="grid flex-1 gap-8 overflow-y-auto px-6 py-6 lg:grid-cols-[minmax(0,1fr)_18rem]"
        >
          <div className="space-y-8 lg:order-none">
            {/* Code and name */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`${ids}-code`}>{t("code")}</Label>
                <div className="flex gap-2">
                  <Input
                    id={`${ids}-code`}
                    value={form.code}
                    onChange={(e) => set("code", normalizeCode(e.target.value))}
                    maxLength={24}
                    autoComplete="off"
                    spellCheck={false}
                    dir="ltr"
                    aria-invalid={!!errors.code}
                    aria-describedby={describedBy("code", true)}
                    className="font-mono uppercase tracking-wider"
                    placeholder="EID15"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => set("code", generateCode(form.name))}
                  >
                    <Shuffle className="size-4" aria-hidden />
                    {t("generate")}
                  </Button>
                </div>
                {fieldError("code") ?? (
                  <p id={`${ids}-code-hint`} className="text-xs text-muted-foreground">
                    {t("codeHint")}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${ids}-name`}>{t("name")}</Label>
                <Input
                  id={`${ids}-name`}
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  maxLength={80}
                  placeholder={t("namePlaceholder")}
                  aria-invalid={!!errors.name}
                  aria-describedby={describedBy("name", true)}
                />
                {fieldError("name") ?? (
                  <p id={`${ids}-name-hint`} className="text-xs text-muted-foreground">
                    {t("nameHint")}
                  </p>
                )}
              </div>
            </div>

            {/* Discount */}
            <fieldset className="space-y-3">
              <legend className="mb-3 text-sm font-semibold">{t("discount")}</legend>
              <div
                role="radiogroup"
                aria-label={t("discount")}
                className="inline-flex rounded-lg border bg-muted p-1"
              >
                {(["percentage", "fixed_amount"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    role="radio"
                    aria-checked={form.discountType === type}
                    onClick={() => set("discountType", type)}
                    className={cn(
                      "rounded-md px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      form.discountType === type
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {type === "percentage" ? t("percentage") : t("fixed")}
                  </button>
                ))}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`${ids}-value`}>
                    {isPercent ? t("percentValue") : t("amountValue")}
                  </Label>
                  <Input
                    id={`${ids}-value`}
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={isPercent ? 90 : undefined}
                    step="any"
                    dir="ltr"
                    value={form.discountValue}
                    onChange={(e) => set("discountValue", e.target.value)}
                    aria-invalid={!!errors.discountValue}
                    aria-describedby={describedBy("discountValue")}
                  />
                  {fieldError("discountValue")}
                </div>
                {isPercent && (
                  <div className="space-y-2">
                    <Label htmlFor={`${ids}-max`}>{t("maxDiscount")}</Label>
                    <Input
                      id={`${ids}-max`}
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="any"
                      dir="ltr"
                      value={form.maximumDiscount}
                      onChange={(e) => set("maximumDiscount", e.target.value)}
                      aria-describedby={`${ids}-max-hint`}
                    />
                    <p id={`${ids}-max-hint`} className="text-xs text-muted-foreground">
                      {t("maxDiscountHint")}
                    </p>
                  </div>
                )}
              </div>
            </fieldset>

            {/* Products */}
            <fieldset className="space-y-3">
              <legend className="mb-3 text-sm font-semibold">{t("products")}</legend>
              <RadioGroup
                value={form.productScope}
                onValueChange={(v) => set("productScope", v as CouponFormState["productScope"])}
                className="grid gap-2 sm:grid-cols-2"
              >
                <ChoiceCard
                  id={`${ids}-scope-all`}
                  title={t("allProducts")}
                  hint={t("allProductsHint")}
                  checked={form.productScope === "all"}
                  control={<RadioGroupItem id={`${ids}-scope-all`} value="all" />}
                />
                <ChoiceCard
                  id={`${ids}-scope-selected`}
                  title={t("selectedProducts")}
                  hint={t("selectedProductsHint")}
                  checked={form.productScope === "selected"}
                  control={<RadioGroupItem id={`${ids}-scope-selected`} value="selected" />}
                />
              </RadioGroup>
              {form.productScope === "selected" && (
                <CouponProductPicker
                  products={products}
                  selectedIds={form.productIds}
                  onChange={(next) => set("productIds", next)}
                  invalid={!!errors.productIds}
                />
              )}
              {fieldError("productIds")}
            </fieldset>

            {/* Where it works */}
            <fieldset className="space-y-3">
              <legend className="mb-3 text-sm font-semibold">{t("channels")}</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                <ChoiceCard
                  id={`${ids}-ch-marketplace`}
                  title={t("marketplace")}
                  hint={t("marketplaceHint")}
                  checked={form.channels.includes("marketplace")}
                  control={
                    <Checkbox
                      id={`${ids}-ch-marketplace`}
                      checked={form.channels.includes("marketplace")}
                      onCheckedChange={(c) => toggleChannel("marketplace", c === true)}
                    />
                  }
                />
                <ChoiceCard
                  id={`${ids}-ch-storefront`}
                  title={t("storefront")}
                  hint={storeHost ?? t("storefrontNoHost")}
                  hintDir={storeHost ? "ltr" : undefined}
                  checked={form.channels.includes("storefront")}
                  control={
                    <Checkbox
                      id={`${ids}-ch-storefront`}
                      checked={form.channels.includes("storefront")}
                      onCheckedChange={(c) => toggleChannel("storefront", c === true)}
                    />
                  }
                />
              </div>
              {fieldError("channels")}
            </fieldset>

            {/* Conditions */}
            <fieldset className="space-y-3">
              <legend className="mb-3 text-sm font-semibold">{t("limits")}</legend>
              <div className="grid gap-4 sm:grid-cols-3">
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
              <p className="text-xs text-muted-foreground">{t("minPurchaseHint")}</p>
            </fieldset>

            {/* Active dates */}
            <fieldset className="space-y-3">
              <legend className="mb-3 text-sm font-semibold">{t("dates")}</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`${ids}-start`}>{t("startsAt")}</Label>
                  <Input
                    id={`${ids}-start`}
                    type="date"
                    value={form.startDate}
                    onChange={(e) => set("startDate", e.target.value)}
                    aria-invalid={!!errors.dates}
                    aria-describedby={describedBy("dates")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${ids}-end`}>{t("expiresAt")}</Label>
                  <Input
                    id={`${ids}-end`}
                    type="date"
                    min={form.startDate || undefined}
                    value={form.endDate}
                    onChange={(e) => set("endDate", e.target.value)}
                    aria-invalid={!!errors.dates}
                    aria-describedby={describedBy("dates")}
                  />
                </div>
              </div>
              {fieldError("dates")}
            </fieldset>
          </div>

          {/* Live preview: what the customer is handed. */}
          <aside className="order-first lg:order-none">
            <div className="space-y-3 lg:sticky lg:top-0">
              <p className="text-sm font-semibold">{t("previewLabel")}</p>
              <div className="rounded-xl bg-muted p-4">
                <div className="flex overflow-visible rounded-lg shadow-sm">
                  <CouponTicketStub
                    discountType={form.discountType}
                    discountValue={previewValue}
                    status={previewStatus}
                    notchClassName="bg-muted"
                    className="w-28 rounded-e-none py-5"
                  />
                  <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 rounded-e-lg bg-card px-4 py-3">
                    <span
                      dir="ltr"
                      className="truncate font-mono text-lg font-semibold tracking-wider text-foreground"
                    >
                      {normalizeCode(form.code) || "CODE"}
                    </span>
                    <span className="truncate text-sm text-muted-foreground">
                      {form.name.trim() || t("previewName")}
                    </span>
                  </div>
                </div>
                <dl className="mt-4 space-y-1 text-xs text-muted-foreground">
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
              <p className="text-sm leading-relaxed text-muted-foreground">{t("scope")}</p>
            </div>
          </aside>
        </form>

        <SheetFooter className="flex-row justify-end gap-2 border-t px-6 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button type="submit" form={`${ids}-form`} disabled={isSaving}>
            {isSaving && <Spinner className="size-4" />}
            {coupon ? t("save") : t("createAction")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function ChoiceCard({
  id,
  title,
  hint,
  hintDir,
  checked,
  control,
}: {
  id: string;
  title: string;
  hint: string;
  hintDir?: "ltr";
  checked: boolean;
  control: React.ReactNode;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
        checked ? "border-primary bg-primary/5" : "hover:bg-muted/60"
      )}
    >
      <span className="pt-0.5">{control}</span>
      <span className="min-w-0">
        <span className="block text-sm font-medium">{title}</span>
        <span dir={hintDir} className="block truncate text-xs text-muted-foreground">
          {hint}
        </span>
      </span>
    </label>
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
  decimal?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        inputMode={decimal ? "decimal" : "numeric"}
        min={decimal ? 0 : 1}
        step={decimal ? "any" : 1}
        dir="ltr"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
