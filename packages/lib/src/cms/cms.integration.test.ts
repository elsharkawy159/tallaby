import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as s from "@workspace/db/schema";
import { createIsolationWorld, type IsolationWorld } from "../stores/isolation.fixtures";
import {
  createCmsCollection,
  deleteCmsCollection,
  deleteCmsItem,
  ensureBlogCollection,
  getCmsItem,
  getPublicCmsItem,
  listBlogPosts,
  listCmsCollections,
  listCmsItemRevisions,
  listPublicBlogTags,
  listPublicCmsItems,
  listPublicCmsUrls,
  resolvePublicContent,
  restoreCmsItemRevision,
  saveBlogPost,
  saveCmsItem,
  updateCmsCollection,
} from "./cms.server";

/**
 * Blog + CMS storage (PLAN.md P4-16, P4-11) and the §17 isolation rules for
 * CMS ids: drafts and scheduled posts are never public, A cannot read or edit
 * B's posts, and one store's slug never resolves on another store's host.
 * Skipped without TEST_DATABASE_URL.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

const post = (slug: string, extra: Record<string, unknown> = {}) => ({
  slug,
  status: "draft",
  data: { title: `Post ${slug}`, excerpt: "Short", body: "<p>Hello world</p>", tags: ["news"] },
  seo: { title: "", description: "", ogImage: "", noindex: false },
  ...extra,
});

describe.skipIf(!TEST_DATABASE_URL)("cms and blog (integration)", () => {
  const client = postgres(TEST_DATABASE_URL ?? "postgres://unused", { prepare: false, max: 4 });
  const db = drizzle(client, { schema: s });
  let w: IsolationWorld;

  beforeAll(async () => {
    w = await createIsolationWorld(db);
  }, 60_000);

  afterAll(async () => {
    if (w) await w.cleanup();
    await client.end();
  });

  it("creates the store's system blog once, for its owner only", async () => {
    const first = await ensureBlogCollection(w.a.sellerId, w.a.a1, db);
    const again = await ensureBlogCollection(w.a.sellerId, w.a.a1, db);
    expect(first.success && again.success).toBe(true);
    if (first.success && again.success) {
      expect(again.data.id).toBe(first.data.id);
      expect(first.data).toMatchObject({ kind: "blog", slug: "blog", isSystem: true });
      expect(first.data.fields.map((f) => f.key)).toEqual(["title", "excerpt", "coverImage", "body", "tags", "authorName"]);
    }
    expect(await ensureBlogCollection(w.b.sellerId, w.a.a1, db)).toEqual({ success: false, error: "not_found" });
    expect(await listCmsCollections(w.b.sellerId, w.a.a1, db)).toBeNull();
  });

  it("drafts and scheduled posts are never public; published ones are", async () => {
    const draft = await saveBlogPost(w.a.sellerId, w.a.a1, null, post("draft-one"), w.a.sellerId, db);
    const future = new Date(Date.now() + 86_400_000).toISOString();
    const scheduled = await saveBlogPost(w.a.sellerId, w.a.a1, null, post("later", { status: "published", publishedAt: future }), w.a.sellerId, db);
    const live = await saveBlogPost(w.a.sellerId, w.a.a1, null, post("live", { status: "published" }), w.a.sellerId, db);
    expect(draft.success && scheduled.success && live.success).toBe(true);
    if (!(draft.success && scheduled.success && live.success)) return;
    expect([draft.data.state, scheduled.data.state, live.data.state]).toEqual(["draft", "scheduled", "published"]);

    const pub = await listPublicCmsItems(w.a.a1, "blog", {}, db);
    expect(pub.items.map((i) => i.slug)).toEqual(["live"]);
    expect(pub.total).toBe(1);
    expect(await getPublicCmsItem(w.a.a1, "blog", "draft-one", db)).toBeNull();
    expect(await getPublicCmsItem(w.a.a1, "blog", "later", db)).toBeNull();
    expect((await getPublicCmsItem(w.a.a1, "blog", "live", db))?.data.title).toBe("Post live");

    const urls = await listPublicCmsUrls(w.a.a1, db);
    expect(urls.map((u) => u.path)).toEqual(["/blog", "/blog/live"]);
    expect(await listPublicBlogTags(w.a.a1, db)).toEqual([{ tag: "news", count: 1 }]);

    const content = await resolvePublicContent(w.a.a1, { s1: { collection: "blog", limit: 5 }, s2: { collection: "nope", limit: 3 } }, db);
    expect(content.items.s1?.map((i) => i.slug)).toEqual(["live"]);
    expect(content.items.s2).toEqual([]);

    // The dashboard sees all three, filterable by state.
    const all = await listBlogPosts(w.a.sellerId, w.a.a1, {}, db);
    expect(all?.total).toBe(3);
    expect((await listBlogPosts(w.a.sellerId, w.a.a1, { state: "scheduled" }, db))?.items.map((i) => i.slug)).toEqual(["later"]);
    expect((await listBlogPosts(w.a.sellerId, w.a.a1, { state: "draft" }, db))?.items.map((i) => i.slug)).toEqual(["draft-one"]);

    // Unpublishing takes it off the store at once.
    const unpublished = await saveBlogPost(w.a.sellerId, w.a.a1, live.data.id, post("live"), w.a.sellerId, db);
    expect(unpublished.success && unpublished.data.state).toBe("draft");
    expect(await getPublicCmsItem(w.a.a1, "blog", "live", db)).toBeNull();
  });

  it("sanitizes the body on save, derives reading time, and keeps revisions", async () => {
    const saved = await saveBlogPost(
      w.a.sellerId,
      w.a.a1,
      null,
      post("safe", { data: { title: "Safe", body: '<p onclick="x()">Hi</p><script>alert(1)</script><a href="javascript:alert(1)">l</a><img src="data:x" onerror="y">' } }),
      w.a.sellerId,
      db,
    );
    expect(saved.success).toBe(true);
    if (!saved.success) return;
    const found = await getCmsItem(w.a.sellerId, w.a.a1, saved.data.id, db);
    expect(found?.item.data.body).toBe("<p>Hi</p><a>l</a><img />");
    expect(found?.item.data.readingMinutes).toBe(1);

    const edited = await saveBlogPost(w.a.sellerId, w.a.a1, saved.data.id, post("safe", { data: { title: "Safe v2" } }), w.a.sellerId, db);
    expect(edited.success).toBe(true);
    const revisions = await listCmsItemRevisions(w.a.sellerId, w.a.a1, saved.data.id, db);
    expect(revisions?.map((r) => r.title)).toEqual(["Safe v2", "Safe"]);
    const restored = await restoreCmsItemRevision(w.a.sellerId, w.a.a1, saved.data.id, revisions![1]!.id, w.a.sellerId, db);
    expect(restored.success).toBe(true);
    expect((await getCmsItem(w.a.sellerId, w.a.a1, saved.data.id, db))?.item.data.title).toBe("Safe");
    expect(await listCmsItemRevisions(w.b.sellerId, w.b.b1, saved.data.id, db)).toBeNull();
  });

  it("rejects a duplicate slug in the same collection and invalid data", async () => {
    expect(await saveBlogPost(w.a.sellerId, w.a.a1, null, post("safe"), w.a.sellerId, db)).toEqual({ success: false, error: "slug_taken" });
    const bad = await saveBlogPost(w.a.sellerId, w.a.a1, null, post("bad", { data: { title: "" } }), w.a.sellerId, db);
    expect(bad).toMatchObject({ success: false, error: "invalid_data", issues: [{ key: "title", code: "required" }] });
  });

  it("isolation: A cannot read or edit B's posts, and slugs never cross hosts", async () => {
    const bPost = await saveBlogPost(w.b.sellerId, w.b.b1, null, post("b-only", { status: "published" }), w.b.sellerId, db);
    expect(bPost.success).toBe(true);
    if (!bPost.success) return;

    // A cannot load, edit, delete or restore B's post, with A's or B's store id.
    expect(await getCmsItem(w.a.sellerId, w.b.b1, bPost.data.id, db)).toBeNull();
    expect(await getCmsItem(w.a.sellerId, w.a.a1, bPost.data.id, db)).toBeNull();
    expect(await saveBlogPost(w.a.sellerId, w.b.b1, bPost.data.id, post("hacked"), w.a.sellerId, db)).toEqual({ success: false, error: "not_found" });
    expect(await saveBlogPost(w.a.sellerId, w.a.a1, bPost.data.id, post("hacked"), w.a.sellerId, db)).toEqual({ success: false, error: "not_found" });
    expect(await deleteCmsItem(w.a.sellerId, w.a.a1, bPost.data.id, db)).toEqual({ success: false, error: "not_found" });
    expect(await deleteCmsItem(w.a.sellerId, w.b.b1, bPost.data.id, db)).toEqual({ success: false, error: "not_found" });
    const bBlog = await ensureBlogCollection(w.b.sellerId, w.b.b1, db);
    if (!bBlog.success) throw new Error("no blog");
    expect(await saveCmsItem(w.a.sellerId, w.a.a1, bBlog.data.id, null, post("into-b"), w.a.sellerId, db)).toEqual({ success: false, error: "not_found" });
    const [still] = await db.select({ slug: s.cmsItems.slug }).from(s.cmsItems).where(eq(s.cmsItems.id, bPost.data.id));
    expect(still?.slug).toBe("b-only");

    // B's slug 404s on A's host; A1's posts do not show on A2.
    expect(await getPublicCmsItem(w.a.a1, "blog", "b-only", db)).toBeNull();
    expect(await getPublicCmsItem(w.b.b1, "blog", "b-only", db)).not.toBeNull();
    expect((await listPublicCmsItems(w.a.a2, "blog", {}, db)).items).toEqual([]);
    expect((await listPublicCmsItems(w.b.b1, "blog", {}, db)).items.map((i) => i.slug)).toEqual(["b-only"]);

    // Cross-store: A1's post cannot be edited through A2.
    const a1Post = await saveBlogPost(w.a.sellerId, w.a.a1, null, post("a1-post"), w.a.sellerId, db);
    if (!a1Post.success) throw new Error("save failed");
    expect(await saveBlogPost(w.a.sellerId, w.a.a2, a1Post.data.id, post("moved"), w.a.sellerId, db)).toEqual({ success: false, error: "not_found" });
    expect(await getCmsItem(w.a.sellerId, w.a.a2, a1Post.data.id, db)).toBeNull();
  });

  it("generic collections: reserved slugs, typed data, the blog is fixed", async () => {
    const fields = [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "summary", label: "Summary", type: "textarea" },
      { key: "details", label: "Details", type: "richtext" },
    ];
    expect(await createCmsCollection(w.a.sellerId, w.a.a1, { name: "Blog 2", slug: "blog", fields }, db)).toEqual({ success: false, error: "reserved_slug" });
    expect(await createCmsCollection(w.a.sellerId, w.a.a1, { name: "Cart", slug: "cart", fields }, db)).toEqual({ success: false, error: "reserved_slug" });
    expect(await createCmsCollection(w.b.sellerId, w.a.a1, { name: "Look", slug: "lookbook", fields }, db)).toEqual({ success: false, error: "not_found" });
    const created = await createCmsCollection(w.a.sellerId, w.a.a1, { name: "Lookbook", slug: "lookbook", fields }, db);
    expect(created.success).toBe(true);
    if (!created.success) return;
    expect(await createCmsCollection(w.a.sellerId, w.a.a1, { name: "Again", slug: "lookbook", fields }, db)).toEqual({ success: false, error: "slug_taken" });

    const item = await saveCmsItem(
      w.a.sellerId,
      w.a.a1,
      created.data.id,
      null,
      { slug: "summer", status: "published", data: { name: "Summer", summary: "Light", details: "<p>x</p><script>y</script>", extra: 1 } },
      w.a.sellerId,
      db,
    );
    expect(item.success).toBe(true);
    const pub = await getPublicCmsItem(w.a.a1, "lookbook", "summer", db);
    expect(pub?.data).toEqual({ name: "Summer", summary: "Light", details: "<p>x</p>" });
    expect((await listPublicCmsUrls(w.a.a1, db)).map((u) => u.path)).toContain("/lookbook/summer");

    const collections = await listCmsCollections(w.a.sellerId, w.a.a1, db);
    expect(collections?.map((c) => c.slug)).toEqual(["blog", "lookbook"]);
    const blog = collections!.find((c) => c.slug === "blog")!;
    expect(await updateCmsCollection(w.a.sellerId, w.a.a1, blog.id, { name: "News", slug: "news", fields }, db)).toEqual({ success: false, error: "system_collection" });
    expect(await deleteCmsCollection(w.a.sellerId, w.a.a1, blog.id, db)).toEqual({ success: false, error: "system_collection" });
    expect(await deleteCmsCollection(w.b.sellerId, w.b.b1, created.data.id, db)).toEqual({ success: false, error: "not_found" });

    // Renaming the slug moves its public URLs; deleting removes the items.
    expect((await updateCmsCollection(w.a.sellerId, w.a.a1, created.data.id, { name: "Looks", slug: "looks", fields }, db)).success).toBe(true);
    expect(await getPublicCmsItem(w.a.a1, "lookbook", "summer", db)).toBeNull();
    expect(await getPublicCmsItem(w.a.a1, "looks", "summer", db)).not.toBeNull();
    expect((await deleteCmsCollection(w.a.sellerId, w.a.a1, created.data.id, db)).success).toBe(true);
    expect(await getPublicCmsItem(w.a.a1, "looks", "summer", db)).toBeNull();
  });

  it("an archived store's content is not public and cannot be written", async () => {
    const saved = await saveBlogPost(w.a.sellerId, w.a.a2, null, post("a2-live", { status: "published" }), w.a.sellerId, db);
    expect(saved.success).toBe(true);
    await db.update(s.stores).set({ status: "archived" }).where(eq(s.stores.id, w.a.a2));
    try {
      expect(await getPublicCmsItem(w.a.a2, "blog", "a2-live", db)).toBeNull();
      expect(await listPublicCmsUrls(w.a.a2, db)).toEqual([]);
      expect(await saveBlogPost(w.a.sellerId, w.a.a2, null, post("x"), w.a.sellerId, db)).toEqual({ success: false, error: "store_read_only" });
    } finally {
      await db.update(s.stores).set({ status: "active" }).where(eq(s.stores.id, w.a.a2));
    }
  });
});
