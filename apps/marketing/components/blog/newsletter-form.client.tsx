"use client";

import * as React from "react";
import { CircleCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { CtaButton } from "@/components/site/cta-button";

/**
 * Newsletter signup. UI only for now: there is no newsletter list or table
 * yet, so the address is not stored anywhere.
 */
export function NewsletterForm() {
  const t = useTranslations("blog.index");
  const tc = useTranslations("common");
  const [done, setDone] = React.useState(false);

  return (
    <div className="relative z-[1]">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.currentTarget.reset();
          setDone(true);
        }}
        className="flex flex-col gap-1.5 rounded-[18px] bg-white p-1.5 sm:flex-row sm:rounded-full"
      >
        <input
          type="email"
          required
          dir="ltr"
          placeholder="you@example.com"
          aria-label={tc("email")}
          className="h-[46px] min-w-0 flex-1 bg-transparent px-[18px] text-teal-900 outline-none sm:h-auto"
        />
        <CtaButton type="submit">{t("subscribe")}</CtaButton>
      </form>
      <div role="status" className="mt-2.5 flex min-h-[22px] items-center gap-1.5 text-sm text-[#86efac]">
        {done ? (
          <>
            <CircleCheck className="size-4" aria-hidden />
            {t("subscribed")}
          </>
        ) : null}
      </div>
    </div>
  );
}
