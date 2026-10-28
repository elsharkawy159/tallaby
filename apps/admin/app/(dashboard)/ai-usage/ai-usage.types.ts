export interface AiUsageTotals {
  /** Successful model calls. */
  ok: number;
  errors: number;
  /** Refused by the per-seller daily cap (no model call made). */
  blocked: number;
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  costMicroUsd: number;
  /** Sellers with at least one call in the range. */
  sellers: number;
  /** Average latency of successful calls, ms. */
  avgLatencyMs: number | null;
}

export interface AiUsageSellerRow {
  sellerId: string;
  name: string;
  slug: string | null;
  ok: number;
  errors: number;
  blocked: number;
  /** Successful calls since Cairo midnight (what the daily cap counts). */
  okToday: number;
  tokens: number;
  costMicroUsd: number;
  lastUsedAt: string | null;
  /** Products saved with AI (all time, products.ai_source). */
  aiProducts: number;
}

export interface AiUsageFeatureRow {
  feature: string;
  model: string;
  ok: number;
  errors: number;
  blocked: number;
  tokens: number;
  costMicroUsd: number;
}

export interface AiUsageCallRow {
  id: string;
  feature: string;
  model: string;
  status: "ok" | "error" | "blocked";
  inputTokens: number | null;
  cachedInputTokens: number | null;
  outputTokens: number | null;
  costMicroUsd: number;
  latencyMs: number | null;
  errorCode: string | null;
  createdAt: string;
}

export interface AiProductCounts {
  added: number;
  edited: number;
}

export interface AiUsageOverview {
  totals: AiUsageTotals;
  sellers: AiUsageSellerRow[];
  features: AiUsageFeatureRow[];
  products: AiProductCounts;
}

export interface SellerAiUsage {
  totals: AiUsageTotals;
  okToday: number;
  features: AiUsageFeatureRow[];
  recent: AiUsageCallRow[];
  products: AiProductCounts;
}
