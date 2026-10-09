import Image from "next/image";
import { cn } from "@workspace/ui/lib/utils";
import { getPublicUrl } from "@workspace/ui/lib/utils";
import s from "../storefront.module.css";

/** The seller's round logo, or their initial when they haven't uploaded one. */
export function StoreLogo({
  name,
  logoUrl,
  className,
  size = 36,
}: {
  name: string;
  logoUrl: string | null;
  className?: string;
  size?: number;
}) {
  return (
    <span
      className={cn(s.logo, className)}
      style={{ width: size, height: size, fontSize: size * 0.45 }}
      aria-hidden
    >
      {logoUrl ? (
        <Image
          src={getPublicUrl(logoUrl, "sellers")}
          alt=""
          fill
          sizes={`${size}px`}
          className="object-cover"
        />
      ) : (
        name.trim().charAt(0).toUpperCase()
      )}
    </span>
  );
}
