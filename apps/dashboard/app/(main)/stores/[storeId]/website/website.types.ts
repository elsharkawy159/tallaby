export type WebsiteSiteStatus = "draft" | "published" | "unpublished";

export type WebsiteRevision = {
  id: string;
  revisionNumber: number;
  createdAt: string;
  isLive: boolean;
};

export type WebsiteOverviewData = {
  storeId: string;
  readOnly: boolean;
  liveUrl: string;
  hostname: string;
  siteStatus: WebsiteSiteStatus;
  /** A builder revision is what the store host shows (otherwise Tallaby Classic). */
  isLive: boolean;
  hasUnpublishedChanges: boolean;
  /** The seller chose a template (or the site was ever live); going live needs it. */
  templateChosen: boolean;
  lastPublishedAt: string | null;
  previewEnabled: boolean;
  pageCount: number;
  revisions: WebsiteRevision[];
};

export type WebsitePageSeo = {
  title?: string;
  description?: string;
  ogImage?: string;
  noindex?: boolean;
};

export type WebsitePageRow = {
  id: string;
  slug: string;
  isHome: boolean;
  /** The store's product page (fixed slug, never in the menu). */
  kind?: "product";
  name: { ar?: string; en?: string };
  seo: WebsitePageSeo;
  showInNav: boolean;
  updatedAt: string | null;
};
