import { describe, expect, it } from "vitest";
import { applyDiscountRules, isRuleLive, parseDiscountRule, type DiscountRule, type RuleLine } from "./automatic-discounts.lib";

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
