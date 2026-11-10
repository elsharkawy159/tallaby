import { describe, expect, it } from "vitest"
import { isRichTextHtml, plainTextToRichText, richTextToPlainText } from "@workspace/tiptap/plain-text"
import { getSectionProgress, normalizeSearchText, suggestCategories } from "./add-product.lib"
import { isEmptyHtml, prepareProductForSubmit } from "./prepare-product-submit.lib"
import { addProductFormSchema, defaultValues, type AddProductFormData, type CategoryOption } from "./add-product.schema"

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

  it("falls back to the description text when there is no short description", () => {
    const data = base()
    data.localized.en.description = ""
    data.localized.en.content = "<h2>Soft</h2><p>Egyptian&nbsp;cotton &amp; linen</p>"
    expect(prepareProductForSubmit(data).localized.en.metaDescription).toBe("Soft Egyptian cotton & linen")
  })

  it("clips the automatic meta title at a word break", () => {
    const data = base()
    data.localized.en.title = "word ".repeat(20)
    const title = prepareProductForSubmit(data).localized.en.metaTitle ?? ""
    expect(title.length).toBeLessThanOrEqual(60)
    expect(title.endsWith("word…")).toBe(true)
  })

  it("uses the rich short description as plain text for SEO", () => {
    const data = base()
    data.localized.en.description = "<p><strong>Soft</strong> cotton</p><ul><li>Machine wash</li></ul>"
    expect(prepareProductForSubmit(data).localized.en.metaDescription).toBe("Soft cotton • Machine wash")
  })

  it("stores an emptied short description editor as empty", () => {
    const data = base()
    data.localized.en.description = "<p></p>"
    expect(prepareProductForSubmit(data).localized.en.description).toBe("")
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

describe("short description text", () => {
  it("tells rich text from plain text", () => {
    expect(isRichTextHtml("<p>Hi</p>")).toBe(true)
    expect(isRichTextHtml("Latency <5ms & ANC")).toBe(false)
  })

  it("turns rich text into lines of plain text", () => {
    expect(richTextToPlainText("<p>One&nbsp;&amp; two</p><p>Three<br>four</p>")).toBe("One & two\nThree\nfour")
    expect(richTextToPlainText("Plain\ntext ")).toBe("Plain\ntext")
    expect(richTextToPlainText(null)).toBe("")
  })

  it("turns older plain text into escaped paragraphs", () => {
    expect(plainTextToRichText("First line\nlatency < 5ms & more\n\nNext")).toBe("<p>First line<br>latency &lt; 5ms &amp; more</p><p>Next</p>")
    expect(plainTextToRichText("<p>Kept</p>")).toBe("<p>Kept</p>")
    expect(plainTextToRichText("  ")).toBe("")
  })
})

describe("Arabic-only products", () => {
  const arabicOnly = (): AddProductFormData =>
    structuredClone({
      ...defaultValues,
      categoryId: "cat-1",
      images: ["a.jpg"],
      price: { list: 100, final: 100, discountType: "amount" },
      localized: {
        en: { ...defaultValues.localized.en, slug: "tyshyrt-qtn" },
        ar: { ...defaultValues.localized.ar, title: "تيشيرت قطن", description: "<p>قطن مصري</p>" },
      },
    }) as unknown as AddProductFormData

  it("passes validation with only an Arabic name and short description", () => {
    expect(addProductFormSchema.safeParse(arabicOnly()).success).toBe(true)
  })

  it("needs a name and a short description in one language", () => {
    const data = arabicOnly()
    data.localized.ar.title = ""
    data.localized.ar.description = "<p></p>"
    const issues = addProductFormSchema.safeParse(data).error?.issues.map((i) => i.path.join(".")) ?? []
    expect(issues).toEqual(
      expect.arrayContaining(["localized.en.title", "localized.ar.title", "localized.en.description", "localized.ar.description"])
    )
  })

  it("fills the English version from the Arabic one on submit", () => {
    const out = prepareProductForSubmit(arabicOnly())
    expect(out.localized.en.title).toBe("تيشيرت قطن")
    expect(out.localized.en.description).toBe("<p>قطن مصري</p>")
    expect(out.localized.en.slug).toBe("tyshyrt-qtn")
  })

  it("counts four basics in either language", () => {
    const basics = getSectionProgress(arabicOnly(), {}, false).find((s) => s.id === "sec-basic")!
    expect(basics).toMatchObject({ total: 4, done: 4, complete: true })
  })
})
