/**
 * Automatic discount rules of a store (ROADMAP.md F-13a). Pure and in integer
 * piastres; the design note's §8 has the rules. Each line gets the single best
 * automatic rule; a coupon still applies on what is left.
 */

export type DiscountRuleType = "percent_off" | "buy_x_get_y" | "free_gift";

export type DiscountRule = {
  id: string;
  sellerId: string;
  storeId: string;
  name: string;
  ruleType: DiscountRuleType;
  scope: "all" | "categories";
  categoryIds: string[];
  discountPercent: number | null;
  buyQuantity: number | null;
  getQuantity: number | null;
  minSubtotalPiastres: number | null;
  giftProductIds: string[];
  startsAt: string;
  endsAt: string | null;
  isActive: boolean;
};

export type RuleLine = {
  productId: string;
  /** The seller's own category, for a rule scoped to categories. */
  categoryId: string | null;
  /**
   * The category and, when it is a sub-category, its main category (0171), so a
   * rule on a main category covers its sub-categories. Missing → `[categoryId]`.
   */
  categoryIds?: string[];
  quantity: number;
  /** Unit price in piastres. */
  unitPiastres: number;
};

export type AutomaticDiscountSnapshot = {
  ruleId: string;
  name: string;
  ruleType: DiscountRuleType;
  discountPercent: number;
  discountedUnits: number;
};

export type RuleLineResult = { discountPiastres: number; snapshot: AutomaticDiscountSnapshot } | null;

export const DISCOUNT_RULE_MAX_PERCENT = 90;
export const DISCOUNT_RULE_NAME_MAX = 80;
export const DISCOUNT_RULE_MAX_GIFTS = 10;

/** On, of this store and seller, and inside its time window. */
export function isRuleLive(rule: DiscountRule, store: { sellerId: string | null; storeId: string }, now: Date): boolean {
  if (!rule.isActive || rule.sellerId !== store.sellerId || rule.storeId !== store.storeId) return false;
  if (new Date(rule.startsAt).getTime() > now.getTime()) return false;
  return rule.endsAt === null || new Date(rule.endsAt).getTime() > now.getTime();
}

export function lineInRuleScope(rule: Pick<DiscountRule, "scope" | "categoryIds">, line: Pick<RuleLine, "categoryId" | "categoryIds">): boolean {
  if (rule.scope === "all") return true;
  const lineCategories = line.categoryIds ?? (line.categoryId !== null ? [line.categoryId] : []);
  return lineCategories.some((id) => rule.categoryIds.includes(id));
}

/** A percent off every unit in scope. A unit never reaches 0. */
function percentOffLines(rule: DiscountRule, lines: readonly RuleLine[]): RuleLineResult[] {
  const percent = Math.min(rule.discountPercent ?? 0, DISCOUNT_RULE_MAX_PERCENT);
  return lines.map((line) => {
    if (percent <= 0 || line.unitPiastres <= 1 || !lineInRuleScope(rule, line)) return null;
    const unit = Math.min(Math.round((line.unitPiastres * percent) / 100), line.unitPiastres - 1);
    if (unit <= 0 || line.quantity <= 0) return null;
    return {
      discountPiastres: unit * line.quantity,
      snapshot: { ruleId: rule.id, name: rule.name, ruleType: rule.ruleType, discountPercent: percent, discountedUnits: line.quantity },
    };
  });
}

/**
 * Buy X get Y: units in scope pool across lines. Every complete X + Y earns Y units
 * at the rule's percent off (100 = free), and those are always the cheapest units,
 * so the customer pays for the dearer ones.
 */
function buyXGetYLines(rule: DiscountRule, lines: readonly RuleLine[]): RuleLineResult[] {
  const buy = rule.buyQuantity ?? 0;
  const get = rule.getQuantity ?? 0;
  const percent = Math.min(rule.discountPercent ?? 0, 100);
  const results: RuleLineResult[] = lines.map(() => null);
  if (buy < 1 || get < 1 || percent <= 0) return results;

  const inScope = lines
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => lineInRuleScope(rule, line) && line.quantity > 0)
    .sort((a, b) => a.line.unitPiastres - b.line.unitPiastres || a.index - b.index);
  const units = inScope.reduce((sum, { line }) => sum + line.quantity, 0);
  let left = Math.floor(units / (buy + get)) * get;

  for (const { line, index } of inScope) {
    if (left <= 0) break;
    const discountedUnits = Math.min(left, line.quantity);
    left -= discountedUnits;
    const unit = Math.round((line.unitPiastres * percent) / 100);
    if (unit <= 0) continue;
    results[index] = {
      discountPiastres: unit * discountedUnits,
      snapshot: { ruleId: rule.id, name: rule.name, ruleType: rule.ruleType, discountPercent: percent, discountedUnits },
    };
  }
  return results;
}

/** One result per line: its best live rule. A tie goes to the rule listed first. */
export function applyDiscountRules(
  lines: readonly RuleLine[],
  rules: readonly DiscountRule[],
  store: { sellerId: string | null; storeId: string },
  now: Date,
): RuleLineResult[] {
  const best: RuleLineResult[] = lines.map(() => null);
  for (const rule of rules) {
    if (!isRuleLive(rule, store, now)) continue;
    const results =
      rule.ruleType === "percent_off" ? percentOffLines(rule, lines) : rule.ruleType === "buy_x_get_y" ? buyXGetYLines(rule, lines) : [];
    results.forEach((result, index) => {
      if (result && result.discountPiastres > (best[index]?.discountPiastres ?? 0)) best[index] = result;
    });
  }
  return best;
}

export type GiftSnapshot = { ruleId: string; name: string };

export type GiftLine = {
  ruleId: string;
  productId: string;
  quantity: number;
  /** Active, in this store's catalog and in stock. */
  available: boolean;
};

/** The cart has paid units and reaches the rule's amount. A gift is never sold on its own. */
export function giftRuleReached(rule: Pick<DiscountRule, "minSubtotalPiastres">, cart: { netPiastres: number; paidUnits: number }): boolean {
  return cart.paidUnits > 0 && cart.netPiastres > 0 && cart.netPiastres >= (rule.minSubtotalPiastres ?? 0);
}

/**
 * The positions of gift lines that may not go through: the rule is off, ended or
 * another store's, the cart doesn't reach its amount, the product isn't one of its
 * gifts or can't be handed over, the quantity isn't 1, or it's a second gift for
 * the same rule.
 */
export function invalidGiftLineIndexes(
  gifts: readonly GiftLine[],
  rules: readonly DiscountRule[],
  store: { sellerId: string | null; storeId: string },
  cart: { netPiastres: number; paidUnits: number },
  now: Date,
): number[] {
  const taken = new Set<string>();
  const invalid: number[] = [];
  gifts.forEach((gift, index) => {
    const rule = rules.find((candidate) => candidate.id === gift.ruleId);
    const ok =
      rule &&
      rule.ruleType === "free_gift" &&
      isRuleLive(rule, store, now) &&
      giftRuleReached(rule, cart) &&
      rule.giftProductIds.includes(gift.productId) &&
      gift.available &&
      gift.quantity === 1 &&
      !taken.has(gift.ruleId);
    if (ok) taken.add(gift.ruleId);
    else invalid.push(index);
  });
  return invalid;
}

export type DiscountRuleInput = {
  name: string;
  ruleType: DiscountRuleType;
  scope: "all" | "categories";
  categoryIds: string[];
  discountPercent: number | null;
  buyQuantity: number | null;
  getQuantity: number | null;
  minSubtotal: number | null;
  giftProductIds: string[];
  startsAt: string;
  endsAt: string | null;
};

export type DiscountRuleError = "name" | "type" | "categories" | "percent" | "buyGet" | "minSubtotal" | "gifts" | "dates";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function uuidList(value: unknown): string[] {
  return Array.isArray(value) ? [...new Set(value.filter((id): id is string => typeof id === "string" && UUID.test(id)))] : [];
}

/** What a seller typed, cleaned, or why not. Ownership of the ids is checked by the caller. */
export function parseDiscountRule(raw: Record<string, unknown> | null | undefined, now: Date): { ok: true; rule: DiscountRuleInput } | { ok: false; error: DiscountRuleError } {
  const name = String(raw?.name ?? "").trim();
  if (name.length < 1 || name.length > DISCOUNT_RULE_NAME_MAX) return { ok: false, error: "name" };
  const ruleType = raw?.ruleType;
  if (ruleType !== "percent_off" && ruleType !== "buy_x_get_y" && ruleType !== "free_gift") return { ok: false, error: "type" };

  const scope = raw?.scope === "categories" && ruleType !== "free_gift" ? "categories" : "all";
  const categoryIds = scope === "categories" ? uuidList(raw?.categoryIds) : [];
  if (scope === "categories" && categoryIds.length === 0) return { ok: false, error: "categories" };

  const startsAt = raw?.startsAt ? new Date(String(raw.startsAt)) : now;
  const endsAt = raw?.endsAt ? new Date(String(raw.endsAt)) : null;
  if (Number.isNaN(startsAt.getTime()) || (endsAt && (Number.isNaN(endsAt.getTime()) || endsAt.getTime() <= startsAt.getTime()))) {
    return { ok: false, error: "dates" };
  }

  const base = {
    name,
    ruleType,
    scope,
    categoryIds,
    discountPercent: null,
    buyQuantity: null,
    getQuantity: null,
    minSubtotal: null,
    giftProductIds: [] as string[],
    startsAt: startsAt.toISOString(),
    endsAt: endsAt?.toISOString() ?? null,
  } satisfies DiscountRuleInput;

  const percent = Math.round(Number(raw?.discountPercent) * 100) / 100;
  if (ruleType === "percent_off") {
    if (!Number.isFinite(percent) || percent < 1 || percent > DISCOUNT_RULE_MAX_PERCENT) return { ok: false, error: "percent" };
    return { ok: true, rule: { ...base, discountPercent: percent } };
  }
  if (ruleType === "buy_x_get_y") {
    if (!Number.isFinite(percent) || percent < 1 || percent > 100) return { ok: false, error: "percent" };
    const buyQuantity = Number(raw?.buyQuantity);
    const getQuantity = Number(raw?.getQuantity);
    if (!Number.isInteger(buyQuantity) || buyQuantity < 1 || buyQuantity > 100 || !Number.isInteger(getQuantity) || getQuantity < 1 || getQuantity > 100) {
      return { ok: false, error: "buyGet" };
    }
    return { ok: true, rule: { ...base, discountPercent: percent, buyQuantity, getQuantity } };
  }
  const minSubtotal = Math.round(Number(raw?.minSubtotal) * 100) / 100;
  if (!Number.isFinite(minSubtotal) || minSubtotal < 0 || minSubtotal > 1_000_000) return { ok: false, error: "minSubtotal" };
  const giftProductIds = uuidList(raw?.giftProductIds);
  if (giftProductIds.length < 1 || giftProductIds.length > DISCOUNT_RULE_MAX_GIFTS) return { ok: false, error: "gifts" };
  return { ok: true, rule: { ...base, minSubtotal, giftProductIds } };
}
