/**
 * Stock photos for the editor's Explore tab (owner request 2026-10-18):
 * shapes and pure helpers for the Pexels API. No secrets and no I/O here.
 */

import type { StockPhoto, StockPhotoPage } from "@workspace/store-editor";

export type { StockPhoto, StockPhotoPage };

/** The parts of a Pexels photo we read (https://www.pexels.com/api/documentation/#photos-overview). */
export type PexelsPhoto = {
  id: number;
  width: number;
  height: number;
  url?: string;
  alt?: string | null;
  avg_color?: string | null;
  photographer?: string | null;
  src?: { large2x?: string; large?: string; medium?: string; original?: string };
};

export const STOCK_PAGE_SIZE = 24;
export const PHOTO_ID_RE = /^\d{1,12}$/;

/** Image bytes are only ever fetched from Pexels' own image host over https. */
export function isPexelsImageUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "images.pexels.com";
  } catch {
    return false;
  }
}

/** Trimmed, collapsed search text (max 80 chars); empty when there is nothing to search. */
export function cleanQuery(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, 80) : "";
}

export function toStockPhoto(photo: PexelsPhoto): StockPhoto | null {
  const thumb = photo.src?.medium ?? photo.src?.large;
  if (!Number.isInteger(photo.id) || !isPexelsImageUrl(thumb)) return null;
  return {
    id: String(photo.id),
    thumbUrl: thumb,
    previewUrl: [photo.src?.large2x, photo.src?.large].find(isPexelsImageUrl) ?? thumb,
    width: photo.width,
    height: photo.height,
    alt: photo.alt?.trim() ?? "",
    avgColor: photo.avg_color && /^#[0-9a-f]{6}$/i.test(photo.avg_color) ? photo.avg_color : null,
    photographer: photo.photographer?.trim() ?? "",
    pageUrl: photo.url && photo.url.startsWith("https://www.pexels.com/") ? photo.url : "https://www.pexels.com/",
  };
}

/** Bounding boxes of the Pexels renditions we import (940×650 at 2x and 1x, ratio kept). */
const RENDITIONS = [
  { key: "large2x", w: 1880, h: 1300 },
  { key: "large", w: 940, h: 650 },
] as const;

/** What to import: the large 2x rendition, else the large one, with its expected size. */
export function importSource(photo: PexelsPhoto): { url: string; width: number; height: number } | null {
  for (const r of RENDITIONS) {
    const url = photo.src?.[r.key];
    if (!isPexelsImageUrl(url)) continue;
    const scale = Math.min(1, r.w / photo.width, r.h / photo.height);
    return { url, width: Math.max(1, Math.round(photo.width * scale)), height: Math.max(1, Math.round(photo.height * scale)) };
  }
  return null;
}
