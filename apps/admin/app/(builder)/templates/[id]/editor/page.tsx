// Disabled 2026-10-27: storefront templates and the section library come from the codebase only
// (owner; @workspace/store-sections). The templates, template_versions and library_sections tables
// were dropped (0109). The original code is kept below, commented out, for reference.
import { redirect } from "next/navigation";

export default function DisabledPage(): never {
  redirect("/");
}

// import type { Metadata } from "next";
// import Link from "next/link";
// import { notFound } from "next/navigation";
// import { getTemplateForSections, listTemplateLibraryEntries } from "@workspace/lib/admin/server";
// import { adminActorId } from "@/app/(dashboard)/_lib/saas-admin.server";
// import { storeFontVariables } from "@/app/(builder)/stores/[storeId]/editor/store-fonts";
// import { TemplateSectionsScreen } from "./template-sections.client";
//
// export const dynamic = "force-dynamic";
//
// export const metadata: Metadata = { title: "Template editor" };
//
// const localized = (value: unknown): { ar?: string; en?: string } =>
//   value && typeof value === "object" && !Array.isArray(value) ? (value as { ar?: string; en?: string }) : {};
//
// /**
//  * One template, section by section (owner, 2026-10-26): its pages' library
//  * sections in order, with the header and footer; the admin fills each
//  * section's values for this template (copy, photos, links, product lists),
//  * adds, moves and removes sections, and edits the colours, fonts and pages.
//  * A section's structure and styles stay in its library section (Admin ›
//  * Sections). Saves write the template draft; Publish adds a version.
//  * Admin / super_admin only (the proxy keeps moderators out; this page and
//  * every action re-check).
//  */
// export default async function TemplateEditorPage({ params }: { params: Promise<{ id: string }> }) {
//   const { id } = await params;
//   const actorId = await adminActorId("canManageUsers");
//   if (!actorId) notFound();
//   const [template, library] = await Promise.all([getTemplateForSections(id), listTemplateLibraryEntries()]);
//   if (!template) notFound();
//   const name = localized(template.name);
//   const title = name.en || name.ar || template.key;
//
//   if (!template.config) {
//     return (
//       <div className="grid min-h-dvh place-items-center p-4 text-center">
//         <div className="space-y-2">
//           <p className="text-sm text-destructive">The saved content of “{title}” is not a valid site and cannot be opened.</p>
//           <Link href="/templates" className="text-sm underline">
//             Back to templates
//           </Link>
//         </div>
//       </div>
//     );
//   }
//
//   return <TemplateSectionsScreen template={{ ...template, config: template.config }} library={library} fontClassName={storeFontVariables} />;
// }
//
