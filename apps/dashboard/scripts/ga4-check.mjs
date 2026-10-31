// Read-only check of Tallaby's storefront GA4 property (docs/store-views.md).
// Shows whether hits arrive (realtime), whether GA4 has processed them, and
// which store ids it has, so "Store visits = 0" can be traced in a minute.
//
//   pnpm --filter dashboard ga4:check [storeId]
//
// Node 24+ (loads the .ts helpers with built-in type stripping).

import { createSign } from "node:crypto";
import {
  GOOGLE_TOKEN_URL,
  STORE_ID_DIMENSION,
  base64Url,
  readGa4Env,
  serviceAccountJwtInput,
} from "../lib/analytics/store-views.lib.ts";

const storeId = process.argv[2]?.trim() || null;
const env = readGa4Env();
if (!env) {
  console.error("GA4_PROPERTY_ID, GA4_SERVICE_ACCOUNT_EMAIL or GA4_SERVICE_ACCOUNT_PRIVATE_KEY is missing or invalid.");
  process.exit(1);
}

const input = serviceAccountJwtInput(env.clientEmail, Math.floor(Date.now() / 1000));
let signature;
try {
  signature = createSign("RSA-SHA256").update(input).sign(env.privateKey);
} catch (error) {
  console.error("The private key cannot sign (check quotes and \\n escapes):", error.message);
  process.exit(1);
}
const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion: `${input}.${base64Url(signature)}`,
  }),
});
const { access_token: token, error_description } = await tokenResponse.json();
if (!token) {
  console.error("Google rejected the service account:", error_description ?? tokenResponse.status);
  process.exit(1);
}

const base = `https://analyticsdata.googleapis.com/v1beta/properties/${env.propertyId}`;
const headers = { authorization: `Bearer ${token}`, "content-type": "application/json" };

async function report(method, body) {
  const response = await fetch(`${base}:${method}`, { method: "POST", headers, body: JSON.stringify(body) });
  const json = await response.json();
  if (!response.ok) return `error ${response.status}: ${json.error?.message}`;
  const rows = (json.rows ?? []).map((row) =>
    [...(row.dimensionValues ?? []), ...(row.metricValues ?? [])].map((v) => v.value).join("  "),
  );
  return rows.length ? rows : "(no rows)";
}

function section(title, value) {
  console.log(`\n## ${title}`);
  console.log(Array.isArray(value) ? value.map((row) => `  ${row}`).join("\n") : `  ${value}`);
}

const last30 = [{ startDate: "29daysAgo", endDate: "today" }];
console.log(`GA4 property ${env.propertyId} as ${env.clientEmail}`);

const metadata = await fetch(`${base}/metadata`, { headers }).then((r) => r.json());
const registered = (metadata.dimensions ?? []).some((d) => d.apiName === STORE_ID_DIMENSION);
section(
  `Custom dimension ${STORE_ID_DIMENSION}`,
  registered ? "registered" : "MISSING: create it (Admin > Custom definitions, event scope, parameter store_id)",
);

section(
  "Realtime, last 30 minutes (hits arriving?)",
  await report("runRealtimeReport", { dimensions: [{ name: "eventName" }], metrics: [{ name: "eventCount" }] }),
);
section(
  "Realtime pages",
  await report("runRealtimeReport", {
    dimensions: [{ name: "unifiedScreenName" }],
    metrics: [{ name: "activeUsers" }],
    limit: 20,
  }),
);
section(
  "Processed page_view per day, last 30 days (what the dashboard reads)",
  await report("runReport", {
    dateRanges: last30,
    dimensions: [{ name: "date" }],
    metrics: [{ name: "eventCount" }],
    dimensionFilter: { filter: { fieldName: "eventName", stringFilter: { value: "page_view" } } },
    orderBys: [{ dimension: { dimensionName: "date" } }],
  }),
);
if (registered) {
  section(
    "Processed sessions per store_id, last 30 days",
    await report("runReport", {
      dateRanges: last30,
      dimensions: [{ name: STORE_ID_DIMENSION }],
      metrics: [{ name: "sessions" }, { name: "screenPageViews" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 50,
    }),
  );
}
if (storeId && registered) {
  section(
    `Store ${storeId}, per day, last 30 days`,
    await report("runReport", {
      dateRanges: last30,
      dimensions: [{ name: "date" }],
      metrics: [{ name: "sessions" }, { name: "screenPageViews" }],
      dimensionFilter: {
        filter: { fieldName: STORE_ID_DIMENSION, stringFilter: { matchType: "EXACT", value: storeId } },
      },
      orderBys: [{ dimension: { dimensionName: "date" } }],
    }),
  );
}

console.log(`
Reading it:
- Realtime has rows but processed days are empty: GA4 has not processed the hits yet
  (hours, up to 24-48 h on a new property). Wait, then press Refresh on Store views.
- Processed rows exist but store_id shows only "(not set)": the GTM GA4 Event tag does
  not send store_id, or the dimension was created after those hits.
- Your store id is missing but others appear: that store's pages are not tagged
  (offline/draft store, or STORE_VIEWS_GTM_ID missing on the ecommerce deploy).`);
