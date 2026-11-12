import { PLANS } from "@workspace/lib/plans";
import { PLAN_PRICES, formatNumber } from "@/lib/marketing/pricing.lib";

/**
 * The /pricing "Compare plans" table: every finished seller feature, grouped,
 * with what each plan gets. Only features that are live (ROADMAP.md §2.1 or
 * every task `[x]`) belong here; nothing "soon". The labels live in
 * `pricing.compare.rows.<id>` ({ label, desc }) and the values in
 * `pricing.compare.values.<key>`. Numbers come from the plans module, never
 * the copy: today the plans differ only by price, AI credits and campaign
 * emails (`@workspace/lib/plans`).
 */

/** "yes": included (a check). "text": a value key, with ICU values (`{count}`) or price tokens (`{pro}`). */
export type CompareCell = { kind: "yes" } | { kind: "text"; key: string; values?: Record<string, string> };

export type CompareRow = { id: string; free: CompareCell; pro: CompareCell };

export type CompareGroupId = "plan" | "website" | "products" | "orders" | "payments" | "shipping" | "marketing" | "ai" | "analytics" | "account";

export type CompareGroup = { id: CompareGroupId; rows: CompareRow[] };

const yes: CompareCell = { kind: "yes" };
const both = (id: string): CompareRow => ({ id, free: yes, pro: yes });
const text = (key: string, values?: Record<string, string>): CompareCell => ({ kind: "text", key, values });
const same = (id: string, cell: CompareCell): CompareRow => ({ id, free: cell, pro: cell });

export const COMPARE_GROUPS: readonly CompareGroup[] = [
  {
    id: "plan",
    rows: [
      { id: "monthlyFee", free: text("none"), pro: text("proMonthly") },
      { id: "orderFee", free: text("orderFee"), pro: text("none") },
      same("salesShare", text("none")),
      same("products", text("unlimited")),
      same("visits", text("unlimited")),
      { id: "stores", free: text("stores", { count: formatNumber(PLANS.free.maxStores) }), pro: text("stores", { count: formatNumber(PLANS.pro.maxStores) }) },
      both("switchPlan"),
    ],
  },
  {
    id: "website",
    rows: [
      both("templates"),
      both("builder"),
      both("theme"),
      both("pages"),
      both("forms"),
      both("media"),
      both("domain"),
      both("seo"),
      both("languages"),
      both("currency"),
      both("storeApp"),
      both("policies"),
      both("publish"),
      both("requestTheme"),
    ],
  },
  {
    id: "products",
    rows: [
      both("variants"),
      both("import"),
      both("bulkEdit"),
      both("taxonomy"),
      both("stock"),
      both("stockHistory"),
      both("lowStock"),
      both("backInStock"),
      both("minQty"),
      both("reviews"),
      both("socialProof"),
      both("trash"),
      both("feeds"),
      both("catalog"),
    ],
  },
  {
    id: "orders",
    rows: [
      both("orderStages"),
      both("bulkExport"),
      both("print"),
      both("manual"),
      both("missed"),
      both("pendingCarts"),
      both("customers"),
      both("repeatOrder"),
      both("fakeOrders"),
      both("whatsappConfirm"),
      both("checkoutForm"),
      both("simpleCheckout"),
      both("minOrder"),
      same("customerEmails", text("withApp")),
      both("orderAlerts"),
    ],
  },
  {
    id: "payments",
    rows: [both("cod"), both("wallets"), both("instapay"), both("cards")],
  },
  {
    id: "shipping",
    rows: [both("zones"), both("aiZones"), both("freeDelivery"), both("bosta"), both("wassalha"), both("riders")],
  },
  {
    id: "marketing",
    rows: [
      both("coupons"),
      both("discounts"),
      both("quantityOffers"),
      both("crossSell"),
      {
        id: "emailCampaigns",
        free: text("perMonthCount", { count: formatNumber(PLAN_PRICES.free.emails) }),
        pro: text("perMonthCount", { count: formatNumber(PLAN_PRICES.pro.emails) }),
      },
      both("extraEmails"),
      both("winback"),
      both("subscribers"),
      both("audiences"),
      both("metaPixel"),
      both("googleTags"),
      both("sheets"),
    ],
  },
  {
    id: "ai",
    rows: [
      {
        id: "aiCredits",
        free: text("perMonthCount", { count: formatNumber(PLAN_PRICES.free.aiCredits) }),
        pro: text("perMonthCount", { count: formatNumber(PLAN_PRICES.pro.aiCredits) }),
      },
      both("extraCredits"),
      both("autofill"),
      both("aiSeo"),
      both("mcp"),
    ],
  },
  {
    id: "analytics",
    rows: [both("reports"), both("productViews"), both("crossSellReport"), both("statements")],
  },
  {
    id: "account",
    rows: [both("arabicDashboard"), both("dashboardApp"), both("notifications"), both("signup"), both("support"), both("roadmap"), both("referral")],
  },
];

/** Every row id, for the message tests. */
export const COMPARE_ROW_IDS: readonly string[] = COMPARE_GROUPS.flatMap((group) => group.rows.map((row) => row.id));

/** Every value key a cell uses, for the message tests. */
export const COMPARE_VALUE_KEYS: readonly string[] = [
  ...new Set(COMPARE_GROUPS.flatMap((group) => group.rows.flatMap((row) => [row.free, row.pro]).flatMap((cell) => (cell.kind === "text" ? [cell.key] : [])))),
];

/** Whether the two plans differ on this row (shown a little stronger). */
export function rowDiffers(row: CompareRow): boolean {
  return JSON.stringify(row.free) !== JSON.stringify(row.pro);
}
