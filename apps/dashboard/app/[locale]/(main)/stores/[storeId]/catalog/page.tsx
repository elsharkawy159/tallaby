import { redirect } from "next/navigation";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

/** The catalog choice moved to Store settings › General (2026-10-18); old links land there. */
export default async function StoreCatalogPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  redirect(`/stores/${encodeURIComponent(storeId)}/settings#catalog-mode`);
}
