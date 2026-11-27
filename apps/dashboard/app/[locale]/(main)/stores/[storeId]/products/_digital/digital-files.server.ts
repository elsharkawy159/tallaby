"use server";

import { randomUUID } from "node:crypto";
import { applyInvalidation, invalidateProduct, invalidateSellerProducts, mergeInvalidations, type ProductCacheSnapshot } from "@workspace/cache";
import {
  and,
  asc,
  count,
  db,
  digitalFiles,
  digitalOrders,
  digitalProducts,
  eq,
  inArray,
  isNull,
  productVariants,
  products,
  sql,
} from "@workspace/db";
import { syncCategoryProductCountForProductChange } from "@workspace/db/categories";
import { getServiceClient } from "@workspace/db/supabase/service";
import { parsePriceJson } from "@workspace/lib";
import { isAccessError } from "@/lib/auth/require-seller.server";
import { requireProductStore } from "@/lib/products/product-store.server";
import { createRateLimiter } from "@/lib/rate-limit.lib";
import {
  DIGITAL_FILES_BUCKET,
  DIGITAL_FILE_MAX_BYTES,
  buildDigitalFilePath,
  digitalFileProblem,
  isOwnDigitalFilePath,
} from "./digital-files.lib";
import {
  productDigitalInputSchema,
  type DigitalUploadUrlResult,
  type SaveProductDigitalResult,
} from "./digital-files.dto";

/**
 * Digital products in the seller form (ROADMAP.md F-108a).
 *
 * Files go from the browser straight to the private `digital-products` bucket
 * (0189: no storage policies) through an upload URL signed here for one exact
 * path in the session seller's store folder; the bytes never pass through a
 * server action. The save then checks every path again and reads each new
 * file's real size from storage.
 */

const limiter = createRateLimiter({ limit: 120, windowMs: 10 * 60_000 });
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function accessError(error: unknown): "readOnly" | "notFound" | null {
  if (!isAccessError(error)) return null;
  return error.code === "seller_blocked" || error.code === "store_read_only" ? "readOnly" : "notFound";
}

/**
 * Signs one upload into `<sellerId>/<storeId>/<uuid>-<safe name>` of the
 * `digital-products` bucket. The store must be the session seller's (a write
 * to it); the name's extension and the size are checked here, and the path is
 * built here, so a browser can never write into another seller's or store's
 * folder, or overwrite a file.
 */
export async function createDigitalFileUploadUrl(storeId: string, file: { name: string; size: number }): Promise<DigitalUploadUrlResult> {
  try {
    const { seller, store } = await requireProductStore(storeId);
    const name = String(file?.name ?? "");
    const size = Number(file?.size);
    if (name.length > 255 || digitalFileProblem({ name, size })) return { success: false, error: "invalidFile" };
    if (!limiter.check(`digital-upload:${seller.sellerId}`)) return { success: false, error: "notAllowed" };

    const path = buildDigitalFilePath(seller.sellerId, store.id, randomUUID(), name);
    if (!path) return { success: false, error: "invalidFile" };
    const { data, error } = await getServiceClient().storage.from(DIGITAL_FILES_BUCKET).createSignedUploadUrl(path);
    if (error || !data) {
      console.error("[digital-files] sign failed", error?.message);
      return { success: false, error: "generic" };
    }
    return { success: true, token: data.token, path };
  } catch (error) {
    if (accessError(error)) return { success: false, error: "notAllowed" };
    console.error("[digital-files] sign failed", (error as Error)?.message);
    return { success: false, error: "generic" };
  }
}

async function productSnapshot(productId: string): Promise<ProductCacheSnapshot | null> {
  const row = await db.query.products.findFirst({
    where: eq(products.id, productId),
    columns: {
      id: true,
      sellerId: true,
      storeId: true,
      categoryId: true,
      brandId: true,
      status: true,
      isFeatured: true,
      isTrending: true,
      isSeasonal: true,
      isMostSelling: true,
      isPlatformChoice: true,
      sponsored: true,
      price: true,
    },
    with: { productTranslations: { columns: { locale: true, slug: true } } },
  });
  if (!row) return null;
  return {
    id: row.id,
    sellerId: row.sellerId,
    storeId: row.storeId,
    categoryId: row.categoryId,
    brandId: row.brandId,
    slugs: row.productTranslations.map((t) => ({ locale: t.locale, slug: t.slug })),
    status: row.status,
    isFeatured: row.isFeatured ?? false,
    isTrending: row.isTrending ?? false,
    isSeasonal: row.isSeasonal ?? false,
    isMostSelling: row.isMostSelling ?? false,
    isPlatformChoice: row.isPlatformChoice ?? false,
    sponsored: row.sponsored ?? false,
    priceKey: JSON.stringify(row.price ?? null),
  };
}

/** The product price as numeric(10,2) text, computed in piastres. */
function priceText(price: unknown): string {
  const parsed = parsePriceJson(price);
  const value = parsed.final > 0 ? parsed.final : parsed.base > 0 ? parsed.base : (parsed.list ?? 0);
  const piastres = Math.max(0, Math.round(Number(value) * 100));
  return `${Math.floor(piastres / 100)}.${String(piastres % 100).padStart(2, "0")}`;
}

/** Deletes storage objects no digital row points to any more. Best effort: a failure only leaves an orphan file. */
async function removeUnusedObjects(paths: string[]) {
  const unique = [...new Set(paths.filter(Boolean))];
  if (!unique.length) return;
  try {
    const stillUsed = new Set<string>();
    for (const row of await db.select({ path: digitalFiles.fileUrl }).from(digitalFiles).where(inArray(digitalFiles.fileUrl, unique))) stillUsed.add(row.path);
    for (const row of await db.select({ path: digitalProducts.fileUrl }).from(digitalProducts).where(inArray(digitalProducts.fileUrl, unique)))
      if (row.path) stillUsed.add(row.path);
    const unused = unique.filter((path) => !stillUsed.has(path));
    if (!unused.length) return;
    const { error } = await getServiceClient().storage.from(DIGITAL_FILES_BUCKET).remove(unused);
    if (error) console.error("[digital-files] remove failed", error.message);
  } catch (error) {
    console.error("[digital-files] remove failed", (error as Error)?.message);
  }
}

type Outcome =
  | { ok: true; removed: string[]; unpublished: boolean; previousStatus: string | null; nextStatus: string | null; categoryId: string }
  | { ok: false; error: "notFound" | "bundle" | "hasVariants" };

/**
 * Saves the product form's type and files (F-108a), after createProduct /
 * updateProduct and before saveProductSocialProof. The store must be the
 * session seller's and the product in it (F-87c `inStore`), else `notFound`.
 *
 * Digital: every path must be in `<sellerId>/<storeId>/` and exist in the
 * bucket; the product's stock is never counted and pre-order is switched off;
 * a bundle or a product with options is refused. The one `digital_products`
 * row (price and status mirror the product) is created or updated and its
 * `digital_files` replaced. A live product saved with no files goes back to
 * draft (a digital product is never live without a file).
 *
 * Physical: the digital rows and their files are deleted, unless a buyer
 * already has a download for them (`digital_orders` cascade from
 * `digital_products`), in which case they are kept so those links keep working.
 *
 * Storage objects of removed files are deleted after the commit, best effort.
 */
export async function saveProductDigital(storeId: string, productId: string, input: unknown): Promise<SaveProductDigitalResult> {
  try {
    const { seller, store, inStore } = await requireProductStore(storeId);
    const parsed = productDigitalInputSchema.safeParse(input);
    if (!parsed.success || typeof productId !== "string" || !UUID_RE.test(productId)) return { success: false, error: "invalidInput" };
    const sellerId = seller.sellerId;
    const { productType } = parsed.data;
    const files = productType === "digital" ? parsed.data.files : [];
    if (files.some((file) => !isOwnDigitalFilePath(sellerId, store.id, file.path))) return { success: false, error: "badFile" };

    // Files this product already has keep their stored size and type; new ones are read from storage.
    const saved = new Map<string, { size: number; type: string }>();
    if (files.length) {
      const rows = await db
        .select({ path: digitalFiles.fileUrl, size: digitalFiles.fileSize, type: digitalFiles.fileType })
        .from(digitalFiles)
        .innerJoin(digitalProducts, eq(digitalProducts.id, digitalFiles.digitalProductId))
        .where(and(eq(digitalProducts.productId, productId), eq(digitalProducts.sellerId, sellerId)));
      for (const row of rows) saved.set(row.path, { size: row.size, type: row.type });
    }
    const bucket = getServiceClient().storage.from(DIGITAL_FILES_BUCKET);
    const checked = await Promise.all(
      files.map(async (file) => {
        const known = saved.get(file.path);
        if (known) return { ...file, ...known };
        const { data, error } = await bucket.info(file.path);
        if (error || !data) return null;
        const size = Number(data.size ?? (data.metadata as { size?: unknown } | undefined)?.size ?? 0);
        const type = String(data.contentType ?? (data.metadata as { mimetype?: unknown } | undefined)?.mimetype ?? "") || "application/octet-stream";
        return { ...file, size, type };
      }),
    );
    if (checked.some((file) => file === null)) return { success: false, error: "missingFile" };
    const list = checked as { path: string; name: string; size: number; type: string }[];
    if (list.some((file) => file.size <= 0 || file.size > DIGITAL_FILE_MAX_BYTES)) return { success: false, error: "badFile" };

    const before = await productSnapshot(productId);
    const now = new Date().toISOString();

    const outcome: Outcome = await db.transaction(async (tx) => {
      const [product] = await tx
        .select({
          id: products.id,
          status: products.status,
          price: products.price,
          categoryId: products.categoryId,
          // Read through to_jsonb so this works before and after 0188 adds products.is_bundle.
          isBundle: sql<boolean>`coalesce((to_jsonb(${products}) ->> 'is_bundle')::boolean, false)`,
        })
        .from(products)
        .where(and(eq(products.id, productId), eq(products.sellerId, sellerId), inStore, isNull(products.deletedAt)))
        .for("update")
        .limit(1);
      if (!product) return { ok: false, error: "notFound" };

      const owners = await tx
        .select({ id: digitalProducts.id, fileUrl: digitalProducts.fileUrl })
        .from(digitalProducts)
        .where(and(eq(digitalProducts.productId, productId), eq(digitalProducts.sellerId, sellerId)))
        .orderBy(asc(digitalProducts.createdAt));
      const ownerIds = owners.map((row) => row.id);

      if (productType === "physical") {
        await tx.update(products).set({ productType: "physical", updatedAt: now }).where(and(eq(products.id, productId), eq(products.productType, "digital")));
        if (!ownerIds.length) return { ok: true, removed: [], unpublished: false, previousStatus: product.status, nextStatus: product.status, categoryId: product.categoryId };
        const [sold] = await tx.select({ n: count() }).from(digitalOrders).where(inArray(digitalOrders.digitalProductId, ownerIds));
        if ((sold?.n ?? 0) > 0) return { ok: true, removed: [], unpublished: false, previousStatus: product.status, nextStatus: product.status, categoryId: product.categoryId };
        const fileRows = await tx.select({ path: digitalFiles.fileUrl }).from(digitalFiles).where(inArray(digitalFiles.digitalProductId, ownerIds));
        // digital_files cascade with their digital_products row.
        await tx.delete(digitalProducts).where(inArray(digitalProducts.id, ownerIds));
        return {
          ok: true,
          removed: [...fileRows.map((row) => row.path), ...owners.flatMap((row) => (row.fileUrl ? [row.fileUrl] : []))],
          unpublished: false,
          previousStatus: product.status,
          nextStatus: product.status,
          categoryId: product.categoryId,
        };
      }

      if (product.isBundle) return { ok: false, error: "bundle" };
      const [options] = await tx.select({ n: count() }).from(productVariants).where(eq(productVariants.productId, productId));
      if ((options?.n ?? 0) > 0) return { ok: false, error: "hasVariants" };

      const unpublished = list.length === 0 && product.status === "active";
      const nextStatus = unpublished ? "draft" : product.status;
      await tx
        .update(products)
        .set({ productType: "digital", trackStock: false, preorderEnabled: false, preorderShipsAt: null, ...(unpublished && { status: "draft" as const }), updatedAt: now })
        .where(eq(products.id, productId));

      const mirror = { price: priceText(product.price), status: nextStatus ?? "draft", updatedAt: now };
      let ownerId = ownerIds[0];
      if (ownerId) {
        await tx.update(digitalProducts).set(mirror).where(eq(digitalProducts.id, ownerId));
      } else {
        const [created] = await tx
          .insert(digitalProducts)
          .values({ productId, sellerId, digitalType: "digital_download", deliveryMethod: "automatic", ...mirror })
          .returning({ id: digitalProducts.id });
        ownerId = created!.id;
      }

      const current = await tx
        .select({ id: digitalFiles.id, path: digitalFiles.fileUrl })
        .from(digitalFiles)
        .where(eq(digitalFiles.digitalProductId, ownerId));
      const wanted = new Map(list.map((file, index) => [file.path, { ...file, index }]));
      const gone = current.filter((row) => !wanted.has(row.path));
      if (gone.length) await tx.delete(digitalFiles).where(inArray(digitalFiles.id, gone.map((row) => row.id)));
      const kept = new Map(current.filter((row) => wanted.has(row.path)).map((row) => [row.path, row.id]));
      for (const file of wanted.values()) {
        const id = kept.get(file.path);
        if (id) {
          await tx.update(digitalFiles).set({ fileName: file.name, sortOrder: file.index }).where(eq(digitalFiles.id, id));
        } else {
          await tx.insert(digitalFiles).values({
            digitalProductId: ownerId,
            fileName: file.name,
            fileUrl: file.path,
            fileSize: file.size,
            fileType: file.type,
            sortOrder: file.index,
          });
        }
      }
      return { ok: true, removed: gone.map((row) => row.path), unpublished, previousStatus: product.status, nextStatus, categoryId: product.categoryId };
    });
    if (!outcome.ok) return { success: false, error: outcome.error };

    await removeUnusedObjects(outcome.removed);
    if (outcome.unpublished) {
      await syncCategoryProductCountForProductChange({
        categoryId: outcome.categoryId,
        previousStatus: outcome.previousStatus,
        nextStatus: outcome.nextStatus,
      });
    }
    const after = await productSnapshot(productId);
    await applyInvalidation(mergeInvalidations(invalidateProduct(before, after), invalidateSellerProducts(sellerId)), { from: "dashboard", mode: "action" });
    return { success: true, unpublished: outcome.unpublished };
  } catch (error) {
    const access = accessError(error);
    if (access) return { success: false, error: access };
    console.error("[digital-files] save failed", error);
    return { success: false, error: "generic" };
  }
}
