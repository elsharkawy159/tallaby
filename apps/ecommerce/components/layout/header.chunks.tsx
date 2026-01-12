"use client";

import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@/lib/utils";
import type { User } from "@supabase/supabase-js";
import { useTranslations } from "next-intl";

export const BecomeSellerButton = ({
  className,
  user,
}: {
  className?: string;
  user: User | null;
}) => {
  const t = useTranslations("onboarding");

  return (
    <Button asChild className={cn("text-sm", className)} size="sm">
      <Link
        href={
          user?.user_metadata?.is_seller
            ? "https://dashboard.tallaby.com/"
            : "/auth?redirect=/onboarding"
        }
        target={user?.user_metadata?.is_seller ? "_blank" : "_self"}
      >
        {user?.user_metadata?.is_seller ? t("viewDashboard") : t("startSelling")}
      </Link>
    </Button>
  );
};
