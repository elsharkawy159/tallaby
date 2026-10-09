"use client";

import type { ReactElement } from "react";
import { Link } from "@/i18n/navigation";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import {
  getSellerCtaHref,
  getSellerCtaOpensInNewTab,
  isExistingSeller,
} from "@/lib/seller/seller-cta.lib";
import { useAuthUser } from "@/lib/auth/use-auth-user";

/** Plain-text seller entry for the top bar; same destination as the button. */
export const SellOnTallabyLink = ({
  className,
}: {
  className?: string;
}): ReactElement => {
  const { user } = useAuthUser();
  const t = useTranslations("topbar");
  const opensInNewTab = getSellerCtaOpensInNewTab(user);

  return (
    <Link
      href={getSellerCtaHref(user)}
      target={opensInNewTab ? "_blank" : undefined}
      rel={opensInNewTab ? "noopener noreferrer" : undefined}
      className={className}
    >
      {t("sellOnTallaby")}
    </Link>
  );
};

export const BecomeSellerButton = ({
  className,
}: {
  className?: string;
}): ReactElement => {
  const { user } = useAuthUser();
  const t = useTranslations("onboarding");
  const href = getSellerCtaHref(user);
  const opensInNewTab = getSellerCtaOpensInNewTab(user);
  const label = isExistingSeller(user) ? t("viewDashboard") : t("startSelling");

  return (
    <Button asChild className={cn("text-sm", className)} size="sm">
      <Link
        href={href}
        target={opensInNewTab ? "_blank" : undefined}
        rel={opensInNewTab ? "noopener noreferrer" : undefined}
      >
        {label}
      </Link>
    </Button>
  );
};
