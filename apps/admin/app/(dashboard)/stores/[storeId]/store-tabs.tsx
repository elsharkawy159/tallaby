import Link from "next/link";
import { Badge } from "@workspace/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import {
  getStoreCatalogForAdmin,
  getStoreCommerceForAdmin,
  getStoreMediaForAdmin,
  getStoreWebsiteForAdmin,
  listStoreAuditForAdmin,
  listStoreContentForAdmin,
  listStoreFormsForAdmin,
  listStoreIntegrationsForAdmin,
  type AdminStoreHeader,
} from "@workspace/lib/admin/server";
import { getGovernorateLabel } from "@workspace/lib/shipping";
import { formatCurrency } from "@workspace/lib";
import { ReasonActionButton } from "../../_components/dialogs/reason-action.client";
import { IntegrationsTable } from "../../integrations/integrations-table";
import { auditActionLabel } from "../../sellers/[id]/seller-admin.lib";
import { storeAdminAction } from "../../sellers/[id]/seller-admin.server";
import { PAYMENT_METHOD_LABELS, formatAdminDate, formatBytes, localizedText } from "../stores.lib";
import { unpublishCmsItemAction } from "../stores.server";

type TabProps = { store: AdminStoreHeader };

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-8 text-center text-sm text-muted-foreground">{children}</p>;
}

export function StoreOverviewTab({ store }: TabProps) {
  const base = { sellerId: store.sellerId, storeId: store.id };
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Store</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-3">
            <Fact label="Subdomain">
              <span dir="ltr">{store.subdomain}</span>
              {store.isPrimary && <Badge variant="outline" className="ml-2 font-normal">Primary</Badge>}
            </Fact>
            <Fact label="Default language">{store.defaultLocale.toUpperCase()}</Fact>
            <Fact label="Catalog">{store.catalogMode === "selected" ? "Selected products" : "All seller products"}</Fact>
            <Fact label="Template">{store.templateKey}</Fact>
            <Fact label="First published">{formatAdminDate(store.firstPublishedAt)}</Fact>
            <Fact label="Last published">{formatAdminDate(store.lastPublishedAt)}</Fact>
            <Fact label="Created">{formatAdminDate(store.createdAt)}</Fact>
            <Fact label="Seller email">{store.sellerEmail ?? "—"}</Fact>
            <Fact label="Store wallet (seller)">
              {store.walletBalance === null ? (
                "—"
              ) : (
                <Link href={`/sellers/${store.sellerId}?tab=wallet`} className={Number(store.walletBalance) < 0 ? "text-destructive hover:underline" : "hover:underline"}>
                  {formatCurrency(Number(store.walletBalance))}
                </Link>
              )}
            </Fact>
          </dl>
          {store.domains.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-2 text-sm font-semibold">Custom domains</h3>
              <ul className="space-y-1 text-sm">
                {store.domains.map((domain) => (
                  <li key={domain.id} className="flex flex-wrap items-center gap-2">
                    <span dir="ltr">{domain.domain}</span>
                    <Badge variant="outline" className="font-normal capitalize">
                      {domain.status}
                    </Badge>
                    {domain.lastError && <span className="text-xs text-destructive">{domain.lastError}</span>}
                    <Link href={`/domains?q=${encodeURIComponent(domain.domain)}`} className="text-xs text-muted-foreground hover:underline">
                      Manage
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Admin actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-start gap-3">
          {store.siteStatus === "published" && (
            <ReasonActionButton
              label="Force-unpublish site"
              title="Unpublish this store's website?"
              description="Visitors see the store's offline page until the seller publishes again."
              confirmLabel="Unpublish"
              destructive
              payload={{ ...base, action: "unpublish_store" }}
              action={storeAdminAction}
            />
          )}
          {store.status === "suspended" ? (
            <ReasonActionButton
              label="Lift suspension"
              title="Lift the suspension?"
              confirmLabel="Unsuspend"
              payload={{ ...base, action: "unsuspend_store" }}
              action={storeAdminAction}
            />
          ) : (
            <ReasonActionButton
              label="Suspend store"
              title="Suspend this store?"
              description="The storefront and its custom domain stop resolving. The seller keeps dashboard access."
              confirmLabel="Suspend"
              destructive
              payload={{ ...base, action: "suspend_store" }}
              action={storeAdminAction}
            />
          )}
          <p className="text-xs text-muted-foreground">Every action needs a reason and is saved in the audit log.</p>
        </CardContent>
      </Card>
    </div>
  );
}

export async function StoreWebsiteTab({ store }: TabProps) {
  const site = await getStoreWebsiteForAdmin(store.id);
  const colors = (site.design?.colors ?? {}) as Record<string, unknown>;
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Pages ({site.pages.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {site.pages.length === 0 ? (
            <Empty>No pages yet.</Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Page</TableHead>
                  <TableHead>Path</TableHead>
                  <TableHead>In menu</TableHead>
                  <TableHead className="text-right">Draft version</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {site.pages.map((page) => (
                  <TableRow key={page.id}>
                    <TableCell className="font-medium">
                      {localizedText(page.name)}
                      {page.isHome && <Badge variant="outline" className="ml-2 font-normal">Home</Badge>}
                    </TableCell>
                    <TableCell dir="ltr" className="font-mono text-xs">
                      /{page.slug}
                    </TableCell>
                    <TableCell>{page.showInNav ? "Yes" : "No"}</TableCell>
                    <TableCell className="text-right tabular-nums">{page.draftVersion}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatAdminDate(page.updatedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Published revisions (view only)</CardTitle>
        </CardHeader>
        <CardContent>
          {site.revisions.length === 0 ? (
            <Empty>Never published.</Empty>
          ) : (
            <ul className="divide-y text-sm">
              {site.revisions.map((revision) => (
                <li key={revision.id} className="flex items-center justify-between gap-2 py-2">
                  <span>
                    #{revision.revisionNumber} · {revision.templateKey}
                    {revision.id === site.publishedRevisionId && <Badge className="ml-2">Live</Badge>}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatAdminDate(revision.createdAt)}
                    {revision.publishedBy ? ` · ${revision.publishedBy}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Design, SEO and social</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <h3 className="mb-1 text-xs text-muted-foreground">Colours</h3>
            {Object.keys(colors).length === 0 ? (
              <p className="text-muted-foreground">Template defaults.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {Object.entries(colors)
                  .filter(([, value]) => typeof value === "string")
                  .slice(0, 12)
                  .map(([key, value]) => (
                    <span key={key} className="inline-flex items-center gap-1 text-xs">
                      <span className="size-4 rounded border" style={{ background: /^#[0-9a-f]{3,8}$/i.test(String(value)) ? String(value) : undefined }} />
                      {key}
                    </span>
                  ))}
              </div>
            )}
          </div>
          <div>
            <h3 className="mb-1 text-xs text-muted-foreground">SEO</h3>
            <p>{typeof site.seo.title === "string" && site.seo.title ? site.seo.title : <span className="text-muted-foreground">No custom title</span>}</p>
            {typeof site.seo.description === "string" && site.seo.description && (
              <p className="text-xs text-muted-foreground">{site.seo.description}</p>
            )}
          </div>
          <div>
            <h3 className="mb-1 text-xs text-muted-foreground">Social links</h3>
            {Object.keys(site.social).length === 0 ? (
              <p className="text-muted-foreground">None.</p>
            ) : (
              <ul className="space-y-0.5">
                {Object.entries(site.social).map(([network, url]) => (
                  <li key={network} className="truncate" dir="ltr">
                    <span className="text-muted-foreground">{network}:</span> {url}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export async function StoreCatalogTab({ store }: TabProps) {
  const catalog = await getStoreCatalogForAdmin(store.id, store.sellerId);
  return (
    <Card>
      <CardContent className="py-6">
        <dl className="grid gap-4 sm:grid-cols-4">
          <Fact label="Mode">{store.catalogMode === "selected" ? "Selected products only" : "All seller products"}</Fact>
          <Fact label="Shown in this store">
            {(store.catalogMode === "selected" ? catalog.selected : catalog.activeProducts).toLocaleString()}
          </Fact>
          <Fact label="Seller's active products">{catalog.activeProducts.toLocaleString()}</Fact>
          <Fact label="Seller's products (all statuses)">{catalog.allProducts.toLocaleString()}</Fact>
          <Fact label="Seller categories">{catalog.lists ? catalog.lists.categories : "Needs migration 0068"}</Fact>
          <Fact label="Seller brands">{catalog.lists ? catalog.lists.brands : "Needs migration 0068"}</Fact>
        </dl>
        <Link href={`/products?seller=${encodeURIComponent(store.sellerSlug)}`} className="mt-4 inline-block text-sm text-muted-foreground hover:underline">
          Open the seller&apos;s products
        </Link>
      </CardContent>
    </Card>
  );
}

export async function StoreCommerceTab({ store }: TabProps) {
  const { methods, zones } = await getStoreCommerceForAdmin(store.id);
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment methods</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1 text-sm">
            {methods.map((method) => (
              <li key={method.key} className="flex items-center justify-between">
                <span>{PAYMENT_METHOD_LABELS[method.key] ?? method.key}</span>
                <Badge variant={method.enabled ? "default" : "secondary"}>
                  {method.enabled ? (method.codFee ? `On · fee ${method.codFee} EGP` : "On") : "Off"}
                </Badge>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">Account numbers and wallet details are not shown.</p>
        </CardContent>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Shipping zones ({zones.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {zones.length === 0 ? (
            <Empty>No custom zones: platform shipping rates apply.</Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Zone</TableHead>
                  <TableHead>Areas</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>COD</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {zones.map((zone) => (
                  <TableRow key={zone.id} className={zone.enabled ? "" : "opacity-60"}>
                    <TableCell className="font-medium">{localizedText(zone.name)}</TableCell>
                    <TableCell className="max-w-72 text-xs">
                      {(zone.governorates ?? []).map((g) => getGovernorateLabel(String(g), "en")).join(", ")}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(Number(zone.price))}
                      {zone.freeOver && <div className="text-xs text-muted-foreground">free over {formatCurrency(Number(zone.freeOver))}</div>}
                    </TableCell>
                    <TableCell className="text-sm">
                      {zone.deliveryDaysMin ?? "?"}–{zone.deliveryDaysMax ?? "?"}
                    </TableCell>
                    <TableCell>{zone.codEnabled ? "Yes" : "No"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export async function StoreIntegrationsTab({ store }: TabProps) {
  const rows = await listStoreIntegrationsForAdmin(store.id);
  return (
    <Card>
      <CardContent className="py-4">
        <IntegrationsTable rows={rows} />
      </CardContent>
    </Card>
  );
}

export async function StoreFormsTab({ store }: TabProps) {
  const forms = await listStoreFormsForAdmin(store.id);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Forms</CardTitle>
        <p className="text-sm text-muted-foreground">Submission contents hold customer data and are not shown here.</p>
      </CardHeader>
      <CardContent>
        {forms.length === 0 ? (
          <Empty>No forms.</Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Form</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Submissions</TableHead>
                <TableHead>Last submission</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {forms.map((form) => (
                <TableRow key={form.id}>
                  <TableCell className="font-medium">
                    {form.name}
                    <div className="font-mono text-xs text-muted-foreground">{form.key}</div>
                  </TableCell>
                  <TableCell className="capitalize">{form.status}</TableCell>
                  <TableCell className="text-right tabular-nums">{form.submissions.toLocaleString()}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatAdminDate(form.lastSubmissionAt)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatAdminDate(form.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export async function StoreContentTab({ store }: TabProps) {
  const { collections, items } = await listStoreContentForAdmin(store.id);
  const collectionNames = new Map(collections.map((collection) => [collection.id, collection.name]));
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Collections</CardTitle>
        </CardHeader>
        <CardContent>
          {collections.length === 0 ? (
            <Empty>No collections.</Empty>
          ) : (
            <ul className="divide-y text-sm">
              {collections.map((collection) => (
                <li key={collection.id} className="flex justify-between py-2">
                  <span>
                    {collection.name}
                    <span className="ml-1 text-xs text-muted-foreground">({collection.kind})</span>
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {collection.published}/{collection.items}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Latest items</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <Empty>No posts or items.</Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Collection</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.title}
                      <div className="font-mono text-xs text-muted-foreground" dir="ltr">
                        {item.slug}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{collectionNames.get(item.collectionId) ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={item.status === "published" ? "default" : "secondary"} className="capitalize">
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatAdminDate(item.updatedAt)}</TableCell>
                    <TableCell className="text-right">
                      {item.status === "published" && (
                        <ReasonActionButton
                          label="Unpublish"
                          title="Unpublish this item?"
                          description="It goes back to a draft. The seller can edit and publish it again."
                          confirmLabel="Unpublish"
                          destructive
                          payload={{ sellerId: store.sellerId, storeId: store.id, itemId: item.id }}
                          action={unpublishCmsItemAction}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export async function StoreMediaTab({ store }: TabProps) {
  const media = await getStoreMediaForAdmin(store.id);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {media.count.toLocaleString()} files · {formatBytes(media.bytes)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {media.largest.length === 0 ? (
          <Empty>No uploads.</Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Largest files</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Size</TableHead>
                <TableHead>Uploaded</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {media.largest.map((asset) => (
                <TableRow key={asset.id}>
                  <TableCell className="max-w-80 truncate">{asset.filename}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{asset.mimeType}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatBytes(Number(asset.bytes ?? 0))}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatAdminDate(asset.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export async function StoreAuditTab({ store }: TabProps) {
  const { settings, admin } = await listStoreAuditForAdmin(store.id);
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Admin actions</CardTitle>
        </CardHeader>
        <CardContent>
          {admin.length === 0 ? (
            <Empty>None.</Empty>
          ) : (
            <ul className="divide-y text-sm">
              {admin.map((row) => (
                <li key={row.id} className="py-2">
                  <div className="flex justify-between gap-2">
                    <span className="font-medium">{auditActionLabel(row.action)}</span>
                    <span className="text-xs text-muted-foreground">{formatAdminDate(row.createdAt)}</span>
                  </div>
                  <p className="text-muted-foreground">{row.reason}</p>
                  {row.actorName && <p className="text-xs text-muted-foreground">by {row.actorName}</p>}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Seller settings changes</CardTitle>
        </CardHeader>
        <CardContent>
          {settings.length === 0 ? (
            <Empty>None.</Empty>
          ) : (
            <ul className="divide-y text-sm">
              {settings.map((row) => (
                <li key={row.id} className="flex justify-between gap-2 py-2">
                  <span>
                    {row.section} · {row.action}
                    {row.actorName && <span className="text-xs text-muted-foreground"> by {row.actorName}</span>}
                  </span>
                  <span className="text-xs text-muted-foreground">{formatAdminDate(row.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
