import { storeUrl } from "@workspace/lib/storefront";
import { loadWebsiteStorePage } from "@/lib/stores/website-page.server";
import { EMPTY_POST } from "../blog.lib";
import { PostEditor } from "../post-editor.client";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function NewBlogPostPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const store = await loadWebsiteStorePage(storeId);
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
