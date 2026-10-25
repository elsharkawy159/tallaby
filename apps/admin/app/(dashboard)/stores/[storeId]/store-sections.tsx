import Link from "next/link";
import { Badge } from "@workspace/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
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
import { AdminTable, type AdminTableColumn } from "../../_components/admin-table/admin-table";
import { ReasonActionButton } from "../../_components/dialogs/reason-action.client";
import { IntegrationsTable } from "../../integrations/integrations-table";
import { sellerWalletHref } from "../../_components/entity/entity-href.lib";
import { PersonCard } from "../../_components/entity/person-card";
import { getAccountRelations } from "../../_components/entity/relations.server";
import { auditActionLabel } from "../../sellers/[id]/seller-admin.lib";
import { storeAdminAction } from "../../sellers/[id]/seller-admin.server";
import { PAYMENT_METHOD_LABELS, formatAdminDate, formatBytes, localizedText } from "../stores.lib";
import { unpublishCmsItemAction } from "../stores.server";
import {
  VERCEL_APEX_A_RECORD,
  VERCEL_CNAME_TARGET,
  type VercelVerificationRecord,
} from "@workspace/lib/storefront/vercel-domains";
import { domainAdminAction } from "../../domains/domains.server";
import { AssignDomainButton } from "./assign-domain.client";
import { logServerError } from "@workspace/db/log";
import { listStoreTemplates } from "@workspace/lib/store-sites/server";
import { loadCachedTemplateCards } from "@/lib/store-templates.data";
import { RemoteImage } from "@/components/media/remote-image";
import { ChangeThemeButton, PaletteBand, type ThemeOption } from "./store-theme.client";
import {
  discardSiteDraftAction,
  restoreSiteRevisionAction,
  undoStoreThemeAction,
  unpublishSiteAction,
} from "./website-actions.server";

type SectionProps = { store: AdminStoreHeader };

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

/**
 * The DNS records a pending domain still needs, as registrars want them (the
 * same as the seller's domain tab): the Host is relative to the domain, so
 * `@`, `www`, `_vercel`. Typing the full name there makes Namecheap and others
 * create `faster-eg.com.faster-eg.com`.
 */
function DomainDnsRecords({ domain, verification }: { domain: string; verification: unknown }) {
  const host = (name: string) => (name.endsWith(`.${domain}`) ? name.slice(0, -(domain.length + 1)) : name);
  const records = [
    { type: "A", name: "@", value: VERCEL_APEX_A_RECORD },
    { type: "CNAME", name: "www", value: VERCEL_CNAME_TARGET },
    ...(Array.isArray(verification) ? (verification as VercelVerificationRecord[]) : []).map((record) => ({
      type: record.type,
      name: host(record.domain),
      value: record.value,
    })),
  ];
  return (
    <div className="rounded-md border p-2 text-xs" dir="ltr">
      <p className="mb-1 text-muted-foreground">
        DNS records the domain owner must set. Type the Host exactly as shown (<code>@</code> is the domain itself), and
        delete any other <code>@</code> or <code>www</code> records such as the registrar&apos;s parking or redirect.
      </p>
      <table className="w-full">
        <thead className="text-muted-foreground">
          <tr className="text-start">
            <th className="pe-3 text-start font-normal">Type</th>
            <th className="pe-3 text-start font-normal">Host</th>
            <th className="text-start font-normal">Value</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={`${record.type}-${record.name}-${record.value}`} className="align-top">
              <td className="pe-3 font-medium">{record.type}</td>
              <td className="pe-3 break-all">{record.name}</td>
              <td className="break-all font-mono">{record.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export async function StoreOverviewSection({ store, canWrite }: SectionProps & { canWrite: boolean }) {
  const base = { sellerId: store.sellerId, storeId: store.id };
  const owner = await getAccountRelations(store.sellerId).catch(() => null);
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
            <Fact label="First published">{formatAdminDate(store.firstPublishedAt)}</Fact>
            <Fact label="Last published">{formatAdminDate(store.lastPublishedAt)}</Fact>
            <Fact label="Created">{formatAdminDate(store.createdAt)}</Fact>
            <Fact label="Store wallet (seller)">
              {store.walletBalance === null ? (
                "—"
              ) : (
                <Link href={sellerWalletHref(store.sellerId)} className={Number(store.walletBalance) < 0 ? "text-destructive hover:underline" : "hover:underline"}>
                  {formatCurrency(Number(store.walletBalance))}
                </Link>
              )}
            </Fact>
          </dl>
          <div className="mt-6">
            <h3 className="mb-2 text-sm font-semibold">Custom domain</h3>
            {store.domains.length === 0 ? (
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span>None. The store is served at its tallaby.com subdomain.</span>
                {canWrite && <AssignDomainButton storeId={store.id} />}
              </div>
            ) : (
              <ul className="space-y-3 text-sm">
                {store.domains.map((domain) => (
                  <li key={domain.id} className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span dir="ltr">{domain.domain}</span>
                      <Badge variant="outline" className="font-normal capitalize">
                        {domain.status}
                      </Badge>
                      {domain.lastError && <span className="text-xs text-destructive">{domain.lastError}</span>}
                      <Link href={`/domains?q=${encodeURIComponent(domain.domain)}`} className="text-xs text-muted-foreground hover:underline">
                        Manage
                      </Link>
                      {canWrite && (
                        <>
                          <ReasonActionButton
                            label="Re-check"
                            title="Re-check"
                            reasonRequired={false}
                            payload={{ action: "recheck", domainId: domain.id }}
                            action={domainAdminAction}
                          />
                          <ReasonActionButton
                            label="Remove"
                            title={`Remove ${domain.domain}?`}
                            description="Detaches the domain from Tallaby. The store goes back to its tallaby.com subdomain."
                            confirmLabel="Remove"
                            destructive
                            payload={{ action: "remove_domain", domainId: domain.id }}
                            action={domainAdminAction}
                          />
                        </>
                      )}
                    </div>
                    {domain.status !== "active" && <DomainDnsRecords domain={domain.domain} verification={domain.verification} />}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
      <div className="space-y-6">
        {owner ? <PersonCard title="Store owner" account={owner} excludeStoreId={store.id} /> : null}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Admin actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-start gap-3">
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
            <p className="text-xs text-muted-foreground">
              Every action needs a reason and is saved in the audit log. Website actions (theme, unpublish) are in Website.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const PAGE_COLUMNS: AdminTableColumn[] = [
  { id: "name", header: "Page", sortable: true },
  { id: "path", header: "Path", sortable: true },
  { id: "inMenu", header: "In menu", sortable: true, descFirst: true },
  { id: "draftVersion", header: "Draft version", sortable: true, descFirst: true, align: "end" },
  { id: "updatedAt", header: "Updated", sortable: true, descFirst: true },
];

const ZONE_COLUMNS: AdminTableColumn[] = [
  { id: "name", header: "Zone", sortable: true },
  { id: "areas", header: "Areas" },
  { id: "price", header: "Price", sortable: true, align: "end" },
  { id: "days", header: "Days", sortable: true },
  { id: "cod", header: "COD", sortable: true, descFirst: true },
];

const FORM_COLUMNS: AdminTableColumn[] = [
  { id: "name", header: "Form", sortable: true },
  { id: "status", header: "Status", sortable: true },
  { id: "submissions", header: "Submissions", sortable: true, descFirst: true, align: "end" },
  { id: "lastSubmissionAt", header: "Last submission", sortable: true, descFirst: true },
  { id: "createdAt", header: "Created", sortable: true, descFirst: true },
];

const ITEM_COLUMNS: AdminTableColumn[] = [
  { id: "title", header: "Title", sortable: true },
  { id: "collection", header: "Collection", sortable: true },
  { id: "status", header: "Status", sortable: true },
  { id: "updatedAt", header: "Updated", sortable: true, descFirst: true },
  { id: "actions", header: "", align: "end" },
];

const MEDIA_COLUMNS: AdminTableColumn[] = [
  { id: "filename", header: "Largest files", sortable: true },
  { id: "type", header: "Type", sortable: true },
  { id: "size", header: "Size", sortable: true, descFirst: true, align: "end" },
  { id: "createdAt", header: "Uploaded", sortable: true, descFirst: true },
];

/**
 * `canWrite`: admin / super_admin (moderators see the tab read-only). The
 * site actions re-check the role, the store and the reason on the server.
 */
export async function StoreWebsiteSection({ store, canWrite }: SectionProps & { canWrite: boolean }) {
  const [site, gallery] = await Promise.all([
    getStoreWebsiteForAdmin(store.id),
    listStoreTemplates(store.sellerId, store.id, undefined, loadCachedTemplateCards).catch((error) => {
      logServerError("admin", "store page theme gallery failed", { storeId: store.id }, error);
      return null;
    }),
  ]);
  const colors = (site.design?.colors ?? {}) as Record<string, unknown>;
  const themes: ThemeOption[] = (gallery?.templates ?? []).map((template) => ({
    key: template.key,
    name: localizedText(template.name),
    category: template.category,
    thumbnailUrl: template.thumbnailUrl,
    isPremium: template.isPremium,
    isDefault: template.isDefault,
    palette: template.palette,
    pageCount: template.outline.length,
  }));
  const currentKey = gallery?.currentKey ?? store.templateKey;
  const current = themes.find((theme) => theme.key === currentKey) ?? null;
  const install = gallery?.lastInstall ?? null;
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="overflow-hidden py-0 lg:col-span-2">
        <div className="flex flex-col sm:flex-row">
          <PaletteBand palette={current?.palette ?? []} className="h-3 shrink-0 sm:h-auto sm:w-3" />
          <div className="flex flex-1 flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              {current?.thumbnailUrl ? (
                <RemoteImage
                  src={current.thumbnailUrl}
                  alt=""
                  width={96}
                  height={72}
                  className="hidden h-[72px] w-24 shrink-0 rounded-md border object-cover object-top sm:block"
                />
              ) : null}
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">Theme</p>
                <p className="text-lg font-semibold leading-tight">{current?.name ?? currentKey}</p>
                <p className="text-sm text-muted-foreground">
                  {current ? `${current.category.charAt(0).toUpperCase()}${current.category.slice(1)}, ${current.pageCount} pages` : "No longer offered in the gallery"}
                  {install && install.templateKey === currentKey ? `. Applied ${formatAdminDate(install.installedAt)}` : ""}
                </p>
              </div>
            </div>
            {canWrite && (
              <div className="flex flex-wrap items-center gap-2">
                {install?.canUndo && (
                  <ReasonActionButton
                    label="Undo theme change"
                    title="Undo the last theme change?"
                    description="The drafts go back to how they were before the theme was applied, and pages it added are removed. Edits made since then are lost. The live site does not change."
                    confirmLabel="Undo"
                    payload={{ storeId: store.id }}
                    action={undoStoreThemeAction}
                  />
                )}
                {themes.length > 0 && (
                  <ChangeThemeButton
                    storeId={store.id}
                    storeName={store.name}
                    currentKey={currentKey}
                    themes={themes}
                    siteLive={store.siteStatus === "published"}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Pages ({site.pages.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminTable
            columns={PAGE_COLUMNS}
            emptyMessage={<Empty>No pages yet.</Empty>}
            rows={site.pages.map((page) => ({
              id: page.id,
              sortValues: {
                name: localizedText(page.name),
                path: page.slug,
                inMenu: page.showInNav,
                draftVersion: page.draftVersion,
                updatedAt: page.updatedAt,
              },
              cells: {
                name: (
                  <span className="font-medium">
                    {localizedText(page.name)}
                    {page.isHome && <Badge variant="outline" className="ml-2 font-normal">Home</Badge>}
                  </span>
                ),
                path: (
                  <span dir="ltr" className="font-mono text-xs">
                    /{page.slug}
                  </span>
                ),
                inMenu: page.showInNav ? "Yes" : "No",
                draftVersion: <span className="tabular-nums">{page.draftVersion}</span>,
                updatedAt: <span className="text-sm text-muted-foreground">{formatAdminDate(page.updatedAt)}</span>,
              },
            }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Published revisions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    {formatAdminDate(revision.createdAt)}
                    {revision.publishedBy ? ` · ${revision.publishedBy}` : ""}
                    {canWrite && (
                      <ReasonActionButton
                        label="Restore"
                        title={`Restore revision #${revision.revisionNumber} to the drafts?`}
                        description="The store's drafts are replaced by this revision. The live site does not change until someone publishes."
                        confirmLabel="Restore to drafts"
                        payload={{ storeId: store.id, revisionId: revision.id }}
                        action={restoreSiteRevisionAction}
                      />
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {canWrite && (site.publishedRevisionId || store.siteStatus === "published") && (
            <div className="flex flex-wrap items-center gap-2 border-t pt-4">
              {site.publishedRevisionId && (
                <ReasonActionButton
                  label="Discard draft"
                  title="Discard the unpublished changes?"
                  description="Every page, the design and the header/footer go back to the live revision. The seller's unpublished edits are lost."
                  confirmLabel="Discard draft"
                  destructive
                  payload={{ storeId: store.id }}
                  action={discardSiteDraftAction}
                />
              )}
              {store.siteStatus === "published" && (
                <ReasonActionButton
                  label="Unpublish website"
                  title="Unpublish this store's website?"
                  description="Visitors see the store's offline page until it is published again. The drafts are kept."
                  confirmLabel="Unpublish"
                  destructive
                  payload={{ storeId: store.id }}
                  action={unpublishSiteAction}
                />
              )}
              <p className="w-full text-xs text-muted-foreground">Every action needs a reason and is saved in the audit log.</p>
            </div>
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

export async function StoreCatalogSection({ store }: SectionProps) {
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

export async function StoreCommerceSection({ store }: SectionProps) {
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
          <AdminTable
            columns={ZONE_COLUMNS}
            emptyMessage={<Empty>No custom zones: platform shipping rates apply.</Empty>}
            rows={zones.map((zone) => ({
              id: zone.id,
              className: zone.enabled ? "" : "opacity-60",
              sortValues: {
                name: localizedText(zone.name),
                price: Number(zone.price),
                days: zone.deliveryDaysMin,
                cod: zone.codEnabled,
              },
              cells: {
                name: <span className="font-medium">{localizedText(zone.name)}</span>,
                areas: (
                  <div className="max-w-72 text-xs">
                    {(zone.governorates ?? []).map((g) => getGovernorateLabel(String(g), "en")).join(", ")}
                  </div>
                ),
                price: (
                  <span className="tabular-nums">
                    {formatCurrency(Number(zone.price))}
                    {zone.freeOver && <span className="block text-xs text-muted-foreground">free over {formatCurrency(Number(zone.freeOver))}</span>}
                  </span>
                ),
                days: (
                  <span className="text-sm">
                    {zone.deliveryDaysMin ?? "?"}–{zone.deliveryDaysMax ?? "?"}
                  </span>
                ),
                cod: zone.codEnabled ? "Yes" : "No",
              },
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export async function StoreIntegrationsSection({ store }: SectionProps) {
  const rows = await listStoreIntegrationsForAdmin(store.id);
  return (
    <Card>
      <CardContent className="py-4">
        <IntegrationsTable rows={rows} />
      </CardContent>
    </Card>
  );
}

export async function StoreFormsSection({ store }: SectionProps) {
  const forms = await listStoreFormsForAdmin(store.id);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Forms</CardTitle>
        <p className="text-sm text-muted-foreground">Submission contents hold customer data and are not shown here.</p>
      </CardHeader>
      <CardContent>
        <AdminTable
          columns={FORM_COLUMNS}
          emptyMessage={<Empty>No forms.</Empty>}
          rows={forms.map((form) => ({
            id: form.id,
            sortValues: {
              name: form.name,
              status: form.status,
              submissions: form.submissions,
              lastSubmissionAt: form.lastSubmissionAt,
              createdAt: form.createdAt,
            },
            cells: {
              name: (
                <div className="font-medium">
                  {form.name}
                  <div className="font-mono text-xs text-muted-foreground">{form.key}</div>
                </div>
              ),
              status: <span className="capitalize">{form.status}</span>,
              submissions: <span className="tabular-nums">{form.submissions.toLocaleString()}</span>,
              lastSubmissionAt: <span className="text-sm text-muted-foreground">{formatAdminDate(form.lastSubmissionAt)}</span>,
              createdAt: <span className="text-sm text-muted-foreground">{formatAdminDate(form.createdAt)}</span>,
            },
          }))}
        />
      </CardContent>
    </Card>
  );
}

export async function StoreContentSection({ store }: SectionProps) {
  const { collections, items } = await listStoreContentForAdmin(store.id);
  const collectionNames = new Map(collections.map((collection) => [collection.id, collection.name]));
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Blog & CMS collections</CardTitle>
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
          <AdminTable
            columns={ITEM_COLUMNS}
            emptyMessage={<Empty>No posts or items.</Empty>}
            rows={items.map((item) => ({
              id: item.id,
              sortValues: {
                title: item.title,
                collection: collectionNames.get(item.collectionId) ?? null,
                status: item.status,
                updatedAt: item.updatedAt,
              },
              cells: {
                title: (
                  <div className="font-medium">
                    {item.title}
                    <div className="font-mono text-xs text-muted-foreground" dir="ltr">
                      {item.slug}
                    </div>
                  </div>
                ),
                collection: <span className="text-sm">{collectionNames.get(item.collectionId) ?? "—"}</span>,
                status: (
                  <Badge variant={item.status === "published" ? "default" : "secondary"} className="capitalize">
                    {item.status}
                  </Badge>
                ),
                updatedAt: <span className="text-sm text-muted-foreground">{formatAdminDate(item.updatedAt)}</span>,
                actions:
                  item.status === "published" ? (
                    <ReasonActionButton
                      label="Unpublish"
                      title="Unpublish this item?"
                      description="It goes back to a draft. The seller can edit and publish it again."
                      confirmLabel="Unpublish"
                      destructive
                      payload={{ sellerId: store.sellerId, storeId: store.id, itemId: item.id }}
                      action={unpublishCmsItemAction}
                    />
                  ) : null,
              },
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export async function StoreMediaSection({ store }: SectionProps) {
  const media = await getStoreMediaForAdmin(store.id);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Media</CardTitle>
        <p className="text-sm text-muted-foreground">
          {media.count.toLocaleString()} files, {formatBytes(media.bytes)} in all
        </p>
      </CardHeader>
      <CardContent>
        <AdminTable
          columns={MEDIA_COLUMNS}
          defaultSort={{ id: "size", desc: true }}
          emptyMessage={<Empty>No uploads.</Empty>}
          rows={media.largest.map((asset) => ({
            id: asset.id,
            sortValues: {
              filename: asset.filename,
              type: asset.mimeType,
              size: Number(asset.bytes ?? 0),
              createdAt: asset.createdAt,
            },
            cells: {
              filename: <div className="max-w-80 truncate">{asset.filename}</div>,
              type: <span className="text-xs text-muted-foreground">{asset.mimeType}</span>,
              size: <span className="tabular-nums">{formatBytes(Number(asset.bytes ?? 0))}</span>,
              createdAt: <span className="text-sm text-muted-foreground">{formatAdminDate(asset.createdAt)}</span>,
            },
          }))}
        />
      </CardContent>
    </Card>
  );
}

export async function StoreAuditSection({ store }: SectionProps) {
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
