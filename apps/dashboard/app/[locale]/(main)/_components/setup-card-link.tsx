import { Link } from "@/i18n/navigation";

/**
 * Makes a whole setup step card open its step (owner, 2026-11-26): an empty
 * link laid over the `relative` card. Screen readers and the keyboard skip it,
 * since the card's own visible button is the real link; put that button above
 * it with `relative z-[1]`. A separate element, not a stretched `::after`,
 * because the amber button moves on hover (a transform would trap the layer).
 */
export function CardOverlayLink({ href }: { href: string }) {
  return <Link href={href} aria-hidden tabIndex={-1} className="absolute inset-0 rounded-[inherit]" />;
}
