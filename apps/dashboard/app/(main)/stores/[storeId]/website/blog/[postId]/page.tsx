import { notFound } from "next/navigation";
import { getCmsItem } from "@workspace/lib/cms/server";
import { storeUrl } from "@workspace/lib/storefront";
import { loadStorePage } from "@/lib/stores/store-page.server";
import { toPostForm } from "../blog.lib";
import { PostEditor } from "../post-editor.client";

/** Edit one post. A post of another store (or a non-blog item) is a 404. */
export default async function EditBlogPostPage({ params }: { params: Promise<{ storeId: string; postId: string }> }) {
  const { storeId, postId } = await params;
  const store = await loadStorePage(storeId);
  const found = await getCmsItem(store.sellerId, store.id, postId);
  if (!found || found.collection.kind !== "blog") notFound();

  return (
    <PostEditor
      key={found.item.updatedAt}
      storeId={store.id}
      postId={found.item.id}
      initial={toPostForm(found.item)}
      publishedAt={found.item.publishedAt}
      state={found.item.state}
      liveBaseUrl={storeUrl(store.subdomain)}
      defaultAuthor={store.name}
      readOnly={store.status !== "active"}
    />
  );
}
