import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

/**
 * The AI Store Builder against a real database (ROADMAP.md F-54), with the model
 * mocked: no live AI call is ever made here. Throwaway sellers; deleting their
 * auth rows removes all they own (0134). Runs only when TEST_DATABASE_URL is
 * set; never point it at production.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
if (TEST_DATABASE_URL) {
  process.env.DATABASE_URL = TEST_DATABASE_URL;
  process.env.NEXT_PUBLIC_SUPABASE_URL ??= "https://example.supabase.co";
}

const copy = (title: string) => ({
  title,
  description: "A hand-poured soy wax candle.",
  bulletPoints: ["Soy wax"],
  metaTitle: title,
  metaDescription: "A hand-poured soy wax candle.",
  metaKeywords: ["candle"],
  contentBlocks: [{ kind: "paragraph", text: "Hand poured.", items: [] }],
});

const autofill = {
  localized: { ar: copy("شمعة فانيليا"), en: copy("Vanilla candle") },
  categoryHint: "candles",
  brandName: null,
  storeCategoryName: "شموع",
  price: { list: 9999, final: null, discountPercent: null, discountEndsAt: null },
  quantity: 777,
  condition: "new",
  variantTypes: [],
  reviews: [],
  productPhotos: [],
  missing: [],
  warnings: [],
  dimensions: { length: null, width: null, height: null, unit: null, weight: null, weightUnit: null },
  sku: null,
  showLiveViews: null,
};

vi.mock("@workspace/ai", async (original) => ({
  ...(await original<typeof import("@workspace/ai")>()),
  // Slots are filled with their own text, so the test sees that writing leaves the tree valid.
  generateStructured: vi.fn(async (options: { feature: string; content: { text: string }[] }) => {
    if (options.feature === "store_builder_site_copy") {
      const slots = JSON.parse(/SLOTS \(JSON\):\n(.*)\n/.exec(options.content[0]!.text)![1] ?? "[]") as { id: string }[];
      return { object: { values: slots.map((slot) => ({ id: slot.id, ar: "نص جديد", en: "New text" })) }, usage: {}, modelId: "mock" };
    }
    if (options.feature === "store_builder_policies") return { object: { returnPolicy: "استبدال خلال 14 يوم." }, usage: {}, modelId: "mock" };
    if (options.feature === "store_builder_shipping") {
      return { object: { zones: [{ places: ["Cairo"], price: 50, daysMin: 1, daysMax: 2, freeOver: null }, { places: ["Narnia"], price: 60, daysMin: null, daysMax: null, freeOver: null }] }, usage: {}, modelId: "mock" };
    }
    return { object: { notes: [] }, usage: {}, modelId: "mock" };
  }),
}));
vi.mock("@workspace/cache", async (original) => ({ ...(await original<typeof import("@workspace/cache")>()), applyInvalidation: vi.fn(async () => {}) }));
vi.mock("@workspace/lib/orders", () => ({ sendStoreCreatedEmail: vi.fn(async () => {}) }));
vi.mock("next-intl/server", () => ({ getTranslations: vi.fn(async () => (key: string) => key) }));
vi.mock("@/app/(main)/products/add/ai/ai-autofill.server", () => ({ autofillProduct: vi.fn(async () => ({ output: autofill, cached: false })) }));
vi.mock("@/actions/categories", async () => {
  const { db, categories } = await import("@workspace/db");
  const rows = await db.select({ id: categories.id, name: categories.name, nameAr: categories.nameAr, slug: categories.slug, level: categories.level }).from(categories).limit(50);
  return { getAllCategories: async () => ({ data: rows }) };
});

describe.skipIf(!TEST_DATABASE_URL)("AI Store Builder (integration)", { timeout: 300_000 }, () => {
  const sellerId = randomUUID();
  const otherSellerId = randomUUID();
  const ctx = { sellerId, userId: sellerId, sellerStatus: "approved" };

  const load = async () => ({
    ...(await import("@workspace/db")),
    ...(await import("./builder.store.server")),
    ...(await import("./builder-run.server")),
    ...(await import("./builder.dto")),
    ...(await import("./builder.lib")),
  });

  const makeSeller = async (id: string) => {
    const { db, sql } = await load();
    const email = `qa-${id.slice(0, 8)}@example.test`;
    await db.execute(sql`INSERT INTO auth.users (id, email, aud, role) VALUES (${id}, ${email}, 'authenticated', 'authenticated') ON CONFLICT DO NOTHING`);
    await db.execute(sql`INSERT INTO users (id, email, is_guest) VALUES (${id}, ${email}, false) ON CONFLICT DO NOTHING`);
    await db.execute(sql`
      INSERT INTO sellers (id, business_name, display_name, slug, business_type, legal_address, support_email, status)
      SELECT ${id}, 'QA builder', 'QA builder', ${`qa-${id.slice(0, 8)}`}, business_type, legal_address, ${email}, 'approved'
      FROM sellers LIMIT 1`);
  };

  beforeAll(async () => {
    await makeSeller(sellerId);
    await makeSeller(otherSellerId);
  }, 120_000);

  afterAll(async () => {
    const { db, sql } = await load();
    await db.execute(sql`DELETE FROM auth.users WHERE id = ANY(${`{${sellerId},${otherSellerId}}`}::uuid[])`);
  }, 120_000);

  it("gives one open conversation, and one free build per account and per phone", async () => {
    const { startBuild, claimFreeBuild, withNextQuestion, loadBuild, abandonBuild } = await load();
    const first = await startBuild(sellerId, withNextQuestion);
    if (!first.ok) throw new Error(first.error);
    const again = await startBuild(sellerId, withNextQuestion);
    expect(again.ok && again.build.id).toBe(first.build.id);

    const phone = `010${sellerId.replace(/\D/g, "").slice(0, 8).padEnd(8, "0")}`;
    const claims = await Promise.all([
      claimFreeBuild({ sellerId, buildId: first.build.id, phone, ip: `qa-${sellerId}` }),
      claimFreeBuild({ sellerId, buildId: first.build.id, phone, ip: `qa-${sellerId}` }),
    ]);
    expect(claims.sort()).toEqual(["already", "claimed"]);
    expect((await loadBuild(sellerId, first.build.id))?.free).toBe(true);

    // Another account with the same phone.
    const other = await startBuild(otherSellerId, withNextQuestion);
    if (!other.ok) throw new Error(other.error);
    await expect(claimFreeBuild({ sellerId: otherSellerId, buildId: other.build.id, phone, ip: null })).resolves.toBe("phoneUsed");
    // Another seller can't read this build.
    await expect(loadBuild(otherSellerId, first.build.id)).resolves.toBeNull();

    // Restarting before a build began keeps the free build.
    await abandonBuild(sellerId, first.build.id);
    const restarted = await startBuild(sellerId, withNextQuestion);
    if (!restarted.ok) throw new Error(restarted.error);
    expect(restarted.build.id).not.toBe(first.build.id);
    expect(restarted.build.free).toBe(true);
    expect(restarted.build.state.paid).toBe(false);
  });

  it("limits the free builds of one address", async () => {
    const { claimFreeBuild, BUILDER_LIMITS, db, storeBuildClaims } = await load();
    const ip = `qa-ip-${randomUUID()}`;
    const { hashIp } = await load();
    const ipHash = hashIp(ip);
    const ids = Array.from({ length: BUILDER_LIMITS.freeBuildsPerIpPerDay }, () => randomUUID());
    for (const id of ids) await makeSeller(id);
    await db.insert(storeBuildClaims).values(ids.map((id) => ({ sellerId: id, ipHash })));
    await expect(claimFreeBuild({ sellerId: otherSellerId, buildId: randomUUID(), phone: null, ip })).resolves.toBe("ipLimit");
    const { sql } = await load();
    await db.execute(sql`DELETE FROM auth.users WHERE id = ANY(${`{${ids.join(",")}}`}::uuid[])`);
  });

  it("builds a whole store once, as drafts, and never publishes", async () => {
    const { startBuild, withNextQuestion, runBuildStep, loadBuild, saveBuild, parseBuilderState, loadReview, db, products, stores, storePages, sellers, storeShippingZones, eq, aiUsageLogs, buildSpendMicroUsd } = await load();
    const started = await startBuild(sellerId, withNextQuestion);
    if (!started.ok) throw new Error(started.error);

    // A store for the seller to be built into, and a real template key.
    const { CODE_TEMPLATES } = await import("@workspace/store-sections/templates");
    const state = {
      ...parseBuilderState({}),
      name: "نور للشموع",
      about: "شموع يدوي",
      industryId: "handmade",
      contact: { phone: "01012345678", whatsapp: null, email: "qa@example.test" },
      social: [{ platform: "instagram", value: "https://instagram.com/noor" }],
      socialDone: true,
      brief: { nameEn: `qa builder ${sellerId.slice(0, 6)}`, taglineAr: "شموع", taglineEn: "Candles", audience: "الكل", tone: "دافي", styleWords: ["warm"] },
      briefConfirmed: true,
      logoDone: true,
      shortlist: [CODE_TEMPLATES[0]!.key],
      templateKey: CODE_TEMPLATES[0]!.key,
      products: [
        { id: "a1", name: "Vanilla", details: "", price: 150, compareAtPrice: null, stock: 20, unlimited: false, photos: [] },
        { id: "b2", name: "Lavender", details: "", price: 170, compareAtPrice: 200, stock: null, unlimited: true, photos: [] },
      ],
      productsDone: true,
      shipping: { mode: "text" as const, text: "Cairo 50, Narnia 60" },
      returns: { kind: "days" as const, days: 14 },
    };
    await saveBuild(sellerId, started.build.id, { state, status: "building" });

    for (let i = 0; i < 30; i++) {
      const build = await loadBuild(sellerId, started.build.id);
      if (!build) throw new Error("no build");
      const step = await runBuildStep(ctx, build);
      if (step.finished) break;
    }
    const done = await loadBuild(sellerId, started.build.id);
    expect(done?.status).toBe("review");
    expect(done?.storeId).toBeTruthy();

    const made = await db.select().from(products).where(eq(products.sellerId, sellerId));
    expect(made).toHaveLength(2);
    // Hidden, with the seller's figures and never the model's.
    expect(made.every((product) => product.status === "draft")).toBe(true);
    expect(made.map((product) => (product.price as { list?: number; final?: number }).final ?? (product.price as { list?: number }).list).sort()).toEqual(expect.arrayContaining([150]));
    expect(JSON.stringify(made.map((product) => product.price))).not.toContain("9999");
    expect(made.find((product) => product.sku?.endsWith("-B2"))?.trackStock).toBe(false);

    const [store] = await db.select().from(stores).where(eq(stores.id, done!.storeId!));
    expect(store).toMatchObject({ sellerId, name: "نور للشموع", siteStatus: "draft", publishedRevisionId: null, templateKey: CODE_TEMPLATES[0]!.key });
    const pages = await db.select().from(storePages).where(eq(storePages.storeId, store!.id));
    expect(JSON.stringify(pages.map((page) => page.draftContent))).toContain("نص جديد");

    const zones = await db.select().from(storeShippingZones).where(eq(storeShippingZones.storeId, store!.id));
    expect(zones).toHaveLength(1);
    const [seller] = await db.select({ returnPolicy: sellers.returnPolicy }).from(sellers).where(eq(sellers.id, sellerId));
    expect(seller?.returnPolicy).toContain("14");

    // The review reads what is really there.
    const review = await loadReview(ctx, done!);
    expect(review.products).toHaveLength(2);
    expect(review.issues.map((issue) => issue.code)).toEqual(expect.arrayContaining(["productsWithoutPhoto", "placesNotRecognised", "noLogo"]));
    expect(review.issues.map((issue) => issue.code)).not.toContain("pagesInvalid");
    expect(review.regenerationsLeft).toBe(2);
    expect((await db.select().from(products).where(eq(products.sellerId, sellerId))).length).toBe(2);

    // Spend comes from the usage rows.
    await db.insert(aiUsageLogs).values({ sellerId, feature: "store_builder_product", model: "mock", status: "ok", costMicroUsd: 1234 });
    await expect(buildSpendMicroUsd(sellerId, done!.createdAt)).resolves.toBeGreaterThanOrEqual(1234);
    await db.insert(aiUsageLogs).values({ sellerId, feature: "product_autofill", model: "mock", status: "ok", costMicroUsd: 1_000_000 });
    await expect(buildSpendMicroUsd(sellerId, done!.createdAt)).resolves.toBeLessThan(1_000_000);
  });
});
