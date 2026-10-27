import { siFacebook, siInstagram, siPinterest, siThreads, siTiktok, siWhatsapp, siX, siYoutube } from "simple-icons";
import { getSocialPlatform } from "@workspace/store-sections/social";
import { cn } from "@workspace/ui/lib/utils";

const ICONS = {
  facebook: siFacebook,
  instagram: siInstagram,
  tiktok: siTiktok,
  youtube: siYoutube,
  x: siX,
  pinterest: siPinterest,
  threads: siThreads,
  whatsapp: siWhatsapp,
  // Simple Icons removed LinkedIn; the store platforms list keeps its last version.
  linkedin: { path: getSocialPlatform("linkedin")!.icon },
} as const;

export type BrandIconName = keyof typeof ICONS;

/** Social brand marks (lucide dropped its brand icons). */
export function BrandIcon({ name, className }: { name: BrandIconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("size-[18px] fill-current", className)}>
      <path d={ICONS[name].path} />
    </svg>
  );
}
