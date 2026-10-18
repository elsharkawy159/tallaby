import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getStoreForEditor } from "@workspace/lib/store-sites/server";
import { publicStoreSocialLinks } from "@workspace/lib/stores";
import { storeUrl } from "@workspace/lib/storefront";
import { designSystemSchema } from "@workspace/store-sections";
import { StorePageHeader } from "@/components/stores/store-page-header";
import { loadWebsiteStorePage } from "@/lib/stores/website-page.server";
import { loadEditorCatalog } from "@/app/(builder)/stores/[storeId]/editor/editor.data";
import { storeFontVariables } from "../_components/store-fonts";
import { DesignSystemEditor } from "./design.client";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("websiteDesign");
  return { title: t("title") };
}

/**
 * Website › Design system (PLAN.md P4-13, §7.3). Colors, typography and
 * buttons are the store's design-system DRAFT (live on Publish), saved with
 * the editor's `saveDesignSystem` (optimistic version). Logo, favicon and
 * banner are store fields and apply at once, like Store settings › General.
 */
export default async function WebsiteDesignPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const store = await loadWebsiteStorePage(storeId);
  const [editor, catalog] = await Promise.all([
    getStoreForEditor(store.sellerId, store.id),
    loadEditorCatalog(store.sellerId, store.catalogMode === "selected" ? store.id : undefined),
  ]);
  if (!editor) notFound();

  const parsed = designSystemSchema.safeParse(editor.designSystem);
  const contact = (store.contact ?? {}) as { phone?: string; email?: string };

  return (
    <section className="mx-auto w-full max-w-6xl space-y-5 p-4 sm:p-6">
      <StorePageHeader store={store} />
      <DesignSystemEditor
        storeId={store.id}
        readOnly={store.status !== "active"}
        initial={{
          designSystem: parsed.success ? parsed.data : { colors: {}, typography: {}, spacing: {} },
          version: editor.designSystem.version,
          brand: { logoUrl: store.logoUrl ?? "", faviconUrl: store.faviconUrl ?? "", bannerUrl: store.bannerUrl ?? "" },
        }}
        store={{
          name: store.name,
          description: store.description,
          logoUrl: store.logoUrl,
          bannerUrl: store.bannerUrl,
          url: storeUrl(store.subdomain),
          contact: { phone: contact.phone ?? null, email: contact.email ?? null },
          social: publicStoreSocialLinks(store.contact),
          policies: [],
        }}
        defaultLocale={store.defaultLocale === "en" ? "en" : "ar"}
        catalog={catalog}
        fontClassName={storeFontVariables}
      />
    </section>
  );
}
