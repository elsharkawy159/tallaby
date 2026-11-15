import { Check } from "lucide-react";
import Image from "next/image";
import type { StoreAppKey } from "@workspace/lib/integrations";
import { cn } from "@workspace/ui/lib/utils";
import { APP_BRANDS } from "./apps-brand.lib";

/**
 * A store app's brand tile (Apps page, Shipping › Shipping companies,
 * Payment methods › Online card payments), with a green check when connected.
 */
export function AppLogo({ app, connected, className }: { app: StoreAppKey; connected?: boolean; className?: string }) {
  const brand = APP_BRANDS[app];
  return (
    <span
      className={cn(
        "relative grid size-12 shrink-0 place-items-center rounded-[14px]",
        brand.image
          ? "bg-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)]"
          : brand.dark && "shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]",
        className,
      )}
      style={brand.image ? undefined : { background: brand.bg }}
      aria-hidden
    >
      {brand.image ? (
        <Image src={brand.image} alt="" width={96} height={96} className="size-full overflow-hidden rounded-[inherit] object-cover" />
      ) : (
        <svg viewBox="0 0 24 24" className="size-[52%]" style={{ fill: brand.fg }}>
          <path d={brand.icon.path} />
        </svg>
      )}
      {connected && (
        <span className="absolute -end-1 -bottom-1 grid size-[18px] place-items-center rounded-full bg-success text-background ring-[3px] ring-card">
          <Check className="size-[11px] stroke-[3]" aria-hidden />
        </span>
      )}
    </span>
  );
}
