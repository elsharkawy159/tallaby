import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getStoreForEditor, getStoreSiteStatus, listStoreTemplates } from "@workspace/lib/store-sites/server";
import { storePreviewSecret } from "@workspace/lib/store-sites/preview";
import { storeUrl } from "@workspace/lib/storefront";
import { publicStoreSocialLinks } from "@workspace/lib/stores";
import { designSystemSchema, sectionInstanceSchema, type SiteLocale } from "@workspace/store-sections";
import { storeBuilderEnabled } from "@/components/dashboard/sidebar.config";
import { loadStorePage } from "@/lib/stores/store-page.server";
import { storeFontVariables } from "@/app/(main)/stores/[storeId]/website/_components/store-fonts";
import { toTemplateCardViews } from "@/app/(main)/stores/[storeId]/website/templates/templates.lib";
import type { EditorInitial } from "@workspace/store-editor/editor.client";
import { SellerEditor } from "./seller-editor.client";
import { loadEditorSnapshot } from "./server/editor.data";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("storeEditor");
  return { title: t("title") };
}

const asLocale = (value: unknown): SiteLocale => (value === "en" ? "en" : "ar");

/**
 * Website editor for one store (PLAN.md P4-06). The store id comes from the
 * URL and is checked by loadStorePage (404 for a foreign or missing store);
 * every save goes through the editor actions, which check it again.
 */
export default async function StoreEditorPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const store = await loadStorePage(storeId);
  if (!storeBuilderEnabled(store.sellerId)) notFound();

  const [editor, status, catalog, gallery] = await Promise.all([
    getStoreForEditor(store.sellerId, store.id),
    getStoreSiteStatus(store.sellerId, store.id),
    loadEditorSnapshot(store.sellerId, store.id, store.catalogMode),
    listStoreTemplates(store.sellerId, store.id),
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
      // WhatsApp is its own store setting; sections fall back to the phone number themselves.
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
  };

  return <SellerEditor initial={initial} />;
}
