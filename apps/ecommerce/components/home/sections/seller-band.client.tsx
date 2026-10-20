"use client";

import type { ComponentProps } from "react";
import { Link } from "@/i18n/navigation";
import { useAuthUser } from "@/lib/auth/use-auth-user";
import {
  getSellerCtaHref,
  getSellerCtaOpensInNewTab,
} from "@/lib/seller/seller-cta.lib";

/** Guests and customers go to the dashboard signup; existing sellers go to their dashboard. */
export function StartSellingLink(props: Omit<ComponentProps<typeof Link>, "href">) {
  const { user } = useAuthUser();
  const opensInNewTab = getSellerCtaOpensInNewTab(user);

  return (
    <Link
      {...props}
      href={getSellerCtaHref(user, { fromSellPage: true })}
      target={opensInNewTab ? "_blank" : undefined}
      rel={opensInNewTab ? "noopener noreferrer" : undefined}
    />
  );
}
