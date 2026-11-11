import { generateStructured } from "@workspace/ai";
import { applyInvalidation, invalidateStoreSite } from "@workspace/cache";
import { and, count, db, eq, gte, inArray, isNull, notInArray, products, storeDesignSystems, stores } from "@workspace/db";
import { AgentProductError, agentSetProductStatus, type AgentProductContext } from "@workspace/lib/products/agent/server";
import { publishStoreSite, saveStoreDesignSystem, saveStorePageDraft } from "@workspace/lib/store-sites/server";
import { grantWelcomeGiftSafely } from "@workspace/lib/store-wallet/server";
import { productInStore, productShownInStore } from "@workspace/lib/stores/scope/server";
import { getStore, getStoreShipping } from "@workspace/lib/stores/server";
import { designSystemSchema, validatePageContent } from "@workspace/store-sections/config";
import { runBulkBatch } from "@/app/(main)/stores/[storeId]/products/add/from-file/from-file-run.server";
import { ensureTaxonomyItem } from "@/app/(main)/stores/[storeId]/products/categories-brands/categories-brands.server";
import { pexelsConfigured, searchPexels } from "@/lib/stock-photos/pexels.server";
import { STORE_INDUSTRIES } from "@/lib/stores/industries.lib";
import { isSwitchOn } from "@/lib/stores/platform-switches.server";
import { BUILDER_FEATURES, BUILDER_LIMITS, builderReviewOutputSchema, type BuilderReview, type BuilderState } from "./builder.dto";
import { fileBatchRows, fileRowsToAdd, reviewIssuesV2, type BuildItem, type DraftReason } from "./builder.lib";
import { assignStockPhotos, brandColors, hideEmptyDataSections, isPeopleFree, leftoverTemplateText } from "./builder-checks.lib";
import { fileRowToMapped } from "./builder-intake.lib";
import { REVIEW_SYSTEM_RULES, reviewRequestText } from "./builder-prompts.lib";
import {
  ALLOWED,
  boundStore,
  builtProductIds,
  currentPolicy,
  draftPages,
  draftRows,
  otherStoresShowingAll,
  requireStoreOf,
  storeLocale,
  type RunContext,
} from "./builder-run.server";
import type { StepOutcome, StepSpec } from "./builder-run.lib";
import { buildSpendMicroUsd, checkBuildSpend, checkModelCall, giveCreditBack, loadItems, saveBuild, type BuildRow } from "./builder.store.server";

/**
 * The v2 build's own steps (ROADMAP.md F-82f, F-82j; spec §7–8): brand,
 * categories, hero photos, products from the file, quality checks and
 * publishing. Loaded by builder-run.server.ts for v2 builds only. The seller
 * comes from the session and the store is the build's own (requireStoreOf):
 * nothing here takes an id from the client or the model.
 */

const RESULT_CACHE_MS = 10 * 60_000;

/** The build's brief as the store's agent profile (stores.agent_profile, 0157; spec §14.3). */
export async function writeAgentProfile(sellerId: string, storeId: string, state: BuilderState): Promise<void> {
  const brief = state.brief;
  const profile = {
    voice: brief?.tone ?? "",
    audience: brief?.audience ?? "",
    styleWords: brief?.styleWords ?? [],
    styles: state.styles,
    taglineAr: brief?.taglineAr ?? "",
    taglineEn: brief?.taglineEn ?? "",
    nameEn: state.nameEn ?? brief?.nameEn ?? "",
    photoKeywordsEn: state.photoKeywordsEn,
    source: "store_builder",
    updatedAt: new Date().toISOString(),
  };
  await db
    .update(stores)
    .set({ agentProfile: profile })
    .where(and(eq(stores.id, storeId), eq(stores.sellerId, sellerId)));
}

// ── Brand ───────────────────────────────────────────────────────────────────

async function applyBrand(ctx: RunContext, build: BuildRow): Promise<StepOutcome> {
  const store = await requireStoreOf(ctx, build);
  const [row] = await db.select().from(storeDesignSystems).where(eq(storeDesignSystems.storeId, store.id)).limit(1);
  if (!row) return { data: { kept: "no_design_system" } };
  // Motion (0162) is carried along: saveStoreDesignSystem replaces the whole design system.
  const parsed = designSystemSchema.safeParse({ colors: row.colors, typography: row.typography, spacing: row.spacing, ...(row.motion != null && { motion: row.motion }) });
  if (!parsed.success) return { data: { kept: "invalid_design_system" } };
  const branded = brandColors(parsed.data.colors, build.state.primaryColor);
  // No colour: the template's own palette stays (the seller chose it).
  if (!branded) return { data: { kept: "template_colors" } };
  const saved = await saveStoreDesignSystem(ctx.sellerId, store.id, { ...parsed.data, colors: branded.colors }, row.version);
  if (!saved.success) throw new Error(`brand_${saved.error}`);
  return { data: { primary: branded.colors.primary ?? null, notes: branded.notes } };
}

// ── Categories ──────────────────────────────────────────────────────────────

const MAX_CATEGORIES = 12;

/**
 * The store's categories, in the seller's own words: the file's category
 * column, or (no column) one category for the store's field. The template's
 * category tiles and "Nth category" product rows read the store's categories in
 * order (`categoryList`, `categoryIndex`), so creating them is the binding; no
 * node is touched. Each product is placed in a Tallaby category in code by the
 * importer (`matchCategory`); a weak match is a to-do, not a blocker.
 */
async function applyCategories(ctx: RunContext, build: BuildRow): Promise<StepOutcome> {
  const { state } = build;
  const rows = fileRowsToAdd(state.fileRows);
  const names = [...new Set(rows.flatMap((row) => (row.category ? [row.category.trim()] : [])).filter(Boolean))].slice(0, MAX_CATEGORIES);
  let fallbackName: string | null = null;
  // The build's own store: its categories are created in that store's list (F-87d).
  const store = await requireStoreOf(ctx, build);
  if (!names.length && (rows.length || state.products.length)) {
    const industry = STORE_INDUSTRIES.find((i) => i.id === state.industryId);
    fallbackName = industry ? (storeLocale(store) === "en" ? industry.en : industry.ar) : null;
  }
  const all = names.length ? names : fallbackName ? [fallbackName] : [];
  let created = 0;
  for (const name of all) {
    const result = await ensureTaxonomyItem(store.id, "category", { name });
    if (result.success) created++;
  }
  return { data: { names: all, created, fallbackName } };
}

// ── Hero and about photos (D7) ──────────────────────────────────────────────

async function applyHeroPhotos(ctx: RunContext, build: BuildRow): Promise<StepOutcome> {
  const keywords = build.state.photoKeywordsEn;
  if (!keywords.length) return { data: { skipped: "no_keywords" } };
  if (!pexelsConfigured()) return { data: { skipped: "unavailable" } };
  const store = await requireStoreOf(ctx, build);
  const pages = await draftPages(store.id);
  let photos;
  try {
    photos = (await searchPexels(keywords.slice(0, 3).join(" ").slice(0, 80).toLowerCase(), 1)).photos;
  } catch (error) {
    console.error("[ai-builder] stock photos failed", error instanceof Error ? error.message : error);
    return { data: { skipped: "unavailable" } };
  }
  // No people or body parts (template rule), landscape for a hero; no good match keeps the template's photo.
  const urls = photos.filter((photo) => isPeopleFree(photo.alt) && photo.width >= photo.height).map((photo) => photo.previewUrl).slice(0, 5);
  const { pages: changed, placed } = assignStockPhotos(pages, urls);
  for (const page of changed) {
    const saved = await saveStorePageDraft(ctx.sellerId, store.id, page.id, page.content, page.draftVersion, { allowedSections: ALLOWED });
    if (!saved.success) throw new Error(`page_${saved.error}`);
  }
  return { data: { placed } };
}

// ── Products from the file (F-82f) ──────────────────────────────────────────

export type BuiltProduct = { id: string; row?: number; title?: string; missing: DraftReason[] };

/**
 * One batch of the seller's file through the file importer (`runBulkBatch`):
 * the same validation, category matching, photo import and batch copy
 * (`product_bulk_copy`, docs/ai.md §5), with the build id on the usage log, no
 * credits on the free build, and every product saved hidden until `publish`.
 * The SKUs are fixed per build file and row (`importSku`), so a batch run again
 * adds nothing twice and finds what it made before.
 */
async function applyFileBatch(ctx: RunContext, build: BuildRow, batch: number, items: ReadonlyMap<string, BuildItem>): Promise<StepOutcome> {
  const { state } = build;
  const rows = fileBatchRows(state.fileRows, batch);
  if (!state.fileKey || !rows.length) return { data: { products: [], productIds: [], notAdded: 0 } };
  const fallback = (items.get("categories")?.data.fallbackName as string | null | undefined) ?? null;
  // The builder's spend stop before each batch; past it, rows that need no copy are still added.
  const spendOk = await checkBuildSpend(build);
  // The build's own store (requireStoreOf), never one from the client (F-87c).
  const store = await requireStoreOf(ctx, build);
  const result = await runBulkBatch(
    ctx.sellerId,
    { fileKey: state.fileKey, source: "sheet", rows: rows.map((row) => fileRowToMapped(row, fallback)) },
    { storeId: store.id, refId: build.id, credits: state.paid, ai: spendOk, keepDraft: true, unlimitedRows: new Set(rows.filter((row) => row.unlimited).map((row) => row.row)) },
  );
  if (!result.ok) throw new Error(`file_${result.error}`);

  const stop = !spendOk ? "budget" : result.stop === "noCredits" || result.stop === "dailyLimit" ? result.stop : null;
  if (stop && !build.stopReason) {
    build.stopReason = stop;
    await saveBuild(ctx.sellerId, build.id, { stopReason: stop });
  }

  // Ids by SKU: rows added now, and rows an earlier attempt of this step added ("already").
  // Only products made since the build started: a SKU the seller already used elsewhere is never taken over.
  // And only products of the build's store (F-87c; before the split `managed` = the seller's).
  const skus = result.results.flatMap((r) => (r.sku && (r.outcome === "live" || r.outcome === "draft" || r.outcome === "already") ? [r.sku] : []));
  const catalogSplit = skus.length ? await isSwitchOn("stores_catalog_split") : false;
  const found = skus.length
    ? await db
        .select({ id: products.id, sku: products.sku, images: products.images })
        .from(products)
        .where(
          and(
            eq(products.sellerId, ctx.sellerId),
            inArray(products.sku, skus),
            isNull(products.deletedAt),
            gte(products.createdAt, build.createdAt),
            productInStore(store.id, { catalogSplit, scope: "managed" }),
          ),
        )
    : [];
  const bySku = new Map(found.map((row) => [row.sku, row]));
  const byRow = new Map(rows.map((row) => [row.row, row]));
  const made: BuiltProduct[] = result.results.flatMap((r) => {
    const product = r.sku ? bySku.get(r.sku) : undefined;
    const row = byRow.get(r.row);
    if (!product || !row) return [];
    const missing: DraftReason[] = [];
    if (!Array.isArray(product.images) || product.images.length === 0) missing.push("photo");
    if (row.stock === null && !row.unlimited) missing.push("stock");
    if (r.notes?.includes("checkName")) missing.push("name");
    return [{ id: product.id, row: r.row, title: (r.title ?? row.name).slice(0, 120), missing }];
  });
  const notAdded = rows.length - made.length;
  return { data: { products: made, productIds: made.map((p) => p.id), notAdded, creditsUsed: result.creditsUsed, ...(stop && { stop }) } };
}

/** Every product the build made, and why each is a draft (empty: complete, D4). */
export function builtProducts(items: ReadonlyMap<string, BuildItem>): BuiltProduct[] {
  const out = new Map<string, BuiltProduct>();
  for (const item of items.values()) {
    if (item.status !== "done") continue;
    if (Array.isArray(item.data.products)) {
      for (const raw of item.data.products as BuiltProduct[]) if (raw && typeof raw.id === "string") out.set(raw.id, { ...raw, missing: Array.isArray(raw.missing) ? raw.missing : [] });
    } else if (item.key.startsWith("product:") && item.productId) {
      const missing = Array.isArray(item.data.missing) ? (item.data.missing as DraftReason[]) : [];
      out.set(item.productId, { id: item.productId, title: typeof item.data.title === "string" ? item.data.title : undefined, missing });
    }
  }
  return [...out.values()];
}

// ── Checks (spec §8) ────────────────────────────────────────────────────────

/**
 * Live products this store will show: the build's complete ones, plus, before
 * the catalog split, the account's others when the store shows all products;
 * after it, the store's own others (F-87c).
 */
async function visibleProducts(sellerId: string, storeId: string, items: ReadonlyMap<string, BuildItem>): Promise<number> {
  const complete = builtProducts(items).filter((product) => !product.missing.length).length;
  const catalogSplit = await isSwitchOn("stores_catalog_split");
  if (!catalogSplit && items.get("catalog")?.data.mode === "selected") return complete;
  const ids = builtProductIds(items);
  const [row] = await db
    .select({ value: count() })
    .from(products)
    .where(
      and(
        eq(products.sellerId, sellerId),
        eq(products.status, "active"),
        isNull(products.deletedAt),
        ...(ids.length ? [notInArray(products.id, ids)] : []),
        ...(catalogSplit ? [productShownInStore({ storeId, catalogSplit })] : []),
      ),
    );
  return complete + (row?.value ?? 0);
}

async function applyChecks(ctx: RunContext, build: BuildRow, items: ReadonlyMap<string, BuildItem>): Promise<StepOutcome> {
  const store = await requireStoreOf(ctx, build);
  const locale = storeLocale(store);
  const pages = await draftPages(store.id);
  const invalidPages = pages.filter((page) => !validatePageContent(page.content, { allowedSections: ALLOWED }).success).length;

  const originals = (items.get("site_copy")?.data.originals as string[] | undefined) ?? [];
  const leftover = originals.length ? leftoverTemplateText(pages, originals, locale) : 0;

  const liveProducts = await visibleProducts(ctx.sellerId, store.id, items);
  const categories = ((items.get("categories")?.data.names as string[] | undefined) ?? []).length;
  const { pages: toHide, hidden } = hideEmptyDataSections(pages, { liveProducts, categories });
  for (const page of toHide) {
    const saved = await saveStorePageDraft(ctx.sellerId, store.id, page.id, page.content, page.draftVersion, { allowedSections: ALLOWED });
    if (!saved.success) throw new Error(`page_${saved.error}`);
  }

  // v1's last read (mixed languages, contradictions): only ever a note. Code gates above ran whatever happens here.
  let notes: string[] = [];
  const gate = await checkModelCall(build, BUILDER_FEATURES.review);
  if (gate.ok) {
    try {
      const titles = builtProducts(items).flatMap((product) => (product.title ? [product.title] : []));
      const { object, cached } = await generateStructured({
        feature: BUILDER_FEATURES.review,
        sellerId: ctx.sellerId,
        refId: build.id,
        tier: "fast",
        schema: builderReviewOutputSchema,
        system: REVIEW_SYSTEM_RULES,
        content: [{ type: "text", text: reviewRequestText([build.state.brief?.taglineAr ?? "", build.state.brief?.taglineEn ?? "", ...titles.slice(0, 30)]) }],
        thinkingLevel: "minimal",
        maxOutputTokens: 300,
        cacheMs: RESULT_CACHE_MS,
      });
      if (cached) await giveCreditBack(ctx.sellerId, gate.creditReference);
      notes = object.notes.map((note) => note.replace(/[<>]/g, " ").trim().slice(0, 200)).filter(Boolean).slice(0, 5);
    } catch (error) {
      await giveCreditBack(ctx.sellerId, gate.creditReference);
      console.error("[ai-builder] notes failed", error instanceof Error ? error.message : error);
    }
  }
  return {
    data: {
      invalidPages,
      flags: [
        { code: "demoTextLeft", count: leftover },
        { code: "sectionsHidden", count: hidden },
      ],
      notes,
    },
  };
}

// ── Publish (D1, D3, D4) ────────────────────────────────────────────────────

/**
 * The same safe path as Templates' auto-publish (`publishNewStoreSafely`): only
 * a store never published (checked under the row lock), with its template
 * chosen; the cache is cleared; an error is returned, never thrown.
 */
async function publishBuiltStore(ctx: RunContext, store: { id: string; subdomain: string }): Promise<{ ok: boolean; error: string | null }> {
  try {
    const result = await publishStoreSite(ctx.sellerId, store.id, ctx.userId, { allowedSections: ALLOWED, requireTemplateChoice: true, onlyIfNeverPublished: true });
    if (!result.success) return { ok: false, error: result.error };
    await grantWelcomeGiftSafely(ctx.sellerId);
    await applyInvalidation(invalidateStoreSite(ctx.sellerId, store.id, store.subdomain), { from: "dashboard", mode: "route" });
    return { ok: true, error: null };
  } catch (error) {
    console.error("[ai-builder] publish failed", error instanceof Error ? error.message : error);
    return { ok: false, error: "failed" };
  }
}

/**
 * Pressing "Build and publish" was the seller's consent (D1). Complete
 * products go live (photo, price and a stock answer: D4; the rest stay drafts
 * on the to-do list), then the site, even with no products (D3). Only the
 * build's own store, and only if it was never published: a store the seller
 * published or switched off is never touched. A publish error never fails the
 * build; it is recorded for the review.
 */
async function applyPublish(ctx: RunContext, build: BuildRow, items: ReadonlyMap<string, BuildItem>): Promise<StepOutcome> {
  const store = await requireStoreOf(ctx, build);
  const agentContext: AgentProductContext = { sellerId: ctx.sellerId, userId: ctx.userId, sellerStatus: ctx.sellerStatus, storeId: store.id };
  let live = 0;
  const held: string[] = [];
  for (const product of builtProducts(items)) {
    if (product.missing.length) continue;
    try {
      const result = await agentSetProductStatus(agentContext, product.id, "active");
      if (result.changed) await applyInvalidation(result.invalidation, { from: "dashboard", mode: "route" });
      if (result.status === "active") live++;
    } catch (error) {
      if (!(error instanceof AgentProductError)) throw error;
      held.push(product.id);
    }
  }

  if (build.publishedAt) return { data: { live, held, published: true, publishError: null } };
  const bound = await boundStore(ctx.sellerId, store.id);
  const outcome = bound === "ok" ? await publishBuiltStore(ctx, store) : { ok: false, error: bound === "published" ? "already_published" : "missing" };
  if (outcome.ok) {
    const now = new Date().toISOString();
    build.publishedAt = now;
    await saveBuild(ctx.sellerId, build.id, { publishedAt: now });
  }
  return { data: { live, held, published: outcome.ok, publishError: outcome.error } };
}

// ── The steps ───────────────────────────────────────────────────────────────

/** The v2 steps; null for a key the v1 steps handle (store, settings, template, site copy, products, catalog, shipping, policy). */
export async function v2SpecFor(ctx: RunContext, build: BuildRow, key: string, items: ReadonlyMap<string, BuildItem>): Promise<StepSpec | null> {
  if (key === "brand") return { feature: null, apply: () => applyBrand(ctx, build) };
  if (key === "categories") return { feature: null, apply: () => applyCategories(ctx, build) };
  if (key === "hero_photos") return { feature: null, apply: () => applyHeroPhotos(ctx, build) };
  if (key.startsWith("products_file:")) {
    const batch = Number(key.slice("products_file:".length));
    if (!Number.isInteger(batch) || batch < 0) return { feature: null, apply: async () => ({ status: "failed" }) };
    return { feature: null, apply: () => applyFileBatch(ctx, build, batch, items) };
  }
  if (key === "checks") return { feature: null, apply: () => applyChecks(ctx, build, items) };
  if (key === "publish") return { feature: null, apply: () => applyPublish(ctx, build, items) };
  return null;
}

// ── Review ──────────────────────────────────────────────────────────────────

/** The done card and its to-do list, from what is really there now. */
export async function loadReviewV2(ctx: RunContext, build: BuildRow): Promise<BuilderReview> {
  const items = await loadItems(build.id);
  const store = build.storeId ? await getStore(ctx.sellerId, build.storeId) : null;
  const built = builtProducts(items);
  const ids = built.map((product) => product.id);
  const rows = ids.length
    ? await db.query.products.findMany({
        where: and(eq(products.sellerId, ctx.sellerId), inArray(products.id, ids), isNull(products.deletedAt)),
        columns: { id: true, status: true, images: true },
        with: { productTranslations: { columns: { locale: true, title: true } } },
      })
    : [];
  const list = rows.map((row) => ({
    id: row.id,
    title: row.productTranslations.find((t) => t.locale === "ar")?.title ?? row.productTranslations[0]?.title ?? "",
    status: row.status,
    hasPhoto: Array.isArray(row.images) && row.images.length > 0,
  }));
  const status = new Map(list.map((row) => [row.id, row]));

  const pages = store ? await draftRows(store.id) : [];
  const invalidPages = pages.filter((row) => !validatePageContent(row.draftContent, { allowedSections: ALLOWED }).success).length;
  const shipping = store ? await getStoreShipping(ctx.sellerId, store.id) : null;
  const policy = await currentPolicy(ctx.sellerId);
  const allMode = await otherStoresShowingAll(ctx.sellerId, store?.id ?? null);
  const publishItem = items.get("publish");
  const checks = items.get("checks");
  const flags = ((checks?.data.flags as { code: string; count: number }[] | undefined) ?? []).filter((flag) => typeof flag?.code === "string" && typeof flag.count === "number");
  const published = Boolean(build.publishedAt) || store?.siteStatus === "published";
  const fileNotAdded = [...items.values()]
    .filter((item) => item.key.startsWith("products_file:"))
    .reduce((sum, item) => sum + (item.status === "done" ? Number(item.data.notAdded ?? 0) : fileBatchRows(build.state.fileRows, Number(item.key.split(":")[1])).length), 0);

  return {
    flow: "v2",
    storeId: store?.id ?? null,
    storeName: store?.name ?? null,
    subdomain: store?.subdomain ?? null,
    stopReason: build.stopReason,
    issues: reviewIssuesV2({
      storeId: store?.id ?? null,
      state: build.state,
      items,
      products: list.map(({ id, hasPhoto }) => ({ id, hasPhoto })),
      zoneCount: shipping?.zones.length ?? 0,
      returnPolicy: policy?.returnPolicy ?? null,
      invalidPages,
      built: built.map((product) => ({ id: product.id, live: status.get(product.id)?.status === "active", missing: product.missing })),
      published,
      publishError: (publishItem?.data.publishError as string | null | undefined) ?? null,
      flags,
      fileNotAdded,
    }),
    notes: ((checks?.data.notes as string[] | undefined) ?? []).filter((note) => typeof note === "string"),
    products: list,
    draftProducts: list.filter((row) => row.status === "draft" && row.hasPhoto).length,
    regenerationsLeft: Math.max(0, 1 + BUILDER_LIMITS.siteCopyRegenerations - build.siteCopyRuns),
    otherStoresShowAll: allMode,
    spentMicroUsd: await buildSpendMicroUsd(ctx.sellerId, build),
    published,
    viewUrl: store ? `/api/stores/${store.id}/view` : null,
  };
}
