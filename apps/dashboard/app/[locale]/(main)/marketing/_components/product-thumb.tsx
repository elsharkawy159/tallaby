import Image from "next/image";
import { ImageOff } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import { isOptimizableImage } from "@/lib/image-hosts";
import { getPublicUrl } from "@/lib/utils";

type Props = {
  /** Storage path or full URL, as stored on the product. */
  image: string | null;
  /** Rendered size in px; also sizes the optimized request. */
  size: number;
  className?: string;
};

/** Square product thumbnail with a placeholder when there is no image. */
export function ProductThumb({ image, size, className }: Props) {
  const src = image ? getPublicUrl(image, "products") : "";

  return (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted text-muted-foreground",
        className
      )}
      style={{ width: size, height: size }}
    >
      {src ? (
        <Image
          src={src}
          alt=""
          fill
          sizes={`${size}px`}
          // Imported products can point at hosts next/image isn't configured for.
          unoptimized={!isOptimizableImage(src)}
          className="object-cover"
        />
      ) : (
        <ImageOff className="size-4" aria-hidden />
      )}
    </span>
  );
}
