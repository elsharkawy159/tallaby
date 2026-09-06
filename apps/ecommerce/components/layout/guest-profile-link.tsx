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
  const isMobile = variant === "mobile";

  return (
    <Button
      asChild
      variant="ghost"
      size={isMobile ? undefined : "icon"}
      className={cn(
        isMobile
          ? "relative h-auto min-w-0 flex-1 basis-0 shrink flex flex-col rtl:flex-col items-center justify-center gap-1 rounded-none px-1 py-2 text-gray-500 hover:bg-transparent hover:text-primary transition-colors sm:px-2"
          : "text-white hover:text-gray-200 hover:bg-transparent cursor-pointer transition-colors",
        className
      )}
      title={displayName ? t("welcome", { name: displayName }) : t("myProfile")}
    >
      <Link href="/profile">
        {isMobile ? (
          <>
            <span className="relative inline-flex items-center justify-center rounded-full p-1.5">
              <UserIcon className="size-5" />
            </span>
            <span className="w-full truncate text-center text-[11px] leading-none">
              {t("myProfile")}
            </span>
          </>
        ) : (
          <UserIcon className="size-6" />
        )}
      </Link>
    </Button>
  );
}
