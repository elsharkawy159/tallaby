"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@workspace/ui/components/button";
import { logout } from "@/actions/auth";

export function RiderSignOut() {
  const t = useTranslations("rider");
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={t("signOut")}
      disabled={isPending}
      onClick={() => startTransition(() => logout())}
    >
      <LogOut className="size-4" />
    </Button>
  );
}
