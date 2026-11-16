import { describe, expect, it } from "vitest"
import { DEFAULT_COMMISSION_RATE } from "@/lib/utils/product-pricing.lib"
import { addProductFormSchema, defaultLocalizedFields, defaultValues, type AddProductFormData } from "../add-product.schema"
import { quickProductCardFrom, quickProductMissing, quickProductTitle, sellerPriceFields } from "./ai-product-uploader.lib"

const pricing = { commissionRate: DEFAULT_COMMISSION_RATE, isCommissionExempt: false }

describe("quickProductMissing", () => {
  it("asks for a photo first, then the description, then the price", () => {
    expect(quickProductMissing({ images: 0, description: "", price: null })).toBe("img")
    expect(quickProductMissing({ images: 1, description: "  ", price: 100 })).toBe("desc")
    expect(quickProductMissing({ images: 2, description: "قميص قطن", price: undefined })).toBe("price")
    expect(quickProductMissing({ images: 2, description: "قميص قطن", price: 0 })).toBe("price")
    expect(quickProductMissing({ images: 2, description: "قميص قطن", price: Number.NaN })).toBe("price")
    expect(quickProductMissing({ images: 1, description: "قميص قطن", price: 350 })).toBeNull()
  })
})

describe("sellerPriceFields", () => {
  it("is the seller's price with no sale, whatever the AI read", () => {
    expect(sellerPriceFields(350, pricing)).toEqual({
      list: 350,
      base: 350,
      final: 350,
      discountValue: undefined,
      discountType: "percent",
      discountEndsAt: null,
    })
  })

  it("keeps piastres and passes the form schema", () => {
    const price = sellerPriceFields(199.999, pricing)
    expect(price.list).toBe(200)
    expect(price.final).toBe(200)
    const values = {
      ...defaultValues,
      categoryId: "cat",
      images: ["seller/2026-11-16/a.jpg"],
      price,
      localized: {
        en: { ...defaultLocalizedFields(), title: "Cotton shirt", slug: "cotton-shirt", description: "<p>Soft</p>" },
        ar: { ...defaultLocalizedFields(), title: "قميص قطن", description: "<p>ناعم</p>" },
      },
    }
    expect(addProductFormSchema.safeParse(values).success).toBe(true)
  })
})

describe("quickProductTitle", () => {
  it("uses the page language, else the other one", () => {
    expect(quickProductTitle({ ar: { title: "قميص" }, en: { title: "Shirt" } }, "ar")).toBe("قميص")
    expect(quickProductTitle({ ar: { title: "قميص" }, en: { title: "Shirt" } }, "en")).toBe("Shirt")
    expect(quickProductTitle({ ar: { title: "قميص" }, en: { title: " " } }, "en")).toBe("قميص")
    expect(quickProductTitle({}, "ar")).toBe("")
  })
})

describe("quickProductCardFrom", () => {
  it("shows the first photo, the name and the selling price", () => {
    const values = {
      ...defaultValues,
      images: ["a.jpg", "b.jpg"],
      price: sellerPriceFields(500, pricing),
      localized: { en: { ...defaultLocalizedFields(), title: "Mug" }, ar: { ...defaultLocalizedFields(), title: "كوب" } },
    } as unknown as AddProductFormData
    expect(quickProductCardFrom(values, { id: "p1", status: "active" }, "ar")).toEqual({
      id: "p1",
      title: "كوب",
      image: "a.jpg",
      price: 500,
      status: "active",
    })
  })
})
