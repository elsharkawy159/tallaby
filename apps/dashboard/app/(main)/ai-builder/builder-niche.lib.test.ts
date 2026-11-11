import { describe, expect, it } from "vitest";
import { EDITIONS } from "@workspace/store-sections/templates";
import { TSHIRTS } from "../../../../../packages/store-sections/src/templates/editions/tshirts.fixture";
import { parseBuilderState, type BuilderFileRow, type BuilderState } from "./builder.dto";
import { applyEditReading, applyIntakeReading, intakeWithoutModel, type IntakeReading } from "./builder-intake.lib";
import { builderNiche, builderNicheInput, installEdition, suggestionEdition, suggestionEditionChoice } from "./builder-niche.lib";

/**
 * The builder's niche (ROADMAP F-90): computed in code from what the seller
 * gave. Packs come from the fixture (t-shirts on `fashion-luxe`) through the
 * `editions` parameter, never from the registry.
 */

const state = (over: Partial<BuilderState> = {}): BuilderState => ({ ...parseBuilderState({ flow: "v2" }), ...over });
const row = (name: string, extra: Partial<BuilderFileRow> = {}): BuilderFileRow => ({
  row: 2,
  name,
  nameEn: null,
  price: 25000,
  compareAt: null,
  stock: 5,
  unlimited: false,
  images: [],
  category: null,
  description: null,
  sku: null,
  ...extra,
});
const PACKS = [TSHIRTS];

describe("builderNiche: Arabic and English, with and without products, with a hint", () => {
  it("is null when the seller said nothing that names a trade", () => {
    expect(builderNiche(state())).toBeNull();
    expect(builderNiche(state({ industryId: "fashion" }))).toBeNull();
    expect(builderNiche(state({ industryId: "fashion", name: "Nova", about: "متجر جديد بأسعار مناسبة" }))).toBeNull();
    expect(builderNiche(state({ industryId: "other", name: "Nova" }))).toBeNull();
  });

  it("reads an Arabic description with no products and no model hint", () => {
    expect(builderNiche(state({ industryId: "fashion", about: "بنبيع تيشيرتات قطن مطبوعة" }))).toBe("tshirts");
    expect(builderNiche(state({ industryId: "fashion", about: "متجر فساتين سواريه" }))).toBe("dresses");
    expect(builderNiche(state({ about: "ساعات يد رجالي وحريمي" }))).toBe("watches");
  });

  it("reads an English description and an English store name", () => {
    expect(builderNiche(state({ industryId: "fashion", about: "We sell printed t-shirts and hoodies" }))).toBe("tshirts");
    expect(builderNiche(state({ industryId: "fashion", name: "Cairo Tees", nameEn: "Cairo Tees", about: "Heavy cotton tees" }))).toBe("tshirts");
  });

  it("reads the product titles of the seller's file, Arabic or English, when the words above say nothing", () => {
    const ar = state({ industryId: "fashion", name: "قطنة", fileRows: [row("تيشيرت أبيض سادة"), row("تيشيرت أسود اوفر سايز"), row("هودي رمادي"), row("تيشيرت مطبوع")] });
    expect(builderNiche(ar)).toBe("tshirts");
    const en = state({ industryId: "fashion", name: "Qotna", fileRows: [row("White T-shirt"), row("Black oversized t-shirt"), row("Grey hoodie"), row("Printed tee")] });
    expect(builderNiche(en)).toBe("tshirts");
    // Products typed in the chat count the same.
    const typed = state({ industryId: "fashion", products: ["تيشيرت أبيض", "تيشيرت أسود", "هودي"].map((name, index) => ({ id: String(index), name, details: "", price: 250, compareAtPrice: null, stock: 3, unlimited: false, photos: [] })) });
    expect(builderNiche(typed)).toBe("tshirts");
  });

  it("uses the model's short hint, and the hint alone is enough", () => {
    expect(builderNiche(state({ industryId: "fashion", tradeHint: "t-shirts" }))).toBe("tshirts");
    expect(builderNiche(state({ industryId: "fashion", tradeHint: "women's dresses" }))).toBe("dresses");
    // A hint that names no trade changes nothing.
    expect(builderNiche(state({ industryId: "fashion", tradeHint: "online store" }))).toBeNull();
  });

  it("hands the matcher the industry, the names, the titles with the file's categories, and a capped hint", () => {
    const input = builderNicheInput(
      state({
        industryId: "fashion",
        name: "قطنة",
        nameEn: "Qotna",
        tradeHint: "t-shirts",
        about: "ا".repeat(500),
        fileRows: [row("تيشيرت", { nameEn: "Tee", category: "تيشيرتات" }), row("هودي", { category: "تيشيرتات" })],
      }),
    );
    expect(input.industryId).toBe("fashion");
    expect(input.name).toBe("قطنة Qotna");
    expect(input.productTitles).toEqual(["تيشيرت", "Tee", "هودي", "تيشيرتات"]);
    expect(input.hint!.startsWith("t-shirts . ")).toBe(true);
    expect(input.hint!.length).toBe("t-shirts . ".length + 300);
    expect(input.category).toBeUndefined();
    expect(builderNicheInput(state({ industryId: "other" })).industryId).toBeNull();
    expect(builderNicheInput(state()).hint).toBeNull();
  });
});

describe("the hint comes from the reading the builder already makes", () => {
  const reading: IntakeReading = {
    name: null,
    nameEn: null,
    nameIdeas: [],
    industryHint: "t-shirts",
    audience: "",
    tone: "",
    styleWords: [],
    taglineAr: "",
    taglineEn: "",
    photoKeywordsEn: [],
    contact: { phone: null, whatsapp: null, email: null },
    social: [],
  };

  it("keeps the intake reading's industry hint as the trade hint", () => {
    const next = applyIntakeReading(state({ about: "متجر ملابس" }), reading);
    expect(next.tradeHint).toBe("t-shirts");
    expect(builderNiche(next)).toBe("tshirts");
  });

  it("keeps an earlier hint when a later reading has none, and has none without the model", () => {
    expect(applyIntakeReading(state({ tradeHint: "t-shirts" }), { ...reading, industryHint: null }).tradeHint).toBe("t-shirts");
    expect(intakeWithoutModel(state({ about: "متجر جديد" })).tradeHint).toBeNull();
  });

  it("takes a new hint from a chat edit only when the industry changes (the shortlist is made again)", () => {
    const edit = { nameEn: null, industryHint: "watches", phone: null, whatsapp: null, email: null, socialLinks: [], products: [], storeName: null, colorWord: null, styleWords: [] };
    const before = state({ industryId: "fashion", tradeHint: "t-shirts", shortlist: ["fashion-luxe"], nicheId: "tshirts" });
    const changed = applyEditReading(before, edit, "أنا ببيع ساعات", () => "id");
    if (changed.industryId !== "fashion") {
      expect(changed.tradeHint).toBe("watches");
      expect(changed.shortlist).toEqual([]);
    }
    const same = applyEditReading(before, { ...edit, industryHint: null }, "غيّر اللون", () => "id");
    expect(same.tradeHint).toBe("t-shirts");
    expect(same.shortlist).toEqual(["fashion-luxe"]);
  });
});

describe("suggestionEdition: only a valid edition gets through", () => {
  it("is the niche when its pack is approved on the template", () => {
    expect(suggestionEdition("fashion-luxe", "tshirts", PACKS)).toBe("tshirts");
    expect(suggestionEditionChoice("fashion-luxe", "tshirts", PACKS)).toEqual({ id: "tshirts", name: { ar: "تيشيرتات", en: "T-shirts" } });
    expect(installEdition({ templateKey: "fashion-luxe", nicheId: "tshirts" }, PACKS)).toEqual({ editionId: "tshirts" });
  });

  it("is null for an unknown niche, a pack not approved on the template, a template that takes none, and junk", () => {
    const cases: [string | null | undefined, unknown][] = [
      ["fashion-luxe", "dresses"],
      ["fashion-luxe", "no-such-niche"],
      ["fashion-luxe", "tshirts'; drop table stores;--"],
      ["fashion-luxe", ""],
      ["fashion-luxe", null],
      ["fashion-luxe", undefined],
      ["fashion-luxe", 7],
      ["fashion-luxe", ["tshirts"]],
      ["kabl", "tshirts"],
      ["tallaby-classic", "tshirts"],
      ["no-such-template", "tshirts"],
      ["", "tshirts"],
      [null, "tshirts"],
      [undefined, "tshirts"],
    ];
    for (const [key, niche] of cases) {
      expect(suggestionEdition(key, niche, PACKS), `${key} / ${String(niche)}`).toBeNull();
      expect(installEdition({ templateKey: key ?? null, nicheId: niche as string | null }, PACKS), `${key} / ${String(niche)}`).toEqual({});
      if (key) expect(suggestionEditionChoice(key, niche, PACKS)).toBeNull();
    }
  });

  it("is null once the pack is no longer registered (a build saved before, installed after)", () => {
    expect(suggestionEdition("fashion-luxe", "tshirts", [])).toBeNull();
    expect(installEdition({ templateKey: "fashion-luxe", nicheId: "tshirts" }, [])).toEqual({});
  });

  it("with the registered packs: a niche with no pack gives no edition (every niche today)", () => {
    const without = ["tshirts", "dresses", "watches"].filter((id) => !EDITIONS.some((edition) => edition.niche === id));
    for (const niche of without) {
      expect(suggestionEdition("fashion-luxe", niche)).toBeNull();
      expect(installEdition({ templateKey: "fashion-luxe", nicheId: niche })).toEqual({});
    }
  });
});
