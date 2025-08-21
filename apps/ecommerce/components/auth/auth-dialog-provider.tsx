"use client";

import { AuthDialog } from "./auth-dialog";
import { useAuthDialog } from "@/hooks/use-auth-dialog";

export const AuthDialogProvider = () => {
  const { isOpen, mode, close } = useAuthDialog();

  return <AuthDialog open={isOpen} onOpenChange={close} defaultMode={mode} />;
};
