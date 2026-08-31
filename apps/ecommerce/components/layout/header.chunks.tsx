"use client";

import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@/lib/utils";
import type { User } from "@supabase/supabase-js";
import { useTranslations } from "next-intl";
import {
  getSellerCtaHref,
  getSellerCtaOpensInNewTab,
  isExistingSeller,
} from "@/lib/seller/seller-cta.lib";

export const BecomeSellerButton = ({
  className,
  user,
}: {
  className?: string;
  user: User | null;
}) => {
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
