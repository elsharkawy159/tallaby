/** Template shapes shared by the editor's template panels and the host apps (Website › Templates in the dashboard re-exports them). */

import type { DesignSystem, PageContent, SectionInstance, TemplateDemo } from "@workspace/store-sections";

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
  /** Colour swatches (code templates; empty for others). */
  palette: readonly string[];
  /** Ready-made forms "Use template" adds (`newsletter`, `contact`…). */
  formKinds: readonly string[];
  /** Page names in both languages by slug (code templates). */
  pageNames?: Readonly<Record<string, Localized>>;
  /** Pages with their section names (resolved on the server from the section library). */
  pages: { slug: string; isHome: boolean; name: string; sections: Localized[] }[];
};

/** A template's full content for the editor's preview dialog (rendered with the store's products). */
export type TemplatePreviewView = {
  designSystem: DesignSystem;
  header: SectionInstance | null;
  footer: SectionInstance | null;
  /** `content` = the whole page content (sections plus page-level styles), for applying one page. */
  pages: { slug: string; isHome: boolean; /** `product` for the template's product page (previewed with a demo product). */ kind?: "page" | "product"; name: string; sections: SectionInstance[]; content: PageContent }[];
  /** A demo store to preview with (code templates), or null to use the store's own products. */
  demo: TemplateDemo | null;
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
