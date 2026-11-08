import { describe, expect, it } from "vitest";
import { BUILDER_LIMITS, parseBuilderState, type BuilderChatOutput, type BuilderProduct, type BuilderState } from "./builder.dto";
import {
  applyAnswer,
  buildItemKeys,
  buildProgress,
  canSpend,
  currentStep,
  latinNameInText,
  matchIndustry,
  mergeReading,
  nextBuildItem,
  numbersInText,
  platformBudgetMicroUsd,
  productsProblem,
  readContact,
  readSocialLinks,
  reviewIssues,
  shippingZoneNames,
  shortlistTemplates,
  subdomainBase,
  withNextQuestion,
} from "./builder.lib";
import { syncField } from "./builder-row.lib";

const state = (patch: Partial<BuilderState> = {}): BuilderState => ({ ...parseBuilderState({}), ...patch });
const product = (patch: Partial<BuilderProduct> = {}): BuilderProduct => ({
  id: "p1",
  name: "Mug",
  details: "",
  price: 100,
  compareAtPrice: null,
  stock: 3,
  unlimited: false,
  photos: [],
  ...patch,
});
const output = (patch: Partial<BuilderChatOutput> = {}): BuilderChatOutput => ({
  nameEn: null,
  industryHint: null,
  phone: null,
  whatsapp: null,
  email: null,
  socialLinks: [],
  products: [],
  ...patch,
});
const newId = () => "new";

describe("the conversation", () => {
  it("asks each question in order and moves on as answers come", () => {
    let s = state();
    expect(currentStep(s)).toBe("name");
    s = { ...s, name: "Noor" };
    expect(currentStep(s)).toBe("about");
    s = { ...s, about: "candles" };
    expect(currentStep(s)).toBe("industry");
    s = { ...s, industryId: "handmade", contact: { phone: "01012345678", whatsapp: null, email: null } };
    // A phone from the first answer skips the contact question.
    expect(currentStep(s)).toBe("social");
    s = { ...s, socialDone: true };
    expect(currentStep(s)).toBe("brief");
    s = { ...s, briefConfirmed: true, logoDone: true };
    expect(currentStep(s)).toBe("template");
    s = { ...s, templateKey: "x", productsDone: true };
    expect(currentStep(s)).toBe("shipping");
    s = { ...s, shipping: { mode: "skip" }, returns: { kind: "skip" } };
    expect(currentStep(s)).toBe("summary");
  });

  it("adds the next question once, so a resumed chat doesn't repeat it", () => {
    const once = withNextQuestion(state());
    expect(once.messages).toEqual([{ role: "assistant", key: "name" }]);
    expect(withNextQuestion(once).messages).toHaveLength(1);
  });

  it("refuses over-long text before anything else", () => {
    expect(applyAnswer(state(), { type: "text", text: "x".repeat(BUILDER_LIMITS.textMax + 1) })).toEqual({ kind: "error", error: "tooLong" });
  });

  it("sends only the free-text answers to the model", () => {
    const named = applyAnswer(state(), { type: "text", text: "Noor" });
    expect(named.kind).toBe("ok");
    const about = applyAnswer(state({ name: "Noor" }), { type: "text", text: "handmade candles" });
    expect(about.kind).toBe("read");
    const contact = applyAnswer(state({ name: "Noor", about: "x", industryId: "food" }), { type: "text", text: "01012345678" });
    expect(contact.kind).toBe("ok");
  });

  it("needs a phone to pass the contact question", () => {
    const s = state({ name: "Noor", about: "x", industryId: "food" });
    expect(applyAnswer(s, { type: "text", text: "no number here" })).toEqual({ kind: "error", error: "needPhone" });
    expect(applyAnswer(s, { type: "skip" })).toEqual({ kind: "error", error: "needPhone" });
  });

  it("confirms the brief only when there is one", () => {
    const s = state({ name: "Noor", about: "x", industryId: "food", contact: { phone: "01012345678", whatsapp: null, email: null }, socialDone: true });
    expect(applyAnswer(s, { type: "chip", value: "confirm" }).kind).toBe("error");
    const brief = { nameEn: "Noor", taglineAr: "ا", taglineEn: "a", audience: "ا", tone: "ا", styleWords: [] };
    expect(applyAnswer({ ...s, brief }, { type: "chip", value: "confirm" })).toEqual({ kind: "confirmBrief" });
    expect(applyAnswer({ ...s, brief }, { type: "text", text: "more playful" }).kind).toBe("rewriteBrief");
  });

  it("only takes a template from the shortlist", () => {
    const s = state({
      name: "Noor",
      about: "x",
      industryId: "food",
      contact: { phone: "01012345678", whatsapp: null, email: null },
      socialDone: true,
      briefConfirmed: true,
      logoDone: true,
      shortlist: ["good"],
    });
    expect(applyAnswer(s, { type: "chip", value: "other-template" }).kind).toBe("error");
    expect(applyAnswer(s, { type: "chip", value: "good" }).kind).toBe("ok");
  });

  it("asks one price for all Egypt, then reads it in code", () => {
    const s = state({
      name: "Noor",
      about: "x",
      industryId: "food",
      contact: { phone: "01012345678", whatsapp: null, email: null },
      socialDone: true,
      briefConfirmed: true,
      logoDone: true,
      templateKey: "t",
      productsDone: true,
    });
    const asked = applyAnswer(s, { type: "chip", value: "egypt_flat" });
    if (asked.kind !== "ok") throw new Error("chip refused");
    expect(asked.state.shippingAwaitingPrice).toBe(true);
    const priced = applyAnswer(asked.state, { type: "text", text: "٦٠ جنيه" });
    if (priced.kind !== "ok") throw new Error("price refused");
    expect(priced.state.shipping).toEqual({ mode: "template", template: "egypt_flat", price: 60 });
    expect(currentStep(priced.state)).toBe("returns");
  });

  it("keeps a return period as the seller's own choice", () => {
    const s = state({
      name: "Noor",
      about: "x",
      industryId: "food",
      contact: { phone: "01012345678", whatsapp: null, email: null },
      socialDone: true,
      briefConfirmed: true,
      logoDone: true,
      templateKey: "t",
      productsDone: true,
      shipping: { mode: "skip" },
    });
    const chose = applyAnswer(s, { type: "chip", value: "days:14" });
    expect(chose.kind === "ok" && chose.state.returns).toEqual({ kind: "days", days: 14 });
    expect(applyAnswer(s, { type: "chip", value: "days:9" }).kind).toBe("error");
  });
});

describe("products", () => {
  it("won't move on without a price and a stock answer", () => {
    expect(productsProblem([])).toBe("needProducts");
    expect(productsProblem([product({ price: null })])).toBe("needPrices");
    expect(productsProblem([product({ stock: null })])).toBe("needPrices");
    expect(productsProblem([product({ stock: null, unlimited: true })])).toBeNull();
    expect(productsProblem([product()])).toBeNull();
  });

  it("reads numbers in any digits", () => {
    expect(numbersInText("السعر ٢٥٠ جنيه and 1,200 EGP")).toEqual([250, 1200]);
  });
});

describe("what the model may fill in", () => {
  it("drops a price, stock or phone that isn't in the seller's text", () => {
    const merged = mergeReading(
      state(),
      output({ phone: "01099999999", products: [{ name: "Mug", details: "", price: 500, compareAtPrice: null, stock: 7 }] }),
      "I sell a Mug",
      newId,
    );
    expect(merged.products[0]).toMatchObject({ name: "Mug", price: null, stock: null });
    expect(merged.contact.phone).toBeNull();
  });

  it("keeps what the seller did write", () => {
    const merged = mergeReading(
      state(),
      output({ phone: "01012345678", products: [{ name: "Mug", details: "", price: 250, compareAtPrice: 300, stock: 4 }] }),
      "Mug 250 instead of 300, 4 pieces. Call 01012345678",
      newId,
    );
    expect(merged.products[0]).toMatchObject({ price: 250, compareAtPrice: 300, stock: 4 });
    expect(merged.contact.phone).toBe("01012345678");
  });

  it("never replaces an answer and ignores a link the seller didn't write", () => {
    const merged = mergeReading(
      state({ contact: { phone: "01111111111", whatsapp: null, email: null } }),
      output({ phone: "01012345678", socialLinks: ["https://instagram.com/evil"] }),
      "my number 01012345678",
      newId,
    );
    expect(merged.contact.phone).toBe("01111111111");
    expect(merged.social).toEqual([]);
    expect(merged.socialDone).toBe(false);
  });

  it("stops at the product limit and skips duplicates", () => {
    const many = Array.from({ length: BUILDER_LIMITS.products }, (_, i) => product({ id: `p${i}`, name: `P${i}` }));
    const full = mergeReading(state({ products: many }), output({ products: [{ name: "One more", details: "", price: null, compareAtPrice: null, stock: null }] }), "x", newId);
    expect(full.products).toHaveLength(BUILDER_LIMITS.products);
    const dup = mergeReading(state({ products: [product()] }), output({ products: [{ name: "mug", details: "", price: null, compareAtPrice: null, stock: null }] }), "x", newId);
    expect(dup.products).toHaveLength(1);
  });
});

describe("the store's Latin name from a reading", () => {
  it("is kept only when the seller wrote it", () => {
    expect(mergeReading(state(), output({ nameEn: "Noor Candles" }), "my store is called noor  candles", newId).nameEn).toBe("Noor Candles");
    expect(mergeReading(state(), output({ nameEn: "Nour" }), "اسم المتجر نور", newId).nameEn).toBeNull();
  });

  it("never replaces one already kept, and refuses odd values", () => {
    expect(mergeReading(state({ nameEn: "Noor" }), output({ nameEn: "Other" }), "Other", newId).nameEn).toBe("Noor");
    expect(latinNameInText("<b>x</b>", "<b>x</b>")).toBeNull();
    expect(latinNameInText("a".repeat(41), "a".repeat(41))).toBeNull();
    expect(latinNameInText("123", "123")).toBeNull();
    expect(latinNameInText(null, "anything")).toBeNull();
    expect(latinNameInText("Dar El-Noor", "Dar El-Noor shop")).toBe("Dar El-Noor");
  });
});

describe("answers read in code", () => {
  it("reads contact details with no model", () => {
    expect(readContact("٠١٠١٢٣٤٥٦٧٨")).toMatchObject({ phone: "01012345678" });
    expect(readContact("01012345678 واتساب 01112345678 a@b.co")).toEqual({ phone: "01012345678", whatsapp: "01112345678", email: "a@b.co" });
    expect(readContact("hello").phone).toBeNull();
  });

  it("only takes links on the platform's own site", () => {
    expect(readSocialLinks("https://instagram.com/noor")).toEqual([{ platform: "instagram", value: expect.stringContaining("instagram.com/noor") }]);
    expect(readSocialLinks("https://facebook.com.evil.com/x")).toEqual([]);
    expect(readSocialLinks("noor store")).toEqual([]);
  });

  it("matches an industry in code", () => {
    expect(matchIndustry("gold jewelry and watches")).toBe("jewelry");
    expect(matchIndustry("مجوهرات")).toBe("jewelry");
    expect(matchIndustry("zzz")).toBeNull();
  });

  it("makes a subdomain from Latin letters only", () => {
    expect(subdomainBase("Noor Candles!", "نور")).toBe("noor-candles");
    expect(subdomainBase(null, "نور")).toBe("");
  });

  it("names every shipping group", () => {
    expect(shippingZoneNames("tallaby_rates", 2)).toEqual([
      { nameAr: "منطقة 1", nameEn: "Zone 1" },
      { nameAr: "منطقة 2", nameEn: "Zone 2" },
    ]);
    expect(shippingZoneNames("egypt_flat", 1)).toHaveLength(1);
  });
});

describe("template shortlist", () => {
  const t = (key: string, category: string, en = "") => ({ key, category, name: { en }, description: { en } });
  const list = [t("a", "food", "warm bakery"), t("b", "food", "bold"), t("c", "food", "minimal"), t("d", "food", "minimal clean"), t("e", "beauty")];

  it("picks three of the store's industry, style words first", () => {
    const picked = shortlistTemplates(list, "food", ["minimal"], "seed");
    expect(picked).toHaveLength(3);
    expect(picked).not.toContain("e");
    expect(picked.slice(0, 2).sort()).toEqual(["c", "d"]);
  });

  it("gives the same list for the same seed", () => {
    expect(shortlistTemplates(list, null, [], "seed")).toEqual(shortlistTemplates(list, null, [], "seed"));
  });
});

describe("spend", () => {
  it("stops before a call could cross the hard stop", () => {
    expect(canSpend(0)).toBe(true);
    expect(canSpend(BUILDER_LIMITS.hardStopMicroUsd - BUILDER_LIMITS.callMarginMicroUsd - 1)).toBe(true);
    expect(canSpend(BUILDER_LIMITS.hardStopMicroUsd - BUILDER_LIMITS.callMarginMicroUsd)).toBe(false);
    expect(canSpend(BUILDER_LIMITS.hardStopMicroUsd)).toBe(false);
  });

  it("reads the platform budget from env", () => {
    expect(platformBudgetMicroUsd("10")).toBe(10_000_000);
    expect(platformBudgetMicroUsd("0")).toBe(0);
    expect(platformBudgetMicroUsd(undefined)).toBe(25_000_000);
    expect(platformBudgetMicroUsd("nope")).toBe(25_000_000);
  });
});

describe("build steps", () => {
  it("lists one item per product and resumes at the first unfinished one", () => {
    const keys = buildItemKeys({ products: [product({ id: "a" }), product({ id: "b" })] });
    expect(keys).toEqual(["store", "settings", "template", "site_copy", "product:a", "product:b", "catalog", "shipping", "policy", "notes"]);
    const items = new Map([
      ["store", { status: "done" as const }],
      ["settings", { status: "failed" as const }],
      ["template", { status: "skipped" as const }],
      ["site_copy", { status: "pending" as const }],
    ]);
    expect(nextBuildItem(keys, items)).toBe("site_copy");
    expect(buildProgress(keys, items)).toEqual({ done: 3, total: 10, current: "site_copy" });
  });
});

describe("review", () => {
  const base = {
    storeId: "s1",
    state: { products: [product()], logo: "logo.jpg", returns: { kind: "days" as const, days: 7 }, shipping: { mode: "template" as const, template: "cairo_giza" as const } },
    products: [{ id: "x", hasPhoto: true }],
    zoneCount: 1,
    returnPolicy: "ok",
    invalidPages: 0,
  };
  const done = new Map([
    ["product:p1", { status: "done" as const, data: {}, productId: "x" }],
    ["site_copy", { status: "done" as const, data: {}, productId: null }],
    ["shipping", { status: "done" as const, data: {}, productId: null }],
  ]);

  it("is empty when everything is there", () => {
    expect(reviewIssues({ ...base, items: done })).toEqual([]);
  });

  it("lists what's missing, with a link to fix it", () => {
    const issues = reviewIssues({
      ...base,
      state: { ...base.state, logo: null },
      items: new Map([["shipping", { status: "done" as const, data: { unmatched: ["Narnia"] }, productId: null }]]),
      products: [{ id: "x", hasPhoto: false }],
      zoneCount: 0,
      returnPolicy: " ",
      invalidPages: 1,
    });
    expect(issues.map((issue) => issue.code)).toEqual([
      "productNotBuilt",
      "productsWithoutPhoto",
      "siteCopyMissing",
      "pagesInvalid",
      "noLogo",
      "placesNotRecognised",
      "shippingNotSet",
      "noReturnPolicy",
    ]);
    expect(issues.every((issue) => issue.href)).toBe(true);
  });

  it("doesn't ask for shipping the seller skipped", () => {
    const issues = reviewIssues({ ...base, state: { ...base.state, shipping: { mode: "skip" } }, items: done, zoneCount: 0 });
    expect(issues.map((issue) => issue.code)).not.toContain("shippingNotSet");
  });
});

describe("a product row following the server", () => {
  it("shows a new server value when the seller hasn't typed", () => {
    expect(syncField({ value: "", synced: "" }, "250")).toEqual({ value: "250", synced: "250" });
  });

  it("keeps what the seller is typing", () => {
    expect(syncField({ value: "30", synced: "" }, "250")).toEqual({ value: "30", synced: "250" });
  });

  it("changes nothing when the server value is the same", () => {
    const field = { value: "3", synced: "2" };
    expect(syncField(field, "2")).toBe(field);
  });
});
