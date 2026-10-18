/** Website › Templates (PLAN.md §8.1, P4-05): shapes shared by the page, the gallery and the actions. */

import type { DesignSystem, PageContent, SectionInstance } from "@workspace/store-sections";

type Localized = { ar?: string; en?: string };

export type TemplateCardView = {
  key: string;
  name: Localized;
  description: Localized;
  category: string;
  thumbnailUrl: string | null;
  isDefault: boolean;
  isPremium: boolean;
  version: number;
  /** Pages with their section names (resolved on the server from the section library). */
  pages: { slug: string; isHome: boolean; name: string; sections: Localized[] }[];
};

export type TemplateInstallView = { templateKey: string; installedAt: string; canUndo: boolean };

/** A template's full content for the editor's preview dialog (rendered with the store's products). */
export type TemplatePreviewView = {
  designSystem: DesignSystem;
  header: SectionInstance | null;
  footer: SectionInstance | null;
  /** `content` = the whole page content (sections plus page-level styles), for applying one page. */
  pages: { slug: string; isHome: boolean; name: string; sections: SectionInstance[]; content: PageContent }[];
};

/** Error keys under `websiteTemplates.errors`. */
export type TemplateErrorKey =
  | "notFound"
  | "readOnly"
  | "templateNotFound"
  | "premiumTemplate"
  | "invalidTemplate"
  | "tooManyPages"
  | "nothingToUndo"
  | "rateLimited"
  | "generic";

export type TemplateActionResult<T> = { success: true; data: T } | { success: false; error: TemplateErrorKey };

/** lib error codes → message keys. */
export const TEMPLATE_ERRORS: Record<string, TemplateErrorKey> = {
  not_found: "notFound",
  store_read_only: "readOnly",
  template_not_found: "templateNotFound",
  premium_template: "premiumTemplate",
  invalid_template: "invalidTemplate",
  too_many_pages: "tooManyPages",
  nothing_to_undo: "nothingToUndo",
};
