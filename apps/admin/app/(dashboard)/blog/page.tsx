import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table";
import { logServerError } from "@workspace/db/log";
import { listPlatformBlogPostsForAdmin, type AdminPlatformBlogRow } from "@workspace/lib/admin/server";
import { PLATFORM_BLOG_BUCKET, platformPostLocales, platformPostState } from "@workspace/lib/platform-blog";
import { getPublicUrl } from "@workspace/ui/lib/utils";
import { getCurrentAdminUser } from "@/lib/auth/admin-auth";
import { ReasonActionButton } from "../_components/dialogs/reason-action.client";
import { deleteBlogPostAction } from "./blog.server";
import { RemoteImage } from "@/components/media/remote-image";

export const dynamic = "force-dynamic";

const STATE_BADGE = {
  draft: { label: "Draft", variant: "secondary" },
  scheduled: { label: "Scheduled", variant: "outline" },
  published: { label: "Published", variant: "default" },
} as const;

const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Cairo" });

/**
 * The tallaby.com blog (0073): platform posts shown on /blog of the marketing
 * site, separate from store blogs. Not cached: admins need their drafts at once.
 */
export default async function BlogPostsPage() {
  await getCurrentAdminUser();
  let rows: AdminPlatformBlogRow[];
  try {
    rows = await listPlatformBlogPostsForAdmin();
  } catch (error) {
    logServerError("admin", "blog list failed", {}, error);
    return <p className="text-sm text-destructive">Posts could not be loaded. Is migration 0073 applied?</p>;
  }
  // The marketing site (apps/ecommerce); NEXT_PUBLIC_SITE_URL here is the admin app itself.
  const siteUrl = process.env.ECOMMERCE_URL?.replace(/\/$/, "");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Blog</h1>
          <p className="text-sm text-muted-foreground">
            Posts on the tallaby.com blog. Each post can have Arabic and English text; a language without a title is not
            shown in that language. Store blogs are managed by sellers in their dashboard.
          </p>
        </div>
        <Button asChild>
          <Link href="/blog/new">
            <Plus className="size-4" /> New post
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="py-4">
          {rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No posts yet. While the blog is empty, tallaby.com shows its built-in sample posts.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Post</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Languages</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Publish date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const state = STATE_BADGE[platformPostState(row.status, row.publishedAt)];
                  const locales = platformPostLocales(row);
                  const cover = row.coverImage ? getPublicUrl(row.coverImage, PLATFORM_BLOG_BUCKET) : "";
                  return (
                    <TableRow key={row.id} className="align-top">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {cover ? (
                            <RemoteImage src={cover} alt="" width={64} height={40} className="h-10 w-16 rounded border object-cover" />
                          ) : (
                            <div className="h-10 w-16 rounded border bg-muted" />
                          )}
                          <div className="min-w-0">
                            <Link href={`/blog/${row.id}`} className="font-medium hover:underline">
                              {row.titleEn || row.titleAr || "Untitled"}
                            </Link>
                            {row.titleAr && row.titleEn ? (
                              <div dir="rtl" className="text-sm text-muted-foreground">
                                {row.titleAr}
                              </div>
                            ) : null}
                            <div className="font-mono text-xs text-muted-foreground">/{row.slug}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm capitalize">{row.category}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {locales.length ? locales.map((l) => <Badge key={l} variant="outline" className="uppercase">{l}</Badge>) : "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={state.variant}>{state.label}</Badge>
                      </TableCell>
                      <TableCell className="text-sm tabular-nums">{row.publishedAt ? dateFormat.format(new Date(row.publishedAt)) : "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {siteUrl && platformPostState(row.status, row.publishedAt) === "published" ? (
                            <Button asChild variant="ghost" size="sm">
                              <a href={`${siteUrl}/${locales[0] ?? "ar"}/blog/${row.slug}`} target="_blank" rel="noreferrer">
                                View
                              </a>
                            </Button>
                          ) : null}
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/blog/${row.id}`}>Edit</Link>
                          </Button>
                          <ReasonActionButton
                            label="Delete"
                            title="Delete this post?"
                            description="The post is removed from tallaby.com for good."
                            confirmLabel="Delete"
                            destructive
                            payload={{ id: row.id }}
                            action={deleteBlogPostAction}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
