"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@workspace/ui/components/button";
import { ConfirmActionDialog } from "@/components/layout/confirm-action-dialog.client";

/**
 * "Disconnect" for an app sheet. It asks first, because disconnecting drops
 * the saved settings (and, for Google, revokes the grant). On success the
 * sheet closes, which also closes this dialog; on failure it stays open.
 */
export function DisconnectAppButton({
  className,
  disabled,
  pending,
  description,
  onConfirm,
}: {
  className?: string;
  disabled?: boolean;
  pending: boolean;
  /** What the seller loses; defaults to the generic text. */
  description?: string;
  onConfirm: () => void;
}) {
  const t = useTranslations("storeApps");
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className={className}
        disabled={disabled || pending}
        onClick={() => setOpen(true)}
      >
        {t("disconnect")}
      </Button>
      <ConfirmActionDialog
        open={open}
        onOpenChange={setOpen}
        title={t("disconnectConfirm.title")}
        description={description ?? t("disconnectConfirm.description")}
        confirmLabel={t("disconnect")}
        destructive
        pending={pending}
        onConfirm={onConfirm}
      />
    </>
  );
}
