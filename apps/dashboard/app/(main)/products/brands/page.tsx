import { TaxonomyPage, taxonomyPageMetadata } from "../categories-brands/taxonomy-page.data";

export const dynamic = "force-dynamic";

export function generateMetadata() {
  return taxonomyPageMetadata("brand");
}

export default function SellerBrandsPage() {
  return <TaxonomyPage kind="brand" />;
}
