type Bilingual = { ar: string; en: string };

export type DevSectionItem = {
  id: string;
  name: Bilingual;
  description: Bilingual;
  category: string;
  subcategory: string;
  version: number;
  /** Repo-relative file that declares the design, when found. */
  file: string | null;
  /** Keys of the templates built from this section (an edit here shows in each of them). */
  usedBy: string[];
};

export type DevSectionGroup = { id: string; name: Bilingual; items: DevSectionItem[] };

export type DevTemplateItem = {
  key: string;
  name: Bilingual;
  description: Bilingual;
  version: number;
  isDefault: boolean;
  folder: string;
  palette: string[];
  /** `slug` is "" for the home page. */
  pages: { slug: string; name: Bilingual }[];
  homeSections: number;
  /** Section ids (library ids, or Classic/Atelier's own) the template is built from. */
  sections: string[];
};

/** Templates grouped by their store industry (`TemplateDefinition.category`). */
export type DevTemplateGroup = { id: string; items: DevTemplateItem[] };

export type DevLibraryData = {
  sections: DevSectionGroup[];
  templates: DevTemplateGroup[];
  /** Templates whose demo store (products, categories, theme) can fill a section preview. */
  demoTemplates: { key: string; name: string }[];
  /** The storefront's dark-mode CSS (`siteDarkCss`), for Theme › Dark in the frames. */
  darkCss: string;
};
