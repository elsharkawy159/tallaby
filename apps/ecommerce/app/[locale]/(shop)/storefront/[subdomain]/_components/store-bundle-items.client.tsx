"use client";

import { useTranslations } from "next-intl";
import type { BundleContentItem } from "@workspace/lib/products/bundles";
import { Link } from "@/i18n/navigation";
import { ImageWithFallback } from "@/components/shared/image-with-fallback";

/**
 * "What's in the bundle" in the store's buy box (0188, ROADMAP.md F-07f): each
 * item's photo, name (a link only when shoppers can open the item), variant and
 * count. Drawn in the store's look (`--sf-*` tokens). Nothing without items.
 */
export function StoreBundleItems({ items }: { items: readonly BundleContentItem[] | undefined }) {
  const t = useTranslations("storeProduct.bundle");
  if (!items?.length) return null;
  return (
    <section className="mb-5 rounded-xl border border-(--sf-line) p-3" aria-labelledby="sf-bundle-title">
      <h2 id="sf-bundle-title" className="mb-2 text-sm font-semibold text-(--sf-ink)">
        {t("title")}
      </h2>
      <ul className="grid gap-2">
        {items.map((item) => {
          const name = <span className="line-clamp-2 break-words text-sm font-medium text-(--sf-ink)">{item.name}</span>;
          return (
            <li key={`${item.productId}:${item.variantName ?? ""}`} className="flex min-w-0 items-center gap-3">
              <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-(--sf-shelf)">
                <ImageWithFallback src={item.image ?? ""} alt="" fill sizes="48px" className="object-contain p-1" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                {item.slug ? (
                  <Link href={`/products/${encodeURIComponent(item.slug)}`} className="hover:underline">
                    {name}
                  </Link>
                ) : (
                  name
                )}
                {item.variantName && <span className="text-xs text-(--sf-muted)">{item.variantName}</span>}
              </span>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-(--sf-ink)" dir="ltr">
                ×{item.quantity}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
