import type { StoreSeo, StoreSeoInput } from "@workspace/lib/stores";

/** Website › SEO form values and helpers. Error keys live under `domainSeo.errors`. */
export type DomainSeoErrorKey = "invalidInput" | "readOnly" | "notFound" | "generic";

export type DomainSeoResult = { success: true } | { success: false; error: DomainSeoErrorKey };

/**
 * The SEO form as edited in the browser ("" = empty). The Google Search
 * Console code moved to Apps › Google Search Console (2026-11-27): the form
 * never sends it, so saving keeps the stored token.
 */
export type StoreSeoFormValues = {
  titleTemplate: string;
  description: string;
  shareImageUrl: string;
  indexing: boolean;
  keywords: string[];
};

export function toSeoFormValues(seo: StoreSeo): StoreSeoFormValues {
  return {
    titleTemplate: seo.titleTemplate ?? "",
    description: seo.description ?? "",
    shareImageUrl: seo.shareImageUrl ?? "",
    indexing: seo.indexing,
    keywords: [...seo.keywords],
  };
}

/** Form values → the strict server schema (empty strings become null there). */
export function toSeoPatch(v: StoreSeoFormValues): StoreSeoInput {
  return {
    titleTemplate: v.titleTemplate.trim(),
    description: v.description.trim(),
    shareImageUrl: v.shareImageUrl.trim(),
    indexing: v.indexing,
    keywords: v.keywords,
  };
}
