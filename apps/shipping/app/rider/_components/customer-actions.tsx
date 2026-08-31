"use client";

import { Copy, Phone } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@workspace/ui/components/button";
import { MapsLinkButton } from "@workspace/ui/components/maps-link-button";

interface CustomerActionsProps {
  phone: string | null;
  address: string;
  latitude: number | null;
  longitude: number | null;
}

export function CustomerActions({
  phone,
  address,
  latitude,
  longitude,
}: CustomerActionsProps) {
  const t = useTranslations("rider");

  return (
    <div className="grid grid-cols-3 gap-2">
      <Button
        variant="outline"
        className="h-12 flex-col gap-1 text-xs"
        disabled={!phone}
        asChild={!!phone}
      >
        {phone ? (
          <a href={`tel:${phone}`}>
            <Phone className="size-4" />
            {t("call")}
          </a>
        ) : (
          <span>
            <Phone className="size-4" />
            {t("call")}
          </span>
        )}
      </Button>

      <MapsLinkButton
        type="navigation"
        latitude={latitude}
        longitude={longitude}
        label={t("maps")}
        variant="outline"
        className="h-12 flex-col gap-1 text-xs"
      />

      <Button
        type="button"
        variant="outline"
        className="h-12 flex-col gap-1 text-xs"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(address);
            toast.success(t("addressCopied"));
          } catch {
            toast.error(t("addressCopyFailed"));
          }
        }}
      >
        <Copy className="size-4" />
        {t("copy")}
      </Button>
    </div>
  );
}
