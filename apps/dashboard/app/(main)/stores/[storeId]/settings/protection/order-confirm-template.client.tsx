"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { LoaderCircle, MessageCircle, RotateCcw } from "lucide-react";

import { Button } from "@workspace/ui/components/button";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import { BUTTON_CLASS, SMALL_BUTTON_CLASS, TEXTAREA_CLASS } from "@/components/form/form-ui";
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

  return (
    <section className="space-y-4 rounded-xl border bg-card p-4 sm:p-5">
      <div className="space-y-1">
        <h2 className="flex items-center gap-2 font-semibold">
          <MessageCircle className="size-4 text-[#25D366]" />
          {t("confirmTitle")}
        </h2>
        <p className="text-sm text-muted-foreground">{t("confirmDescription")}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="confirm-template">{t("template")}</Label>
          <Textarea
            id="confirm-template"
            dir="auto"
            rows={9}
            maxLength={ORDER_CONFIRM_TEMPLATE_MAX}
            value={value}
            disabled={readOnly}
            onChange={(event) => setValue(event.target.value)}
            className={TEXTAREA_CLASS}
          />
          <p className="text-xs text-muted-foreground">
            {t("placeholders")}{" "}
            {ORDER_CONFIRM_PLACEHOLDERS.map((key) => (
              <code key={key} className="me-1 rounded bg-muted px-1 py-0.5 text-[11px]" dir="ltr">
                {`{${key}}`}
              </code>
            ))}
          </p>
        </div>
        <div className="space-y-1.5">
          <span className="text-sm font-medium">{t("preview")}</span>
          <div className="whitespace-pre-wrap rounded-xl bg-[#e7ffdb] p-3 text-sm text-[#111b21] dark:bg-[#005c4b] dark:text-[#e9edef]" dir="auto">
            {preview}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" className={BUTTON_CLASS} disabled={readOnly || isPending || !dirty} onClick={() => save(value)}>
          {isPending && <LoaderCircle className="size-4 animate-spin" />}
          {t("save")}
        </Button>
        {saved && (
          <Button
            type="button"
            variant="ghost"
            className={SMALL_BUTTON_CLASS}
            disabled={readOnly || isPending}
            onClick={() => save("")}
          >
            <RotateCcw className="size-3.5" />
            {t("useDefault")}
          </Button>
        )}
      </div>
    </section>
  );
}
