// Disabled 2026-10-27: storefront templates and the section library come from the codebase only
// (owner; @workspace/store-sections). The templates, template_versions and library_sections tables
// were dropped (0109). The original code is kept below, commented out, for reference.
import { redirect } from "next/navigation";

export default function DisabledPage(): never {
  redirect("/");
}

// import Link from "next/link";
// import { notFound } from "next/navigation";
// import { Badge } from "@workspace/ui/components/badge";
// import { Button } from "@workspace/ui/components/button";
// import { Card, CardContent } from "@workspace/ui/components/card";
// import { Input } from "@workspace/ui/components/input";
// import { logServerError } from "@workspace/db/log";
// import { firstParam } from "@workspace/lib/admin";
// import { listLibrarySectionsForAdmin, type LibrarySectionAdminRow } from "@workspace/lib/admin/server";
// import { LIBRARY_CATEGORY_IDS } from "@workspace/store-sections/render";
// import { adminActorId } from "../_lib/saas-admin.server";
// import { AdminTable, type AdminTableColumn } from "../_components/admin-table/admin-table";
// import { formatAdminDate } from "../stores/stores.lib";
// import { NewSectionButton, type SectionDetails } from "./new-section-dialog.client";
// import { SectionRowActions } from "./section-row-actions.client";
//
// export const dynamic = "force-dynamic";
//
// interface PageProps {
//   searchParams: Promise<Record<string, string | string[] | undefined>>;
// }
//
// const COLUMNS: AdminTableColumn[] = [
//   { id: "name", header: "Section", sortable: true },
//   { id: "category", header: "Category", sortable: true },
//   { id: "version", header: "Version", sortable: true, descFirst: true },
//   { id: "status", header: "Status" },
//   { id: "updated", header: "Updated", sortable: true, descFirst: true },
//   { id: "actions", header: "Actions", align: "end" },
// ];
//
// const CATEGORIES = LIBRARY_CATEGORY_IDS as readonly string[];
//
// const text = (value: unknown, locale: "ar" | "en") =>
//   value && typeof value === "object" && typeof (value as Record<string, unknown>)[locale] === "string" ? ((value as Record<string, string>)[locale] ?? "") : "";
//
// function details(row: LibrarySectionAdminRow): SectionDetails {
//   return {
//     id: row.id,
//     key: row.key,
//     category: row.category,
//     subcategory: row.subcategory,
//     name: { ar: text(row.name, "ar"), en: text(row.name, "en") },
//     description: { ar: text(row.description, "ar"), en: text(row.description, "en") },
//   };
// }
//
// /**
//  * The section library sellers pick from in Add › Sections (spec §5.3,
//  * Task 11): create, edit in the website editor, publish, hide and delete.
//  * Admin / super_admin only (the proxy keeps moderators out).
//  */
// export default async function SectionsPage({ searchParams }: PageProps) {
//   if (!(await adminActorId("canManageUsers"))) notFound();
//   const params = await searchParams;
//   const category = firstParam(params.category);
//   const includeHidden = firstParam(params.hidden) === "1";
//   const query = firstParam(params.q)?.trim() || undefined;
//   const filter = { category: category && CATEGORIES.includes(category) ? category : undefined, includeHidden, query };
//
//   let rows: LibrarySectionAdminRow[];
//   try {
//     rows = await listLibrarySectionsForAdmin(filter);
//   } catch (error) {
//     logServerError("admin", "library section list failed", {}, error);
//     return <p className="text-sm text-destructive">Sections could not be loaded. Try again.</p>;
//   }
//
//   return (
//     <div className="space-y-6">
//       <div className="flex flex-wrap items-start justify-between gap-3">
//         <div>
//           <h1 className="text-2xl font-semibold">Sections</h1>
//           <p className="max-w-3xl text-sm text-muted-foreground">
//             The ready-made sections sellers add from Add › Sections in their website editor. Edits are drafts until you publish
//             them; a new section reaches sellers with its first publish. Stores that already added a section keep their own copy,
//             so hiding or deleting one never changes a store.
//           </p>
//         </div>
//         <NewSectionButton categories={CATEGORIES} />
//       </div>
//
//       <form action="/sections" className="flex flex-wrap items-center gap-2">
//         <select name="category" defaultValue={filter.category ?? ""} className="h-8 rounded-md border border-input bg-background px-2 text-sm" aria-label="Category">
//           <option value="">All categories</option>
//           {CATEGORIES.map((id) => (
//             <option key={id} value={id}>
//               {id}
//             </option>
//           ))}
//         </select>
//         <label className="flex items-center gap-1.5 text-sm">
//           <input type="checkbox" name="hidden" value="1" defaultChecked={includeHidden} />
//           Show hidden
//         </label>
//         <Input name="q" defaultValue={query ?? ""} placeholder="Name or key" className="h-8 w-56" />
//         <Button type="submit" size="sm" variant="outline">
//           Filter
//         </Button>
//         {(filter.category || includeHidden || query) && (
//           <Link href="/sections" className="text-sm text-muted-foreground hover:underline">
//             Clear
//           </Link>
//         )}
//         <span className="ml-auto text-sm text-muted-foreground">{rows.length} sections</span>
//       </form>
//
//       <Card>
//         <CardContent className="py-4">
//           <AdminTable
//             columns={COLUMNS}
//             emptyMessage="No sections match."
//             rows={rows.map((row) => {
//               const name = text(row.name, "en") || text(row.name, "ar") || row.key;
//               return {
//                 id: row.id,
//                 className: "align-top",
//                 sortValues: { name, category: row.category, version: row.version, updated: row.updatedAt },
//                 cells: {
//                   name: (
//                     <div>
//                       <Link href={`/sections/${row.id}/editor`} className="font-medium hover:underline">
//                         {name}
//                       </Link>
//                       {text(row.name, "ar") && (
//                         <div dir="rtl" className="text-xs text-muted-foreground">
//                           {text(row.name, "ar")}
//                         </div>
//                       )}
//                       <div className="font-mono text-xs text-muted-foreground">{row.key}</div>
//                     </div>
//                   ),
//                   category: (
//                     <div className="text-sm">
//                       {row.category}
//                       {row.subcategory && <div className="text-xs text-muted-foreground">{row.subcategory}</div>}
//                     </div>
//                   ),
//                   version: <span className="tabular-nums text-sm">{row.version > 0 ? `v${row.version}` : "—"}</span>,
//                   status: (
//                     <div className="flex flex-wrap gap-1">
//                       {row.version === 0 && <Badge variant="secondary">Not published</Badge>}
//                       {row.hasDraft && row.version > 0 && <Badge variant="outline">Unpublished changes</Badge>}
//                       {row.isHidden && <Badge variant="secondary">Hidden</Badge>}
//                       {!row.isHidden && row.version > 0 && <Badge variant="outline">Shown</Badge>}
//                     </div>
//                   ),
//                   updated: <span className="text-xs text-muted-foreground">{formatAdminDate(row.updatedAt)}</span>,
//                   actions: <SectionRowActions section={details(row)} isHidden={row.isHidden} categories={CATEGORIES} />,
//                 },
//               };
//             })}
//           />
//         </CardContent>
//       </Card>
//     </div>
//   );
// }
//
