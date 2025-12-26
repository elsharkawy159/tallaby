"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User as UserIcon } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@/lib/utils";

interface AuthLinkClientProps {
  variant?: "mobile" | "desktop";
  className?: string;
}

export function AuthLinkClient({
  variant = "desktop",
  className,
}: AuthLinkClientProps) {
  const pathname = usePathname();

  // Don't add redirect if already on login page
  const loginUrl =
    pathname === "/login"
      ? "/login"
      : `/login?redirect=${encodeURIComponent(pathname)}`;

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
        <UserIcon className={cn("size-6", variant === "mobile" && "size-5")} />
        {variant === "mobile" && <span className="text-xs">Sign In</span>}
      </Link>
    </Button>
  );
}
