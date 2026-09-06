"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { User as UserIcon } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface AuthLinkClientProps {
  variant?: "mobile" | "desktop";
  className?: string;
}

export function AuthLinkClient({
  variant = "desktop",
  className,
}: AuthLinkClientProps) {
  const pathname = usePathname();
  const t = useTranslations("auth");
  const isMobile = variant === "mobile";

  // Don't add redirect if already on login page
  const loginUrl =
    pathname === "/auth"
      ? "/auth"
      : `/auth?redirect=${encodeURIComponent(pathname)}`;

  return (
    <Button
      asChild
      variant="ghost"
      size={isMobile ? undefined : "icon"}
      className={cn(
        isMobile
          ? "relative h-auto min-w-0 flex-1 basis-0 shrink flex flex-col rtl:flex-col items-center justify-center gap-1 rounded-none px-2 py-2 text-gray-500 hover:bg-transparent hover:text-primary transition-colors"
          : "text-white hover:text-gray-200 hover:bg-transparent cursor-pointer transition-colors",
        className
      )}
      title={t("signInToYourAccount")}
    >
      <Link href={loginUrl}>
        {isMobile ? (
          <>
            <span className="relative inline-flex items-center justify-center rounded-full p-1.5">
              <UserIcon className="size-5" />
            </span>
            <span className="w-full truncate text-center text-[11px] leading-none">
              {t("signIn")}
            </span>
          </>
        ) : (
          <UserIcon className="size-6" />
        )}
      </Link>
    </Button>
  );
}
