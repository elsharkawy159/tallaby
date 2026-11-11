import { randomUUID } from "node:crypto";
import { generateStructured } from "@workspace/ai";
import { applyInvalidation, invalidateStorefront } from "@workspace/cache";
import { and, asc, db, eq, inArray, isNull, or, products, sellers, sql, storePages, stores } from "@workspace/db";
import { buildTemplateForm, getFormTemplate } from "@workspace/lib/store-forms";
import { sendStoreCreatedEmail } from "@workspace/lib/orders";
import { agentCreateProductSchema } from "@workspace/lib/products/agent";
import { AgentProductError, agentCreateProduct, agentSetProductStatus, type AgentProductContext } from "@workspace/lib/products/agent/server";
import { templateZones } from "@workspace/lib/shipping/store-zones";
import { applyStoreTemplate, saveStorePageDraft } from "@workspace/lib/store-sites/server";
import {
  applyStoreShippingTemplate,
  checkStoreSubdomain,
  createStore,
  getStore,
  getStoreShipping,
  listStores,
  saveStoreShippingZone,
  setStoreCatalog,
  updateStoreSeo,
  updateStoreSettings,
  updateStoreSocialLinks,
  updateStoreSubdomain,
} from "@workspace/lib/stores/server";
import { pageContentSchema, validatePageContent, type PageContent } from "@workspace/store-sections/config";
import { contentOverrideKeys, storeSectionRegistry } from "@workspace/store-sections/render";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { getAllCategories } from "@/actions/categories";
import { autofillProduct } from "@/app/(main)/stores/[storeId]/products/add/ai/ai-autofill.server";
import { isSwitchOn } from "@/lib/stores/platform-switches.server";
import { contentBlocksToHtml, pickAutofillCategory } from "@/app/(main)/stores/[storeId]/products/add/ai/ai-autofill.lib";
import type { ProductAutofillOutput } from "@/app/(main)/stores/[storeId]/products/add/ai/ai-autofill.dto";
import type { CategoryOption } from "@/app/(main)/stores/[storeId]/products/add/add-product.schema";
import { suggestCategories } from "@/app/(main)/stores/[storeId]/products/add/add-product.lib";
import { proposeZones } from "@/app/(main)/stores/[storeId]/shipping/ai/ai-zones.server";
import type { ProposedZone } from "@/app/(main)/stores/[storeId]/shipping/ai/ai-zones.dto";
import { STORE_INDUSTRIES } from "@/lib/stores/industries.lib";
import { installEdition } from "./builder-niche.lib";
import {
  BUILDER_FEATURES,
  BUILDER_LIMITS,
  builderPolicyOutputSchema,
  builderReviewOutputSchema,
  builderSiteCopyOutputSchema,
  type BuilderProduct,
  type BuilderReview,
  type BuilderSiteCopyOutput,
  type BuilderState,
} from "./builder.dto";
import { applyCopyValues, collectCopySlots } from "./builder-copy.lib";
import { originalTexts } from "./builder-checks.lib";
import { buildItemKeys, buildProgress, isAutoSubdomain, isFinished, reviewIssues, shippingZoneNames, subdomainBase, type BuildItem } from "./builder.lib";
import { POLICY_SYSTEM_RULES, REVIEW_SYSTEM_RULES, SITE_COPY_SYSTEM_RULES, policyRequestText, productRequestText, reviewRequestText, siteCopyRequestText } from "./builder-prompts.lib";
import { FatalBuildError, runNextStep, type BuildRunner, type StepSpec } from "./builder-run.lib";
import { builderPhotoUrl, isOwnBuilderPath } from "./builder-upload.lib";
import { buildSpendMicroUsd, checkModelCall, giveCreditBack, loadItems, saveBuild, saveItem, type BuildRow } from "./builder.store.server";

/**
 * A build's steps through the existing store, product and shipping code
 * (ROADMAP.md F-54d). The seller comes from the session and every call passes
 * the store this build owns, so nothing here takes an id from the model or the
 * client. Writes drafts only: products stay hidden and the site stays offline
 * until the seller acts on the review screen. Cost rules: docs/ai.md.
 */

export const ALLOWED = storeSectionRegistry.allowedSections();
const OVERRIDE_KEYS = contentOverrideKeys(storeSectionRegistry);

/** The same input again within this window is free. */
const RESULT_CACHE_MS = 10 * 60_000;

export type RunContext = { sellerId: string; userId: string; sellerStatus: string };

export const refresh = (subdomain: string) => applyInvalidation(invalidateStorefront([subdomain]), { from: "dashboard", mode: "route" });

// ── Store ───────────────────────────────────────────────────────────────────

/** The bound store, if it is still this seller's and was never published. The build only ever writes to such a store. */
export async function boundStore(sellerId: string, storeId: string): Promise<"ok" | "published" | "missing"> {
  const [row] = await db
    .select({ firstPublishedAt: stores.firstPublishedAt, siteStatus: stores.siteStatus })
    .from(stores)
    .where(and(eq(stores.id, storeId), eq(stores.sellerId, sellerId), isNull(stores.deletedAt)))
    .limit(1);
  if (!row) return "missing";
  return row.firstPublishedAt || row.siteStatus !== "draft" ? "published" : "ok";
}

/** A free address made from the store's name (base, then base-store, base-shop, …); null when the name gives none. */
async function nameSubdomain(sellerId: string, state: BuilderState, storeId?: string): Promise<string | null> {
  const base = subdomainBase(state.brief?.nameEn || state.nameEn, state.name);
  if (!base) return null;
  const check = await checkStoreSubdomain(sellerId, base, storeId ? { storeId } : {});
  if (check.status === "available") return check.subdomain;
  return check.suggestions[0] ?? null;
}

async function freeSubdomain(sellerId: string, state: BuilderState): Promise<string> {
  return (await nameSubdomain(sellerId, state)) ?? `store-${randomUUID().slice(0, 8)}`;
}

/**
 * A store that still has a random address (store-1a2b3c) moves to one made from
 * its name (owner, 2026-11-09). updateStoreSubdomain keeps the old address as a
 * redirect, so links already shared keep working. Never fails the build.
 */
async function nameTheAddress(sellerId: string, store: { id: string; subdomain: string }, state: BuilderState): Promise<void> {
  if (!isAutoSubdomain(store.subdomain)) return;
  const next = await nameSubdomain(sellerId, state, store.id).catch(() => null);
  if (!next || isAutoSubdomain(next)) return;
  const moved = await updateStoreSubdomain(sellerId, store.id, next).catch(() => null);
  if (moved?.success) await refresh(store.subdomain);
}

/**
 * The build's store: the one it is bound to (target_store_id, set at signup for a
 * hero build or by an earlier attempt of this step), or a new one within the plan
 * limit. Never another store of the seller's, guessed (v1 could overwrite one).
 */
export async function ensureStore(ctx: RunContext, build: BuildRow): Promise<string> {
  if (build.storeId) return build.storeId;
  if (build.targetStoreId) {
    const bound = await boundStore(ctx.sellerId, build.targetStoreId);
    if (bound === "published") throw new FatalBuildError("store_published");
    if (bound === "missing") throw new FatalBuildError("no_store");
    return build.targetStoreId;
  }
  const created = await createStore(ctx.sellerId, { name: build.state.name ?? "", subdomain: await freeSubdomain(ctx.sellerId, build.state) });
  if (!created.success) {
    if (created.error === "limit_reached") throw new FatalBuildError("store_limit");
    throw new Error(`store_${created.error}`);
  }
  // Bound at once, so a retry after a crash reuses this store instead of making another.
  await saveBuild(ctx.sellerId, build.id, { targetStoreId: created.data.id });
  build.targetStoreId = created.data.id;
  await sendStoreCreatedEmail(created.data.id);
  return created.data.id;
}

export async function requireStoreOf(ctx: RunContext, build: BuildRow) {
  const store = build.storeId ? await getStore(ctx.sellerId, build.storeId) : null;
  if (!store) throw new FatalBuildError("no_store");
  return store;
}

const seoTitleTemplate = (name: string) => `%s | ${name.replace(/%/g, "")}`.slice(0, 120);

async function applySettings(ctx: RunContext, build: BuildRow) {
  const store = await requireStoreOf(ctx, build);
  const { state } = build;
  await nameTheAddress(ctx.sellerId, store, state);
  const industry = STORE_INDUSTRIES.find((i) => i.id === state.industryId);
  const description = (state.about ?? "").slice(0, 2000);
  const settings = await updateStoreSettings(ctx.sellerId, store.id, {
    ...(state.name && { name: state.name }),
    description,
    ...(industry && { storeCategory: industry.en, storeCategoryAr: industry.ar }),
    ...(state.logo && isOwnBuilderPath(state.logo, ctx.sellerId) && { logoUrl: builderPhotoUrl(state.logo) }),
    contact: {
      ...(state.contact.phone && { phone: state.contact.phone }),
      ...(state.contact.whatsapp && { whatsapp: state.contact.whatsapp }),
      ...(state.contact.email && { email: state.contact.email }),
    },
  });
  if (!settings.success) throw new Error(`settings_${settings.error}`);
  if (state.social.length) {
    const links = state.social.map((link, order) => ({ platform: link.platform, value: link.value, enabled: true, order }));
    const social = await updateStoreSocialLinks(ctx.sellerId, store.id, links);
    if (!social.success) throw new Error(`social_${social.error}`);
  }
  const seo = await updateStoreSeo(ctx.sellerId, store.id, {
    titleTemplate: seoTitleTemplate(state.name ?? store.name),
    description: description.slice(0, 320) || null,
    shareImageUrl: null,
    indexing: true,
    googleSiteVerification: null,
  });
  if (!seo.success) throw new Error(`seo_${seo.error}`);
  // v2 (F-82e): the brief becomes the store's agent profile, the brand memory every agent skill reads (F-83).
  if (state.flow === "v2") await (await import("./builder-items.server")).writeAgentProfile(ctx.sellerId, store.id, state);
  await refresh(store.subdomain);
  return {};
}

/** A ready-made form a template needs, in the store's language (the templates action does the same). */
async function templateFormInput(kind: string, locale: "ar" | "en") {
  const template = getFormTemplate(kind);
  if (!template) return undefined;
  const t = await getTranslations({ locale, namespace: `storeForms.templates.${template.id}` });
  return buildTemplateForm(template, (key) => t(key as never));
}

async function applyTemplate(ctx: RunContext, build: BuildRow) {
  const store = await requireStoreOf(ctx, build);
  const result = await applyStoreTemplate(ctx.sellerId, store.id, build.state.templateKey ?? "", ctx.userId, {
    allowedSections: ALLOWED,
    overrideKeys: OVERRIDE_KEYS,
    formInput: templateFormInput,
    // The niche's edition, when the chosen template still has it (F-90): re-checked here, and again by the server.
    ...installEdition(build.state),
  });
  if (!result.success) throw new Error(`template_${result.error}`);
  return {};
}

// ── Site copy ───────────────────────────────────────────────────────────────

export type DraftPage = { id: string; slug: string; isHome: boolean; draftVersion: number; content: PageContent };

export async function draftPages(storeId: string): Promise<DraftPage[]> {
  const rows = await db
    .select({ id: storePages.id, slug: storePages.slug, isHome: storePages.isHome, kind: storePages.kind, draftVersion: storePages.draftVersion, draftContent: storePages.draftContent })
    .from(storePages)
    .where(eq(storePages.storeId, storeId))
    .orderBy(asc(storePages.orderIndex), asc(storePages.createdAt));
  return rows.flatMap((row) => {
    if (row.kind === "product") return [];
    const content = pageContentSchema.safeParse(row.draftContent);
    return content.success ? [{ id: row.id, slug: row.slug, isHome: row.isHome, draftVersion: row.draftVersion, content: content.data }] : [];
  });
}

export const storeLocale = (store: { defaultLocale: string }) => (store.defaultLocale === "en" ? "en" : "ar");

async function generateSiteCopy(ctx: RunContext, build: BuildRow): Promise<{ value: BuilderSiteCopyOutput; cached?: boolean; noCall?: boolean }> {
  const store = await requireStoreOf(ctx, build);
  const slots = collectCopySlots(await draftPages(store.id), storeLocale(store));
  // Nothing to write, so no call: treated like a cached answer, and no credit is kept.
  if (!slots.length) return { value: { values: [] }, cached: true, noCall: true };
  const { object, cached } = await generateStructured({
    feature: BUILDER_FEATURES.siteCopy,
    sellerId: ctx.sellerId,
    refId: build.id,
    tier: "fast",
    schema: builderSiteCopyOutputSchema,
    system: SITE_COPY_SYSTEM_RULES,
    content: [{ type: "text", text: siteCopyRequestText(build.state, slots) }],
    thinkingLevel: "minimal",
    maxOutputTokens: 3000,
    cacheMs: RESULT_CACHE_MS,
  });
  return { value: object, cached: Boolean(cached) };
}

async function applySiteCopy(ctx: RunContext, build: BuildRow, output: BuilderSiteCopyOutput) {
  const store = await requireStoreOf(ctx, build);
  const pages = await draftPages(store.id);
  // The template's own texts, for the v2 check that none is left (F-82j); only what the first run saw.
  const originals = build.state.flow === "v2" ? originalTexts(pages, storeLocale(store)) : [];
  const { pages: next, applied } = applyCopyValues(pages, output, storeLocale(store));
  for (const page of next) {
    // Through the editor's own save: validated, and refused if the seller edited this page meanwhile.
    const saved = await saveStorePageDraft(ctx.sellerId, store.id, page.id, page.content, page.draftVersion, { allowedSections: ALLOWED });
    if (!saved.success) throw new Error(`page_${saved.error}`);
  }
  return { data: { applied, ...(originals.length && { originals }) } };
}

// ── Products ────────────────────────────────────────────────────────────────

async function photoBytes(sellerId: string, path: string) {
  if (!isOwnBuilderPath(path, sellerId)) return null;
  const response = await fetch(builderPhotoUrl(path));
  if (!response.ok) return null;
  const mediaType = response.headers.get("content-type") ?? "image/jpeg";
  const data = new Uint8Array(await response.arrayBuffer());
  return data.byteLength <= BUILDER_LIMITS.maxImageBytes ? { mediaType, size: data.byteLength, data } : null;
}

async function generateProduct(ctx: RunContext, build: BuildRow, product: BuilderProduct) {
  const images = (await Promise.all(product.photos.slice(0, BUILDER_LIMITS.photosPerProduct).map((path) => photoBytes(ctx.sellerId, path)))).filter((image) => image !== null);
  // The build's own store: its category names go in the prompt (F-87d).
  const store = await requireStoreOf(ctx, build);
  const taxonomy = { sellerId: ctx.sellerId, storeId: store.id, catalogSplit: await isSwitchOn("stores_catalog_split") };
  const { output, cached } = await autofillProduct(taxonomy, { text: productRequestText(product), images, pdf: null, current: null }, { feature: BUILDER_FEATURES.product, refId: build.id });
  return { value: output as unknown, cached };
}

const categoryTree = async () => ((await getAllCategories()).data ?? []) as CategoryOption[];

/** The MCP tools' validation, except that a product with no photo is allowed: it stays a draft (AI-D8). */
const builderProductSchema = agentCreateProductSchema.extend({ images: z.array(z.string().trim().min(1).max(2000)).max(10) });

function pickCategory(categories: CategoryOption[], output: ProductAutofillOutput, state: BuilderState): string | null {
  const matched = pickAutofillCategory(categories, output);
  if (matched) return matched;
  // No match from the product: the store's own industry is the next best guess, in code.
  const industry = STORE_INDUSTRIES.find((i) => i.id === state.industryId);
  if (!industry) return null;
  return suggestCategories(categories, { titles: [industry.en, industry.ar] }, 1)[0]?.category.id ?? null;
}

const keywords = (values: readonly string[]) => values.filter((value) => value.length <= 40).slice(0, 15);

/** Fixed per build and product: a retry after a crash finds the product instead of making a second one. */
export const builderSku = (buildId: string, productId: string) => `AI-${buildId.slice(0, 8)}-${productId}`.toUpperCase();

async function applyProduct(ctx: RunContext, build: BuildRow, product: BuilderProduct, output: ProductAutofillOutput) {
  const store = await requireStoreOf(ctx, build);
  const sku = builderSku(build.id, product.id);
  const [existing] = await db
    .select({ id: products.id })
    .from(products)
    .where(and(eq(products.sellerId, ctx.sellerId), eq(products.sku, sku)))
    .limit(1);
  if (existing) return { productId: existing.id };

  const categoryId = pickCategory(await categoryTree(), output, build.state);
  if (!categoryId) return { status: "failed" as const, data: { reason: "no_category" } };

  const { ar, en } = output.localized;
  const title = { ar: ar.title || product.name, en: en.title || product.name };
  const description = ar.description && en.description ? { ar: ar.description, en: en.description } : undefined;
  const contentAr = contentBlocksToHtml(ar.contentBlocks);
  const contentEn = contentBlocksToHtml(en.contentBlocks);
  const hint = output.categoryHint ?? "";
  const storeCategory = output.storeCategoryName ? { ar: output.storeCategoryName, en: (hint || output.storeCategoryName).slice(0, 80) } : undefined;

  const input = builderProductSchema.parse({
    storeId: store.id,
    title,
    ...(description && { description }),
    ...(contentAr && contentEn && { content: { ar: contentAr, en: contentEn } }),
    bulletPoints: { ar: ar.bulletPoints, en: en.bulletPoints },
    seo: {
      ar: { metaTitle: ar.metaTitle, metaDescription: ar.metaDescription, keywords: keywords(ar.metaKeywords) },
      en: { metaTitle: en.metaTitle, metaDescription: en.metaDescription, keywords: keywords(en.metaKeywords) },
    },
    // Always the seller's own figures, never the model's.
    price: product.price,
    ...(product.compareAtPrice && { compareAtPrice: product.compareAtPrice }),
    ...(product.unlimited ? { trackStock: false } : { quantity: product.stock ?? 0 }),
    sku,
    categoryId,
    ...(storeCategory && { storeCategoryName: storeCategory }),
    images: product.photos.filter((path) => isOwnBuilderPath(path, ctx.sellerId)).map((path) => builderPhotoUrl(path)),
    ...(output.condition && { condition: output.condition }),
    // Hidden until the seller makes it live on the review screen.
    publish: false,
  });
  // The photos are already in the bucket, under this seller's folder: nothing to download.
  const prefix = builderPhotoUrl("");
  const upload = async (url: string) => {
    const path = decodeURIComponent(url.slice(prefix.length));
    return url.startsWith(prefix) && isOwnBuilderPath(path, ctx.sellerId) ? { ok: true as const, path } : { ok: false as const, reason: "not this seller's photo" };
  };
  const agentContext: AgentProductContext = { sellerId: ctx.sellerId, userId: ctx.userId, sellerStatus: ctx.sellerStatus, storeId: store.id };
  try {
    const created = await agentCreateProduct(agentContext, input, upload);
    await applyInvalidation(created.invalidation, { from: "dashboard", mode: "route" });
    // v2: why it stays a draft until the seller fills it in (D4). Price and stock are always set on this path.
    return { productId: created.productId, data: { title: title.ar, missing: input.images.length ? [] : ["photo"] } };
  } catch (error) {
    if (error instanceof AgentProductError && (error.code === "category_required" || error.code === "invalid_category")) {
      return { status: "failed" as const, data: { reason: error.code } };
    }
    throw error;
  }
}

/** Every product the build made: one per photo or typed product, and the products of each file batch (F-82f). */
export function builtProductIds(items: ReadonlyMap<string, BuildItem>): string[] {
  const ids = [...items.values()].flatMap((item) => {
    if (item.status !== "done") return [];
    const fromFile = Array.isArray(item.data.productIds) ? (item.data.productIds as unknown[]).filter((id): id is string => typeof id === "string") : [];
    return [...(item.productId ? [item.productId] : []), ...fromFile];
  });
  return [...new Set(ids)];
}

/**
 * Before the catalog split products belong to the account: a further store
 * shows only what this build made, not the seller's other products. After it
 * (F-87c/F-87e) the build's products already belong to its store
 * (`products.store_id`, set on create), so `store_products` is never written.
 */
async function applyCatalog(ctx: RunContext, build: BuildRow, items: ReadonlyMap<string, BuildItem>) {
  const store = await requireStoreOf(ctx, build);
  if (await isSwitchOn("stores_catalog_split")) return { data: { mode: "store" } };
  const others = (await listStores(ctx.sellerId)).filter((row) => row.id !== store.id);
  if (!others.length) return { data: { mode: "all" } };
  const productIds = builtProductIds(items);
  if (!productIds.length) return { data: { mode: "unchanged" } };
  const result = await setStoreCatalog(ctx.sellerId, store.id, { mode: "selected", productIds });
  if (!result.success) throw new Error(`catalog_${result.error}`);
  await refresh(store.subdomain);
  return { data: { mode: "selected" } };
}

// ── Shipping and policy ─────────────────────────────────────────────────────

async function saveZones(ctx: RunContext, storeId: string, zones: ProposedZone[]) {
  const unmatched = new Set<string>();
  let saved = 0;
  for (const zone of zones) {
    zone.unmatched.forEach((name) => unmatched.add(name));
    if (!zone.places.length || zone.price === null) {
      // Shown to the seller, never guessed: a price or a place the code couldn't read.
      if (zone.nameAr) unmatched.add(zone.nameAr);
      continue;
    }
    const result = await saveStoreShippingZone(ctx.sellerId, ctx.userId, storeId, null, {
      nameAr: zone.nameAr,
      nameEn: zone.nameEn || undefined,
      places: zone.places,
      price: zone.price,
      freeOver: zone.freeOver,
      deliveryDaysMin: zone.daysMin,
      deliveryDaysMax: zone.daysMax,
      codEnabled: true,
      enabled: true,
    });
    // A retry meets its own zones as overlaps, so this can't double them.
    if (result.success) saved++;
    else if (result.error !== "overlap") unmatched.add(zone.nameAr);
  }
  return { data: { saved, unmatched: [...unmatched].slice(0, 20) } };
}

async function applyShippingTemplate(ctx: RunContext, build: BuildRow) {
  const { shipping } = build.state;
  if (shipping?.mode !== "template") return {};
  const store = await requireStoreOf(ctx, build);
  const groups = templateZones(shipping.template, { price: shipping.price }).length;
  const result = await applyStoreShippingTemplate(ctx.sellerId, ctx.userId, store.id, {
    template: shipping.template,
    names: shippingZoneNames(shipping.template, groups),
    ...(shipping.price !== undefined && { price: shipping.price }),
    replace: false,
  });
  if (!result.success && result.error !== "zones_exist") throw new Error(`shipping_${result.error}`);
  return { data: { saved: result.success ? result.data.length : 0, kept: !result.success } };
}

export async function currentPolicy(sellerId: string) {
  const [row] = await db.select({ returnPolicy: sellers.returnPolicy, subdomain: sellers.subdomain }).from(sellers).where(eq(sellers.id, sellerId)).limit(1);
  return row ?? null;
}

const policyWanted = (build: BuildRow) => build.state.returns && build.state.returns.kind !== "skip";

async function applyPolicy(ctx: RunContext, build: BuildRow, output: { returnPolicy: string }) {
  const text = output.returnPolicy.replace(/<[^>]*>/g, " ").trim().slice(0, 1500);
  if (!text) return { status: "failed" as const };
  // The policy is account-wide: never replace what the seller already wrote.
  const updated = await db
    .update(sellers)
    .set({ returnPolicy: text, updatedAt: new Date().toISOString() })
    .where(and(eq(sellers.id, ctx.sellerId), or(isNull(sellers.returnPolicy), sql`btrim(${sellers.returnPolicy}) = ''`)))
    .returning({ subdomain: sellers.subdomain });
  if (updated[0]) await refresh(updated[0].subdomain);
  return { data: { kept: !updated.length } };
}

// ── The steps ───────────────────────────────────────────────────────────────

async function specFor(ctx: RunContext, build: BuildRow, key: string, items: ReadonlyMap<string, BuildItem>): Promise<StepSpec> {
  const { state } = build;
  if (key === "store") {
    return {
      feature: null,
      apply: async () => {
        const storeId = await ensureStore(ctx, build);
        await saveBuild(ctx.sellerId, build.id, { storeId, targetStoreId: storeId });
        build.storeId = storeId;
        build.targetStoreId = storeId;
        return { data: { storeId } };
      },
    };
  }
  if (key === "settings") return { feature: null, apply: () => applySettings(ctx, build) };
  if (state.flow === "v2") {
    const v2 = await (await import("./builder-items.server")).v2SpecFor(ctx, build, key, items);
    if (v2) return v2;
  }
  if (key === "template") return { feature: null, apply: () => applyTemplate(ctx, build) };
  if (key === "site_copy") {
    return {
      feature: BUILDER_FEATURES.siteCopy,
      generate: async () => {
        const generated = await generateSiteCopy(ctx, build);
        // No slots means no call was made: that isn't a run of the seller's allowance.
        if (!generated.noCall) {
          await saveBuild(ctx.sellerId, build.id, { siteCopyRuns: build.siteCopyRuns + 1 });
          build.siteCopyRuns += 1;
        }
        return { value: generated.value, cached: generated.cached };
      },
      apply: (generated) => applySiteCopy(ctx, build, generated as BuilderSiteCopyOutput),
    };
  }
  if (key.startsWith("product:")) {
    const product = state.products.find((p) => `product:${p.id}` === key);
    if (!product) return { feature: null, apply: async () => ({ status: "failed" }) };
    return {
      feature: BUILDER_FEATURES.product,
      generate: () => generateProduct(ctx, build, product),
      apply: (generated) => applyProduct(ctx, build, product, generated as ProductAutofillOutput),
    };
  }
  if (key === "catalog") return { feature: null, apply: () => applyCatalog(ctx, build, items) };
  if (key === "shipping") {
    if (state.shipping?.mode === "text") {
      const text = state.shipping.text;
      return {
        feature: BUILDER_FEATURES.shipping,
        generate: async () => {
          const { zones, cached } = await proposeZones(ctx.sellerId, text, { feature: BUILDER_FEATURES.shipping, refId: build.id });
          return { value: zones, cached };
        },
        apply: async (generated) => saveZones(ctx, (await requireStoreOf(ctx, build)).id, generated as ProposedZone[]),
      };
    }
    return { feature: null, apply: () => applyShippingTemplate(ctx, build) };
  }
  if (key === "policy") {
    const hasPolicy = Boolean((await currentPolicy(ctx.sellerId))?.returnPolicy?.trim());
    if (!policyWanted(build) || hasPolicy) return { feature: null, apply: async () => ({ data: { kept: hasPolicy } }) };
    return {
      feature: BUILDER_FEATURES.policies,
      generate: async () => {
        const store = await requireStoreOf(ctx, build);
        const { object, cached } = await generateStructured({
          feature: BUILDER_FEATURES.policies,
          sellerId: ctx.sellerId,
          refId: build.id,
          tier: "fast",
          schema: builderPolicyOutputSchema,
          system: POLICY_SYSTEM_RULES,
          content: [{ type: "text", text: policyRequestText(state.returns, storeLocale(store)) }],
          thinkingLevel: "minimal",
          maxOutputTokens: 1200,
          cacheMs: RESULT_CACHE_MS,
        });
        return { value: object, cached: Boolean(cached) };
      },
      apply: (generated) => applyPolicy(ctx, build, generated as { returnPolicy: string }),
    };
  }
  // The last read: mixed languages and contradictions. Only ever a note to the seller.
  return {
    feature: BUILDER_FEATURES.review,
    generate: async () => {
      const titles = [...items.values()].flatMap((item) => (typeof item.data.title === "string" ? [item.data.title] : []));
      const { object, cached } = await generateStructured({
        feature: BUILDER_FEATURES.review,
        sellerId: ctx.sellerId,
        refId: build.id,
        tier: "fast",
        schema: builderReviewOutputSchema,
        system: REVIEW_SYSTEM_RULES,
        content: [{ type: "text", text: reviewRequestText([state.brief?.taglineAr ?? "", state.brief?.taglineEn ?? "", ...titles]) }],
        thinkingLevel: "minimal",
        maxOutputTokens: 300,
        cacheMs: RESULT_CACHE_MS,
      });
      return { value: object, cached: Boolean(cached) };
    },
    apply: async (generated) => ({
      data: { notes: (generated as { notes: string[] }).notes.map((note) => note.replace(/[<>]/g, " ").trim().slice(0, 200)).filter(Boolean).slice(0, 5) },
    }),
  };
}

export type BuildStepResult = { build: BuildRow; progress: ReturnType<typeof buildProgress>; finished: boolean };

/** One step of the build, then the review once none are left. The caller holds the build's lease. */
export async function runBuildStep(ctx: RunContext, build: BuildRow): Promise<BuildStepResult> {
  const keys = buildItemKeys(build.state);
  const items = await loadItems(build.id);
  // Some steps read the database to decide what they are, so the spec is resolved before the run.
  const key = keys.find((k) => !isFinished(items.get(k)?.status));
  const spec = key ? await specFor(ctx, build, key, items) : null;

  const runner: BuildRunner = {
    keys,
    items,
    specFor: () => spec!,
    gate: (feature) => checkModelCall(build, feature),
    giveCreditBack: (reference) => giveCreditBack(ctx.sellerId, reference),
    saveItem: (item) => saveItem(build.id, item),
    onStop: async (reason) => {
      build.stopReason = reason;
      await saveBuild(ctx.sellerId, build.id, { stopReason: reason });
    },
  };

  try {
    const { finished, progress } = await runNextStep(runner);
    if (finished) {
      await saveBuild(ctx.sellerId, build.id, { status: "review" });
      return { build: { ...build, status: "review" }, progress, finished };
    }
    return { build, progress, finished };
  } catch (error) {
    if (!(error instanceof FatalBuildError)) throw error;
    await saveBuild(ctx.sellerId, build.id, { status: "review", stopReason: error.reason });
    return { build: { ...build, status: "review", stopReason: error.reason }, progress: buildProgress(keys, items), finished: true };
  }
}

// ── Review ──────────────────────────────────────────────────────────────────

/** The review screen, from what is really there now, so a fix shows up on reload. */
export async function loadReview(ctx: RunContext, build: BuildRow): Promise<BuilderReview> {
  if (build.state.flow === "v2") return (await import("./builder-items.server")).loadReviewV2(ctx, build);
  const items = await loadItems(build.id);
  const store = build.storeId ? await getStore(ctx.sellerId, build.storeId) : null;
  const productIds = [...items.values()].flatMap((item) => (item.status === "done" && item.productId ? [item.productId] : []));
  const rows = productIds.length
    ? await db.query.products.findMany({
        where: and(eq(products.sellerId, ctx.sellerId), inArray(products.id, productIds), isNull(products.deletedAt)),
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

  const pages = store ? await draftRows(store.id) : [];
  const invalidPages = pages.filter((row) => !validatePageContent(row.draftContent, { allowedSections: ALLOWED }).success).length;
  const shipping = store ? await getStoreShipping(ctx.sellerId, store.id) : null;
  const policy = await currentPolicy(ctx.sellerId);
  const allMode = await otherStoresShowingAll(ctx.sellerId, store?.id ?? null);

  return {
    flow: "v1",
    published: false,
    viewUrl: null,
    storeId: store?.id ?? null,
    storeName: store?.name ?? null,
    subdomain: store?.subdomain ?? null,
    stopReason: build.stopReason,
    issues: reviewIssues({
      storeId: store?.id ?? null,
      state: build.state,
      items,
      products: list.map(({ id, hasPhoto }) => ({ id, hasPhoto })),
      zoneCount: shipping?.zones.length ?? 0,
      returnPolicy: policy?.returnPolicy ?? null,
      invalidPages,
    }),
    notes: ((items.get("notes")?.data.notes as string[] | undefined) ?? []).filter((note) => typeof note === "string"),
    products: list,
    draftProducts: list.filter((row) => row.status === "draft" && row.hasPhoto).length,
    regenerationsLeft: Math.max(0, 1 + BUILDER_LIMITS.siteCopyRegenerations - build.siteCopyRuns),
    otherStoresShowAll: allMode,
    spentMicroUsd: await buildSpendMicroUsd(ctx.sellerId, build),
  };
}

/**
 * How many of the seller's other stores show all products, so also this
 * build's (review note). After the catalog split a store shows only its own
 * products, so none does.
 */
export async function otherStoresShowingAll(sellerId: string, storeId: string | null): Promise<number> {
  if (!storeId) return 0;
  if (await isSwitchOn("stores_catalog_split")) return 0;
  const others = (await listStores(sellerId)).filter((row) => row.id !== storeId);
  if (!others.length) return 0;
  const rows = await db
    .select({ id: stores.id })
    .from(stores)
    .where(and(eq(stores.sellerId, sellerId), inArray(stores.id, others.map((row) => row.id)), eq(stores.catalogMode, "all"), isNull(stores.deletedAt)));
  return rows.length;
}

export const draftRows = (storeId: string) =>
  db.select({ draftContent: storePages.draftContent, kind: storePages.kind }).from(storePages).where(eq(storePages.storeId, storeId));

/** Writes the site copy again. Only on the seller's request, within the limit. Overwrites the same text slots, nothing else. */
export async function regenerateSiteCopy(ctx: RunContext, build: BuildRow): Promise<"ok" | "limit" | "budget" | "noCredits" | "dailyLimit" | "failed"> {
  if (build.siteCopyRuns >= 1 + BUILDER_LIMITS.siteCopyRegenerations) return "limit";
  const gate = await checkModelCall(build, BUILDER_FEATURES.siteCopy);
  if (!gate.ok) return gate.reason;
  try {
    const { value, cached } = await generateSiteCopy(ctx, build);
    if (cached) await giveCreditBack(ctx.sellerId, gate.creditReference);
    await applySiteCopy(ctx, build, value);
    if (!cached) await saveBuild(ctx.sellerId, build.id, { siteCopyRuns: build.siteCopyRuns + 1 });
    return "ok";
  } catch (error) {
    await giveCreditBack(ctx.sellerId, gate.creditReference);
    console.error("[ai-builder] regenerate failed", error instanceof Error ? error.message : error);
    return "failed";
  }
}

/** The seller's own action: makes the build's products with photos live. Never runs by itself. */
export async function activateProducts(ctx: RunContext, build: BuildRow): Promise<number> {
  const store = await requireStoreOf(ctx, build);
  const items = await loadItems(build.id);
  const agentContext: AgentProductContext = { sellerId: ctx.sellerId, userId: ctx.userId, sellerStatus: ctx.sellerStatus, storeId: store.id };
  let live = 0;
  for (const productId of builtProductIds(items)) {
    try {
      const result = await agentSetProductStatus(agentContext, productId, "active");
      if (result.changed) await applyInvalidation(result.invalidation, { from: "dashboard", mode: "route" });
      if (result.status === "active") live++;
    } catch (error) {
      // A product with no photo stays draft (AI-D8): the review lists it.
      if (!(error instanceof AgentProductError)) throw error;
    }
  }
  return live;
}
