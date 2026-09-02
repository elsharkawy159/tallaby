"use client";

import type { ProductColorSwatch } from "@/lib/variant-colors";
import { cn } from "@/lib/utils";

interface ProductCardSwatchesProps {
  swatches: ProductColorSwatch[];
  overflow?: number;
  onHover?: (image: string | null) => void;
  className?: string;
}

export const ProductCardSwatches = ({
  swatches,
  overflow = 0,
  onHover,
  className,
}: ProductCardSwatchesProps) => {
  if (!swatches.length) return null;

  return (
    <div
      className={cn(
        "pointer-events-auto flex min-w-0 items-center gap-0.5 rounded-full bg-white/90 px-1 py-0.5 shadow-sm backdrop-blur-sm md:gap-1 md:px-1.5 md:py-1",
        className
      )}
      onClick={(event) => event.stopPropagation()}
    >
      {swatches.map((swatch) => (
        <span
          key={swatch.value}
          role="img"
          tabIndex={0}
          aria-label={swatch.label}
          title={swatch.label}
          className="size-3.5 shrink-0 rounded-full ring-1 ring-black/15 md:size-4"
          style={{ backgroundColor: swatch.hex }}
          onMouseEnter={() => onHover?.(swatch.image ?? null)}
          onMouseLeave={() => onHover?.(null)}
          onFocus={() => onHover?.(swatch.image ?? null)}
          onBlur={() => onHover?.(null)}
        />
      ))}
      {overflow > 0 && (
        <span
          className="px-0.5 text-[9px] font-medium text-gray-600 md:text-[10px]"
          aria-label={`${overflow} more colors`}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
};
