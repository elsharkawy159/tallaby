import type { AddProductFormData, LocalizedFields } from "./add-product.schema"
import { cleanKeywords } from "./meta-keywords.lib"

const META_TITLE_MAX = 60
const META_DESCRIPTION_MAX = 160

/** True when rich-text HTML holds no text and no media (e.g. a bare `<p></p>`). */
export function isEmptyHtml (html: string | undefined): boolean {
  if (!html) return true
  if (/<(img|video|iframe)\b/i.test(html)) return false
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim().length === 0
}

function clip (text: string, max: number) {
  const clean = text.replace(/\s+/g, " ").trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(" ")
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim()}…`
}

function cleanLocale (fields: LocalizedFields): LocalizedFields {
  const title = fields.title?.trim() ?? ""
  const description = fields.description?.trim() ?? ""
  return {
    ...fields,
    title,
    description,
    content: isEmptyHtml(fields.content) ? "" : fields.content,
    bulletPoints: (fields.bulletPoints ?? []).map((point) => point.trim()).filter(Boolean),
    metaKeywords: cleanKeywords(fields.metaKeywords),
    // The form promises to fill SEO from the name and short description.
    metaTitle: fields.metaTitle?.trim() || (title ? clip(title, META_TITLE_MAX) : ""),
    metaDescription:
      fields.metaDescription?.trim() ||
      (description ? clip(description, META_DESCRIPTION_MAX) : ""),
  }
}

/** Final tidy-up between the validated form values and the server action. */
export function prepareProductForSubmit (data: AddProductFormData): AddProductFormData {
  return {
    ...data,
    localized: {
      en: cleanLocale(data.localized.en),
      ar: cleanLocale(data.localized.ar),
    },
  }
}
