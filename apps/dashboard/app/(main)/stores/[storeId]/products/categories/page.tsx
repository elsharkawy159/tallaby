import { TaxonomyPage, taxonomyPageMetadata } from "../categories-brands/taxonomy-page.data";

export const dynamic = "force-dynamic";

export function generateMetadata() {
  return taxonomyPageMetadata("category");
}

export default async function SellerCategoriesPage({ params }: { params: Promise<{ storeId: string }> }) {
  return <TaxonomyPage kind="category" storeId={(await params).storeId} />;
}
