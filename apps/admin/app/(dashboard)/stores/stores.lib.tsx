import { Badge } from "@workspace/ui/components/badge";
import { cn } from "@workspace/ui/lib/utils";
import type { IntegrationProvider } from "@workspace/lib/integrations";

const SITE_CLASSES: Record<string, string> = {
  published: "bg-green-100 text-green-900 border-green-200",
  draft: "bg-gray-100 text-gray-800 border-gray-200",
  unpublished: "bg-amber-100 text-amber-900 border-amber-200",
};

const STORE_CLASSES: Record<string, string> = {
  active: "bg-green-100 text-green-900 border-green-200",
  archived: "bg-gray-100 text-gray-800 border-gray-200",
  suspended: "bg-red-100 text-red-900 border-red-200",
};

export function SiteStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={cn("font-normal capitalize", SITE_CLASSES[status])}>
      {status}
    </Badge>
  );
}

export function StoreStatusBadge({ status }: { status: string }) {
  if (status === "active") return null;
  return (
    <Badge variant="outline" className={cn("font-normal capitalize", STORE_CLASSES[status])}>
      {status}
    </Badge>
  );
}

export function formatAdminDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cod: "Cash on delivery",
  vodafone_cash: "Vodafone Cash",
  e_cash: "Etisalat Cash",
  we_pay: "WE Pay",
  orange_cash: "Orange Cash",
  instapay: "InstaPay",
};

/** Every store app provider's name (registry + DB CHECK); one list for the admin pages and the bell. */
export const PROVIDER_LABELS: Record<IntegrationProvider, string> & Record<string, string> = {
  meta_pixel: "Meta Pixel",
  google_analytics: "Google Analytics",
  google_tag_manager: "Google Tag Manager",
  meta_capi: "Meta Conversions API",
  tiktok_pixel: "TikTok Pixel",
  snapchat_pixel: "Snapchat Pixel",
  google_sheets: "Google Sheets",
  shopify_import: "Shopify import",
  bosta: "Bosta",
  paymob: "Paymob (seller gateway)",
  kashier: "Kashier (seller gateway)",
  wassalha: "Wassalha (Egypt Post)",
};

const INTEGRATION_CLASSES: Record<string, string> = {
  connected: "bg-green-100 text-green-900 border-green-200",
  error: "bg-red-100 text-red-900 border-red-200",
  disconnected: "bg-gray-100 text-gray-800 border-gray-200",
};

export function IntegrationStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={cn("font-normal capitalize", INTEGRATION_CLASSES[status])}>
      {status}
    </Badge>
  );
}

/** A localized jsonb value ({ en, ar }) or plain string → one display string. */
export function localizedText(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of ["en", "ar"]) if (typeof record[key] === "string" && record[key]) return record[key] as string;
  }
  return "—";
}
