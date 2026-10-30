import { CLICK_ID_PARAMS, DIRECT_SOURCE, campaignSource, type CampaignTouch, type ClickIdParam } from "@workspace/lib/campaigns/utm";
import { toInt } from "../reports.lib";

/* Campaigns report (ROADMAP.md F-26a): pure helpers, unit-tested. */

/** Distinct utm combinations read per report; the rest are summed as "other". */
export const CAMPAIGN_ROWS_MAX = 1000;

/** One SQL group: orders with the same utm fields (orders.metadata.utm). */
export type CampaignRawRow = {
  source: string | null;
  medium: string | null;
  campaign: string | null;
  clickIds: unknown;
  referrerHost: string | null;
  orders: unknown;
  delivered: unknown;
  revenuePiastres: unknown;
};

export type CampaignRow = {
  source: string;
  /** null = the orders of this source without a utm_campaign. */
  campaign: string | null;
  orders: number;
  delivered: number;
  revenuePiastres: number;
};

export type CampaignSourceGroup = {
  source: string;
  orders: number;
  delivered: number;
  revenuePiastres: number;
  campaigns: CampaignRow[];
};

export type CampaignReport = {
  totals: { orders: number; delivered: number; revenuePiastres: number };
  /** Orders with any campaign signal (not "direct"). */
  tracked: { orders: number; delivered: number; revenuePiastres: number };
  sources: CampaignSourceGroup[];
};

function clickIdsOf(value: unknown): ClickIdParam[] {
  let list: unknown = value;
  if (typeof value === "string") {
    try {
      list = JSON.parse(value);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(list)) return [];
  return CLICK_ID_PARAMS.filter((id) => (list as unknown[]).includes(id));
}

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v : undefined);

/** The touch a SQL row stands for (values were sanitized when stored). */
export function touchOfRow(row: CampaignRawRow): CampaignTouch {
  return {
    source: str(row.source)?.toLowerCase(),
    medium: str(row.medium),
    campaign: str(row.campaign),
    clickIds: clickIdsOf(row.clickIds),
    referrerHost: str(row.referrerHost),
  };
}

const byOrdersThenRevenue = <T extends { orders: number; revenuePiastres: number }>(a: T, b: T) =>
  b.orders - a.orders || b.revenuePiastres - a.revenuePiastres;

/**
 * Groups the SQL rows by report source (utm_source with aliases merged, else
 * ad click id, else referrer site, else direct) and campaign. Campaign names
 * are matched case-insensitively and shown as first seen. Direct goes last.
 */
export function aggregateCampaigns(rows: CampaignRawRow[]): CampaignReport {
  const groups = new Map<string, CampaignSourceGroup & { byCampaign: Map<string, CampaignRow> }>();
  const totals = { orders: 0, delivered: 0, revenuePiastres: 0 };
  const tracked = { orders: 0, delivered: 0, revenuePiastres: 0 };

  for (const row of rows) {
    const orders = toInt(row.orders);
    if (orders <= 0) continue;
    const delivered = toInt(row.delivered);
    const revenuePiastres = toInt(row.revenuePiastres);
    const touch = touchOfRow(row);
    const source = campaignSource(touch);

    for (const sum of source === DIRECT_SOURCE ? [totals] : [totals, tracked]) {
      sum.orders += orders;
      sum.delivered += delivered;
      sum.revenuePiastres += revenuePiastres;
    }

    let group = groups.get(source);
    if (!group) {
      group = { source, orders: 0, delivered: 0, revenuePiastres: 0, campaigns: [], byCampaign: new Map() };
      groups.set(source, group);
    }
    group.orders += orders;
    group.delivered += delivered;
    group.revenuePiastres += revenuePiastres;

    const campaign = touch.campaign ?? null;
    const key = campaign ? campaign.toLowerCase() : "";
    let entry = group.byCampaign.get(key);
    if (!entry) {
      entry = { source, campaign, orders: 0, delivered: 0, revenuePiastres: 0 };
      group.byCampaign.set(key, entry);
    }
    entry.orders += orders;
    entry.delivered += delivered;
    entry.revenuePiastres += revenuePiastres;
  }

  const sources = [...groups.values()]
    .map(({ byCampaign, ...group }) => ({
      ...group,
      // Named campaigns first, then "no campaign".
      campaigns: [...byCampaign.values()].sort(
        (a, b) => Number(a.campaign === null) - Number(b.campaign === null) || byOrdersThenRevenue(a, b),
      ),
    }))
    .sort((a, b) => Number(a.source === DIRECT_SOURCE) - Number(b.source === DIRECT_SOURCE) || byOrdersThenRevenue(a, b));

  return { totals, tracked, sources };
}

/** Delivered ÷ orders, or null without orders. */
export function deliveryRate(delivered: number, orders: number): number | null {
  return orders > 0 ? Math.min(1, delivered / orders) : null;
}

/** Known sources get a translated label; anything else is shown as typed. */
export const KNOWN_SOURCES = [
  "facebook",
  "instagram",
  "tiktok",
  "whatsapp",
  "google",
  "youtube",
  "snapchat",
  "x",
  "telegram",
  "bing",
  DIRECT_SOURCE,
] as const;

export function isKnownSource(source: string): source is (typeof KNOWN_SOURCES)[number] {
  return (KNOWN_SOURCES as readonly string[]).includes(source);
}
