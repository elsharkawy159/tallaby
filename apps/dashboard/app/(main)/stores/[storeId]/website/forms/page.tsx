import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { listStoreForms } from "@workspace/lib/store-forms/server";
import { loadStorePage } from "@/lib/stores/store-page.server";
import { FormsList } from "./forms-list.client";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("forms") };
}

export default async function StoreFormsPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const store = await loadStorePage(storeId);
  const forms = await listStoreForms(store.sellerId, store.id);
  return <FormsList storeId={store.id} forms={forms} readOnly={store.status !== "active"} />;
}
