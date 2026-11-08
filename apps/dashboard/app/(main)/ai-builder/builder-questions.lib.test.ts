import { describe, expect, it } from "vitest";
import { TEMPLATE_STYLES } from "@workspace/store-sections/templates";
import { parseBuilderState, type BuilderFileRow, type BuilderState } from "./builder.dto";
import { BUILDER_STYLES, applyCardAnswers, currentRound, fileProblems, nextCard, withCard } from "./builder-questions.lib";

const v2 = (patch: Partial<BuilderState> = {}): BuilderState => ({ ...parseBuilderState({}), flow: "v2", intakeDone: true, ...patch });
const fileRow = (patch: Partial<BuilderFileRow> = {}): BuilderFileRow => ({
  row: 2,
  name: "شنطة جلد",
  nameEn: null,
  price: 45000,
  compareAt: null,
  stock: 5,
  unlimited: false,
  images: [],
  category: "شنط",
  description: null,
  sku: null,
  ...patch,
});
const ids = (state: BuilderState) => nextCard(state).questions.map((q) => q.id);

/** Shape A: a prompt only (no name, colour, style or products). */
const shapeA = () => v2({ about: "متجر عطور رجالي", nameIdeas: ["عود", "Oud House", "مسك"], industryOptions: ["beauty", "handmade"] });
/** Shape B: a prompt and a file, name and industry read, no colour. */
const shapeB = () => v2({ about: "شنط جلد طبيعي", name: "جلدي", industryId: "shoes-bags", styleDone: true, styles: ["classic"], fileRows: [fileRow()] });
/** Shape C: the full brief: name, colour, style, file. */
const shapeC = () =>
  v2({
    about: "متجر شنط جلد اسمه جلدي",
    name: "جلدي",
    industryId: "shoes-bags",
    primaryColor: "#7a4e2d",
    colorDone: true,
    styles: ["luxe"],
    styleDone: true,
    fileRows: [fileRow()],
    contact: { phone: "01012345678", whatsapp: "01012345678", email: null },
  });

describe("the question bank", () => {
  it("keeps the same styles as the templates", () => {
    expect([...BUILDER_STYLES]).toEqual([...TEMPLATE_STYLES]);
  });

  it("asks the seller to describe the store before anything is read (dashboard start)", () => {
    const state = { ...parseBuilderState({}), flow: "v2" as const };
    expect(currentRound(state)).toBe("describe");
    expect(ids(state)).toEqual(["describe"]);
  });

  it("shape A: the brand card first (name with 3 ideas, industry top 3, colour), then the style, design, products, selling", () => {
    let state = shapeA();
    const card = nextCard(state);
    expect(card.round).toBe("brand");
    expect(card.questions.map((q) => q.id)).toEqual(["storeName", "industry", "color"]);
    const name = card.questions[0]!;
    expect(name.options.map((o) => o.value)).toEqual(["عود", "Oud House", "مسك"]);
    expect(name.options[0]!.recommended).toBe(true);
    expect(name.allowOther).toBe(true);
    const industry = card.questions[1]!;
    expect(industry.options.map((o) => o.value)).toEqual(["beauty", "handmade", "other"]);
    expect(card.questions[2]!.options.at(-1)).toMatchObject({ value: "template" });

    const first = applyCardAnswers(state, { storeName: { choice: "عود" }, industry: { choice: "beauty" }, color: { text: "#1E5BB8" } });
    expect(first.kind).toBe("ok");
    state = (first as { state: BuilderState }).state;
    expect(state).toMatchObject({ name: "عود", industryId: "beauty", primaryColor: "#1e5bb8", colorDone: true });
    // The 4th brand question shows on a second card of the same round.
    expect(ids(state)).toEqual(["style"]);
    state = (applyCardAnswers(state, { style: { choices: ["luxe", "minimal"] } }) as { state: BuilderState }).state;
    expect(currentRound(state)).toBe("design");

    state = { ...state, shortlist: ["a", "b", "c"] };
    expect(nextCard(state).questions[0]).toMatchObject({ id: "template", kind: "templates" });
    state = (applyCardAnswers(state, { template: { choice: "b" } }) as { state: BuilderState }).state;
    expect(state.templateKey).toBe("b");

    // No file and no products: the products round, the file recommended.
    const products = nextCard(state);
    expect(products.round).toBe("products");
    expect(products.questions[0]!.options.map((o) => [o.value, Boolean(o.recommended)])).toEqual([
      ["file", true],
      ["photos", false],
      ["type", false],
      ["none", false],
    ]);
    state = (applyCardAnswers(state, { products: { choice: "none" } }) as { state: BuilderState }).state;
    expect(currentRound(state)).toBe("selling");
    expect(ids(state)).toEqual(["shipping", "returns", "whatsapp"]);
  });

  it("shape B: asks only the colour on the brand card, and no products question when the file is clean", () => {
    let state = shapeB();
    expect(ids(state)).toEqual(["color"]);
    state = (applyCardAnswers(state, { color: { choice: "template" } }) as { state: BuilderState }).state;
    expect(state).toMatchObject({ primaryColor: null, colorDone: true });
    state = { ...state, shortlist: ["a", "b", "c"], templateKey: "a" };
    expect(currentRound(state)).toBe("selling");
  });

  it("shape C: a seller who gave everything sees only the design and selling cards", () => {
    let state = shapeC();
    expect(currentRound(state)).toBe("design");
    state = { ...state, shortlist: ["a", "b", "c"], templateKey: "a" };
    expect(currentRound(state)).toBe("selling");
    // WhatsApp is known: only shipping and returns.
    expect(ids(state)).toEqual(["shipping", "returns"]);
    const returns = nextCard(state).questions[1]!;
    expect(returns.options[0]).toMatchObject({ value: "days:14", recommended: true });
    state = (applyCardAnswers(state, { shipping: { choice: "egypt_flat", text: "٥٠" }, returns: { choice: "days:14" } }) as { state: BuilderState }).state;
    expect(state.shipping).toEqual({ mode: "template", template: "egypt_flat", price: 50 });
    expect(state.returns).toEqual({ kind: "days", days: 14 });
    expect(currentRound(state)).toBe("summary");
    expect(applyCardAnswers(state, { build: { choice: "build" } }).kind).toBe("build");
  });

  it("shows the file's problem rows, and moves on when the seller says so", () => {
    let state: BuilderState = { ...shapeC(), shortlist: ["a"], templateKey: "a", fileRows: [fileRow(), fileRow({ row: 3, name: "محفظة", price: null, stock: null })] };
    expect(fileProblems(state)).toEqual([{ row: 3, name: "محفظة", missing: ["price", "stock"] }]);
    expect(ids(state)).toEqual(["fileFix"]);
    state = (applyCardAnswers(state, { fileFix: { choice: "continue" } }) as { state: BuilderState }).state;
    expect(currentRound(state)).toBe("selling");
  });

  it("refuses answers that aren't on the card, a skip of a required question, and wrong values", () => {
    const state = shapeA();
    expect(applyCardAnswers(state, { template: { choice: "x" } })).toEqual({ kind: "error", error: "invalidAnswer" });
    expect(applyCardAnswers(state, { storeName: { skip: true } })).toMatchObject({ kind: "error", question: "storeName" });
    expect(applyCardAnswers(state, { color: { text: "green" } })).toMatchObject({ kind: "error", question: "color" });
    // Nothing is saved when one answer is wrong.
    expect(applyCardAnswers(state, { storeName: { text: "عود" }, color: { text: "nope" } }).kind).toBe("error");
  });

  it("typed and photo products need their own price and stock before moving on", () => {
    const state = { ...shapeC(), fileRows: [], shortlist: ["a"], templateKey: "a", productsChoice: "type" as const, products: [{ id: "p", name: "x", details: "", price: null, compareAtPrice: null, stock: null, unlimited: false, photos: [] }] };
    expect(ids(state)).toEqual(["productsDone"]);
    expect(applyCardAnswers(state, { productsDone: { choice: "done" } })).toMatchObject({ kind: "error", error: "needPrices" });
  });

  it("WhatsApp: the same number, a typed one, or skip", () => {
    const base = { ...shapeC(), contact: { phone: "01012345678", whatsapp: null, email: null }, shortlist: ["a"], templateKey: "a", shipping: { mode: "skip" as const }, returns: { kind: "skip" as const } };
    expect(nextCard(base).questions[0]!.options[0]).toMatchObject({ value: "same", params: { phone: "01012345678" } });
    expect((applyCardAnswers(base, { whatsapp: { choice: "same" } }) as { state: BuilderState }).state.contact.whatsapp).toBe("01012345678");
    const skipped = (applyCardAnswers(base, { whatsapp: { skip: true } }) as { state: BuilderState }).state;
    expect(currentRound(skipped)).toBe("summary");
    expect(applyCardAnswers(base, { whatsapp: { text: "12" } })).toMatchObject({ kind: "error", error: "needPhone" });
  });

  it("says the round in the chat once, as an i18n key", () => {
    const once = withCard(shapeA());
    const twice = withCard(once);
    expect(twice.messages.filter((m) => m.role === "assistant")).toEqual([{ role: "assistant", key: "v2.cards.brand" }]);
    expect(twice.pendingQuestions?.round).toBe("brand");
  });
});
