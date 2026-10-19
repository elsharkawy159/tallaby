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
import { createCachedQuery, templateTags } from "@workspace/cache";
import { logServerError } from "@workspace/db/log";
import { firstParam, isUuid } from "@workspace/lib/admin";
import { listTemplateVersionsForAdmin, listTemplatesForAdmin } from "@workspace/lib/admin/server";
import { formatCurrency } from "@workspace/lib";
import { getCurrentAdminUser } from "@/lib/auth/admin-auth";
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
          control visibility, pricing, order and the default for new stores.
        </p>
      </div>

      <Card>
        <CardContent className="py-4">
          {rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No templates.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Gallery</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Order</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead className="text-right">Stores using</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const name = localizedText(row.name);
                  return (
                    <TableRow key={row.id} className="align-top">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {row.thumbnailUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={row.thumbnailUrl} alt="" className="h-10 w-16 rounded border object-cover" />
                          ) : (
                            <div className="h-10 w-16 rounded border bg-muted" />
                          )}
                          <div>
                            <div className="font-medium">{name}</div>
                            <div className="font-mono text-xs text-muted-foreground">{row.key}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm capitalize">{row.category}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {row.isDefault && <Badge>Default</Badge>}
                          <Badge variant={row.isActive ? "outline" : "secondary"}>{row.isActive ? "Shown" : "Hidden"}</Badge>
                          {row.isPremium && <Badge variant="outline">Premium</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{row.price ? formatCurrency(Number(row.price)) : "Free"}</TableCell>
                      <TableCell className="text-right tabular-nums">{row.sortOrder}</TableCell>
                      <TableCell className="text-sm">
                        {row.currentVersion ? `v${row.currentVersion}` : "—"}
                        <div>
                          <Link href={`/templates?versions=${row.id}`} className="text-xs text-muted-foreground hover:underline">
                            {row.versions} {row.versions === 1 ? "version" : "versions"}
                          </Link>
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        <Link href={`/stores?template=${encodeURIComponent(row.key)}`} className="hover:underline">
                          {row.storesUsing}
                        </Link>
                        <div className="text-xs text-muted-foreground">{row.installs} installs</div>
                      </TableCell>
                      <TableCell>
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
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
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
