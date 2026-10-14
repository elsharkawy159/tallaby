import { describe, expect, it } from "vitest"
import { normalizeSearchText, suggestCategories } from "./add-product.lib"
import { isEmptyHtml, prepareProductForSubmit } from "./prepare-product-submit.lib"
import { defaultValues, type AddProductFormData, type CategoryOption } from "./add-product.schema"

type Node = CategoryOption & { categories?: Node[] }

const cat = (id: string, name: string, nameAr: string, children?: Node[]): Node => ({
  id,
  name,
  nameAr,
  slug: id,
  level: 0,
  categories: children,
})

const TREE: Node[] = [
  cat("fashion", "Fashion", "أزياء", [
    cat("men", "Men", "رجالي", [
      cat("men-tshirts", "T-Shirts", "تيشيرتات"),
      cat("men-shoes", "Shoes", "أحذية"),
    ]),
    cat("women", "Women", "حريمي", [cat("dresses", "Dresses", "فساتين")]),
  ]),
  cat("electronics", "Electronics", "إلكترونيات", [
    cat("headphones", "Headphones", "سماعات"),
    cat("smartwatches", "Smart Watches", "ساعات ذكية"),
  ]),
  cat("home", "Home", "المنزل", [cat("kitchen", "Kitchen", "مطبخ")]),
]

const ids = (titles: string[], description?: string) =>
  suggestCategories(TREE, { titles, description }).map((m) => m.category.id)

describe("suggestCategories", () => {
  it("matches English plurals against singular product names", () => {
    expect(ids(["Wireless Bluetooth Headphone"])[0]).toBe("headphones")
  })

  it("matches Arabic titles with the definite article and hamza variants", () => {
    expect(ids(["السماعات اللاسلكية"])[0]).toBe("headphones")
    expect(ids(["احذية رياضية"])[0]).toBe("men-shoes")
  })

  it("only suggests leaf categories", () => {
    expect(ids(["Electronics gadget"])).not.toContain("electronics")
  })

  it("uses the parent path to break ties", () => {
    expect(ids(["Women's summer dress"])[0]).toBe("dresses")
  })

  it("combines both language titles", () => {
    expect(ids(["", "ساعة ذكية"])[0]).toBe("smartwatches")
  })

  it("returns nothing for unrelated names", () => {
    expect(ids(["Zzzz qqqq"])).toEqual([])
  })
})

describe("normalizeSearchText", () => {
  it("folds Arabic letter variants and diacritics", () => {
    expect(normalizeSearchText("أحذيةٌ إلى")).toBe("احذيه الي")
  })
})

describe("prepareProductForSubmit", () => {
  const base = (): AddProductFormData =>
    structuredClone({
      ...defaultValues,
      localized: {
        en: {
          ...defaultValues.localized.en,
          title: "  Cotton tee ",
          description: "Soft Egyptian cotton.",
          bulletPoints: ["100% cotton", " ", ""],
          content: "<p></p>",
        },
        ar: { ...defaultValues.localized.ar },
      },
    }) as unknown as AddProductFormData

  it("drops blank highlights and empty editor HTML", () => {
    const out = prepareProductForSubmit(base())
    expect(out.localized.en.bulletPoints).toEqual(["100% cotton"])
    expect(out.localized.en.content).toBe("")
  })

  it("fills SEO fields from the name and short description", () => {
    const out = prepareProductForSubmit(base())
    expect(out.localized.en.metaTitle).toBe("Cotton tee")
    expect(out.localized.en.metaDescription).toBe("Soft Egyptian cotton.")
    expect(out.localized.ar.metaTitle).toBe("")
  })

  it("keeps SEO fields the seller wrote", () => {
    const data = base()
    data.localized.en.metaTitle = "Custom"
    expect(prepareProductForSubmit(data).localized.en.metaTitle).toBe("Custom")
  })
})

describe("isEmptyHtml", () => {
  it("treats media as content", () => {
    expect(isEmptyHtml('<p><img src="x.png"></p>')).toBe(false)
    expect(isEmptyHtml("<p>&nbsp;</p>")).toBe(true)
  })
})
