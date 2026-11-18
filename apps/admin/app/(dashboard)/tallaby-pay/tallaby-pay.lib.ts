/**
 * Admin › Tallaby Pay display helpers (ROADMAP.md F-100g). Pure: used by the
 * server pages and the client dialogs. Admin copy is English only.
 */
import type { TallabyPayDestination, TallabyPayKycStatus, TallabyPayPayoutStatus } from "@workspace/lib/tallaby-pay";

const EGP = new Intl.NumberFormat("en-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** "EGP 1,250.00", "-EGP 30.00". Display only: the amount stays the row's numeric text everywhere else. */
export function egpAmount(value: string | number | null | undefined): string {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return "EGP —";
  return `${n < 0 ? "-" : ""}EGP ${EGP.format(Math.abs(n))}`;
}

export function isNegativeAmount(value: string | null | undefined): boolean {
  return Number(value ?? 0) < 0;
}

/** Cairo date and time, or "—". */
export function cairoTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-EG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Cairo" }).format(d);
}

/** "3%" or "2.75%" from basis points. */
export function bpsPercent(bps: number): string {
  return `${Number((bps / 100).toFixed(2))}%`;
}

export const PAYOUT_STATUS_LABEL: Record<TallabyPayPayoutStatus, string> = {
  requested: "Waiting",
  paid: "Paid",
  rejected: "Rejected",
  cancelled: "Cancelled by seller",
  reversed: "Reversed",
};

export const KYC_STATUS_LABEL: Record<TallabyPayKycStatus, string> = {
  submitted: "To review",
  verified: "Verified",
  rejected: "Rejected",
};

const WALLET_PROVIDER_LABEL: Record<string, string> = {
  vodafone_cash: "Vodafone Cash",
  e_cash: "e& Cash",
  orange_cash: "Orange Cash",
  we_pay: "WE Pay",
};

/** One label/value line per field, in the order the team types them into the bank or wallet app. */
export function destinationLines(d: TallabyPayDestination): { label: string; value: string; mono?: boolean }[] {
  switch (d.method) {
    case "instapay":
      return [
        { label: "Method", value: "InstaPay" },
        { label: "Holder", value: d.holderName },
        { label: "Address", value: d.address, mono: true },
      ];
    case "bank":
      return [
        { label: "Method", value: "Bank transfer" },
        { label: "Holder", value: d.holderName },
        { label: "Bank", value: d.bankName },
        { label: d.accountNumber.startsWith("EG") ? "IBAN" : "Account", value: d.accountNumber, mono: true },
      ];
    case "mobile_wallet":
      return [
        { label: "Method", value: WALLET_PROVIDER_LABEL[d.provider] ?? d.provider },
        { label: "Holder", value: d.holderName },
        { label: "Phone", value: d.phone, mono: true },
      ];
  }
}

/** How a sale reads in the Admin list. */
export function saleStatusLabel(s: { status: "pending" | "available" | "refunded"; refundState: string | null; orderStatus: string | null }): {
  label: string;
  tone: "neutral" | "success" | "warning" | "danger";
} {
  if (s.status === "refunded") return { label: "Refunded", tone: "danger" };
  if (s.status === "available") return { label: "Available", tone: "success" };
  if (s.refundState === "requested") return { label: "Refund requested", tone: "warning" };
  if (s.refundState === "declined") return { label: "Pending (refund declined)", tone: "neutral" };
  return { label: s.orderStatus === "delivered" ? "Pending (delivered)" : "Pending delivery", tone: "neutral" };
}

/** Why a refund is in the queue. */
export function refundReasonLabel(reason: string | null): string {
  if (reason === "paid_after_cancel") return "Paid after the order was cancelled";
  if (reason === "seller_cancelled") return "Seller cancelled the order";
  return reason?.trim() || "Seller asked for a refund";
}

/** A query string from the current filters, leaving out empty values; `page` 1 is left out too. */
export function filterHref(base: string, params: Record<string, string | number | null | undefined>): string {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === "") continue;
    if (key === "page" && Number(value) <= 1) continue;
    q.set(key, String(value));
  }
  const s = q.toString();
  return s ? `${base}?${s}` : base;
}
