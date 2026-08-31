"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { LogOut } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { logout } from "@/actions/auth";

interface UserMenuProps {
  name: string;
  email: string;
}

export function UserMenu({ name, email }: UserMenuProps) {
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("common");

  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-end sm:block">
        <p className="text-sm font-medium leading-tight">{name}</p>
        <p className="text-xs text-muted-foreground leading-tight">{email}</p>
      </div>
      <Button
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() => startTransition(() => logout())}
      >
        <LogOut className="size-4" />
        <span className="hidden sm:inline">{t("signOut")}</span>
      </Button>
    </div>
  );
}
