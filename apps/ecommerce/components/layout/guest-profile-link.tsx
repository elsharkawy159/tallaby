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
          "flex flex-col items-center text-gray-600 hover:text-primary transition-colors",
        className
      )}
      title={displayName ? t("welcome", { name: displayName }) : t("myProfile")}
    >
      <Link href="/profile">
        <UserIcon className="md:size-6 size-4.5" />
        {variant === "mobile" && (
          <span className="text-xs">{t("myProfile")}</span>
        )}
      </Link>
    </Button>
  );
}
