/**
 * End-to-end check of the MCP endpoint and product tools (ROADMAP.md F-29c,
 * F-29f) against STAGING (packages/db/.env; refuses any other database).
 *
 *   cd apps/backend && npx esbuild scripts/mcp-products-e2e.ts --bundle --platform=node --format=esm \
 *     --target=node20 --outfile=<tmp>/e2e.mjs \
 *     --banner:js="import { createRequire as __cr } from 'node:module'; const require = __cr(import.meta.url);" \
 *     && node <tmp>/e2e.mjs
 *
 * (Bundled like the deployed backend: tsx cannot load @workspace/cache's named exports.)
 *
 * Flow: DCR client → consent grant (store.read + products.write) → code
 * exchange → JSON-RPC over the real /mcp handler: 401 without a token,
 * initialize, tools/list, list_stores, create (lib call with a stand-in
 * uploader, since local env has no staging service key), search, get,
 * update copy/price/variants, publish/hide, idempotent retry, scope and
 * foreign-store denials, trash and restore, then cleanup (product, store
 * category, client → grants, tokens and activity cascade).
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "dotenv";

// Run from apps/backend (the script is bundled with esbuild first, like the deployed backend).
const here = path.resolve(process.cwd(), "scripts");
const stagingEnv = parse(readFileSync(path.resolve(here, "../../../packages/db/.env")));
const backendEnv = parse(readFileSync(path.resolve(here, "../.env")));
if (!stagingEnv.DATABASE_URL || stagingEnv.DATABASE_URL === backendEnv.DATABASE_URL) {
  throw new Error("Refusing to run: packages/db/.env must be the staging database and differ from apps/backend/.env.");
}
process.env.DATABASE_URL = stagingEnv.DATABASE_URL;
process.env.NEXT_PUBLIC_SUPABASE_URL = stagingEnv.NEXT_PUBLIC_SUPABASE_URL;
process.env.MCP_RESOURCE_URLS = "http://localhost:4000/mcp";
delete process.env.SUPABASE_SERVICE_ROLE_KEY;
delete process.env.REVALIDATE_SECRET;

const { randomBytes } = await import("node:crypto");
const { and, db, desc, eq, isNull, oauthClients, products, sellerProductCategories, sellers, sql, stores } = await import("@workspace/db");
const { parseRegistrationRequest, pkceChallengeS256 } = await import("@workspace/lib/agents");
const { createAuthorization, exchangeAuthorizationCode, fetchPublicImage, registerDcrClient, resolveAgentActor } = await import("@workspace/lib/agents/server");
const { agentCreateProduct } = await import("@workspace/lib/products/agent/server");
const { deleteTrashedProductsForever, trashProducts } = await import("@workspace/lib/products/trash/server");
const { mcpApp } = await import("../src/mcp/http");

let passed = 0;
function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`FAILED: ${message}`);
  passed++;
  console.log(`ok - ${message}`);
}

const MCP = "http://localhost:4000/mcp";
let rpcId = 0;
async function rpc(token: string | null, method: string, params: Record<string, unknown> = {}) {
  const response = await mcpApp.fetch(
    new Request(MCP, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        "mcp-protocol-version": "2025-06-18",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: ++rpcId, method, params }),
    }),
  );
  const text = await response.text();
  return { status: response.status, headers: response.headers, body: text ? JSON.parse(text) : null };
}

async function call(token: string, name: string, args: Record<string, unknown>) {
  const res = await rpc(token, "tools/call", { name, arguments: args });
  const result = res.body?.result;
  const text: string = result?.content?.[0]?.text ?? "{}";
  // Input the schema rejects comes back from the SDK as plain text ("MCP error -32602: …").
  const parsed = result?.structuredContent ?? (text.startsWith("{") ? JSON.parse(text) : { error: { code: "invalid_params", message: text } });
  return { isError: Boolean(result?.isError), data: parsed, raw: res.body };
}

async function issueToken(sellerId: string, storeIds: string[], scopes: string[]) {
  const reg = parseRegistrationRequest({ client_name: "MCP E2E", redirect_uris: ["https://claude.ai/api/mcp/auth_callback"] });
  if (!reg.ok) throw new Error("registration parse failed");
  const client = await registerDcrClient(reg.metadata);
  const verifier = randomBytes(32).toString("base64url");
  const { code } = await createAuthorization({
    client,
    sellerId,
    userId: sellerId,
    allStores: false,
    storeIds,
    scopes,
    redirectUri: "https://claude.ai/api/mcp/auth_callback",
    codeChallenge: pkceChallengeS256(verifier),
    resource: MCP,
  });
  const tokens = await exchangeAuthorizationCode({
    code,
    clientId: client.clientId,
    redirectUri: "https://claude.ai/api/mcp/auth_callback",
    codeVerifier: verifier,
    resource: MCP,
  });
  return { clientRowId: client.id, accessToken: tokens.accessToken };
}

const cleanup: (() => Promise<unknown>)[] = [];

async function main() {
  // A staging seller with two live stores lets us test the foreign-store denial with a real id.
  const candidates = await db
    .select({ sellerId: sellers.id, status: sellers.status, storeId: stores.id, storeStatus: stores.status })
    .from(sellers)
    .innerJoin(stores, and(eq(stores.sellerId, sellers.id), isNull(stores.deletedAt), eq(stores.status, "active")))
    .where(eq(sellers.status, "approved"))
    .limit(200);
  const bySeller = new Map<string, string[]>();
  for (const c of candidates) bySeller.set(c.sellerId, [...(bySeller.get(c.sellerId) ?? []), c.storeId]);
  const [sellerId, storeIds] = [...bySeller.entries()].sort((a, b) => b[1].length - a[1].length)[0] ?? [];
  if (!sellerId || !storeIds) throw new Error("no approved seller with a live store on staging");
  const storeId = storeIds[0]!;
  const otherSellerStore = candidates.find((c) => c.sellerId !== sellerId)?.storeId;
  console.log(`# seller ${sellerId.slice(0, 8)}…, store ${storeId.slice(0, 8)}…, ${storeIds.length} store(s)`);

  // An existing staging photo path stands in for the upload (no staging service key locally).
  const [withImage] = await db
    .select({ images: products.images })
    .from(products)
    .where(sql`jsonb_typeof(${products.images}) = 'array' AND jsonb_array_length(${products.images}) > 0 AND (${products.images}->>0) NOT LIKE 'http%'`)
    .orderBy(desc(products.createdAt))
    .limit(1);
  const stagingPhoto = (withImage?.images as string[] | undefined)?.[0];
  assert(stagingPhoto, "found a stored staging photo path to stand in for uploads");
  const fakeUpload = async () => ({ ok: true as const, path: stagingPhoto });

  const full = await issueToken(sellerId, [storeId], ["store.read", "products.write"]);
  cleanup.push(() => db.delete(oauthClients).where(eq(oauthClients.id, full.clientRowId)));
  const readOnly = await issueToken(sellerId, [storeId], ["store.read"]);
  cleanup.push(() => db.delete(oauthClients).where(eq(oauthClients.id, readOnly.clientRowId)));
  const token = full.accessToken;

  // ── Auth ──
  const anon = await rpc(null, "initialize");
  assert(anon.status === 401, "no token → 401");
  assert(/resource_metadata="http:\/\/localhost:4000\/\.well-known\/oauth-protected-resource\/mcp"/.test(anon.headers.get("www-authenticate") ?? ""), "401 carries WWW-Authenticate resource_metadata");
  const bad = await rpc("tby_at_" + "x".repeat(43), "initialize");
  assert(bad.status === 401 && /invalid_token/.test(bad.headers.get("www-authenticate") ?? ""), "unknown token → 401 invalid_token");
  const meta = await mcpApp.fetch(new Request("http://localhost:4000/.well-known/oauth-protected-resource/mcp"));
  const metaBody = await meta.json();
  assert(metaBody.resource === MCP && metaBody.authorization_servers?.length === 1, "protected-resource metadata names this resource and the dashboard issuer");

  // ── MCP handshake ──
  const init = await rpc(token, "initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "e2e", version: "1" } });
  assert(init.status === 200 && init.body?.result?.serverInfo?.name === "tallaby", "initialize → Tallaby server");
  assert(/both Arabic and English/.test(init.body?.result?.instructions ?? ""), "server instructions tell the assistant the bilingual rule");
  const list = await rpc(token, "tools/list");
  const names: string[] = list.body?.result?.tools?.map((t: { name: string }) => t.name) ?? [];
  for (const n of ["whoami", "list_stores", "search_products", "get_product", "create_product", "update_product", "set_product_status", "trash_products", "restore_products", "search_categories", "list_store_categories"]) {
    assert(names.includes(n), `tools/list has ${n}`);
  }

  const who = await call(token, "whoami", {});
  assert(!who.isError && who.data.scopes.includes("products.write"), "whoami shows the granted scopes");
  const storesRes = await call(token, "list_stores", {});
  assert(!storesRes.isError && storesRes.data.stores.length === 1 && storesRes.data.stores[0].id === storeId, "list_stores returns only the granted store");

  // ── Categories ──
  const cats = await call(token, "search_categories", { storeId, query: "a" });
  assert(!cats.isError && cats.data.categories.length > 0, "search_categories finds Tallaby categories");
  const categoryId = cats.data.categories[0].id as string;

  // ── Create (lib call: the stand-in uploader replaces the staging upload) ──
  const actor = await resolveAgentActor(token);
  assert(actor, "token resolves to an actor");
  const stamp = Date.now().toString(36);
  const created = await agentCreateProduct(
    { sellerId, userId: actor.userId, sellerStatus: actor.sellerStatus, storeId },
    {
      storeId,
      title: { ar: `كوب اختبار ${stamp}`, en: `Test mug ${stamp}` },
      description: { ar: "كوب سيراميك للاختبار", en: "Ceramic mug for testing" },
      bulletPoints: { ar: ["٣٥٠ مل"], en: ["350 ml"] },
      price: 150,
      compareAtPrice: 200,
      images: ["https://example.com/mug.jpg"],
      categoryId,
      storeCategoryName: { ar: `اختبار ${stamp}`, en: `MCP E2E ${stamp}` },
      variants: [
        { options: [{ name: { ar: "اللون", en: "Color" }, value: { ar: "أحمر", en: "Red", swatch: "#ef4444" } }], price: 150, stock: 4 },
        { options: [{ name: { ar: "اللون", en: "Color" }, value: { ar: "أزرق", en: "Blue" } }], price: 160, compareAtPrice: 200, stock: 6 },
      ],
    },
    fakeUpload,
  );
  const productId = created.productId;
  cleanup.push(async () => {
    await trashProducts(sellerId, sellerId, [productId]);
    await deleteTrashedProductsForever(sellerId, [productId]);
  });
  cleanup.push(() => db.delete(sellerProductCategories).where(and(eq(sellerProductCategories.sellerId, sellerId), eq(sellerProductCategories.name, `MCP E2E ${stamp}`))));
  assert(created.status === "active" && created.slug.startsWith(`test-mug-${stamp}`), "create → live product with an English slug");

  // ── Read it back over MCP ──
  const found = await call(token, "search_products", { storeId, query: stamp });
  assert(!found.isError && found.data.items.length === 1 && found.data.items[0].id === productId, "search_products finds it by name");
  assert(found.data.items[0].stock === 10 && found.data.items[0].variants === 2, "search row shows total variant stock");
  const got = await call(token, "get_product", { storeId, productId });
  assert(!got.isError && got.data.copy.ar.title === `كوب اختبار ${stamp}` && got.data.copy.en.title === `Test mug ${stamp}`, "get_product returns both languages");
  assert(got.data.price === 150 && got.data.compareAtPrice === 200, "price and compare-at price round-trip");
  assert(got.data.copy.ar.description === "<p>كوب سيراميك للاختبار</p>", "plain-text description is stored as sanitized HTML");
  assert(got.data.copy.en.metaTitle === `Test mug ${stamp}` && got.data.copy.en.metaDescription === "Ceramic mug for testing", "SEO fields are filled automatically");
  assert(got.data.storeCategory?.name === `MCP E2E ${stamp}`, "store category was found or added by name");
  assert(got.data.variants.length === 2 && got.data.variants[0].options.ar[0] === "اللون: أحمر", "variants carry Arabic options");
  assert(got.data.images[0]?.startsWith("http"), "images come back as public URLs");

  // ── Update over MCP ──
  const redId = got.data.variants[0].id as string;
  const upd = await call(token, "update_product", {
    storeId,
    productId,
    title: { ar: `كوب معدل ${stamp}`, en: `Edited mug ${stamp}` },
    price: 140,
    images: [got.data.images[0]],
    variants: [
      { id: redId, options: [{ name: { ar: "اللون", en: "Color" }, value: { ar: "أحمر", en: "Red" } }], price: 140, stock: 9 },
    ],
  });
  assert(!upd.isError && upd.data.status === "active", "update_product keeps a live product live");
  const after = await call(token, "get_product", { storeId, productId });
  assert(after.data.copy.en.title === `Edited mug ${stamp}` && after.data.price === 140, "update changed title and price");
  assert(after.data.slug === got.data.slug, "update keeps the slug (links keep working)");
  assert(after.data.variants.length === 1 && after.data.variants[0].id === redId && after.data.variants[0].stock === 9, "variant list replaced in place: kept id, removed the other");
  assert(after.data.images.length === 1 && after.data.images[0] === got.data.images[0], "existing photo kept by its public URL");
  const halfCopy = await call(token, "update_product", { storeId, productId, description: { en: "English only" } });
  assert(halfCopy.isError, "copy in one language only is rejected");
  const foreignImage = await call(token, "update_product", { storeId, productId, images: ["somebody-else/photo.jpg"] });
  assert(foreignImage.isError && foreignImage.data.error.code === "image_failed", "a path the product doesn't own is refused");

  // ── Status ──
  const hide = await call(token, "set_product_status", { storeId, productId, status: "draft" });
  assert(!hide.isError && hide.data.status === "draft" && hide.data.changed, "set_product_status hides the product");
  const stillDraft = await call(token, "update_product", { storeId, productId, price: 145 });
  assert(!stillDraft.isError && stillDraft.data.status === "draft", "editing a draft keeps it a draft");
  const show = await call(token, "set_product_status", { storeId, productId, status: "active" });
  assert(!show.isError && show.data.status === "active", "set_product_status publishes it again");

  // ── Denials ──
  const denied = await call(readOnly.accessToken, "update_product", { storeId, productId, price: 1 });
  assert(denied.isError && denied.data.error.code === "scope_missing", "a read-only grant cannot edit");
  if (otherSellerStore) {
    const foreign = await call(token, "search_products", { storeId: otherSellerStore });
    assert(foreign.isError && foreign.data.error.code === "store_not_allowed", "another seller's store id is refused");
  }
  const unknownProduct = await call(token, "get_product", { storeId, productId: "00000000-0000-4000-8000-000000000000" });
  assert(unknownProduct.isError && unknownProduct.data.error.code === "not_found", "unknown product → not_found");
  const sellerIdInjection = await call(token, "create_product", { storeId, sellerId: "x", title: { ar: "a", en: "a" }, price: 1, images: ["https://example.com/a.jpg"] });
  assert(sellerIdInjection.isError, "extra fields such as sellerId are rejected by the schema");

  // ── create_product over MCP: no staging service key, so the image step must fail cleanly and write nothing ──
  const key = `e2e-${stamp}`;
  const viaMcp = await call(token, "create_product", { storeId, title: { ar: "لا", en: `No upload ${stamp}` }, price: 10, images: ["https://127.0.0.1/a.jpg"], categoryId, idempotencyKey: key });
  assert(viaMcp.isError && viaMcp.data.error.code === "image_failed", "create_product with a private-network image URL fails cleanly");
  const none = await call(token, "search_products", { storeId, query: `No upload ${stamp}` });
  assert(none.data.items.length === 0, "a failed create leaves no product behind");

  // ── Trash / restore ──
  const trashed = await call(token, "trash_products", { storeId, productIds: [productId] });
  assert(!trashed.isError && trashed.data.trashed[0] === productId, "trash_products moves it to Trash");
  const inTrash = await call(token, "search_products", { storeId, status: "trash", query: stamp });
  assert(inTrash.data.items.length === 1 && inTrash.data.items[0].inTrash, "it is listed in Trash");
  const restored = await call(token, "restore_products", { storeId, productIds: [productId] });
  assert(!restored.isError && restored.data.restored[0] === productId, "restore_products brings it back");

  // ── Activity log ──
  const logged = await db.execute(sql`SELECT tool, status FROM agent_tool_calls WHERE grant_id IN (SELECT id FROM agent_grants WHERE client_id = ${full.clientRowId})`);
  const rows = (logged as unknown as { rows?: { tool: string; status: string }[] }).rows ?? (logged as unknown as { tool: string; status: string }[]);
  assert(rows.some((r) => r.tool === "update_product" && r.status === "ok"), "successful calls are in the activity log");
  assert(rows.some((r) => r.status === "error"), "failed calls are in the activity log");

  // ── Real download through the SSRF guard (no storage) ──
  const image = await fetchPublicImage("https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?w=200");
  assert(image.mime === "image/jpeg" && image.bytes.length > 1000, "fetchPublicImage downloads a real public JPEG");
  let blocked = false;
  try {
    await fetchPublicImage("https://localhost/a.jpg");
  } catch {
    blocked = true;
  }
  assert(blocked, "fetchPublicImage refuses localhost");
}

let exitCode = 0;
try {
  await main();
  console.log(`\n${passed} checks passed`);
} catch (error) {
  exitCode = 1;
  console.error(error);
} finally {
  for (const step of cleanup.reverse()) {
    try {
      await step();
    } catch (error) {
      console.error("cleanup step failed:", (error as Error).message);
    }
  }
  process.exit(exitCode);
}
