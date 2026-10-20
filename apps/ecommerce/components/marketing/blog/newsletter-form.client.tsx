"use client";

import * as React from "react";
import { CircleAlert, CircleCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { CtaButton } from "@/components/marketing/site/cta-button";
import { subscribeToNewsletter } from "./newsletter.server";

type Status = { kind: "idle" } | { kind: "done" } | { kind: "error"; message: string };

/** Newsletter signup, stored in `newsletter_subscribers` (0072). */
export function NewsletterForm() {
  const t = useTranslations("blog.index");
  const tc = useTranslations("common");
  const locale = useLocale();
  const [status, setStatus] = React.useState<Status>({ kind: "idle" });
  const [pending, startTransition] = React.useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    startTransition(async () => {
      const result = await subscribeToNewsletter({
        email: String(data.get("email") ?? ""),
        locale: locale === "en" ? "en" : "ar",
        website: String(data.get("website") ?? ""),
      });
      if (result.ok) {
        form.reset();
        setStatus({ kind: "done" });
      } else {
        const key = result.error === "invalid" ? "subscribeInvalid" : result.error === "rateLimited" ? "subscribeRate" : "subscribeError";
        setStatus({ kind: "error", message: t(key) });
      }
    });
  }

  return (
    <div className="relative z-[1]">
      <form onSubmit={onSubmit} className="flex flex-col gap-1.5 rounded-[18px] bg-white p-1.5 sm:flex-row sm:rounded-full">
        <input
          type="email"
          name="email"
          required
          maxLength={200}
          autoComplete="email"
          dir="ltr"
          placeholder="you@example.com"
          aria-label={tc("email")}
          className="h-[46px] min-w-0 flex-1 bg-transparent px-[18px] text-teal-900 outline-none sm:h-auto"
        />
        <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
        <CtaButton type="submit" disabled={pending}>
          {t("subscribe")}
        </CtaButton>
      </form>
      <div role="status" className="mt-2.5 flex min-h-[22px] items-center gap-1.5 text-sm">
        {status.kind === "done" ? (
          <span className="flex items-center gap-1.5 text-[#86efac]">
            <CircleCheck className="size-4" aria-hidden />
            {t("subscribed")}
          </span>
        ) : status.kind === "error" ? (
          <span className="flex items-center gap-1.5 text-[#fca5a5]">
            <CircleAlert className="size-4" aria-hidden />
            {status.message}
          </span>
        ) : null}
      </div>
    </div>
  );
}
