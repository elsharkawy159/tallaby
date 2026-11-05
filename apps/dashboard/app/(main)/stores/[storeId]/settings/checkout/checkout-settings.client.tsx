"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Check, ExternalLink, Eye, ListChecks, Lock, MessageCircle, PartyPopper } from "lucide-react";

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
import type { StoreMinOrder } from "@workspace/lib/stores/min-order";
import {
  CheckRow,
  Field,
  IconButton,
  Note,
  Row,
  Rows,
  SaveBar,
  SectionCard,
  Segmented,
  TextAction,
  TextArea,
  TextInput,
  TwoColumns,
} from "@/components/seller-ui";
import type { MoneyUnit } from "@/lib/i18n/format";
import { cn } from "@/lib/utils";
import { saveStoreCheckoutSettings } from "./checkout-settings.server";
import { StoreMinOrderCard, useStoreMinOrder } from "./min-order.client";

type Settings = { checkoutForm: StoreCheckoutForm; thankYou: StoreThankYou };

const MOVE = "size-7 rounded-lg max-[600px]:size-10 [&_svg]:size-3.5";

/**
 * Store settings › Checkout (ROADMAP.md F-25, F-13b). The minimum order, which
 * extra fields the store website's checkout shows (hidden / optional / required)
 * and in what order, plus the thank-you page: a message, "Confirm on WhatsApp"
 * and suggested products. One save bar covers all of it. The customer's name,
 * phone and delivery address always stay required; the governorate and area are
 * already picked from lists.
 */
export function StoreCheckoutSettingsForm({
  storeId,
  siteUrl,
  money,
  initialMinOrder,
  initial,
  hasWhatsapp,
  readOnly,
}: {
  storeId: string;
  siteUrl: string;
  money: MoneyUnit;
  initialMinOrder: StoreMinOrder;
  initial: Settings;
  hasWhatsapp: boolean;
  readOnly: boolean;
}) {
  const t = useTranslations("storeCheckoutSettings");
  const tSetup = useTranslations("storeSetup");
  const minOrder = useStoreMinOrder(storeId, money, initialMinOrder);
  const [saved, setSaved] = useState<Settings>(initial);
  const [form, setForm] = useState<StoreCheckoutForm>(initial.checkoutForm);
  const [thankYou, setThankYou] = useState<StoreThankYou>(initial.thankYou);
  const [isPending, startTransition] = useTransition();
  const disabled = readOnly || isPending;
  const settingsDirty = JSON.stringify({ checkoutForm: form, thankYou }) !== JSON.stringify(saved);

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
      const minError = await minOrder.save();
      if (minError) {
        toast.error(minError);
        return;
      }
      if (settingsDirty) {
        const result = await saveStoreCheckoutSettings(storeId, { checkoutForm: form, thankYou });
        if (!result.success) {
          toast.error(t(`errors.${result.error}`));
          return;
        }
        setSaved(result.settings);
        setForm(result.settings.checkoutForm);
        setThankYou(result.settings.thankYou);
      }
      toast.success(t("saved"));
    });
  };

  const discard = () => {
    minOrder.reset();
    setForm(saved.checkoutForm);
    setThankYou(saved.thankYou);
  };

  const fieldLabel = (key: CheckoutFieldKey) =>
    key === "customQuestion" ? form.question.trim() || t("fields.customQuestion") : t(`fields.${key}`);
  // The preview follows the unsaved edits; a question without a label is not shown.
  const preview = visibleCheckoutFields(
    form.question.trim() ? form : { ...form, fields: { ...form.fields, customQuestion: "hidden" } },
  );
  const fixedFields = ["fixedName", "fixedPhone", "fixedPlace", "fixedAddress"] as const;

  return (
    <div className="flex flex-col gap-4">
      {readOnly && <Note tone="amber">{t("readOnly")}</Note>}

      <StoreMinOrderCard money={money} state={minOrder} disabled={disabled} />

      <SectionCard icon={ListChecks} title={t("formTitle")} description={t("formDescription")}>
        <Field label={tSetup("fixedFieldsLabel")} note={t("alwaysRequired")}>
          <div className="flex flex-wrap gap-1.5">
            {fixedFields.map((key) => (
              <span key={key} className="inline-flex h-[30px] items-center gap-[5px] rounded-full bg-(--s-fill) px-3 text-xs font-semibold text-(--s-muted)">
                <Lock className="size-[13px] text-(--s-subtle)" aria-hidden />
                {tSetup(key)}
              </span>
            ))}
          </div>
        </Field>

        <TwoColumns>
          <Rows>
            {form.order.map((key, index) => (
              <Row
                key={key}
                className="items-start"
                start={
                  <div className="flex shrink-0 flex-col">
                    <IconButton
                      className={MOVE}
                      disabled={disabled || index === 0}
                      onClick={() => move(index, -1)}
                      aria-label={t("moveUp", { field: fieldLabel(key) })}
                    >
                      <ArrowUp />
                    </IconButton>
                    <IconButton
                      className={MOVE}
                      disabled={disabled || index === form.order.length - 1}
                      onClick={() => move(index, 1)}
                      aria-label={t("moveDown", { field: fieldLabel(key) })}
                    >
                      <ArrowDown />
                    </IconButton>
                  </div>
                }
              >
                <div className="flex flex-col gap-2">
                  <b className={cn("text-sm font-bold text-(--s-text)", form.fields[key] === "hidden" && "text-(--s-faint)")}>{t(`fields.${key}`)}</b>
                  {/* A fieldset is the only way to disable all three buttons of the shared switch. */}
                  <fieldset disabled={disabled} className="contents">
                    <Segmented
                      label={t(`fields.${key}`)}
                      className="self-start max-[600px]:w-full"
                      value={form.fields[key]}
                      onChange={(mode) => setMode(key, mode)}
                      options={CHECKOUT_FIELD_MODES.map((mode) => ({ value: mode, label: t(`modes.${mode}`) }))}
                    />
                  </fieldset>
                  {key === "customQuestion" && form.fields.customQuestion !== "hidden" && (
                    <Field label={t("questionLabel")} htmlFor="checkout-question">
                      <TextInput
                        id="checkout-question"
                        value={form.question}
                        maxLength={CHECKOUT_QUESTION_MAX}
                        disabled={disabled}
                        placeholder={t("questionPlaceholder")}
                        onChange={(e) => setForm((current) => ({ ...current, question: e.target.value }))}
                      />
                    </Field>
                  )}
                </div>
              </Row>
            ))}
          </Rows>

          {/* What the customer sees under "Order details", from the unsaved edits. */}
          <div className="flex flex-col gap-2.5 rounded-[20px] border border-(--s-line) bg-(--s-tint) p-4">
            <small className="flex items-center gap-1.5 text-xs font-bold text-(--s-subtle)">
              <Eye className="size-3.5" aria-hidden />
              {t("previewTitle")}
            </small>
            {preview.length === 0 ? (
              <p className="text-[13px] text-(--s-muted)">{t("previewEmpty")}</p>
            ) : (
              preview.map(({ key, required }) => (
                <div key={key} className="flex flex-col gap-1">
                  <p className="text-[12.5px] font-semibold text-(--s-text)">
                    {fieldLabel(key)}
                    {required ? <span className="text-destructive"> *</span> : <small className="font-medium text-(--s-faint)"> ({t("modes.optional")})</small>}
                  </p>
                  <span className={cn("block rounded-[10px] border border-(--s-field) bg-(--s-surface)", key === "notes" ? "h-16" : "h-[38px]")} />
                </div>
              ))
            )}
          </div>
        </TwoColumns>
      </SectionCard>

      <SectionCard icon={PartyPopper} title={t("thankYouTitle")} description={t("thankYouDescription")}>
        <div className="grid grid-cols-[minmax(0,1fr)_260px] items-start gap-4 max-[860px]:grid-cols-1">
          <div className="flex flex-col gap-3.5">
            <Field
              label={t("messageLabel")}
              htmlFor="thank-you-message"
              note={t("messageHint", { count: thankYou.message.length, max: THANK_YOU_MESSAGE_MAX })}
            >
              <TextArea
                id="thank-you-message"
                rows={4}
                maxLength={THANK_YOU_MESSAGE_MAX}
                value={thankYou.message}
                disabled={disabled}
                placeholder={t("messagePlaceholder")}
                onChange={(e) => setThankYou((current) => ({ ...current, message: e.target.value }))}
              />
            </Field>
            <CheckRow
              label={t("whatsappLabel")}
              description={hasWhatsapp ? t("whatsappHint") : t("whatsappMissing")}
              checked={thankYou.whatsappButton}
              disabled={disabled}
              onChange={(e) => setThankYou((current) => ({ ...current, whatsappButton: e.target.checked }))}
            />
            <CheckRow
              label={t("productsLabel")}
              description={t("productsHint")}
              checked={thankYou.suggestedProducts}
              disabled={disabled}
              onChange={(e) => setThankYou((current) => ({ ...current, suggestedProducts: e.target.checked }))}
            />
            <Note>{t("pixelsKept")}</Note>
            <TextAction asChild className="self-start max-[600px]:min-h-10">
              <a href={siteUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink aria-hidden />
                {t("viewStore")}
              </a>
            </TextAction>
          </div>

          {/* The page as the customer gets it, without a real order number. */}
          <div aria-hidden className="flex flex-col items-center gap-2 rounded-[20px] border border-(--s-line) bg-(--s-tint) p-[18px] text-center">
            <span className="grid size-[46px] place-items-center rounded-full bg-success-soft text-success">
              <Check className="size-[22px]" />
            </span>
            <b className="text-sm font-bold text-(--s-ink)">{tSetup("thanksPreviewTitle")}</b>
            {thankYou.message.trim() && <p className="text-[12.5px] break-words whitespace-pre-wrap text-(--s-muted)">{thankYou.message}</p>}
            {thankYou.whatsappButton && hasWhatsapp && (
              <span className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-(--s-whatsapp) text-[12.5px] font-bold text-white">
                <MessageCircle className="size-[15px]" />
                {t("whatsappLabel")}
              </span>
            )}
            {thankYou.suggestedProducts && (
              <span className="grid w-full grid-cols-4 gap-1.5">
                {[0, 1, 2, 3].map((n) => (
                  <i key={n} className="aspect-square rounded-lg bg-(--s-fill)" />
                ))}
              </span>
            )}
          </div>
        </div>
      </SectionCard>

      {!readOnly && <SaveBar dirty={minOrder.dirty || settingsDirty} saving={isPending} onSave={save} onDiscard={discard} />}
    </div>
  );
}
