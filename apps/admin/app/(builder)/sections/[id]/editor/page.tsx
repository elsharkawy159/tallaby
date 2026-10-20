import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLibrarySectionForEditor } from "@workspace/lib/admin/server";
import { designSystemSchema } from "@workspace/store-sections";
import { DEFAULT_TEMPLATE, getCodeTemplate } from "@workspace/store-sections/templates";
import { adminActorId } from "@/app/(dashboard)/_lib/saas-admin.server";
import { storeFontVariables } from "@/app/(builder)/stores/[storeId]/editor/store-fonts";
import { SectionEditorGate } from "./section-editor.client";
import { sectionEditorInitial } from "./section-editor.lib";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Section editor" };

/**
 * The shared website editor on one library section (spec §5.3, Task 11):
 * a single synthetic page holding the section's draft (or published) tree
 * with its photo slots, the default template's look and its demo catalog.
 * Admin / super_admin only (the proxy keeps moderators out; this re-checks).
 */
export default async function SectionEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actorId = await adminActorId("canManageUsers");
  if (!actorId) notFound();
  const row = await getLibrarySectionForEditor(id);
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

  return <SectionEditorGate initial={initial} sectionName={name} />;
}
