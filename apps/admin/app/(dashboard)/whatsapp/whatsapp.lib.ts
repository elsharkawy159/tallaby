/** Display helpers of Admin › WhatsApp (F-109). Pure, used by the page and the client parts. */

export const WHATSAPP_TABS = [
  { key: "settings", label: "Settings" },
  { key: "connection", label: "Connection" },
  { key: "templates", label: "Templates" },
  { key: "usage", label: "Usage" },
  { key: "failed", label: "Failed messages" },
] as const;

export type WhatsAppTab = (typeof WHATSAPP_TABS)[number]["key"];

export function parseTab(value: unknown): WhatsAppTab {
  return WHATSAPP_TABS.some((t) => t.key === value) ? (value as WhatsAppTab) : "settings";
}

export const EVENT_LABELS: Record<string, string> = {
  order_placed: "Order placed",
  order_confirmed: "Order confirmed",
  order_shipped: "Order shipped",
  order_out_for_delivery: "Out for delivery",
  order_delivered: "Order delivered",
  order_cancelled: "Order cancelled",
  reply: "Reply",
};

export const RATE_LABELS: Record<string, string> = {
  utility: "Utility",
  authentication: "Authentication",
  marketing: "Marketing",
  service: "Service",
};

export const BACKEND_ERROR_MESSAGES: Record<"not_configured" | "not_ready" | "failed" | "timeout", string> = {
  not_configured: "Not configured: the backend has no WhatsApp env yet, or this app has no BACKEND_API_URL or INTERNAL_API_SECRET.",
  not_ready: "The backend isn't ready for WhatsApp yet (its endpoint is missing). Deploy the backend first.",
  failed: "The backend returned an error. Check its logs.",
  timeout: "The backend took too long to answer. Try again.",
};

export function templateSummaryText(kind: "submit" | "sync", summary: Record<string, number>): string {
  const parts = Object.entries(summary).map(([key, n]) => `${n} ${key}`);
  const head = kind === "submit" ? "Sent to Meta" : "Statuses synced";
  return parts.length ? `${head}: ${parts.join(", ")}` : head;
}

export type Tone = "neutral" | "success" | "warning" | "danger";

export function templateStatusTone(status: string): Tone {
  if (status === "approved") return "success";
  if (status === "pending") return "warning";
  if (status === "rejected" || status === "paused" || status === "disabled") return "danger";
  return "neutral";
}

export function cairoTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-EG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Cairo" }).format(d);
}

export const num = (n: number) => n.toLocaleString("en-US");
