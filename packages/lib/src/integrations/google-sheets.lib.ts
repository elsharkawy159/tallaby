/**
 * Google Sheets order export (PLAN.md §9.2, P7-06). Pure and edge-safe:
 * OAuth URLs, the token/Sheets REST calls (injectable fetch, timeout) and the
 * order → row mapping. Scope is `drive.file` only, so the app can reach the
 * spreadsheets it created and nothing else in the seller's Drive. Values are
 * written with valueInputOption=RAW, so a customer name such as "=IMPORT…"
 * stays text and can never run as a formula.
 */

export const GOOGLE_SHEETS_SCOPE = "https://www.googleapis.com/auth/drive.file";
export const GOOGLE_TIMEOUT_MS = 15_000;
export const SHEET_TAB = "Orders";
/** Upper bound per export run; older orders are skipped (newest first). */
export const SHEETS_EXPORT_MAX_ORDERS = 5_000;
const SPREADSHEET_ID_RE = /^[A-Za-z0-9_-]{20,100}$/;

export type GoogleClient = { clientId: string; clientSecret: string; redirectUri: string };
export type GoogleSheetsSecret = { refreshToken: string };

/** Server-only env; when unset the integration shows as unavailable ("Soon"). */
export function readGoogleClientEnv(env: Record<string, string | undefined> = process.env): {
  clientId: string;
  clientSecret: string;
} | null {
  const clientId = env.GOOGLE_OAUTH_CLIENT_ID?.trim();
  const clientSecret = env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
  return clientId && clientSecret ? { clientId, clientSecret } : null;
}

export function isValidSpreadsheetId(value: unknown): value is string {
  return typeof value === "string" && SPREADSHEET_ID_RE.test(value);
}

export function spreadsheetUrl(spreadsheetId: string): string {
  return `https://docs.google.com/spreadsheets/d/${encodeURIComponent(spreadsheetId)}/edit`;
}

export function buildGoogleAuthUrl(client: Omit<GoogleClient, "clientSecret">, state: string): string {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: client.clientId,
    redirect_uri: client.redirectUri,
    response_type: "code",
    scope: GOOGLE_SHEETS_SCOPE,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "false",
    state,
  }).toString();
  return url.toString();
}

type CallOptions = { fetchImpl?: typeof fetch; timeoutMs?: number };
export type GoogleResult<T> = { ok: true; data: T } | { ok: false; error: "auth" | "not_found" | "failed" };

async function googleCall<T>(
  url: string,
  init: RequestInit,
  { fetchImpl = fetch, timeoutMs = GOOGLE_TIMEOUT_MS }: CallOptions,
): Promise<GoogleResult<T>> {
  try {
    const response = await fetchImpl(url, { ...init, redirect: "error", signal: AbortSignal.timeout(timeoutMs) });
    if (response.status === 400 || response.status === 401 || response.status === 403) {
      // invalid_grant (revoked / expired refresh token) is a 400 at the token endpoint.
      return { ok: false, error: "auth" };
    }
    if (response.status === 404) return { ok: false, error: "not_found" };
    if (!response.ok) return { ok: false, error: "failed" };
    return { ok: true, data: (await response.json().catch(() => ({}))) as T };
  } catch {
    return { ok: false, error: "failed" };
  }
}

function form(body: Record<string, string>): RequestInit {
  return {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body).toString(),
  };
}

export async function exchangeGoogleCode(
  client: GoogleClient,
  code: string,
  options: CallOptions = {},
): Promise<GoogleResult<{ refreshToken: string; accessToken: string; scopes: string[] }>> {
  const result = await googleCall<{ refresh_token?: string; access_token?: string; scope?: string }>(
    "https://oauth2.googleapis.com/token",
    form({
      code,
      client_id: client.clientId,
      client_secret: client.clientSecret,
      redirect_uri: client.redirectUri,
      grant_type: "authorization_code",
    }),
    options,
  );
  if (!result.ok) return result;
  const scopes = (result.data.scope ?? "").split(" ").filter(Boolean);
  if (!result.data.refresh_token || !result.data.access_token || !scopes.includes(GOOGLE_SHEETS_SCOPE)) {
    return { ok: false, error: "auth" };
  }
  return { ok: true, data: { refreshToken: result.data.refresh_token, accessToken: result.data.access_token, scopes } };
}

export async function refreshGoogleAccessToken(
  client: Omit<GoogleClient, "redirectUri">,
  refreshToken: string,
  options: CallOptions = {},
): Promise<GoogleResult<string>> {
  const result = await googleCall<{ access_token?: string }>(
    "https://oauth2.googleapis.com/token",
    form({
      client_id: client.clientId,
      client_secret: client.clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
    options,
  );
  if (!result.ok) return result;
  return result.data.access_token ? { ok: true, data: result.data.access_token } : { ok: false, error: "auth" };
}

/** Revokes the grant at Google. A token Google already forgot counts as revoked. */
export async function revokeGoogleToken(token: string, options: CallOptions = {}): Promise<boolean> {
  const result = await googleCall("https://oauth2.googleapis.com/revoke", form({ token }), options);
  return result.ok || result.error === "auth";
}

const SHEETS = "https://sheets.googleapis.com/v4/spreadsheets";

function bearer(accessToken: string, init: RequestInit = {}): RequestInit {
  return {
    ...init,
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
  };
}

export async function createSpreadsheet(
  accessToken: string,
  title: string,
  headers: string[],
  options: CallOptions = {},
): Promise<GoogleResult<{ spreadsheetId: string }>> {
  const created = await googleCall<{ spreadsheetId?: string }>(
    SHEETS,
    bearer(accessToken, {
      method: "POST",
      body: JSON.stringify({
        properties: { title: title.slice(0, 100) },
        sheets: [{ properties: { title: SHEET_TAB, gridProperties: { frozenRowCount: 1 } } }],
      }),
    }),
    options,
  );
  if (!created.ok) return created;
  const spreadsheetId = created.data.spreadsheetId;
  if (!isValidSpreadsheetId(spreadsheetId)) return { ok: false, error: "failed" };
  const header = await googleCall(
    `${SHEETS}/${spreadsheetId}/values/${encodeURIComponent(`${SHEET_TAB}!A1`)}?valueInputOption=RAW`,
    bearer(accessToken, { method: "PUT", body: JSON.stringify({ values: [headers] }) }),
    options,
  );
  if (!header.ok) return header;
  return { ok: true, data: { spreadsheetId } };
}

/** The order ids already in column A, mapped to their 1-based row numbers. */
export async function readOrderIdColumn(
  accessToken: string,
  spreadsheetId: string,
  options: CallOptions = {},
): Promise<GoogleResult<Map<string, number>>> {
  const result = await googleCall<{ values?: string[][] }>(
    `${SHEETS}/${spreadsheetId}/values/${encodeURIComponent(`${SHEET_TAB}!A:A`)}?majorDimension=ROWS`,
    bearer(accessToken, { method: "GET" }),
    options,
  );
  if (!result.ok) return result;
  const rows = new Map<string, number>();
  (result.data.values ?? []).forEach((row, index) => {
    const id = row[0];
    if (index > 0 && typeof id === "string" && id) rows.set(id, index + 1);
  });
  return { ok: true, data: rows };
}

export type SheetCell = string | number;

export async function writeOrderRows(
  accessToken: string,
  spreadsheetId: string,
  plan: SheetWritePlan,
  options: CallOptions = {},
): Promise<GoogleResult<null>> {
  if (plan.updates.length) {
    const updated = await googleCall(
      `${SHEETS}/${spreadsheetId}/values:batchUpdate`,
      bearer(accessToken, {
        method: "POST",
        body: JSON.stringify({
          valueInputOption: "RAW",
          data: plan.updates.map((u) => ({ range: `${SHEET_TAB}!A${u.row}`, values: [u.values] })),
        }),
      }),
      options,
    );
    if (!updated.ok) return updated;
  }
  if (plan.appends.length) {
    const appended = await googleCall(
      `${SHEETS}/${spreadsheetId}/values/${encodeURIComponent(`${SHEET_TAB}!A1`)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
      bearer(accessToken, { method: "POST", body: JSON.stringify({ values: plan.appends }) }),
      options,
    );
    if (!appended.ok) return appended;
  }
  return { ok: true, data: null };
}

// ---------------------------------------------------------------------------
// Mapping

export type SheetOrder = {
  id: string;
  orderNumber: string;
  createdAt: string | null;
  status: string | null;
  paymentStatus: string | null;
  paymentMethod: string;
  customerName: string | null;
  customerPhone: string | null;
  city: string | null;
  itemCount: number;
  subtotal: string;
  shippingCost: string | null;
  discountAmount: string | null;
  totalAmount: string;
  currency: string | null;
};

/** Column order; the dashboard passes translated header labels in this order. */
export const SHEET_COLUMNS = [
  "orderId",
  "orderNumber",
  "date",
  "status",
  "paymentStatus",
  "paymentMethod",
  "customer",
  "phone",
  "city",
  "items",
  "subtotal",
  "shipping",
  "discount",
  "total",
  "currency",
] as const;

function money(value: string | null | undefined): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
}

/** One sheet row per order; column A (order id) is the idempotency key. */
export function orderToSheetRow(order: SheetOrder): SheetCell[] {
  return [
    order.id,
    order.orderNumber,
    order.createdAt ? new Date(order.createdAt).toISOString().replace("T", " ").slice(0, 19) : "",
    order.status ?? "",
    order.paymentStatus ?? "",
    order.paymentMethod,
    order.customerName ?? "",
    order.customerPhone ?? "",
    order.city ?? "",
    order.itemCount,
    money(order.subtotal),
    money(order.shippingCost),
    money(order.discountAmount),
    money(order.totalAmount),
    order.currency ?? "EGP",
  ];
}

export type SheetWritePlan = { updates: Array<{ row: number; values: SheetCell[] }>; appends: SheetCell[][] };

/**
 * Splits orders into rows to refresh in place (already in the sheet, e.g. a
 * status change) and rows to append, so re-running an export never adds a
 * duplicate. Appends are oldest first.
 */
export function planSheetWrite(orders: SheetOrder[], existing: Map<string, number>): SheetWritePlan {
  const plan: SheetWritePlan = { updates: [], appends: [] };
  const seen = new Set<string>();
  const sorted = [...orders].sort((a, b) => String(a.createdAt ?? "").localeCompare(String(b.createdAt ?? "")));
  for (const order of sorted) {
    if (seen.has(order.id)) continue;
    seen.add(order.id);
    const row = existing.get(order.id);
    if (row) plan.updates.push({ row, values: orderToSheetRow(order) });
    else plan.appends.push(orderToSheetRow(order));
  }
  return plan;
}
