import * as React from "react";
import { MapPin, Navigation } from "lucide-react";
import type { VariantProps } from "class-variance-authority";

import { Button, buttonVariants } from "@workspace/ui/components/button";
import {
  getGoogleMapsUrl,
  hasValidCoordinates,
  type MapsLinkType,
} from "@workspace/ui/lib/maps";

interface MapsLinkButtonProps
  extends Omit<React.ComponentProps<"a">, "href" | "type">,
    VariantProps<typeof buttonVariants> {
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  type: MapsLinkType;
  label?: string;
}

const DEFAULT_LABELS: Record<MapsLinkType, string> = {
  navigation: "Navigation",
  location: "Location",
};

function MapsLinkButton({
  latitude,
  longitude,
  type,
  label,
  variant = "outline",
  size = "sm",
  className,
  ...props
}: MapsLinkButtonProps) {
  if (!hasValidCoordinates(latitude, longitude)) {
    return null;
  }

  const href = getGoogleMapsUrl(latitude as number, longitude as number, type);
  const text = label ?? DEFAULT_LABELS[type];
  const Icon = type === "navigation" ? Navigation : MapPin;

  return (
    <Button variant={variant} size={size} className={className} asChild>
      <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
        <Icon className="size-4" />
        {text}
      </a>
    </Button>
  );
}

export { MapsLinkButton };
export type { MapsLinkButtonProps };
