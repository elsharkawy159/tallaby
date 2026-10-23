import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTemplateForStudio } from "@workspace/lib/admin/server";
import type { EditorInitial } from "@workspace/store-editor/editor.client";
import { templateDemoProduct } from "@workspace/store-sections/templates";
import { adminActorId } from "@/app/(dashboard)/_lib/saas-admin.server";
import { loadLibraryPresets } from "@/app/(builder)/stores/[storeId]/editor/library.data";
import { storeFontVariables } from "@/app/(builder)/stores/[storeId]/editor/store-fonts";
import { siteConfigToEditorInitial } from "./template-adapter.lib";
import { TemplateEditorGate } from "./template-editor.client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Template editor" };

const localized = (value: unknown): { ar?: string; en?: string } =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as { ar?: string; en?: string }) : {};

/**
 * The shared website editor on one library template (spec §5.4, Task 15):
 * every page of its draft (or its current published version), its design
 * system and header/footer, on the template's demo catalog (`meta.demo`).
 * Saves write the template draft; Publish adds a version that new stores and
 * the seller gallery use. Admin / super_admin only (the proxy keeps
 * moderators out; this page and every action re-check).
 */
export default async function TemplateEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actorId = await adminActorId("canManageUsers");
  if (!actorId) notFound();
  const [template, presets] = await Promise.all([getTemplateForStudio(id), loadLibraryPresets()]);
  if (!template) notFound();
  const name = localized(template.name);
  const title = name.en || name.ar || template.key;

  if (!template.config) {
    return (
      <div className="grid min-h-dvh place-items-center p-4 text-center">
        <div className="space-y-2">
          <p className="text-sm text-destructive">The saved content of “{title}” is not a valid site and cannot be opened in the editor.</p>
          <Link href="/templates" className="text-sm underline">
            Back to templates
          </Link>
        </div>
      </div>
    );
  }

  const demo = template.meta.demo;
  const initial: EditorInitial = {
    ...siteConfigToEditorInitial(template.config, { ...template.meta, pageNames: template.pageNames }, template.draftVersion),
    storeId: template.id,
    storeUrl: "",
    readOnly: false,
    store: { name: demo.store.name.ar ?? title, description: demo.store.description.ar ?? null, url: "/" },
    designVersion: template.draftVersion,
    chromeVersion: template.draftVersion,
    catalogMode: "all",
    isLive: template.version !== null,
    hasUnpublishedChanges: template.hasDraft || template.version === null,
    previewEnabled: false,
    templates: { currentKey: "", items: [] },
    fontClassName: storeFontVariables,
    category: { en: null, ar: null },
    presets,
    previewProduct: templateDemoProduct(demo),
    title,
  };

  return (
    <TemplateEditorGate
      initial={initial}
      config={template.config}
      pageNames={template.pageNames}
      draftVersion={template.draftVersion}
      templateName={title}
      isDefault={template.isDefault}
      isActive={template.isActive}
    />
  );
}
