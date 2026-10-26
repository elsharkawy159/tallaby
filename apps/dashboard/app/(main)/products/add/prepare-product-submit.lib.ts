import type { AddProductFormData, LocalizedFields } from "./add-product.schema"
import { richTextToPlainText } from "@workspace/tiptap/plain-text"
import { cleanKeywords } from "./meta-keywords.lib"

/** Search-engine limits for the meta title and description. */
export const META_TITLE = { min: 50, max: 60 }
export const META_DESCRIPTION = { min: 150, max: 160 }

/** True when rich-text HTML holds no text and no media (e.g. a bare `<p></p>`). */
export function isEmptyHtml (html: string | undefined): boolean {
  if (!html) return true
  if (/<(img|video|iframe)\b/i.test(html)) return false
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim().length === 0
}

/** Rich text (or plain text) as one line of plain text. */
export function htmlToPlainText (html: string | undefined): string {
  return richTextToPlainText(html).replace(/\s*\n\s*/g, " ")
}

/** Shortens text to `max` characters at a word break, ending with "…". */
export function clip (text: string, max: number) {
  const clean = text.replace(/\s+/g, " ").trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(" ")
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim()}…`
}

/** The meta title the form fills in until the seller writes their own: the product name. */
export function autoMetaTitle (fields: Pick<LocalizedFields, "title">): string {
  return clip(fields.title ?? "", META_TITLE.max)
}

/** The automatic meta description: the short description, else the detailed description (both rich text). */
export function autoMetaDescription (fields: Pick<LocalizedFields, "description" | "content">): string {
  const source = htmlToPlainText(fields.description) || htmlToPlainText(fields.content)
  return clip(source, META_DESCRIPTION.max)
}

function cleanLocale (fields: LocalizedFields): LocalizedFields {
  const title = fields.title?.trim() ?? ""
  // Rich text (plain text from older products and imports); an emptied editor leaves "<p></p>".
  const description = isEmptyHtml(fields.description) ? "" : (fields.description ?? "").trim()
  return {
    ...fields,
    title,
    description,
    content: isEmptyHtml(fields.content) ? "" : fields.content,
    bulletPoints: (fields.bulletPoints ?? []).map((point) => point.trim()).filter(Boolean),
    metaKeywords: cleanKeywords(fields.metaKeywords),
    // Left empty, SEO comes from the name and description, as the form shows.
    metaTitle: fields.metaTitle?.trim() || autoMetaTitle({ title }),
    metaDescription: fields.metaDescription?.trim() || autoMetaDescription({ description, content: fields.content }),
  }
}

/**
 * A product written only in Arabic: the English version (always saved, and
 * what the English store shows) takes the Arabic text instead of "Untitled".
 * The slug stays the form's single English slug.
 */
function fillEnglishFromArabic (en: LocalizedFields, ar: LocalizedFields): LocalizedFields {
  if (en.title) return en
  return {
    ...en,
    title: ar.title,
    description: en.description || ar.description,
    content: en.content || ar.content,
    bulletPoints: en.bulletPoints?.length ? en.bulletPoints : ar.bulletPoints,
    metaTitle: ar.metaTitle,
    metaDescription: en.metaDescription || ar.metaDescription,
    metaKeywords: en.metaKeywords?.length ? en.metaKeywords : ar.metaKeywords,
  }
}

/** Final tidy-up between the validated form values and the server action. */
export function prepareProductForSubmit (data: AddProductFormData): AddProductFormData {
  const ar = cleanLocale(data.localized.ar)
  return {
    ...data,
    localized: {
      en: fillEnglishFromArabic(cleanLocale(data.localized.en), ar),
      ar,
    },
  }
}
