"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";

import { Button } from "@workspace/ui/components/button";
import { logout } from "@/actions/auth";

export function RiderSignOut() {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Sign out"
      disabled={isPending}
      onClick={() => startTransition(() => logout())}
    >
      <LogOut className="size-4" />
    </Button>
  );
}
