import { and, db, eq, isNull, sellers, stores, storeSiteRevisions } from "@workspace/db";
import { storeEmailBrand, type EmailBrand, type EmailLocale } from "@workspace/emails";
import { storeHostname, storeUrl } from "@workspace/lib/storefront";
import { findActiveCustomDomainForSubdomain } from "@workspace/lib/storefront/server";

export interface StoreEmailContext {
  storeId: string;
  sellerId: string;
  name: string;
  subdomain: string;
  /** Public storefront origin (custom domain when active). */
  url: string;
  host: string;
  brand: EmailBrand;
  defaultLocale: EmailLocale | null;
}

interface SnapshotDesign {
  colors?: { primary?: unknown; accent?: unknown };
  typography?: { bodyFont?: unknown; arabicFont?: unknown };
}

function readDesign(snapshot: unknown): SnapshotDesign | null {
  if (!snapshot || typeof snapshot !== "object") return null;
  const design = (snapshot as { designSystem?: unknown }).designSystem;
  return design && typeof design === "object" ? (design as SnapshotDesign) : null;
}

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/** Store fonts are all Google Fonts (packages/store-sections/src/core/fonts.ts). */
function googleFontUrl(name: string): string {
  return `https://fonts.googleapis.com/css2?family=${encodeURIComponent(name).replace(/%20/g, "+")}:wght@400;600;700&display=swap`;
}

/**
 * A store's identity for its customers' mail: name, logo and the colours and
 * font of its PUBLISHED site (never the builder draft). A store that never
 * published keeps Tallaby's colours with its own name.
 */
export async function loadStoreEmailContext(
  storeId: string,
  locale: EmailLocale,
): Promise<StoreEmailContext | null> {
  const [row] = await db
    .select({
      id: stores.id,
      sellerId: stores.sellerId,
      name: stores.name,
      subdomain: stores.subdomain,
      logoUrl: stores.logoUrl,
      defaultLocale: stores.defaultLocale,
      supportEmail: sellers.supportEmail,
      snapshot: storeSiteRevisions.snapshot,
    })
    .from(stores)
    .innerJoin(sellers, eq(sellers.id, stores.sellerId))
    .leftJoin(storeSiteRevisions, eq(storeSiteRevisions.id, stores.publishedRevisionId))
    .where(and(eq(stores.id, storeId), isNull(stores.deletedAt)))
    .limit(1);
  if (!row) return null;

  const customDomain = await findActiveCustomDomainForSubdomain(row.subdomain).catch(() => null);
  const url = storeUrl(row.subdomain, customDomain);
  const design = readDesign(row.snapshot);
  const font = str(locale === "ar" ? design?.typography?.arabicFont : null) ?? str(design?.typography?.bodyFont);

  return {
    storeId: row.id,
    sellerId: row.sellerId,
    name: row.name,
    subdomain: row.subdomain,
    url,
    host: storeHostname(row.subdomain, customDomain),
    defaultLocale: row.defaultLocale === "ar" || row.defaultLocale === "en" ? row.defaultLocale : null,
    brand: storeEmailBrand({
      name: row.name,
      homeUrl: url,
      logoUrl: row.logoUrl,
      primary: str(design?.colors?.primary),
      accent: str(design?.colors?.accent),
      fontFamily: font,
      fontUrl: font ? googleFontUrl(font) : null,
      supportEmail: row.supportEmail,
    }),
  };
}
