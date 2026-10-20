"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useSignup } from "@/components/marketing/signup/signup-dialog.client";
import { ROOT_DOMAIN, slugify } from "@/lib/marketing/site.lib";
import { CtaButton } from "./cta-button";

/** The footer's opening line: type a brand name straight into a big store link. */
export function FooterClaim() {
  const t = useTranslations("siteFooter");
  const tc = useTranslations("common");
  const { openSignup } = useSignup();
  const [slug, setSlug] = React.useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        openSignup(slug);
      }}
      className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"
    >
      <label className="min-w-0 flex-1">
        <span className="mb-3 block text-[15px] text-mist">{t("claimPrompt")}</span>
        <span
          dir="ltr"
          className="flex min-w-0 items-baseline border-b-2 border-white/15 pb-2 font-latin text-[clamp(30px,5.2vw,60px)] leading-none font-extrabold tracking-[-0.03em] transition-colors focus-within:border-amber-600"
        >
          <input
            value={slug}
            onChange={(e) => setSlug(slugify(e.target.value))}
            placeholder="yourbrand"
            autoComplete="off"
            spellCheck={false}
            aria-label={tc("storeLink")}
            size={Math.max(slug.length, 9)}
            className="min-w-0 bg-transparent text-amber-600 outline-none placeholder:text-amber-600/45"
          />
          <span className="truncate text-white/80">.{ROOT_DOMAIN}</span>
        </span>
      </label>
      <CtaButton type="submit" size="lg" className="self-start lg:self-auto">
        {tc("claimLink")}
      </CtaButton>
    </form>
  );
}
