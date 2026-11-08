import { describe, expect, it } from "vitest";
import { applyMapping, buildSheetModel, validateRow } from "@/app/(main)/products/add/from-file/from-file.lib";
import { parseBuilderState, type BuilderEditOutput, type BuilderIntakeOutput, type BuilderState } from "./builder.dto";
import { applyEditReading, applyIntakeReading, cleanIntakeReading, colorFromText, fileRowToMapped, mergeModelMapping, patchFileRow, readFileColumns, stylesOf, toFileRows } from "./builder-intake.lib";

const output = (patch: Partial<BuilderIntakeOutput> = {}): BuilderIntakeOutput => ({
  storeNameAr: null,
  storeNameEn: null,
  nameIdeas: [],
  industryHint: null,
  audience: null,
  tone: null,
  styleWords: [],
  taglineAr: null,
  taglineEn: null,
  photoKeywordsEn: [],
  phone: null,
  whatsapp: null,
  email: null,
  socialLinks: [],
  ...patch,
});
const v2 = (patch: Partial<BuilderState> = {}): BuilderState => ({ ...parseBuilderState({}), flow: "v2", ...patch });

describe("the intake reading, cleaned", () => {
  const prompt = "متجر عطور رجالي في القاهرة اسمه عود. كلمونا 01012345678";

  it("keeps a name, a phone or a link only when the seller wrote it", () => {
    const reading = cleanIntakeReading(
      output({
        storeNameAr: "عود",
        storeNameEn: "Oud Palace",
        phone: "01099999999",
        whatsapp: "01012345678",
        email: "made@up.com",
        socialLinks: ["instagram.com/fake"],
        nameIdeas: ["فكرة"],
      }),
      prompt,
    );
    expect(reading.name).toBe("عود");
    // Not in the text: dropped.
    expect(reading.nameEn).toBeNull();
    expect(reading.contact.email).toBeNull();
    expect(reading.social).toEqual([]);
    // The code reads the typed number itself; the model's invented one never wins.
    expect(reading.contact.phone).toBe("01012345678");
    // A name was given: no ideas.
    expect(reading.nameIdeas).toEqual([]);
  });

  it("gives name ideas only when no name was written, clipped and cleaned", () => {
    const reading = cleanIntakeReading(output({ storeNameAr: "مسك الليل", nameIdeas: ["<b>Oud</b>", "مسك", "مسك", "Very long name that goes on and on forever"] }), "عطور رجالي");
    expect(reading.name).toBeNull();
    expect(reading.nameIdeas).toEqual(["Oud", "مسك", "Very long name that goes on an"]);
  });

  it("keeps photo keywords as plain English words, at most 5", () => {
    const reading = cleanIntakeReading(output({ photoKeywordsEn: ["Perfume Bottle", "عطر", "oud!", "wood", "amber", "glass", "smoke"] }), prompt);
    expect(reading.photoKeywordsEn).toEqual(["perfume bottle", "wood", "amber", "glass", "smoke"]);
  });

  it("sets the industry only when the code is sure, else offers its best 3", () => {
    const sure = applyIntakeReading(v2({ about: "perfume" }), cleanIntakeReading(output({ industryHint: "beauty cosmetics" }), "perfume"));
    expect(sure.industryId).toBe("beauty");
    const unsure = applyIntakeReading(v2({ about: "حاجات حلوة" }), cleanIntakeReading(output({ industryHint: "gifts and toys" }), "حاجات حلوة"));
    expect(unsure.industryId).toBeNull();
    expect(unsure.industryOptions.length).toBeGreaterThan(0);
    expect(unsure.intakeDone).toBe(true);
  });

  it("reads styles in code and never replaces an answer the seller gave", () => {
    expect(stylesOf(["luxury", "minimal"])).toEqual(["luxe", "minimal"]);
    const state = applyIntakeReading(v2({ name: "My name", contact: { phone: "01111111111", whatsapp: null, email: null } }), cleanIntakeReading(output({ storeNameAr: "عود", styleWords: ["luxury"] }), prompt));
    expect(state.name).toBe("My name");
    expect(state.contact.phone).toBe("01111111111");
    expect(state).toMatchObject({ styles: ["luxe"], styleDone: true });
  });
});

describe("the file inside the build", () => {
  const model = buildSheetModel([
    ["الاسم", "السعر", "الكمية", "القسم", "الصور"],
    ["شنطة جلد", "450 جنيه", "5", "شنط", "https://x.test/a.jpg http://x.test/b.jpg"],
    ["محفظة", "", "", "محافظ", ""],
    ["شنطة جلد", "450", "3", "شنط", ""],
    ["", "100", "1", "", ""],
  ]);

  it("reads known headers in code (no model) and keeps rows missing a price for the seller to fix", () => {
    const columns = readFileColumns(model);
    expect(columns).toMatchObject({ source: "dictionary", needsModel: false });
    const { rows, summary } = toFileRows(applyMapping(model, columns.mapping), columns.source);
    expect(rows).toEqual([
      expect.objectContaining({ row: 2, name: "شنطة جلد", price: 45000, stock: 5, category: "شنط", images: ["https://x.test/a.jpg"] }),
      expect.objectContaining({ row: 3, name: "محفظة", price: null, stock: null, category: "محافظ" }),
    ]);
    expect(summary).toMatchObject({ found: 4, kept: 2, missingPrice: 1, missingStock: 1, dropped: 2 });
  });

  it("asks the model for unknown headers, and keeps only real column indexes from it", () => {
    const odd = buildSheetModel([["xx", "yy"], ["Mug", "100"]]);
    const columns = readFileColumns(odd);
    expect(columns.needsModel).toBe(true);
    expect(mergeModelMapping({ name: 0, price: 1, stock: 7 }, columns.mapping, 2)).toMatchObject({ name: 0, price: 1, stock: null });
    expect(mergeModelMapping({ price: 1 }, columns.mapping, 2)).toBeNull();
  });

  it("turns a compact row back into what the importer reads, with the same price and offer", () => {
    const mapped = fileRowToMapped({ row: 4, name: "Mug", nameEn: null, price: 9950, compareAt: 12000, stock: 2, unlimited: false, images: ["https://x.test/a.jpg"], category: null, description: null, sku: null }, "Kitchen");
    const check = validateRow(mapped);
    expect(check.ok && check.value).toMatchObject({ listPiastres: 12000, salePiastres: 9950, stock: 2, category: "Kitchen", images: ["https://x.test/a.jpg"] });
    const unlimited = fileRowToMapped({ row: 5, name: "Mug", nameEn: null, price: 100, compareAt: null, stock: null, unlimited: true, images: [], category: "C", description: null, sku: null });
    expect(unlimited.stock).toBeUndefined();
  });

  it("the inline fix takes the seller's price in pounds and their stock, and refuses bad ones", () => {
    const row = { row: 3, name: "محفظة", nameEn: null, price: null, compareAt: null, stock: null, unlimited: false, images: [], category: null, description: null, sku: null };
    expect(patchFileRow(row, { price: "١٥٠", stock: 4 })).toMatchObject({ price: 15000, stock: 4 });
    expect(patchFileRow(row, { unlimited: true })).toMatchObject({ unlimited: true, stock: null });
    expect(patchFileRow(row, { price: "100 - 200" })).toBeNull();
    expect(patchFileRow(row, { stock: -1 })).toBeNull();
  });
});

describe("chat edits", () => {
  const edit = (patch: Partial<BuilderEditOutput> = {}): BuilderEditOutput => ({
    nameEn: null,
    industryHint: null,
    phone: null,
    whatsapp: null,
    email: null,
    socialLinks: [],
    products: [],
    storeName: null,
    colorWord: null,
    styleWords: [],
    ...patch,
  });

  it("changes the colour from a word code knows, only when a colour was asked for", () => {
    expect(colorFromText("خلي اللون أخضر", "green")).toBe("#2e7d32");
    expect(colorFromText("use #AA00cc please", null)).toBe("#aa00cc");
    expect(colorFromText("شنطة سوداء بـ 200", null)).toBeNull();
    const state = applyEditReading(v2({ primaryColor: "#111111" }), edit({ colorWord: "navy" }), "make it navy", () => "n");
    expect(state).toMatchObject({ primaryColor: "#1b2a4a", colorDone: true });
  });

  it("renames the store only with a name written in the text, and never invents a price", () => {
    const renamed = applyEditReading(v2({ name: "Old" }), edit({ storeName: "عود الملوك" }), "اسم المتجر عود الملوك", () => "n");
    expect(renamed.name).toBe("عود الملوك");
    const invented = applyEditReading(v2({ name: "Old" }), edit({ storeName: "Something else", products: [{ name: "Mug", details: "", price: 999, compareAtPrice: null, stock: 3 }] }), "add a mug, 3 in stock", () => "n");
    expect(invented.name).toBe("Old");
    expect(invented.products).toEqual([expect.objectContaining({ name: "Mug", price: null, stock: 3 })]);
  });
});
