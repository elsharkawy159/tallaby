"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { cn } from "@workspace/ui/lib/utils";
import { CtaButton } from "@/components/marketing/site/cta-button";
import { ROOT_DOMAIN, slugify } from "@/lib/marketing/site.lib";
import { useSignup } from "./signup-dialog.client";
import type { SignupPlanHint } from "./signup-hint.lib";

type CtaButtonProps = React.ComponentProps<typeof CtaButton>;

/**
 * Any "Create your store" button: opens the signup dialog. `plan="pro"` (the
 * Pro card) sends the new seller to the dashboard's Plans page after signup;
 * it never picks a plan on the server.
 */
export function SignupTrigger({
  children,
  onClick,
  plan,
  ...props
}: Omit<CtaButtonProps, "asChild"> & { plan?: SignupPlanHint }) {
  const t = useTranslations("common");
  const { openSignup } = useSignup();
  return (
    <CtaButton
      type="button"
      onClick={(e) => {
        onClick?.(e);
        openSignup(undefined, null, plan ? { plan } : undefined);
      }}
      {...props}
    >
      {children ?? t("createStore")}
    </CtaButton>
  );
}

/**
 * "yourbrand.tallaby.com [Claim]" pill. Submitting opens the signup dialog
 * with the link filled in.
 */
export function SlugClaimForm({
  submitLabel,
  value,
  onValueChange,
  inputId,
  flat,
  className,
}: {
  submitLabel?: React.ReactNode;
  /** Controlled value, when the parent mirrors it elsewhere (hero preview). */
  value?: string;
  onValueChange?: (slug: string) => void;
  inputId?: string;
  /** No drop shadow, for use inside a card. */
  flat?: boolean;
  className?: string;
}) {
  const t = useTranslations("common");
  const { openSignup } = useSignup();
  const [local, setLocal] = React.useState("");
  const slug = value ?? local;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        openSignup(slug);
      }}
      className={cn(
        "flex max-w-[540px] flex-col items-stretch gap-1.5 rounded-[18px] bg-white p-1.5 sm:flex-row sm:items-center sm:gap-0 sm:rounded-full",
        !flat && "border-[1.5px] border-line-strong shadow-[0_10px_30px_rgba(20,81,99,0.08)]",
        className,
      )}
    >
      <label dir="ltr" className="flex h-12 min-w-0 flex-1 cursor-text items-center px-3 text-base text-neutral-600 sm:h-auto sm:text-[15px] sm:ps-[18px] sm:pe-2">
        <span className="sr-only">{t("storeLink")}</span>
        <input
          id={inputId}
          name="slug"
          value={slug}
          onChange={(e) => {
            const next = slugify(e.target.value);
            setLocal(next);
            onValueChange?.(next);
          }}
          placeholder="yourbrand"
          autoComplete="off"
          spellCheck={false}
          aria-label={t("storeLink")}
          className="min-w-0 flex-1 bg-transparent p-0 text-left font-latin text-base font-semibold text-teal-900 outline-none"
        />
        <span className="font-latin font-medium text-neutral-500">.{ROOT_DOMAIN}</span>
      </label>
      <CtaButton type="submit" className="w-full rounded-xl sm:w-auto sm:rounded-full">
        {submitLabel ?? t("claimLink")}
      </CtaButton>
    </form>
  );
}

