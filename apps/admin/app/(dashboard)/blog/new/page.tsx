import { getCurrentAdminUser } from "@/lib/auth/admin-auth";
import { PostEditor } from "../post-editor.client";

export const dynamic = "force-dynamic";

/** A new tallaby.com blog post. */
export default async function NewBlogPostPage() {
  await getCurrentAdminUser();
  return <PostEditor siteUrl={process.env.ECOMMERCE_URL ?? null} />;
}
