import { describe, expect, it } from "vitest"
import { defaultValues, defaultLocalizedFields, type AddProductFormData } from "../add-product.schema"
import { validateAutofillInput, type ProductAutofillOutput } from "./ai-autofill.dto"
import {
  cleanAutofillOutput,
  paragraphsToHtml,
  planAutofillChanges,
  sellerGaveFigures,
  toParsedImport,
} from "./ai-autofill.lib"

const copy = (title: string) => ({
  title,
  description: "First paragraph.\n\nSecond <b>paragraph</b>.",
  bulletPoints: ["Soft cotton", "  ", "Machine washable"],
  metaTitle: title,
  metaDescription: "A comfortable tee.",
  metaKeywords: ["tee", "Tee", "cotton"],
})

const output = (overrides: Partial<ProductAutofillOutput> = {}): ProductAutofillOutput => ({
  localized: { ar: copy("تيشيرت قطن"), en: copy("Cotton T-shirt") },
  categoryId: "cat-tees",
  brandName: null,
  storeCategoryName: "تيشيرتات",
  price: { list: 450, final: 399 },
  quantity: 20,
  sku: "TS-01",
  condition: "new",
  dimensions: { length: null, width: null, height: null, unit: null, weight: 250, weightUnit: "g" },
  variantTypes: [
    { kind: "size", nameEn: "Size", nameAr: "المقاس", valuesEn: ["S", "M", "L"], valuesAr: ["صغير", "وسط"] },
  ],
  missing: [],
  warnings: [],
  ...overrides,
})

const ctx = { categoryIds: new Set(["cat-tees"]), sellerText: "تيشيرت قطن بـ 450 جنيه", hasPdf: false }

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
    expect(validateAutofillInput({ text: "", images: Array(7).fill(image), pdf: null })).toBe("tooLarge")
    expect(
      validateAutofillInput({ text: "", images: [], pdf: { mediaType: "text/plain", size: 10, data: new Uint8Array() } })
    ).toBe("badFile")
  })
})

describe("cleanAutofillOutput", () => {
  it("keeps figures the seller gave and cleans lists", () => {
    const clean = cleanAutofillOutput(output(), ctx)
    expect(clean.price).toEqual({ list: 450, final: 399 })
    expect(clean.quantity).toBe(20)
    expect(clean.localized.en.bulletPoints).toEqual(["Soft cotton", "Machine washable"])
    expect(clean.localized.en.metaKeywords).toEqual(["tee", "cotton"])
    expect(clean.variantTypes[0]?.valuesAr).toEqual(["صغير", "وسط", "L"])
  })

  it("drops price, stock and SKU when the seller gave no figures", () => {
    const clean = cleanAutofillOutput(output(), { ...ctx, sellerText: "تيشيرت قطن أبيض" })
    expect(clean.price).toEqual({ list: null, final: null })
    expect(clean.quantity).toBeNull()
    expect(clean.sku).toBeNull()
    expect(clean.missing).toEqual(expect.arrayContaining(["price", "stock"]))
  })

  it("keeps figures when a PDF was attached", () => {
    expect(sellerGaveFigures("", true)).toBe(true)
    expect(sellerGaveFigures("السعر ٤٥٠", false)).toBe(true)
  })

  it("drops a category id that is not in the list", () => {
    const clean = cleanAutofillOutput(output({ categoryId: "made-up" }), ctx)
    expect(clean.categoryId).toBeNull()
    expect(clean.missing).toContain("category")
  })

  it("treats a lone or higher sale price sensibly", () => {
    expect(cleanAutofillOutput(output({ price: { list: null, final: 300 } }), ctx).price).toEqual({ list: 300, final: null })
    expect(cleanAutofillOutput(output({ price: { list: 300, final: 350 } }), ctx).price).toEqual({ list: 300, final: null })
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
