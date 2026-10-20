import { storeUrl } from "@workspace/lib/storefront";
import { findActiveCustomDomainForSubdomain } from "@workspace/lib/storefront/server";
import { getSellerProfile } from "./seller";

/** The seller's store address: its active custom domain, else {subdomain}.tallaby.com. */
const getSellerStoreUrl = async (subdomain: string | undefined) => {
  if (!subdomain) return null;
  const customDomain = await findActiveCustomDomainForSubdomain(subdomain).catch(() => null);
  return storeUrl(subdomain, customDomain);
};

export const getSiteData = async () => {
  const [
    seller,
    //  brands, attributes
  ] = await Promise.all([
    getSellerProfile(),
    // getAllCategories(),
    // getSellerDocuments(),
  ]);
  const storeLink = await getSellerStoreUrl(seller.data?.subdomain);
  return {
    seller,
    storeLink,
    // brands,
    // attributes,
  };
};
