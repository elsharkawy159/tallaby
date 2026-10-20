import { notFound } from "next/navigation";
import { isUuid } from "@workspace/lib/admin";
import { getPlatformBlogPostForAdmin } from "@workspace/lib/admin/server";
import { getCurrentAdminUser } from "@/lib/auth/admin-auth";
import { PostEditor } from "../post-editor.client";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

/** Edit one tallaby.com blog post. */
export default async function EditBlogPostPage({ params }: PageProps) {
  const { id } = await params;
  await getCurrentAdminUser();
  if (!isUuid(id)) notFound();
  const post = await getPlatformBlogPostForAdmin(id);
  if (!post) notFound();
  return <PostEditor post={post} siteUrl={process.env.ECOMMERCE_URL ?? null} />;
}
