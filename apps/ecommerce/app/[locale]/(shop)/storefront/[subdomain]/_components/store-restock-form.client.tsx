"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { BellRing, CircleCheck, LoaderCircle } from "lucide-react";
import { subscribeStockAlert } from "@/lib/stock-alerts/subscribe.server";

/**
 * "Notify me when it's back" under an out-of-stock buy box on a store
 * product page (0126, ROADMAP.md F-23a). Follows the selected variant (a new
 * variant starts a fresh form, keyed by the caller). Email only; the server
 * action decides the store from the host.
 */
export function StoreRestockForm({ productId, variantId }: { productId: string; variantId: string | null }) {
  const t = useTranslations("storeProduct.restock");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isPending) return;
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "");
    const honeypot = String(data.get("website") ?? "");
    setError(null);
    startTransition(async () => {
      const result = await subscribeStockAlert({ productId, variantId, email, honeypot: honeypot || undefined });
      if (result.ok) setDone(true);
      else setError(t(`errors.${result.error}`));
    });
  };

  if (done) {
    return (
      <p role="status" className="flex items-center gap-2 rounded-(--sf-radius,12px) border border-(--sf-line) bg-(--sf-paper) px-4 py-3 text-sm font-semibold text-(--sf-ink)">
        <CircleCheck className="size-5 shrink-0 text-(--sf-brand)" aria-hidden />
        {t("done")}
      </p>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="grid gap-2.5 rounded-(--sf-radius,12px) border border-(--sf-line) bg-(--sf-paper) p-4 text-(--sf-ink)"
    >
      <p className="flex items-center gap-2 text-[15px] font-bold">
        <BellRing className="size-[18px] shrink-0 text-(--sf-brand)" aria-hidden />
        {t("title")}
      </p>
      <p className="text-[13px] leading-relaxed text-(--sf-muted)">{t("description")}</p>
      {/* Honeypot: hidden from people, filled by bots. */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      <div className="flex min-w-0 flex-wrap gap-2 sm:flex-nowrap">
        <label className="sr-only" htmlFor={`restock-email-${productId}`}>
          {t("emailLabel")}
        </label>
        <input
          id={`restock-email-${productId}`}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          maxLength={254}
          dir="ltr"
          placeholder={t("emailPlaceholder")}
          aria-invalid={error ? true : undefined}
          className="h-12 min-w-0 flex-1 rounded-full border-[1.5px] border-(--sf-line) bg-(--sf-paper) px-4 text-base text-(--sf-ink) outline-none placeholder:text-(--sf-muted) focus:border-(--sf-brand)"
        />
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-full bg-(--sf-brand) px-5 text-[15px] font-bold text-(--sf-brand-ink) disabled:opacity-60 sm:w-auto"
        >
          {isPending && <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />}
          {t("submit")}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-[13px] font-semibold" style={{ color: "var(--destructive,#dc2626)" }}>
          {error}
        </p>
      )}
    </form>
  );
}
