"use client";

import { Store } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components";
import { cn, getPublicUrl } from "@/lib/utils";

/** Store logos are full URLs or paths in the `sellers` bucket (backfilled from sellers.logo_url). */
export function storeLogoSrc(logoUrl: string | null | undefined): string | undefined {
  if (!logoUrl) return undefined;
  return /^https?:/.test(logoUrl) ? logoUrl : getPublicUrl(logoUrl, "sellers");
}

export function StoreLogo({
  name,
  logoUrl,
  className,
}: {
  name: string;
  logoUrl: string | null | undefined;
  className?: string;
}) {
  return (
    <Avatar className={cn("size-8 shrink-0 rounded-lg border border-sidebar-border", className)}>
      <AvatarImage src={storeLogoSrc(logoUrl)} alt="" className="object-cover" />
      <AvatarFallback className="rounded-lg bg-primary-soft text-xs font-semibold text-primary-ink">
        {name.slice(0, 1).toUpperCase() || <Store className="size-4" />}
      </AvatarFallback>
    </Avatar>
  );
}
