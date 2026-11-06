import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Badge } from "@workspace/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { isUuid } from "@workspace/lib/admin";
import { validateAdminAccess } from "@/lib/auth/admin-auth";
import { getThemeRequestWithImages } from "../theme-requests.data";
import { formatWhen, STATUS_LABELS } from "../theme-requests.lib";
import { ThemeRequestForm } from "./theme-request-form.client";

export const dynamic = "force-dynamic";

/** One theme request (ROADMAP.md F-77): what the seller sent, and the status and reply form. */
export default async function ThemeRequestPage({ params }: { params: Promise<{ id: string }> }) {
  await validateAdminAccess("canManageUsers");
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const request = await getThemeRequestWithImages(id);
  if (!request) notFound();

  return (
    <div className="space-y-5">
      <Link href="/theme-requests" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden />
        Theme requests
      </Link>
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold">Theme request</h1>
        <Badge variant="outline">{STATUS_LABELS[request.status]}</Badge>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">What the seller sent</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 text-sm">
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">Seller</dt>
                <dd>
                  <Link className="underline underline-offset-2" href={`/sellers/${request.sellerId}`}>
                    {request.sellerName ?? "Seller"}
                  </Link>
                  {request.sellerEmail ? <span className="block text-xs text-muted-foreground">{request.sellerEmail}</span> : null}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Store</dt>
                <dd>
                  {request.storeId ? (
                    <Link className="underline underline-offset-2" href={`/stores/${request.storeId}`}>
                      {request.storeName ?? request.subdomain ?? "Store"}
                    </Link>
                  ) : (
                    "Store deleted"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Sent</dt>
                <dd>{formatWhen(request.createdAt)}</dd>
              </div>
              {request.handledAt && (
                <div>
                  <dt className="text-xs text-muted-foreground">Last update</dt>
                  <dd>
                    {formatWhen(request.handledAt)}
                    {request.handledByEmail ? ` · ${request.handledByEmail}` : ""}
                  </dd>
                </div>
              )}
            </dl>

            <section className="space-y-1">
              <h2 className="text-xs font-medium text-muted-foreground">Reference URL</h2>
              {request.referenceUrl ? (
                <a
                  href={request.referenceUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  dir="ltr"
                  className="inline-flex max-w-full items-center gap-1.5 break-all underline underline-offset-2"
                >
                  {request.referenceUrl}
                  <ExternalLink className="size-3.5 shrink-0" aria-hidden />
                </a>
              ) : (
                <p className="text-muted-foreground">None</p>
              )}
            </section>

            <section className="space-y-1">
              <h2 className="text-xs font-medium text-muted-foreground">Description</h2>
              <p className="whitespace-pre-line" dir="auto">
                {request.description || <span className="text-muted-foreground">None</span>}
              </p>
            </section>

            <section className="space-y-1">
              <h2 className="text-xs font-medium text-muted-foreground">Note</h2>
              <p className="whitespace-pre-line" dir="auto">
                {request.note || <span className="text-muted-foreground">None</span>}
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xs font-medium text-muted-foreground">Images ({request.imagePaths.length})</h2>
              {request.imageUrls.length > 0 ? (
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {request.imageUrls.map((url, index) => (
                    <li key={url}>
                      {/* Short-lived signed link to the private bucket (30 minutes). */}
                      <a href={url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Seller image ${index + 1}`} className="aspect-square w-full object-cover" />
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">{request.imagePaths.length ? "Images couldn't be loaded." : "None"}</p>
              )}
            </section>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Status and reply</CardTitle>
          </CardHeader>
          <CardContent>
            <ThemeRequestForm requestId={request.id} status={request.status} reply={request.adminReply} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
