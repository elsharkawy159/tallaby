"use client";

import { UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useAuthDialog } from "@/hooks/use-auth-dialog";
import { useAuthUserContext } from "@/providers/auth-provider";

const CLASS =
  "inline-flex h-10 items-center gap-1.5 rounded-full px-2.5 text-sm font-medium transition-colors hover:bg-(--sf-shelf) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--sf-brand) disabled:opacity-60";

/**
 * Sign-in of a builder header or footer (`accountLink` node): a guest opens
 * the sign-in dialog, a signed-in shopper goes to their account (/profile,
 * served on the store host). Only the icon on phones.
 */
export function StoreAccountButton() {
  const t = useTranslations("storefront.account");
  const { user, isLoading } = useAuthUserContext();
  const { open } = useAuthDialog();

  if (user) {
    return (
      <Link href="/profile" className={CLASS}>
        <UserRound className="size-4.5" aria-hidden />
        <span className="max-sm:sr-only">{t("myAccount")}</span>
      </Link>
    );
  }
  return (
    <button type="button" className={CLASS} disabled={isLoading} onClick={() => open("signin")}>
      <UserRound className="size-4.5" aria-hidden />
      <span className="max-sm:sr-only">{t("signIn")}</span>
    </button>
  );
}
