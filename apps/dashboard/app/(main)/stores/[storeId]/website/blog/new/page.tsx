import { storeUrl } from "@workspace/lib/storefront";
import { loadStorePage } from "@/lib/stores/store-page.server";
import { EMPTY_POST } from "../blog.lib";
import { PostEditor } from "../post-editor.client";

export default async function NewBlogPostPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const store = await loadStorePage(storeId);
  return (
    <PostEditor
      storeId={store.id}
      postId={null}
      initial={EMPTY_POST}
      publishedAt={null}
      liveBaseUrl={storeUrl(store.subdomain)}
      defaultAuthor={store.name}
      readOnly={store.status !== "active"}
    />
  );
}
