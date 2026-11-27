import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { listBlogCategories } from "@workspace/lib/cms/server";
import { loadWebsiteStorePage } from "@/lib/stores/website-page.server";
import { BlogCategories } from "./blog-categories.client";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

/**
 * Website › Blog › Categories (owner, 2026-11-27): the store's blog
 * categories, in order, with their post counts. Seller data: never cached.
 * A foreign store (or a seller outside the store-builder rollout) is a 404.
 */
export default async function BlogCategoriesPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const store = await loadWebsiteStorePage(storeId);
  const [t, categories] = await Promise.all([getTranslations("websiteBlog.categories"), listBlogCategories(store.sellerId, store.id)]);
  if (!categories) notFound();
  return <BlogCategories storeId={store.id} initial={categories} readOnly={store.status !== "active"} title={t("title")} description={t("subtitle")} />;
}
