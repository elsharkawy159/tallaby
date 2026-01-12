"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

  // Don't add redirect if already on login page
  const loginUrl =
    pathname === "/auth"
      ? "/auth"
      : `/auth?redirect=${encodeURIComponent(pathname)}`;

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
      title="Sign in to your account"
    >
      <Link href={loginUrl}>
        <UserIcon className={"md:size-6 size-4.5"} />
        {variant === "mobile" && <span className="text-xs">{t("signIn")}</span>}
      </Link>
    </Button>
  );
}
