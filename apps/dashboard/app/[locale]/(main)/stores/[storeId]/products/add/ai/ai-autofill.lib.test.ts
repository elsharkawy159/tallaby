import { describe, expect, it } from "vitest"
import { defaultValues, defaultLocalizedFields, type AddProductFormData, type CategoryOption } from "../add-product.schema"
import { AUTOFILL_LIMITS, countPdfPages, validateAutofillInput, type ProductAutofillOutput } from "./ai-autofill.dto"
import {
  cleanAutofillOutput,
  contentBlocksToHtml,
  paragraphsToHtml,
  pickAutofillCategory,
  planAutofillChanges,
  sellerGaveFigures,
  seoDescription,
  seoTitle,
  toParsedImport,
} from "./ai-autofill.lib"
import { AUTOFILL_SYSTEM_RULES, autofillRequestText } from "./ai-autofill-prompt.lib"

const copy = (title: string) => ({
  title,
  description: "First paragraph.\n\nSecond <b>paragraph</b>.",
  bulletPoints: ["Soft cotton", "  ", "Machine washable"],
  metaTitle: title,
  metaDescription: "A comfortable tee.",
  metaKeywords: ["tee", "Tee", "cotton"],
  contentBlocks: [
    { kind: "heading" as const, text: title, items: [] },
    { kind: "paragraph" as const, text: "Soft & light.", items: [] },
    { kind: "list" as const, text: "", items: ["100% cotton", " "] },
  ],
})

const output = (overrides: Partial<ProductAutofillOutput> = {}): ProductAutofillOutput => ({
  localized: { ar: copy("تيشيرت قطن"), en: copy("Cotton T-shirt") },
  categoryHint: "t-shirts",
  brandName: null,
  storeCategoryName: "تيشيرتات",
  price: { list: 450, final: 399, discountPercent: null, discountEndsAt: null },
  showLiveViews: null,
  quantity: 20,
  sku: "TS-01",
  condition: "new",
  dimensions: { length: null, width: null, height: null, unit: null, weight: 250, weightUnit: "g" },
  variantTypes: [
    { kind: "size", nameEn: "Size", nameAr: "المقاس", valuesEn: ["S", "M", "L"], valuesAr: ["صغير", "وسط"] },
  ],
  reviews: [],
  productPhotos: [],
  missing: [],
  warnings: [],
  ...overrides,
})

const ctx = { sellerText: "تيشيرت قطن بـ 450 جنيه", hasPdf: false, today: "2026-10-28" }

const price = (overrides: Partial<ProductAutofillOutput["price"]>): ProductAutofillOutput["price"] => ({
  list: null,
  final: null,
  discountPercent: null,
  discountEndsAt: null,
  ...overrides,
})

const emptyForm = (): AddProductFormData =>
  structuredClone({
    ...defaultValues,
    localized: { en: defaultLocalizedFields(), ar: defaultLocalizedFields() },
  }) as unknown as AddProductFormData

describe("validateAutofillInput", () => {
  const image = { mediaType: "image/jpeg", size: 1000, data: new Uint8Array() }

  it("needs at least one input", () => {
    expect(validateAutofillInput({ text: "  ", images: [], pdf: null })).toBe("empty")
  })

  it("accepts text only, or photos only", () => {
    expect(validateAutofillInput({ text: "red mug", images: [], pdf: null })).toBeNull()
    expect(validateAutofillInput({ text: "", images: [image], pdf: null })).toBeNull()
  })

  it("rejects unsupported files and too many photos", () => {
    expect(validateAutofillInput({ text: "", images: [{ ...image, mediaType: "image/gif" }], pdf: null })).toBe("badFile")
    expect(validateAutofillInput({ text: "", images: Array(AUTOFILL_LIMITS.maxImages + 1).fill(image), pdf: null })).toBe("tooLarge")
    expect(
      validateAutofillInput({ text: "", images: [], pdf: { mediaType: "text/plain", size: 10, data: new Uint8Array() } })
    ).toBe("badFile")
  })

  it("rejects text over the limit", () => {
    expect(validateAutofillInput({ text: "a".repeat(AUTOFILL_LIMITS.maxTextLength), images: [], pdf: null })).toBeNull()
    expect(validateAutofillInput({ text: "a".repeat(AUTOFILL_LIMITS.maxTextLength + 1), images: [], pdf: null })).toBe("tooLarge")
  })

  it("rejects a PDF with too many pages, and lets one through when its pages cannot be counted", () => {
    const pdf = (pages: number) => {
      const data = new TextEncoder().encode(
        `%PDF-1.4\n1 0 obj << /Type /Pages /Count ${pages} >> endobj\n` +
          Array.from({ length: pages }, (_, i) => `${i + 2} 0 obj << /Type /Page /Parent 1 0 R >> endobj`).join("\n"),
      )
      return { mediaType: "application/pdf", size: data.length, data }
    }
    expect(countPdfPages(pdf(3).data)).toBe(3)
    expect(validateAutofillInput({ text: "", images: [], pdf: pdf(AUTOFILL_LIMITS.maxPdfPages) })).toBeNull()
    expect(validateAutofillInput({ text: "", images: [], pdf: pdf(AUTOFILL_LIMITS.maxPdfPages + 1) })).toBe("pdfTooLong")
    const packed = new TextEncoder().encode("%PDF-1.7\n1 0 obj << /Type /ObjStm /N 40 >> stream ... endstream")
    expect(countPdfPages(packed)).toBeNull()
  })
})

describe("autofill prompt", () => {
  it("carries no category list; a new product always gets the long description, an edit only on request", () => {
    expect(AUTOFILL_SYSTEM_RULES).not.toMatch(/CATEGORIES \(id/)
    const request = (current: string | null) =>
      autofillRequestText({ text: "mug", current, imageCount: 0, hasPdf: false }, { today: "2026-10-29", storeCategories: [] })
    expect(request(null)).toContain("DETAILED_DESCRIPTION: yes")
    expect(request('{"title":"Mug"}')).toContain("DETAILED_DESCRIPTION: only if asked")
  })
})

describe("SEO lines written in code", () => {
  it("cuts at a word break within the limit", () => {
    const title = "Handmade ceramic coffee mug with a wide handle and a speckled glaze, 350 ml"
    expect(seoTitle(title)).toBe("Handmade ceramic coffee mug with a wide handle and a")
    expect(seoTitle(title).length).toBeLessThanOrEqual(60)
    expect(seoTitle("Short title")).toBe("Short title")
  })

  it("fills the SEO title and description from the copy", () => {
    const clean = cleanAutofillOutput(output(), ctx)
    expect(clean.localized.en.metaTitle).toBe("Cotton T-shirt")
    expect(clean.localized.en.metaDescription).toBe("First paragraph. Second <b>paragraph</b>.")
    expect(seoDescription("x ".repeat(200)).length).toBeLessThanOrEqual(160)
  })

  it("keeps the seller's own SEO lines when editing", () => {
    const current = emptyForm()
    current.localized.en.metaTitle = "My SEO title"
    const paths = planAutofillChanges(current, emptyForm(), cleanAutofillOutput(output(), ctx), "edit", {
      categoryId: null,
      storeCategoryName: null,
    }).map((c) => c.path)
    expect(paths).not.toContain("localized.en.metaTitle")
    expect(paths).toContain("localized.ar.metaTitle")
  })
})

describe("pickAutofillCategory", () => {
  const leaf = (id: string, name: string, nameAr: string) => ({ id, name, nameAr, slug: id, level: 2, categories: [] })
  const categories = [
    {
      id: "fashion",
      name: "Fashion",
      nameAr: "أزياء",
      slug: "fashion",
      level: 1,
      categories: [leaf("cat-tees", "T-Shirts", "تيشيرتات"), leaf("cat-shoes", "Running Shoes", "أحذية جري")],
    },
  ] as unknown as CategoryOption[]

  it("matches the category from the AI's hint and titles", () => {
    const clean = cleanAutofillOutput(output({ categoryHint: "running shoes" }), ctx)
    expect(pickAutofillCategory(categories, { ...clean, localized: { ...clean.localized, en: { ...clean.localized.en, title: "Sneakers" } } })).toBe("cat-shoes")
  })

  it("returns null when nothing matches", () => {
    const clean = cleanAutofillOutput(output({ categoryHint: "garden hose" }), ctx)
    expect(pickAutofillCategory(categories, { ...clean, localized: { ar: { ...clean.localized.ar, title: "خرطوم" }, en: { ...clean.localized.en, title: "Hose" } } })).toBeNull()
  })
})

describe("cleanAutofillOutput", () => {
  it("keeps figures the seller gave and cleans lists", () => {
    const clean = cleanAutofillOutput(output(), ctx)
    expect(clean.price).toEqual({ list: 450, final: 399, discountPercent: null, discountEndsAt: null })
    expect(clean.quantity).toBe(20)
    expect(clean.localized.en.bulletPoints).toEqual(["Soft cotton", "Machine washable"])
    expect(clean.localized.en.metaKeywords).toEqual(["tee", "cotton"])
    expect(clean.variantTypes[0]?.valuesAr).toEqual(["صغير", "وسط", "L"])
  })

  it("drops price, stock and SKU when the seller gave no figures", () => {
    const clean = cleanAutofillOutput(output(), { ...ctx, sellerText: "تيشيرت قطن أبيض" })
    expect(clean.price).toEqual({ list: null, final: null, discountPercent: null, discountEndsAt: null })
    expect(clean.quantity).toBeNull()
    expect(clean.sku).toBeNull()
    expect(clean.missing).toEqual(expect.arrayContaining(["price", "stock"]))
  })

  it("keeps figures when a PDF was attached", () => {
    expect(sellerGaveFigures("", true)).toBe(true)
    expect(sellerGaveFigures("السعر ٤٥٠", false)).toBe(true)
  })

  it("leaves the category to the form's match (no 'missing category' from the model)", () => {
    const clean = cleanAutofillOutput(output({ missing: ["category", "brand"] }), ctx)
    expect(clean.categoryHint).toBe("t-shirts")
    expect(clean.missing).toEqual(expect.arrayContaining(["brand"]))
    expect(clean.missing).not.toContain("category")
  })

  it("treats a lone or higher sale price sensibly", () => {
    expect(cleanAutofillOutput(output({ price: price({ final: 300 }) }), ctx).price).toMatchObject({ list: 300, final: null })
    expect(cleanAutofillOutput(output({ price: price({ list: 300, final: 350 }) }), ctx).price).toMatchObject({ list: 300, final: null })
  })

  it("turns a percent off into the sale price", () => {
    const clean = cleanAutofillOutput(output({ price: price({ list: 450, discountPercent: 20 }) }), ctx)
    expect(clean.price).toEqual({ list: 450, final: 360, discountPercent: null, discountEndsAt: null })
    // Rounded to whole piastres; a stated sale price wins over a percent.
    expect(cleanAutofillOutput(output({ price: price({ list: 99.99, discountPercent: 15 }) }), ctx).price.final).toBe(84.99)
    expect(cleanAutofillOutput(output({ price: price({ list: 450, final: 400, discountPercent: 50 }) }), ctx).price.final).toBe(400)
  })

  it("keeps a valid discount end date only on a real sale", () => {
    const withEnd = (end: string, overrides = {}) =>
      cleanAutofillOutput(output({ price: price({ list: 450, final: 399, discountEndsAt: end, ...overrides }) }), ctx).price.discountEndsAt
    expect(withEnd("2026-11-04")).toBe("2026-11-04")
    expect(withEnd("2026-10-28")).toBe("2026-10-28")
    expect(withEnd("2026-10-27")).toBeNull()
    expect(withEnd("2026-02-30")).toBeNull()
    expect(withEnd("2028-01-01")).toBeNull()
    expect(withEnd("next week")).toBeNull()
    expect(withEnd("2026-11-04", { final: null })).toBeNull()
  })

  it("keeps only known values in the plain-string fields", () => {
    const raw = {
      ...output(),
      condition: "Refurbished",
      missing: ["price", "colour"],
      variantTypes: [{ kind: "pattern", nameEn: "Pattern", nameAr: "النقشة", valuesEn: ["Dots"], valuesAr: ["منقط"] }],
      dimensions: { length: 20, width: null, height: null, unit: "mm", weight: 1, weightUnit: "KG" },
    }
    const clean = cleanAutofillOutput(raw, ctx)
    expect(clean.condition).toBe("refurbished")
    expect(clean.missing).not.toContain("colour")
    expect(clean.variantTypes[0]?.kind).toBe("custom")
    expect(clean.dimensions).toMatchObject({ unit: null, weightUnit: "kg" })
  })

  it("passes the live views switch through only when asked", () => {
    expect(cleanAutofillOutput(output(), ctx).showLiveViews).toBeNull()
    expect(cleanAutofillOutput(output({ showLiveViews: true }), ctx).showLiveViews).toBe(true)
  })
})

describe("paragraphsToHtml", () => {
  it("turns blank-line paragraphs into escaped <p> tags", () => {
    expect(paragraphsToHtml("One\nline.\n\nTwo <b>")).toBe("<p>One line.</p><p>Two &lt;b&gt;</p>")
  })
})

describe("toParsedImport", () => {
  it("maps copy, price and variant types into the import format", () => {
    const parsed = toParsedImport(cleanAutofillOutput(output(), ctx))
    expect(parsed.localized?.en?.title).toBe("Cotton T-shirt")
    expect(parsed.localized?.en?.description).toBe("<p>First paragraph.</p><p>Second &lt;b&gt;paragraph&lt;/b&gt;.</p>")
    expect(parsed.price).toEqual({ list: 450, final: 399 })
    expect(parsed.dimensions).toMatchObject({ weight: 250, weightUnit: "g" })
    expect(parsed.variantTypes?.[0]?.localized.ar.name).toBe("المقاس")
  })
})

describe("planAutofillChanges", () => {
  const filled = () => {
    const values = emptyForm()
    values.localized.en.title = "Cotton T-shirt"
    values.localized.en.slug = "cotton-t-shirt"
    values.localized.ar.title = "تيشيرت قطن"
    values.price.list = 450
    values.price.final = 399
    values.quantity = 20
    return values
  }
  const extra = { categoryId: "cat-tees", storeCategoryName: "تيشيرتات" }

  it("fills an untouched form, including defaults like quantity", () => {
    const changes = planAutofillChanges(emptyForm(), filled(), cleanAutofillOutput(output(), ctx), "empty", extra)
    const paths = changes.map((c) => c.path)
    expect(paths).toEqual(expect.arrayContaining(["localized.en.title", "localized.en.slug", "categoryId", "price.list", "quantity", "sellerCategoryName"]))
  })

  it("keeps what the seller typed in empty-only mode", () => {
    const current = emptyForm()
    current.localized.en.title = "My own title"
    current.price.list = 500
    const changes = planAutofillChanges(current, filled(), cleanAutofillOutput(output(), ctx), "empty", extra)
    const paths = changes.map((c) => c.path)
    expect(paths).not.toContain("localized.en.title")
    expect(paths).not.toContain("localized.en.slug")
    expect(paths).not.toContain("price.final")
    expect(paths).toContain("localized.ar.title")
  })

  it("overwrites in replace mode", () => {
    const current = emptyForm()
    current.localized.en.title = "My own title"
    const changes = planAutofillChanges(current, filled(), cleanAutofillOutput(output(), ctx), "replace", extra)
    expect(changes.find((c) => c.path === "localized.en.title")?.value).toBe("Cotton T-shirt")
  })

  it("sets the discount end date and the live views switch", () => {
    const ai = cleanAutofillOutput(output({ price: price({ list: 450, final: 399, discountEndsAt: "2026-11-04" }), showLiveViews: true }), ctx)
    const changes = planAutofillChanges(emptyForm(), filled(), ai, "empty", extra)
    const end = changes.find((c) => c.path === "price.discountEndsAt")?.value as Date
    expect([end.getFullYear(), end.getMonth() + 1, end.getDate(), end.getHours(), end.getMinutes()]).toEqual([2026, 11, 4, 23, 59])
    expect(changes.find((c) => c.path === "showLiveViews")?.value).toBe(true)
    expect(changes.find((c) => c.path === "price.final")?.value).toBe(399)
  })

  it("never sets price or stock the AI did not give", () => {
    const noFigures = cleanAutofillOutput(output(), { ...ctx, sellerText: "تيشيرت" })
    const paths = planAutofillChanges(emptyForm(), filled(), noFigures, "replace", extra).map((c) => c.path)
    expect(paths.some((p) => p.startsWith("price."))).toBe(false)
    expect(paths).not.toContain("quantity")
  })
})

describe("store category name", () => {
  it("keeps only the last part of a category path", () => {
    expect(cleanAutofillOutput(output({ storeCategoryName: "أزياء > رجالي > تيشيرتات" }), ctx).storeCategoryName).toBe("تيشيرتات")
  })
})

describe("product photos", () => {
  it("keeps only valid, unique image numbers", () => {
    const cleaned = cleanAutofillOutput(output({ productPhotos: [2, 0, 0, 5, -1] }), { ...ctx, imageCount: 3 })
    expect(cleaned.productPhotos).toEqual([0, 2])
  })
})

describe("contentBlocksToHtml", () => {
  it("builds an escaped article with headings, lists and a photo after the intro", () => {
    const blocks = cleanAutofillOutput(output(), ctx).localized.en.contentBlocks
    const html = contentBlocksToHtml(blocks, ["https://cdn.test/a.jpg", "blob:local"], "Tee")
    expect(html).toBe(
      `<h2>Cotton T-shirt</h2><p>Soft &amp; light.</p><img src="https://cdn.test/a.jpg" alt="Tee"><ul><li><p>100% cotton</p></li></ul>`,
    )
  })

  it("normalizes block kinds, drops unknown ones and caps list items", () => {
    const en = {
      ...copy("Tee"),
      contentBlocks: [
        { kind: " Heading ", text: "Tee", items: [] },
        { kind: "quote", text: "Not a kind", items: [] },
        { kind: "list", text: "", items: Array.from({ length: 12 }, (_, i) => `Item ${i}`) },
      ],
    }
    const blocks = cleanAutofillOutput(output({ localized: { ar: copy("تيشيرت"), en } }), ctx).localized.en.contentBlocks
    expect(blocks.map((block) => block.kind)).toEqual(["heading", "list"])
    expect(blocks[1]?.items).toHaveLength(8)
  })
})

describe("edit mode", () => {
  it("changes the copy but keeps the slug and category of a live product", () => {
    const current = emptyForm()
    current.localized.en.title = "Old tee"
    current.localized.en.slug = "old-tee"
    current.categoryId = "cat-old"
    const values = emptyForm()
    values.localized.en.title = "Cotton T-shirt"
    values.localized.en.slug = "cotton-t-shirt"
    const changes = planAutofillChanges(current, values, cleanAutofillOutput(output(), ctx), "edit", {
      categoryId: "cat-tees",
      storeCategoryName: null,
    })
    const paths = changes.map((c) => c.path)
    expect(paths).toContain("localized.en.title")
    expect(paths).not.toContain("localized.en.slug")
    expect(paths).not.toContain("categoryId")
  })

  it("adds new reviews to the list without repeating one", () => {
    const current = emptyForm()
    current.sellerReviews = [{ reviewerName: "Mona", rating: 5, comment: "Great" }] as AddProductFormData["sellerReviews"]
    const reviews = [
      { reviewerName: "Mona", rating: 5, comment: "Great" },
      { reviewerName: "Ali", rating: 4, comment: "Nice fit" },
    ]
    const change = planAutofillChanges(current, emptyForm(), cleanAutofillOutput(output({ reviews }), ctx), "edit", {
      categoryId: null,
      storeCategoryName: null,
    }).find((c) => c.path === "sellerReviews")
    expect((change?.value as unknown[]).length).toBe(2)
  })
})
