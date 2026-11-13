import { describe, expect, it } from "vitest";
import { applyDiscountRules, giftRuleReached, invalidGiftLineIndexes, isRuleLive, parseDiscountRule, type DiscountRule, type GiftLine, type RuleLine } from "./automatic-discounts.lib";

const NOW = new Date("2026-11-04T12:00:00Z");
const store = { sellerId: "s1", storeId: "st1" };
const rule = (extra: Partial<DiscountRule> = {}): DiscountRule => ({
  id: "r1",
  sellerId: "s1",
  storeId: "st1",
  name: "Sale",
  ruleType: "percent_off",
  scope: "all",
  categoryIds: [],
  discountPercent: 10,
  buyQuantity: null,
  getQuantity: null,
  minSubtotalPiastres: null,
  giftProductIds: [],
  startsAt: "2026-11-01T00:00:00Z",
  endsAt: null,
  isActive: true,
  ...extra,
});
const line = (quantity: number, unitPiastres = 10000, categoryId: string | null = null, productId = "p1"): RuleLine => ({ productId, categoryId, quantity, unitPiastres });
const amounts = (lines: RuleLine[], rules: DiscountRule[]) => applyDiscountRules(lines, rules, store, NOW).map((result) => result?.discountPiastres ?? 0);

describe("isRuleLive", () => {
  it("needs the rule on, in its window, on this store and seller", () => {
    expect(isRuleLive(rule(), store, NOW)).toBe(true);
    expect(isRuleLive(rule({ isActive: false }), store, NOW)).toBe(false);
    expect(isRuleLive(rule({ startsAt: "2026-11-05T00:00:00Z" }), store, NOW)).toBe(false);
    expect(isRuleLive(rule({ endsAt: "2026-11-04T11:59:00Z" }), store, NOW)).toBe(false);
    expect(isRuleLive(rule({ endsAt: "2026-11-04T12:01:00Z" }), store, NOW)).toBe(true);
    expect(isRuleLive(rule({ sellerId: "other" }), store, NOW)).toBe(false);
    expect(isRuleLive(rule({ storeId: "other" }), store, NOW)).toBe(false);
  });
});

describe("percent off", () => {
  it("takes the percent off every unit in whole piastres", () => {
    expect(amounts([line(3, 9999)], [rule()])).toEqual([3000]);
  });
  it("covers only the rule's categories", () => {
    const scoped = rule({ scope: "categories", categoryIds: ["c1"] });
    expect(amounts([line(1, 10000, "c1"), line(1, 10000, "c2"), line(1, 10000, null)], [scoped])).toEqual([1000, 0, 0]);
  });
  it("a rule on a main category covers its sub-categories (0171)", () => {
    const onMain = rule({ scope: "categories", categoryIds: ["main"] });
    const inSub: RuleLine = { ...line(1, 10000, "sub"), categoryIds: ["sub", "main"] };
    const inMain: RuleLine = { ...line(1, 10000, "main"), categoryIds: ["main"] };
    expect(amounts([inSub, inMain], [onMain])).toEqual([1000, 1000]);
  });
  it("a rule on a sub-category doesn't cover its main category or a sibling", () => {
    const onSub = rule({ scope: "categories", categoryIds: ["sub"] });
    const inMain: RuleLine = { ...line(1, 10000, "main"), categoryIds: ["main"] };
    const inSibling: RuleLine = { ...line(1, 10000, "sibling"), categoryIds: ["sibling", "main"] };
    const inSub: RuleLine = { ...line(1, 10000, "sub"), categoryIds: ["sub", "main"] };
    expect(amounts([inMain, inSibling, inSub], [onSub])).toEqual([0, 0, 1000]);
  });
  it("a line without categoryIds falls back to its categoryId", () => {
    const onMain = rule({ scope: "categories", categoryIds: ["main"] });
    expect(amounts([line(1, 10000, "main"), line(1, 10000, "sub"), line(1, 10000, null)], [onMain])).toEqual([1000, 0, 0]);
  });
});

describe("buy X get Y", () => {
  const bogo = (extra: Partial<DiscountRule> = {}) => rule({ ruleType: "buy_x_get_y", buyQuantity: 2, getQuantity: 1, discountPercent: 100, ...extra });

  it("gives nothing short of a complete set", () => {
    expect(amounts([line(2)], [bogo()])).toEqual([0]);
  });
  it("gives one free unit per complete set", () => {
    expect(amounts([line(3)], [bogo()])).toEqual([10000]);
    expect(amounts([line(5)], [bogo()])).toEqual([10000]);
    expect(amounts([line(6)], [bogo()])).toEqual([20000]);
  });
  it("pools across lines and takes the cheapest units", () => {
    expect(amounts([line(2, 30000), line(1, 10000, null, "p2")], [bogo()])).toEqual([0, 10000]);
    expect(amounts([line(4, 30000), line(2, 10000, null, "p2")], [bogo()])).toEqual([0, 20000]);
    expect(amounts([line(5, 30000), line(1, 10000, null, "p2")], [bogo()])).toEqual([30000, 10000]);
  });
  it("can be a percent off instead of free", () => {
    expect(amounts([line(3)], [bogo({ discountPercent: 50 })])).toEqual([5000]);
  });
  it("counts only units in scope", () => {
    const scoped = bogo({ scope: "categories", categoryIds: ["c1"] });
    expect(amounts([line(2, 10000, "c1"), line(1, 5000, "c2", "p2")], [scoped])).toEqual([0, 0]);
    expect(amounts([line(3, 10000, "c1"), line(1, 5000, "c2", "p2")], [scoped])).toEqual([10000, 0]);
  });
});

describe("the best single rule per line", () => {
  it("takes each line's best rule and never adds them", () => {
    const a = rule({ id: "a", discountPercent: 10 });
    const b = rule({ id: "b", discountPercent: 20, scope: "categories", categoryIds: ["c1"] });
    const results = applyDiscountRules([line(1, 10000, "c1"), line(1, 10000, "c2")], [a, b], store, NOW);
    expect(results.map((r) => r?.snapshot.ruleId)).toEqual(["b", "a"]);
    expect(results.map((r) => r?.discountPiastres)).toEqual([2000, 1000]);
  });
  it("gives a tie to the first rule, and skips a rule that isn't live", () => {
    const a = rule({ id: "a" });
    const b = rule({ id: "b" });
    const off = rule({ id: "c", discountPercent: 50, isActive: false });
    expect(applyDiscountRules([line(1)], [a, b, off], store, NOW)[0]?.snapshot.ruleId).toBe("a");
  });
  it("ignores free-gift rules, which take nothing off a line", () => {
    const gift = rule({ ruleType: "free_gift", giftProductIds: ["g"], minSubtotalPiastres: 0 });
    expect(amounts([line(1)], [gift])).toEqual([0]);
  });
});

describe("free gifts", () => {
  const giftRule = (extra: Partial<DiscountRule> = {}) => rule({ ruleType: "free_gift", giftProductIds: ["g1", "g2"], minSubtotalPiastres: 50000, ...extra });
  const gift = (extra: Partial<GiftLine> = {}): GiftLine => ({ ruleId: "r1", productId: "g1", quantity: 1, available: true, ...extra });
  const enough = { netPiastres: 50000, paidUnits: 1 };
  const check = (gifts: GiftLine[], rules: DiscountRule[] = [giftRule()], cart = enough) => invalidGiftLineIndexes(gifts, rules, store, cart, NOW);

  it("reaches its amount only with paid units", () => {
    expect(giftRuleReached({ minSubtotalPiastres: 50000 }, enough)).toBe(true);
    expect(giftRuleReached({ minSubtotalPiastres: 50000 }, { netPiastres: 49999, paidUnits: 1 })).toBe(false);
    expect(giftRuleReached({ minSubtotalPiastres: 0 }, { netPiastres: 0, paidUnits: 0 })).toBe(false);
  });
  it("lets a good gift through", () => {
    expect(check([gift()])).toEqual([]);
  });
  it("refuses a gift below the amount, on its own, or with no rule", () => {
    expect(check([gift()], [giftRule()], { netPiastres: 100, paidUnits: 1 })).toEqual([0]);
    expect(check([gift()], [giftRule({ minSubtotalPiastres: 0 })], { netPiastres: 0, paidUnits: 0 })).toEqual([0]);
    expect(check([gift({ ruleId: "gone" })])).toEqual([0]);
  });
  it("refuses a rule that is off, ended, another store's or not a gift rule", () => {
    expect(check([gift()], [giftRule({ isActive: false })])).toEqual([0]);
    expect(check([gift()], [giftRule({ endsAt: "2026-11-04T00:00:00Z" })])).toEqual([0]);
    expect(check([gift()], [giftRule({ sellerId: "other" })])).toEqual([0]);
    expect(check([gift()], [giftRule({ ruleType: "percent_off" })])).toEqual([0]);
  });
  it("refuses a product that isn't a gift, can't be handed over, or more than one unit", () => {
    expect(check([gift({ productId: "paid" })])).toEqual([0]);
    expect(check([gift({ available: false })])).toEqual([0]);
    expect(check([gift({ quantity: 2 })])).toEqual([0]);
  });
  it("allows one gift per rule", () => {
    expect(check([gift(), gift({ productId: "g2" })])).toEqual([1]);
  });
});

describe("parseDiscountRule", () => {
  const input = (extra: Record<string, unknown>) => ({ name: "Sale", ruleType: "percent_off", discountPercent: 10, ...extra });
  const ID = "11111111-1111-4111-8111-111111111111";

  it("accepts a sale with an end date", () => {
    const result = parseDiscountRule(input({ startsAt: "2026-11-04T00:00:00Z", endsAt: "2026-11-10T00:00:00Z" }), NOW);
    expect(result.ok).toBe(true);
  });
  it("refuses a missing name, a bad percent and a reversed window", () => {
    expect(parseDiscountRule(input({ name: " " }), NOW)).toEqual({ ok: false, error: "name" });
    expect(parseDiscountRule(input({ discountPercent: 91 }), NOW)).toEqual({ ok: false, error: "percent" });
    expect(parseDiscountRule(input({ discountPercent: 0 }), NOW)).toEqual({ ok: false, error: "percent" });
    expect(parseDiscountRule(input({ startsAt: "2026-11-10T00:00:00Z", endsAt: "2026-11-04T00:00:00Z" }), NOW)).toEqual({ ok: false, error: "dates" });
    expect(parseDiscountRule(input({ ruleType: "nope" }), NOW)).toEqual({ ok: false, error: "type" });
  });
  it("needs categories when scoped", () => {
    expect(parseDiscountRule(input({ scope: "categories", categoryIds: [] }), NOW)).toEqual({ ok: false, error: "categories" });
    expect(parseDiscountRule(input({ scope: "categories", categoryIds: ["x"] }), NOW)).toEqual({ ok: false, error: "categories" });
    expect(parseDiscountRule(input({ scope: "categories", categoryIds: [ID] }), NOW).ok).toBe(true);
  });
  it("lets buy X get Y reach 100 percent, with whole quantities", () => {
    const bogo = { ruleType: "buy_x_get_y", discountPercent: 100 };
    expect(parseDiscountRule(input({ ...bogo, buyQuantity: 2, getQuantity: 1 }), NOW).ok).toBe(true);
    expect(parseDiscountRule(input({ ...bogo, buyQuantity: 0, getQuantity: 1 }), NOW)).toEqual({ ok: false, error: "buyGet" });
    expect(parseDiscountRule(input({ ...bogo, buyQuantity: 1.5, getQuantity: 1 }), NOW)).toEqual({ ok: false, error: "buyGet" });
  });
  it("needs a gift rule to have an amount and gifts", () => {
    const gift = { ruleType: "free_gift" };
    expect(parseDiscountRule(input({ ...gift, minSubtotal: 500, giftProductIds: [ID] }), NOW).ok).toBe(true);
    expect(parseDiscountRule(input({ ...gift, minSubtotal: -1, giftProductIds: [ID] }), NOW)).toEqual({ ok: false, error: "minSubtotal" });
    expect(parseDiscountRule(input({ ...gift, minSubtotal: 500, giftProductIds: [] }), NOW)).toEqual({ ok: false, error: "gifts" });
  });
});
