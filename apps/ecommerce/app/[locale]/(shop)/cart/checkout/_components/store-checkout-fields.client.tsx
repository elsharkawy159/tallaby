"use client";

import type { UseFormReturn } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Info } from "lucide-react";
import { Card, CardContent, CardTitle } from "@workspace/ui/components/card";
import { FormField } from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import {
  CHECKOUT_ANSWER_MAX,
  CHECKOUT_EMAIL_MAX,
  CHECKOUT_NOTES_MAX,
  visibleCheckoutFields,
  type CheckoutAnswersError,
  type CheckoutFieldKey,
  type StoreCheckoutForm,
} from "@workspace/lib/stores/checkout-form";
import type { CheckoutFormData } from "./checkout-form.schema";

export type StoreCheckoutAnswers = { email: string; secondPhone: string; customAnswer: string };

/**
 * The store's extra checkout fields (ROADMAP.md F-25a) in the seller's order,
 * replacing the plain notes box when the store saved a checkout form. The
 * notes stay in the checkout form; the other answers are kept by the caller
 * and checked again on the server.
 */
export function StoreCheckoutFields({
  form,
  checkoutForm,
  answers,
  onAnswersChange,
  error,
}: {
  form: UseFormReturn<CheckoutFormData>;
  checkoutForm: StoreCheckoutForm;
  answers: StoreCheckoutAnswers;
  onAnswersChange: (next: StoreCheckoutAnswers) => void;
  error: { field: CheckoutFieldKey; error: CheckoutAnswersError } | null;
}) {
  const t = useTranslations("checkout");
  const tf = useTranslations("storeCheckoutForm");
  const fields = visibleCheckoutFields(checkoutForm);
  if (fields.length === 0) return null;

  const label = (text: string, required: boolean, htmlFor: string) => (
    <Label htmlFor={htmlFor} className="text-xs md:text-sm font-medium text-gray-700">
      {text}
      {required ? <span className="text-red-500"> *</span> : <span className="text-gray-400"> ({tf("optional")})</span>}
    </Label>
  );
  const errorFor = (key: CheckoutFieldKey) =>
    error?.field === key ? (
      <p role="alert" className="text-xs md:text-sm text-red-500">
        {tf(`errors.${error.error}`)}
      </p>
    ) : null;

  return (
    <Card className="rounded-xl md:rounded-2xl border border-gray-200 overflow-hidden pt-0">
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 md:px-6 py-3 md:py-5 border-b border-gray-200">
        <CardTitle className="flex items-center gap-2 text-sm md:text-xl font-bold text-gray-900">
          <Info className="h-4 w-4 md:h-5 md:w-5" />
          {t("orderDetails")}
        </CardTitle>
      </div>
      <CardContent className="space-y-4">
        {fields.map(({ key, required }) => {
          if (key === "email") {
            return (
              <div key={key} className="space-y-2">
                {label(tf("email"), required, "checkout-email")}
                <Input
                  id="checkout-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  dir="ltr"
                  maxLength={CHECKOUT_EMAIL_MAX}
                  value={answers.email}
                  onChange={(e) => onAnswersChange({ ...answers, email: e.target.value })}
                  aria-invalid={error?.field === key || undefined}
                />
                {errorFor(key)}
              </div>
            );
          }
          if (key === "secondPhone") {
            return (
              <div key={key} className="space-y-2">
                {label(tf("secondPhone"), required, "checkout-second-phone")}
                <Input
                  id="checkout-second-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  dir="ltr"
                  maxLength={20}
                  placeholder="01XXXXXXXXX"
                  value={answers.secondPhone}
                  onChange={(e) => onAnswersChange({ ...answers, secondPhone: e.target.value })}
                  aria-invalid={error?.field === key || undefined}
                />
                {errorFor(key)}
              </div>
            );
          }
          if (key === "customQuestion") {
            return (
              <div key={key} className="space-y-2">
                {label(checkoutForm.question, required, "checkout-custom-answer")}
                <Input
                  id="checkout-custom-answer"
                  maxLength={CHECKOUT_ANSWER_MAX}
                  value={answers.customAnswer}
                  onChange={(e) => onAnswersChange({ ...answers, customAnswer: e.target.value })}
                  aria-invalid={error?.field === key || undefined}
                />
                {errorFor(key)}
              </div>
            );
          }
          return (
            <div key={key} className="space-y-2">
              {label(t("orderNotes"), required, "notes")}
              <FormField
                control={form.control as any}
                name="notes"
                render={({ field }) => (
                  <Textarea
                    {...field}
                    id="notes"
                    placeholder={t("specialInstructions")}
                    rows={4}
                    maxLength={CHECKOUT_NOTES_MAX}
                    className="w-full resize-none"
                    aria-invalid={error?.field === key || undefined}
                  />
                )}
              />
              {errorFor(key)}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
