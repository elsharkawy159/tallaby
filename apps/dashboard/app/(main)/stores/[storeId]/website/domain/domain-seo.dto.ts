import { GOOGLE_SITE_VERIFICATION_RE, type StoreSeo, type StoreSeoInput } from "@workspace/lib/stores";

/** Error keys live under `domainSeo.errors`. */
export type DomainSeoErrorKey = "invalidInput" | "readOnly" | "notFound" | "generic";

export type DomainSeoResult = { success: true } | { success: false; error: DomainSeoErrorKey };

/** The SEO form as edited in the browser ("" = empty). */
export type StoreSeoFormValues = {
  titleTemplate: string;
  description: string;
  shareImageUrl: string;
  indexing: boolean;
  googleSiteVerification: string;
};

export function toSeoFormValues(seo: StoreSeo): StoreSeoFormValues {
  return {
    titleTemplate: seo.titleTemplate ?? "",
    description: seo.description ?? "",
    shareImageUrl: seo.shareImageUrl ?? "",
    indexing: seo.indexing,
    googleSiteVerification: seo.googleSiteVerification ?? "",
  };
}

/**
 * Search Console shows the token inside a whole tag:
 * `<meta name="google-site-verification" content="abc…" />`. Sellers often
 * paste the tag; keep only the content value. Anything else is returned
 * trimmed and still has to pass GOOGLE_SITE_VERIFICATION_RE on the server.
 */
export function extractVerificationToken(input: string): string {
  const value = input.trim();
  const match = /content\s*=\s*["']([^"']*)["']/i.exec(value);
  return (match ? match[1]! : value).trim();
}

export function isVerificationToken(value: string): boolean {
  return GOOGLE_SITE_VERIFICATION_RE.test(value);
}

/** Form values → the strict server schema (empty strings become null there). */
export function toSeoPatch(v: StoreSeoFormValues): StoreSeoInput {
  return {
    titleTemplate: v.titleTemplate.trim(),
    description: v.description.trim(),
    shareImageUrl: v.shareImageUrl.trim(),
    indexing: v.indexing,
    googleSiteVerification: extractVerificationToken(v.googleSiteVerification),
  };
}
