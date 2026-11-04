import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ImageIcon, Star } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import { SellerCard, SellerCardHeader, TextAction } from "@/components/seller-ui";

/*
 * Home's names for seller-ui parts, plus what only home and reports use.
 * Reports and store views import these too, so they follow the design system.
 * New pages should import from "@/components/seller-ui" directly.
 */

export { DeltaBadge, EmptyState, IconTile, type Tone } from "@/components/seller-ui";

export const HomeCard = SellerCard;

export function HomeCardHeader(props: React.ComponentProps<typeof SellerCardHeader>) {
  return <SellerCardHeader {...props} />;
}

/** Quiet "see all" link in a card header. The arrow follows reading direction. */
export function HeaderLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <TextAction asChild>
      <Link href={href}>
        {children}
        <ArrowLeft className="ltr:rotate-180" aria-hidden />
      </Link>
    </TextAction>
  );
}

export function StarRating({ value, label }: { value: number; label?: string }) {
  const filled = Math.round(value);
  return (
    <span className="inline-flex gap-px text-accent" role="img" aria-label={label}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={cn("size-[13px] fill-current", i > filled && "text-(--s-line)")} aria-hidden />
      ))}
    </span>
  );
}

/** Product thumbnail with a hatched placeholder when there is no image. */
export function ProductThumb({ src, alt = "" }: { src: string | null; alt?: string }) {
  return (
    <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-(--s-line) bg-(--s-fill) bg-[repeating-linear-gradient(135deg,transparent_0_6px,color-mix(in_oklab,var(--border)_70%,transparent)_6px_7px)] text-(--s-faint)">
      {src ? (
        <Image src={src} alt={alt} width={44} height={44} sizes="44px" className="size-full object-cover" />
      ) : (
        <ImageIcon className="size-4" aria-hidden />
      )}
    </span>
  );
}

/** Percent change from `previous` to `current`, or null when there is no baseline. */
export function percentChange(current: number, previous: number): number | null {
  if (previous <= 0) return current > 0 ? null : 0;
  return ((current - previous) / previous) * 100;
}

/** A Simple Icons brand mark (24×24 path) in the current text colour. */
export function BrandIcon({ path, className }: { path: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={cn("size-[15px]", className)} aria-hidden>
      <path d={path} />
    </svg>
  );
}
