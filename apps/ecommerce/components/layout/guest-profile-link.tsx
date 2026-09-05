"use client";

import { Link } from "@/i18n/navigation";
import { User as UserIcon } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface GuestProfileLinkProps {
  variant?: "mobile" | "desktop";
  className?: string;
  displayName?: string;
}

export function GuestProfileLink({
  variant = "desktop",
  className,
  displayName,
}: GuestProfileLinkProps) {
  const t = useTranslations("profile");

  return (
    <Button
      asChild
      variant="ghost"
      size="icon"
      className={cn(
        "text-white hover:text-gray-200 hover:bg-transparent cursor-pointer transition-colors",
        variant === "mobile" &&
          "h-auto flex-1 flex flex-col rtl:flex-col items-center justify-center gap-1 py-2 text-gray-500 hover:text-primary transition-colors",
        className
      )}
      title={displayName ? t("welcome", { name: displayName }) : t("myProfile")}
    >
      <Link href="/profile">
        <UserIcon className="md:size-6 size-4.5" />
        {variant === "mobile" && (
          <span className="text-[11px] leading-none">{t("myProfile")}</span>
        )}
      </Link>
    </Button>
  );
}
