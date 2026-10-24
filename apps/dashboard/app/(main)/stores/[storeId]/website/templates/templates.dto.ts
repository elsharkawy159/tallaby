/** Website › Templates (PLAN.md §8.1, P4-05): shapes shared by the page, the gallery and the actions. */

export type { TemplateCardView, TemplatePreviewView, TemplateErrorKey, TemplateActionResult } from "@workspace/store-editor/templates.dto";
import type { TemplateCardView, TemplateErrorKey } from "@workspace/store-editor/templates.dto";

type Localized = { ar?: string; en?: string };

export type TemplateInstallView = { templateKey: string; installedAt: string; canUndo: boolean };

/** Gallery filters, mirrored in the URL (`?page=`, `?category=`). */
export type TemplatesPageQuery = { page: number; category: string };

/** One page of the gallery (`listTemplatesPage`). */
export type TemplatesPageView = {
  items: TemplateCardView[];
  /** The page served (1-based, clamped to `pageCount`). */
  page: number;
  pageCount: number;
  pageSize: number;
  /** Templates matching the filter, across all pages. */
  total: number;
  /** Every category of the gallery, for the filter tabs. */
  categories: string[];
  currentKey: string;
  /** The last install, with its template's name (it may be on another page). */
  lastInstall: (TemplateInstallView & { name: Localized | null }) | null;
};

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
