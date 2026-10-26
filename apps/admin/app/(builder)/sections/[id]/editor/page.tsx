import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLibrarySectionForEditor, listLibrarySectionsForAdmin } from "@workspace/lib/admin/server";
import { designSystemSchema } from "@workspace/store-sections";
import { DEFAULT_TEMPLATE, getCodeTemplate } from "@workspace/store-sections/templates";
import { adminActorId } from "@/app/(dashboard)/_lib/saas-admin.server";
import { storeFontVariables } from "@/app/(builder)/stores/[storeId]/editor/store-fonts";
import { SectionEditorGate } from "./section-editor.client";
import { sectionEditorInitial } from "./section-editor.lib";
import type { SectionNavItem } from "./section-nav.client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Section editor" };

const localized = (value: unknown): { ar: string; en: string } => {
  const v = value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  return { ar: typeof v.ar === "string" ? v.ar : "", en: typeof v.en === "string" ? v.en : "" };
};

/**
 * The shared website editor on one library section (spec §5.3, Task 11):
 * a single synthetic page holding the section's draft (or published) tree
 * with its photo slots, the default template's look and its demo catalog.
 * Add › Sections lists every library section, to open another one.
 * Admin / super_admin only (the proxy keeps moderators out; this re-checks).
 */
export default async function SectionEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actorId = await adminActorId("canManageUsers");
  if (!actorId) notFound();
  const [row, all] = await Promise.all([getLibrarySectionForEditor(id), listLibrarySectionsForAdmin({ includeHidden: true })]);
  if (!row) notFound();

  // Task 12 moves the demo catalog into the database; the code template is the source for now.
  const template = getCodeTemplate("tallaby-classic") ?? DEFAULT_TEMPLATE;
  const designSystem = designSystemSchema.safeParse(DEFAULT_TEMPLATE.config().designSystem);
  const initial = sectionEditorInitial(row, {
    demo: template.demo,
    designSystem: designSystem.success ? designSystem.data : { colors: {}, typography: {}, spacing: {} },
    fontClassName: storeFontVariables,
  });
  const name = (row.name as { en?: string } | null)?.en ?? row.key;
  const sections: SectionNavItem[] = all.map((s) => ({
    id: s.id,
    key: s.key,
    category: s.category,
    name: localized(s.name),
    hidden: s.isHidden,
    unpublished: s.version === 0,
    hasDraft: s.hasDraft,
  }));

  return <SectionEditorGate initial={initial} sectionName={name} sections={sections} />;
}
