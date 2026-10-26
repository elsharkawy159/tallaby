import { describe, expect, it } from "vitest"
import { highlightMatch, indexTallabyCategories, searchCategoryChoices } from "./category-search.lib"
import type { CategoryOption } from "./add-product.schema"

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
    cat("men", "Men", "رجالي", [cat("men-tshirts", "T-Shirts", "تيشيرتات"), cat("men-shirts", "Shirts", "قمصان")]),
  ]),
  cat("electronics", "Electronics", "إلكترونيات", [cat("headphones", "Headphones", "سماعات")]),
]

const tallaby = indexTallabyCategories(TREE, "ar")
const store = [
  { id: "s1", name: "Summer tees", nameAr: "تيشيرتات صيفي", sourceId: null },
  { id: "s2", name: "Headphones", nameAr: "سماعات", sourceId: "headphones" },
]

const search = (query: string, allowNew = true) =>
  searchCategoryChoices({ query, store, tallaby, suggested: [], locale: "ar", allowNew })

describe("searchCategoryChoices", () => {
  it("lists the store's categories before Tallaby's", () => {
    const rows = search("تيشيرت")
    expect(rows.map((r) => r.kind)).toEqual(["store", "tallaby", "new"])
    expect(rows[0]).toMatchObject({ kind: "store", label: "تيشيرتات صيفي" })
    expect(rows[1]).toMatchObject({ kind: "tallaby", label: "تيشيرتات", parentLabel: "أزياء › رجالي" })
  })

  it("matches either language and Arabic letter variants", () => {
    expect(search("ازياء").some((r) => r.kind === "tallaby" && r.entry.category.id === "fashion")).toBe(true)
    expect(search("shirts").filter((r) => r.kind === "tallaby").map((r) => r.label)).toContain("قمصان")
  })

  it("shows a Tallaby category the store copied only once, as the store's", () => {
    const rows = search("سماعات")
    expect(rows.filter((r) => r.kind === "tallaby")).toHaveLength(0)
    expect(rows[0]).toMatchObject({ kind: "store", option: { id: "s2" } })
  })

  it("offers to add a name nobody has, unless adding is off", () => {
    expect(search("شنط يد").at(-1)).toEqual({ kind: "new", label: "شنط يد" })
    expect(search("شنط يد", false).some((r) => r.kind === "new")).toBe(false)
    // An exact existing name is picked, not added again.
    expect(search("قمصان").some((r) => r.kind === "new")).toBe(false)
  })

  it("browses the top-level categories with no query", () => {
    const tl = search("").filter((r) => r.kind === "tallaby").map((r) => r.label)
    expect(tl).toEqual(["أزياء", "إلكترونيات"])
  })
})

describe("highlightMatch", () => {
  it("finds the query across alef forms, keeping the original letters", () => {
    expect(highlightMatch("إلكترونيات", "الكترو")).toEqual(["", "إلكترو", "نيات"])
    expect(highlightMatch("Shirts", "zz")).toBeNull()
  })
})
