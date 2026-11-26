import { storeUrl } from "@workspace/lib/storefront";
import { findActiveCustomDomainForSubdomain } from "@workspace/lib/storefront/server";
import { getSiteSellerSummary } from "./site-seller.server";

/** The seller's store address: its active custom domain, else {subdomain}.tallaby.com. */
const getSellerStoreUrl = async (subdomain: string | undefined) => {
  if (!subdomain) return null;
  const customDomain = await findActiveCustomDomainForSubdomain(subdomain).catch(() => null);
  return storeUrl(subdomain, customDomain);
};

export const getSiteData = async () => {
  const [
    summary,
    //  brands, attributes
  ] = await Promise.all([
    getSiteSellerSummary(),
    // getAllCategories(),
    // getSellerDocuments(),
  ]);
  const storeLink = await getSellerStoreUrl(summary.data?.subdomain);
  // This goes to the browser (SiteDataProvider): only what the shell reads.
  const seller = summary.success
    ? {
        success: true as const,
        data: { businessName: summary.data.businessName, logoUrl: summary.data.logoUrl },
      }
    : { success: false as const, data: undefined, error: summary.error };
  return {
    seller,
    storeLink,
    // brands,
    // attributes,
  };
};
