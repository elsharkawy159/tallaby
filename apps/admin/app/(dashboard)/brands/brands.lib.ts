import type { Brand, BrandStats, Locale } from "./brands.types";

export function formatDate(date: string | null | undefined): string {
  if (!date) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(new Date(date));
}

export function formatDateShort(date: string | null | undefined): string {
  if (!date) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "short",
  }).format(new Date(date));
}

export function getBrandDisplayName(
  brand: Brand,
  locale: Locale = "en"
): string {
  if (locale === "ar" && brand.nameAr) {
    return brand.nameAr;
  }
  return brand.name;
}

export function getBrandDisplaySlug(
  brand: Brand,
  locale: Locale = "en"
): string {
  if (locale === "ar" && brand.slugAr) {
    return brand.slugAr;
  }
  return brand.slug;
}

export function getBrandDisplayDescription(
  brand: Brand,
  locale: Locale = "en"
): string | null {
  if (locale === "ar" && brand.descriptionAr) {
    return brand.descriptionAr;
  }
  return brand.description || null;
}

export function calculateBrandStats(brands: Brand[]): BrandStats {
  const total = brands.length;
  const verified = brands.filter((b) => b.isVerified === true).length;
  const official = brands.filter((b) => b.isOfficial === true).length;
  const avgRating =
    brands.length > 0
      ? brands.reduce((sum, b) => sum + (b.averageRating || 0), 0) / total
      : 0;

  return {
    total,
    verified,
    official,
    avgRating,
  };
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .trim();
}

export function generateSlugAr(name: string): string {
  // For Arabic, we'll use transliteration or keep Arabic characters
  // This is a basic implementation - you may want to enhance this
  return name
    .toLowerCase()
    .replace(/[^\u0600-\u06FF\s-]/g, "") // Keep Arabic characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .trim();
}
