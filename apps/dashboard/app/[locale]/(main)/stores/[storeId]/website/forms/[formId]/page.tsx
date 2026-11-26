import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getStoreForm } from "@workspace/lib/store-forms/server";
import { loadWebsiteStorePage } from "@/lib/stores/website-page.server";
import { FormEditor } from "./form-editor.client";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("storeForms.editor");
  return { title: t("title") };
}

/** Field editor for one form; the form must belong to this store (404 otherwise). */
export default async function StoreFormEditorPage({ params }: { params: Promise<{ storeId: string; formId: string }> }) {
  const { storeId, formId } = await params;
  const store = await loadWebsiteStorePage(storeId);
  const form = await getStoreForm(store.sellerId, store.id, formId);
  if (!form) notFound();

  return (
    <FormEditor
      storeId={store.id}
      formId={form.id}
      readOnly={store.status !== "active"}
      initial={{
        name: form.name,
        description: form.description ?? "",
        status: form.status,
        fields: form.fields,
        settings: form.settings,
      }}
    />
  );
}
