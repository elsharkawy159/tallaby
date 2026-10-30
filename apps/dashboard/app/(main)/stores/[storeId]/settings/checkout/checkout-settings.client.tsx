"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, ExternalLink } from "lucide-react";

import {
  CHECKOUT_FIELD_MODES,
  CHECKOUT_QUESTION_MAX,
  THANK_YOU_MESSAGE_MAX,
  visibleCheckoutFields,
  type CheckoutFieldKey,
  type CheckoutFieldMode,
  type StoreCheckoutForm,
  type StoreThankYou,
} from "@workspace/lib/stores/checkout-form";
import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { Textarea } from "@workspace/ui/components/textarea";
import { saveStoreCheckoutSettings } from "./checkout-settings.server";

type Settings = { checkoutForm: StoreCheckoutForm; thankYou: StoreThankYou };

/**
 * Store settings › Checkout (ROADMAP.md F-25). Which extra fields the store
 * website's checkout shows (hidden / optional / required) and in what order,
 * plus the thank-you page: a message, "Confirm on WhatsApp" and suggested
 * products. The customer's name, phone and delivery address always stay
 * required; the governorate and area are already picked from lists.
 */
export function StoreCheckoutSettingsForm({
  storeId,
  siteUrl,
  initial,
  hasWhatsapp,
  readOnly,
}: {
  storeId: string;
  siteUrl: string;
  initial: Settings;
  hasWhatsapp: boolean;
  readOnly: boolean;
}) {
  const t = useTranslations("storeCheckoutSettings");
  const [form, setForm] = useState<StoreCheckoutForm>(initial.checkoutForm);
  const [thankYou, setThankYou] = useState<StoreThankYou>(initial.thankYou);
  const [isPending, startTransition] = useTransition();
  const disabled = readOnly || isPending;

  const setMode = (key: CheckoutFieldKey, mode: CheckoutFieldMode) =>
    setForm((current) => ({ ...current, fields: { ...current.fields, [key]: mode } }));

  const move = (index: number, delta: -1 | 1) =>
    setForm((current) => {
      const order = [...current.order];
      const target = index + delta;
      if (target < 0 || target >= order.length) return current;
      [order[index], order[target]] = [order[target]!, order[index]!];
      return { ...current, order };
    });

  const save = () => {
    startTransition(async () => {
      const result = await saveStoreCheckoutSettings(storeId, { checkoutForm: form, thankYou });
      if (!result.success) {
        toast.error(t(`errors.${result.error}`));
        return;
      }
      setForm(result.settings.checkoutForm);
      setThankYou(result.settings.thankYou);
      toast.success(t("saved"));
    });
  };

  const fieldLabel = (key: CheckoutFieldKey) =>
    key === "customQuestion" ? form.question.trim() || t("fields.customQuestion") : t(`fields.${key}`);
  // The preview follows the unsaved edits; a question without a label is not shown.
  const preview = visibleCheckoutFields(
    form.question.trim() ? form : { ...form, fields: { ...form.fields, customQuestion: "hidden" } },
  );

  return (
    <div className="space-y-5">
      {readOnly && <p className="rounded-xl border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">{t("readOnly")}</p>}

      <section className="space-y-4 rounded-xl border bg-card p-4 sm:p-5">
        <div className="space-y-1">
          <h2 className="font-semibold">{t("formTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("formDescription")}</p>
          <p className="text-sm text-muted-foreground">{t("alwaysRequired")}</p>
        </div>

        <ol className="space-y-3">
          {form.order.map((key, index) => (
            <li key={key} className="flex flex-wrap items-center gap-2 rounded-lg border bg-background p-3">
              <div className="flex flex-col">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-6"
                  disabled={disabled || index === 0}
                  onClick={() => move(index, -1)}
                  aria-label={t("moveUp", { field: fieldLabel(key) })}
                >
                  <ArrowUp className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-6"
                  disabled={disabled || index === form.order.length - 1}
                  onClick={() => move(index, 1)}
                  aria-label={t("moveDown", { field: fieldLabel(key) })}
                >
                  <ArrowDown className="size-3.5" />
                </Button>
              </div>
              <span id={`checkout-field-${key}`} className="min-w-32 flex-1 text-sm font-medium">
                {t(`fields.${key}`)}
              </span>
              <Select value={form.fields[key]} disabled={disabled} onValueChange={(value) => setMode(key, value as CheckoutFieldMode)}>
                <SelectTrigger className="w-36" aria-labelledby={`checkout-field-${key}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHECKOUT_FIELD_MODES.map((mode) => (
                    <SelectItem key={mode} value={mode}>
                      {t(`modes.${mode}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {key === "customQuestion" && form.fields.customQuestion !== "hidden" && (
                <div className="w-full space-y-1">
                  <Label htmlFor="checkout-question" className="text-xs">
                    {t("questionLabel")}
                  </Label>
                  <Input
                    id="checkout-question"
                    value={form.question}
                    maxLength={CHECKOUT_QUESTION_MAX}
                    disabled={disabled}
                    placeholder={t("questionPlaceholder")}
                    onChange={(e) => setForm((current) => ({ ...current, question: e.target.value }))}
                  />
                </div>
              )}
            </li>
          ))}
        </ol>

        {/* What the customer sees under "Order details", from the unsaved edits. */}
        <div className="space-y-2 rounded-lg border border-dashed p-3">
          <p className="text-xs font-semibold text-muted-foreground">{t("previewTitle")}</p>
          {preview.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("previewEmpty")}</p>
          ) : (
            <ul className="space-y-2">
              {preview.map(({ key, required }) => (
                <li key={key} className="space-y-1">
                  <p className="text-sm">
                    {fieldLabel(key)}
                    {required ? <span className="text-destructive"> *</span> : <span className="text-muted-foreground"> ({t("modes.optional")})</span>}
                  </p>
                  <div className={key === "notes" ? "h-14 rounded-md border bg-muted/30" : "h-8 rounded-md border bg-muted/30"} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="space-y-4 rounded-xl border bg-card p-4 sm:p-5">
        <div className="space-y-1">
          <h2 className="font-semibold">{t("thankYouTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("thankYouDescription")}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="thank-you-message" className="font-semibold">
            {t("messageLabel")}
          </Label>
          <Textarea
            id="thank-you-message"
            rows={4}
            maxLength={THANK_YOU_MESSAGE_MAX}
            value={thankYou.message}
            disabled={disabled}
            placeholder={t("messagePlaceholder")}
            onChange={(e) => setThankYou((current) => ({ ...current, message: e.target.value }))}
          />
          <p className="text-xs text-muted-foreground">
            {t("messageHint", { count: thankYou.message.length, max: THANK_YOU_MESSAGE_MAX })}
          </p>
        </div>

        <div className="flex items-start gap-2">
          <Checkbox
            id="thank-you-whatsapp"
            checked={thankYou.whatsappButton}
            disabled={disabled}
            onCheckedChange={(value) => setThankYou((current) => ({ ...current, whatsappButton: value === true }))}
          />
          <div className="space-y-0.5">
            <Label htmlFor="thank-you-whatsapp" className="font-normal">
              {t("whatsappLabel")}
            </Label>
            <p className="text-xs text-muted-foreground">{hasWhatsapp ? t("whatsappHint") : t("whatsappMissing")}</p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <Checkbox
            id="thank-you-products"
            checked={thankYou.suggestedProducts}
            disabled={disabled}
            onCheckedChange={(value) => setThankYou((current) => ({ ...current, suggestedProducts: value === true }))}
          />
          <div className="space-y-0.5">
            <Label htmlFor="thank-you-products" className="font-normal">
              {t("productsLabel")}
            </Label>
            <p className="text-xs text-muted-foreground">{t("productsHint")}</p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">{t("pixelsKept")}</p>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" disabled={disabled} onClick={save}>
          {t("save")}
        </Button>
        <a
          href={siteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-primary-ink underline-offset-4 hover:underline"
        >
          {t("viewStore")}
          <ExternalLink className="size-3.5" />
        </a>
      </div>
    </div>
  );
}
