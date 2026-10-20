import { siInstagram, siPinterest, siThreads, siTiktok, siWhatsapp, siX, siYoutube } from "simple-icons";
import { cn } from "@workspace/ui/lib/utils";

const ICONS = {
  instagram: siInstagram,
  tiktok: siTiktok,
  youtube: siYoutube,
  x: siX,
  pinterest: siPinterest,
  threads: siThreads,
  whatsapp: siWhatsapp,
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
