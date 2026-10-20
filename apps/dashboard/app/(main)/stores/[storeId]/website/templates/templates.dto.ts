/** Website › Templates (PLAN.md §8.1, P4-05): shapes shared by the page, the gallery and the actions. */

export type { TemplateCardView, TemplatePreviewView, TemplateErrorKey, TemplateActionResult } from "@workspace/store-editor/templates.dto";
import type { TemplateErrorKey } from "@workspace/store-editor/templates.dto";

export type TemplateInstallView = { templateKey: string; installedAt: string; canUndo: boolean };

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
