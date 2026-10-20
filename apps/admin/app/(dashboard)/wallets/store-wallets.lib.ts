/** Labels and formatting for the seller (store) wallet screens. Pure. */
import { formatCurrency } from "@workspace/lib";

export const ENTRY_TYPE_LABELS: Record<string, string> = {
  sale: "Sale",
  fee: "Platform fee",
  top_up: "Top-up",
  service_charge: "Service charge",
  withdrawal: "Payout",
  adjustment: "Adjustment",
  refund: "Refund",
  fee_reversal: "Fee reversal",
};

export const entryTypeLabel = (type: string) => ENTRY_TYPE_LABELS[type] ?? type.replaceAll("_", " ");

export const TOP_UP_PROVIDER_LABELS: Record<string, string> = {
  vodafone_cash: "Vodafone Cash",
  instapay: "InstaPay",
  kashier: "Kashier (card)",
};

export const topUpProviderLabel = (provider: string) => TOP_UP_PROVIDER_LABELS[provider] ?? provider;

export const TOP_UP_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  succeeded: "Credited",
  failed: "Failed / rejected",
  cancelled: "Cancelled",
};

export const WALLET_STATUS_LABELS: Record<string, string> = {
  active: "Active",
  frozen: "Frozen",
  closed: "Closed",
};

export const ENTRY_TYPE_OPTIONS = Object.entries(ENTRY_TYPE_LABELS).map(([value, label]) => ({ value, label }));
export const TOP_UP_STATUS_OPTIONS = Object.entries(TOP_UP_STATUS_LABELS).map(([value, label]) => ({ value, label }));
export const TOP_UP_PROVIDER_OPTIONS = Object.entries(TOP_UP_PROVIDER_LABELS).map(([value, label]) => ({ value, label }));
export const WALLET_STATUS_OPTIONS = Object.entries(WALLET_STATUS_LABELS).map(([value, label]) => ({ value, label }));
export const BALANCE_OPTIONS = [
  { value: "negative", label: "Below zero" },
  { value: "zero", label: "Zero" },
  { value: "positive", label: "Above zero" },
];
export const DIRECTION_OPTIONS = [
  { value: "credit", label: "Credits (money in)" },
  { value: "debit", label: "Debits (money out)" },
];
export const CHECK_OPTIONS = [{ value: "mismatch", label: "Doesn't match the ledger" }];

/** Signed EGP; numeric text from Postgres. */
export const egp = (value: string | number | null | undefined) => formatCurrency(Number(value ?? 0));

export const signClass = (value: string | number | null | undefined) => {
  const n = Number(value ?? 0);
  return n < 0 ? "text-red-600" : n > 0 ? "text-green-700" : "text-muted-foreground";
};

export const cairoDateTime = (iso: string | null | undefined) =>
  iso
    ? new Intl.DateTimeFormat("en-EG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Cairo" }).format(new Date(iso))
    : "—";

export const shortId = (id: string | null | undefined) => (id ? id.slice(0, 8) : "—");
