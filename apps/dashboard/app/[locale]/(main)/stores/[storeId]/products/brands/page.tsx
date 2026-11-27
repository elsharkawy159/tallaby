import { TaxonomyPage, taxonomyPageMetadata } from "../categories-brands/taxonomy-page.data";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export function generateMetadata() {
  return taxonomyPageMetadata("brand");
}

/** Products › Brands: the store's own brand list (flat, no sub-brands), like Products › Categories. */
export default async function SellerBrandsPage({ params }: { params: Promise<{ storeId: string }> }) {
  return <TaxonomyPage kind="brand" storeId={(await params).storeId} />;
}
