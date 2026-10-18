/** Website › Templates (PLAN.md §8.1, P4-05): shapes shared by the page, the gallery and the actions. */

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
