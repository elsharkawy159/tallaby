"use client";

import { Copy, MapPin, Phone } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@workspace/ui/components/button";

import { getGoogleMapsUrl } from "@/lib/maps";

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
  const mapsUrl = getGoogleMapsUrl(latitude, longitude, address);

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

      <Button variant="outline" className="h-12 flex-col gap-1 text-xs" asChild>
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
          <MapPin className="size-4" />
          {t("maps")}
        </a>
      </Button>

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
