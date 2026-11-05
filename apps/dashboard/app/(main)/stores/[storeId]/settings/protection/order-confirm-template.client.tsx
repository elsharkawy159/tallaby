"use client";

import { useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { MessageCircle, RotateCcw } from "lucide-react";

import { Field, SaveBar, SectionCard, SellerButton, TextArea } from "@/components/seller-ui";
import {
  ORDER_CONFIRM_DEFAULTS,
  ORDER_CONFIRM_PLACEHOLDERS,
  ORDER_CONFIRM_TEMPLATE_MAX,
  renderOrderConfirmMessage,
  type OrderConfirmLocale,
} from "../../../../orders/order-confirm.lib";
import { saveOrderConfirmTemplate } from "./protection.server";

/**
 * The store's WhatsApp "please confirm your order" message (ROADMAP.md F-02g).
 * /orders opens wa.me with it filled in for each new order; the seller then
 * presses "Confirm order". Empty = the default in the store's language.
 */
export function OrderConfirmTemplateSettings({
  storeId,
  storeName,
  locale,
  initial,
  readOnly,
}: {
  storeId: string;
  storeName: string;
  locale: OrderConfirmLocale;
  initial: string | null;
  readOnly: boolean;
}) {
  const t = useTranslations("orderProtection");
  const [saved, setSaved] = useState(initial);
  const [value, setValue] = useState(initial ?? ORDER_CONFIRM_DEFAULTS[locale]);
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dirty = value.trim() !== (saved ?? ORDER_CONFIRM_DEFAULTS[locale]);

  const preview = renderOrderConfirmMessage(value.trim() || null, {
    storeName,
    locale,
    order: {
      customerName: t("sample.name"),
      orderNumber: "1042",
      totalAmount: "355",
      lines: [{ productName: t("sample.product"), variantName: null, quantity: 1 }],
      address: { line: t("sample.line"), area: t("sample.area") },
    },
  });

  const save = (next: string) => {
    startTransition(async () => {
      // Saving the default text keeps the store on the default (it follows future wording).
      const result = await saveOrderConfirmTemplate(storeId, next.trim() === ORDER_CONFIRM_DEFAULTS[locale] ? "" : next);
      if (!result.success) {
        toast.error(t(`errors.${result.error}`));
        return;
      }
      setSaved(result.data);
      setValue(result.data ?? ORDER_CONFIRM_DEFAULTS[locale]);
      toast.success(t("saved"));
    });
  };

  /** Puts a placeholder where the cursor is, or at the end. */
  const insert = (token: string) => {
    const box = textareaRef.current;
    const start = box?.selectionStart ?? value.length;
    const end = box?.selectionEnd ?? value.length;
    const next = `${value.slice(0, start)}${token}${value.slice(end)}`;
    if (next.length > ORDER_CONFIRM_TEMPLATE_MAX) return;
    setValue(next);
    requestAnimationFrame(() => {
      box?.focus();
      box?.setSelectionRange(start + token.length, start + token.length);
    });
  };

  return (
    <SectionCard
      icon={MessageCircle}
      tone="success"
      title={t("confirmTitle")}
      description={t("confirmDescription")}
      action={
        saved ? (
          <SellerButton variant="mini" size="xs" disabled={readOnly || isPending} onClick={() => save("")}>
            <RotateCcw aria-hidden />
            <span className="max-[600px]:sr-only">{t("useDefault")}</span>
          </SellerButton>
        ) : undefined
      }
    >
      <div className="grid grid-cols-2 items-start gap-4 max-[860px]:grid-cols-1">
        <Field label={t("template")} htmlFor="confirm-template">
          <TextArea
            ref={textareaRef}
            id="confirm-template"
            dir="auto"
            rows={9}
            maxLength={ORDER_CONFIRM_TEMPLATE_MAX}
            value={value}
            disabled={readOnly}
            className="min-h-[220px]"
            onChange={(event) => setValue(event.target.value)}
          />
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-(--s-subtle)">
            <span>{t("placeholders")}</span>
            {ORDER_CONFIRM_PLACEHOLDERS.map((key) => (
              <button
                key={key}
                type="button"
                dir="ltr"
                disabled={readOnly}
                onClick={() => insert(`{${key}}`)}
                className="h-7 cursor-pointer rounded-full border border-dashed border-(--s-field-strong) bg-(--s-surface) px-2.5 font-montserrat text-[11.5px] font-semibold text-(--s-link) transition-colors duration-150 hover:border-solid hover:border-(--s-primary) hover:bg-(--s-hover) disabled:pointer-events-none disabled:opacity-50 max-[600px]:h-10"
              >
                {`{${key}}`}
              </button>
            ))}
          </div>
        </Field>
        {/* A picture of WhatsApp, so it keeps WhatsApp's own colours in both themes. */}
        <div className="flex flex-col gap-2">
          <span className="text-[13.5px] font-bold text-(--s-text)">{t("preview")}</span>
          <div className="flex min-h-[220px] flex-col gap-2 rounded-[20px] bg-[#efeae2] p-3.5 dark:bg-[#0b141a]">
            <div className="flex items-center gap-2.5 rounded-xl bg-white px-2.5 py-2 dark:bg-[#202c33]">
              <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-(--tallaby-teal-700) font-montserrat text-sm font-extrabold text-white">
                {storeName.trim().charAt(0).toUpperCase()}
              </span>
              <b className="min-w-0 truncate text-[13px] font-bold text-[#1f2c2f] dark:text-[#e9edef]">
                <bdi>{storeName}</bdi>
              </b>
            </div>
            <div dir="auto" className="max-w-[92%] self-start rounded-xl rounded-ss-[3px] bg-[#d9fdd3] px-3 py-2.5 text-[13px] leading-[1.75] break-words whitespace-pre-wrap text-[#1f2c2f] dark:bg-[#005c4b] dark:text-[#e9edef]">
              {preview}
            </div>
          </div>
        </div>
      </div>
      {!readOnly && <SaveBar dirty={dirty} saving={isPending} onSave={() => save(value)} onDiscard={() => setValue(saved ?? ORDER_CONFIRM_DEFAULTS[locale])} />}
    </SectionCard>
  );
}
