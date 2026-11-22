export type QrDestination = { kind: "home" } | { kind: "page" | "product"; slug: string };

export function qrDestinationUrl(baseUrl: string, destination: QrDestination): string {
  const base = baseUrl.replace(/\/+$/, "");
  if (destination.kind === "home") return `${base}/`;
  if (destination.kind === "product") return productPageUrl(base, destination.slug);
  return `${base}/${encodeURIComponent(destination.slug)}`;
}

export const QR_PNG_OPTIONS = {
  errorCorrectionLevel: "M",
  margin: 4,
  width: 1024,
} as const;
import { productPageUrl } from "@/lib/products/product-view-url.lib";

