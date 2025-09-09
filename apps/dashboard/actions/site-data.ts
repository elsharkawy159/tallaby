
import { getSellerProfile } from "./seller";

export const getSiteData = async () => {
  const [
    seller,
    //  brands, attributes
  ] = await Promise.all([
    getSellerProfile(),
    // getAllCategories(),
    // getSellerDocuments(),
  ]);
  return {
    seller,
    // brands,
    // attributes,
  };
};
