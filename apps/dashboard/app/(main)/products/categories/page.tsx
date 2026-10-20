import { TaxonomyPage, taxonomyPageMetadata } from "../categories-brands/taxonomy-page.data";

export const dynamic = "force-dynamic";

export function generateMetadata() {
  return taxonomyPageMetadata("category");
}

export default function SellerCategoriesPage() {
  return <TaxonomyPage kind="category" />;
}
