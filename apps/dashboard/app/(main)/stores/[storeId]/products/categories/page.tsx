import { TaxonomyPage, taxonomyPageMetadata } from "../categories-brands/taxonomy-page.data";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export function generateMetadata() {
  return taxonomyPageMetadata("category");
}

export default async function SellerCategoriesPage({ params }: { params: Promise<{ storeId: string }> }) {
  return <TaxonomyPage kind="category" storeId={(await params).storeId} />;
}
