import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Badge } from "@workspace/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { createCachedQuery, templateTags } from "@workspace/cache";
import { logServerError } from "@workspace/db/log";
import { firstParam, isUuid } from "@workspace/lib/admin";
import { listTemplateVersionsForAdmin, listTemplatesForAdmin } from "@workspace/lib/admin/server";
import { formatCurrency } from "@workspace/lib";
import { getCurrentAdminUser } from "@/lib/auth/admin-auth";
import { templateGalleryUrl } from "@/lib/site-urls";
import { AdminTable, type AdminTableColumn } from "../_components/admin-table/admin-table";
import { ReasonActionButton } from "../_components/dialogs/reason-action.client";
import { formatAdminDate, localizedText } from "../stores/stores.lib";
import { TemplateEditButton } from "./template-edit.client";
import { setDefaultTemplateAction } from "./templates.server";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * The gallery is platform data with no seller data in it, so it is cached
 * (docs/admin-saas.md §4.2): admin template writes invalidate the tag, and
 * install counts (changed by sellers) refresh within the 5-minute backstop.
 */
const getCachedTemplates = createCachedQuery({
  name: "admin:templates",
  ttl: 300,
  tags: () => [templateTags.catalog()],
  query: () => listTemplatesForAdmin(),
});

const TEMPLATE_COLUMNS: AdminTableColumn[] = [
  { id: "template", header: "Template", sortable: true },
  { id: "category", header: "Category", sortable: true },
  { id: "gallery", header: "Gallery", sortable: true, descFirst: true },
  { id: "price", header: "Price", sortable: true, align: "end" },
  { id: "order", header: "Order", sortable: true, align: "end" },
  { id: "version", header: "Version", sortable: true, descFirst: true },
  { id: "storesUsing", header: "Stores using", sortable: true, descFirst: true, align: "end" },
  { id: "actions", header: "Actions", align: "end" },
];

/** Store templates in the seller gallery (docs/admin-saas.md §3.6). Metadata only. */
export default async function TemplatesPage({ searchParams }: PageProps) {
  await getCurrentAdminUser();
  const versionsFor = firstParam((await searchParams).versions);
  let rows: Awaited<ReturnType<typeof listTemplatesForAdmin>>;
  try {
    rows = await getCachedTemplates();
  } catch (error) {
    logServerError("admin", "template list failed", {}, error);
    return <p className="text-sm text-destructive">Templates could not be loaded. Try again.</p>;
  }
  const selected = versionsFor && isUuid(versionsFor) ? rows.find((row) => row.id === versionsFor) : undefined;
  const versions = selected ? await listTemplateVersionsForAdmin(selected.id).catch(() => []) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Templates</h1>
        <p className="text-sm text-muted-foreground">
          What sellers see in their template gallery. Template content is shipped with releases; here you
          control visibility, pricing, order and the default for new stores. A shown template&apos;s name opens
          its page on tallaby.com in a new tab.
        </p>
      </div>

      <Card>
        <CardContent className="py-4">
          <AdminTable
            columns={TEMPLATE_COLUMNS}
            defaultSort={{ id: "order", desc: false }}
            emptyMessage="No templates."
            rows={rows.map((row) => {
              const name = localizedText(row.name);
              // The gallery only lists active templates that have a version.
              const onSite = row.isActive && row.currentVersion !== null;
              return {
                id: row.id,
                className: "align-top",
                sortValues: {
                  template: name,
                  category: row.category,
                  gallery: row.isDefault ? 2 : row.isActive ? 1 : 0,
                  price: row.price ? Number(row.price) : 0,
                  order: row.sortOrder,
                  version: row.currentVersion,
                  storesUsing: row.storesUsing,
                },
                cells: {
                  template: (
                    <div className="flex items-center gap-3">
                      {row.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={row.thumbnailUrl} alt="" className="h-10 w-16 rounded border object-cover" />
                      ) : (
                        <div className="h-10 w-16 rounded border bg-muted" />
                      )}
                      <div>
                        {onSite ? (
                          <a
                            href={templateGalleryUrl(row.key)}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Open this template on tallaby.com in a new tab"
                            className="inline-flex items-center gap-1 font-medium hover:underline"
                          >
                            {name}
                            <ExternalLink className="size-3 text-muted-foreground" aria-hidden />
                          </a>
                        ) : (
                          <div className="font-medium">{name}</div>
                        )}
                        <div className="font-mono text-xs text-muted-foreground">{row.key}</div>
                      </div>
                    </div>
                  ),
                  category: <span className="text-sm capitalize">{row.category}</span>,
                  gallery: (
                    <div className="flex flex-wrap gap-1">
                      {row.isDefault && <Badge>Default</Badge>}
                      <Badge variant={row.isActive ? "outline" : "secondary"}>{row.isActive ? "Shown" : "Hidden"}</Badge>
                      {row.isPremium && <Badge variant="outline">Premium</Badge>}
                    </div>
                  ),
                  price: <span className="tabular-nums">{row.price ? formatCurrency(Number(row.price)) : "Free"}</span>,
                  order: <span className="tabular-nums">{row.sortOrder}</span>,
                  version: (
                    <div className="text-sm">
                      {row.currentVersion ? `v${row.currentVersion}` : "—"}
                      <div>
                        <Link href={`/templates?versions=${row.id}`} className="text-xs text-muted-foreground hover:underline">
                          {row.versions} {row.versions === 1 ? "version" : "versions"}
                        </Link>
                      </div>
                    </div>
                  ),
                  storesUsing: (
                    <div className="tabular-nums">
                      <Link href={`/stores?template=${encodeURIComponent(row.key)}`} className="hover:underline">
                        {row.storesUsing}
                      </Link>
                      <div className="text-xs text-muted-foreground">{row.installs} installs</div>
                    </div>
                  ),
                  actions: (
                    <div className="flex justify-end gap-2">
                      <TemplateEditButton
                        template={{
                          id: row.id,
                          name,
                          isActive: row.isActive,
                          isPremium: row.isPremium,
                          price: row.price,
                          sortOrder: row.sortOrder,
                          isDefault: row.isDefault,
                        }}
                      />
                      {!row.isDefault && row.isActive && (
                        <ReasonActionButton
                          label="Make default"
                          title={`Make ${name} the default?`}
                          description="New stores start with this template. Existing stores keep theirs."
                          confirmLabel="Make default"
                          payload={{ templateId: row.id }}
                          action={setDefaultTemplateAction}
                        />
                      )}
                    </div>
                  ),
                },
              };
            })}
          />
        </CardContent>
      </Card>

      {selected && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Versions of {localizedText(selected.name)}</CardTitle>
            <Link href="/templates" className="text-sm text-muted-foreground hover:underline">
              Close
            </Link>
          </CardHeader>
          <CardContent>
            {versions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No versions.</p>
            ) : (
              <ul className="divide-y text-sm">
                {versions.map((version) => (
                  <li key={version.id} className="flex flex-wrap justify-between gap-2 py-2">
                    <span>
                      v{version.version}
                      {version.version === selected.currentVersion && <Badge className="ml-2">Current</Badge>}
                      <span className="ml-2 text-xs text-muted-foreground">schema {version.schemaVersion}</span>
                      {version.changelog && <span className="block text-xs text-muted-foreground">{version.changelog}</span>}
                    </span>
                    <span className="text-xs text-muted-foreground">{formatAdminDate(version.publishedAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
