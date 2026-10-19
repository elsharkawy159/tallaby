import { redirect } from "next/navigation";

/** The catalog choice moved to Store settings › General (2026-10-18); old links land there. */
export default async function StoreCatalogPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  redirect(`/stores/${encodeURIComponent(storeId)}/settings#catalog-mode`);
}
