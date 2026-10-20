import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { resolveStoreForAdmin } from "@workspace/lib/admin/server";
import { getStoreForEditor, getStoreSiteStatus, listStoreTemplates } from "@workspace/lib/store-sites/server";
import { storePreviewSecret } from "@workspace/lib/store-sites/preview";
import { storeUrl } from "@workspace/lib/storefront";
import { publicStoreSocialLinks } from "@workspace/lib/stores";
import { getStore } from "@workspace/lib/stores/server";
import { designSystemSchema, sectionInstanceSchema, type SiteLocale } from "@workspace/store-sections";
import type { EditorInitial } from "@workspace/store-editor/editor.client";
import { adminActorId } from "@/app/(dashboard)/_lib/saas-admin.server";
import { loadEditorSnapshot } from "./admin-store-editor.data";
import { loadLibraryPresets } from "./library.data";
import { ReasonGate } from "./reason-gate.client";
import { storeFontVariables } from "./store-fonts";
import { toTemplateCardViews } from "./templates.lib";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Website editor" };

const asLocale = (value: unknown): SiteLocale => (value === "en" ? "en" : "ar");

/**
 * The seller's website editor for any store, opened by an admin (spec
 * 2026-10-20-admin-website-builder §5.2). Mirrors the dashboard's editor page;
 * the seller comes from the store row (resolveStoreForAdmin), never from the
 * URL or the client. A non-admin (or a moderator) or an unknown store is a 404.
 */
export default async function AdminStoreEditorPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const actorId = await adminActorId("canManageUsers");
  if (!actorId) notFound();
  const ref = await resolveStoreForAdmin(actorId, storeId).catch(() => null);
  if (!ref) notFound();
  const store = await getStore(ref.sellerId, ref.storeId);
  if (!store) notFound();

  const [editor, status, catalog, gallery, presets] = await Promise.all([
    getStoreForEditor(ref.sellerId, store.id),
    getStoreSiteStatus(ref.sellerId, store.id),
    loadEditorSnapshot(ref.sellerId, store.id, store.catalogMode),
    listStoreTemplates(ref.sellerId, store.id),
    loadLibraryPresets(),
  ]);
  if (!editor) notFound();

  const header = sectionInstanceSchema.safeParse(editor.store.sharedHeader);
  const footer = sectionInstanceSchema.safeParse(editor.store.sharedFooter);
  const designSystem = designSystemSchema.safeParse(editor.designSystem);
  const contact = (store.contact ?? {}) as { phone?: string; email?: string; whatsapp?: string };
  const locales = (editor.store.supportedLocales ?? ["ar", "en"]).map(asLocale);

  const initial: EditorInitial = {
    storeId: store.id,
    storeUrl: storeUrl(store.subdomain),
    readOnly: store.status !== "active",
    store: {
      name: store.name,
      description: store.description,
      logoUrl: store.logoUrl,
      bannerUrl: store.bannerUrl,
      url: storeUrl(store.subdomain),
      contact: { phone: contact.phone ?? null, email: contact.email ?? null, whatsapp: contact.whatsapp ?? null },
      social: publicStoreSocialLinks(store.contact),
      policies: [],
    },
    pages: editor.pages.map((page) => ({
      id: page.id,
      slug: page.slug,
      isHome: page.isHome,
      name: (page.name ?? {}) as { ar?: string; en?: string },
      seo: (page.seo ?? {}) as Record<string, unknown>,
      showInNav: page.showInNav,
      content: (page.draftContent as EditorInitial["pages"][number]["content"]) ?? { sections: [] },
      version: page.draftVersion,
    })),
    header: header.success ? header.data : null,
    footer: footer.success ? footer.data : null,
    designSystem: designSystem.success ? designSystem.data : { colors: {}, typography: {}, spacing: {} },
    designVersion: editor.designSystem.version,
    chromeVersion: editor.store.chromeVersion,
    defaultLocale: asLocale(editor.store.defaultLocale),
    locales: [...new Set(locales)],
    catalog,
    catalogMode: store.catalogMode ?? "all",
    isLive: Boolean(status?.isLive),
    hasUnpublishedChanges: status?.hasUnpublishedChanges ?? true,
    previewEnabled: storePreviewSecret() !== null,
    templates: { currentKey: gallery?.currentKey ?? "", items: toTemplateCardViews(gallery?.templates ?? []) },
    fontClassName: storeFontVariables,
    category: { en: store.storeCategory ?? null, ar: store.storeCategoryAr ?? null },
    presets,
  };

  return <ReasonGate initial={initial} storeName={store.name} />;
}
