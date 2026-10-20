import type { ServiceConfig } from "@workspace/lib/fulfillment";
import { getGovernorateLabel } from "@workspace/lib/shipping";

export const DETAIL_LABELS: Record<string, string> = {
  estimatedSkus: "Estimated SKUs",
  estimatedDailyOrders: "Daily orders",
  sizeCategory: "Product size",
  hasFragileProducts: "Fragile products",
  estimatedInventoryUnits: "Inventory units",
  specialPackagingNotes: "Packaging notes",
  coverageGovernorates: "Customer areas",
};

export function formatDetail(key: string, value: unknown): string {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.map((g) => getGovernorateLabel(String(g), "en")).join(", ");
  if (key.startsWith("estimated")) return String(value).replace("_plus", "+").replace("_", "–");
  return String(value ?? "—");
}

export function configSummary(config: unknown): string | null {
  const c = (config ?? {}) as ServiceConfig;
  const parts: string[] = [];
  if (c.mode) parts.push(c.mode === "own_riders" ? "Own riders" : "External courier");
  if (c.courierName) parts.push(c.courierName);
  if (c.legacy) parts.push("pre-fulfillment baseline");
  if (c.sellerRidersAllowed) parts.push("seller riders allowed");
  return parts.length ? parts.join(" · ") : null;
}
