import { getFilterOptions } from "@/actions/products";
import { ProductsFilter } from "./ProductsFilter";

const ProductsFilterWrapper = async () => {
  const filterOptionsResult = await getFilterOptions();

  return <ProductsFilter filterOptions={filterOptionsResult} />;
};

export default ProductsFilterWrapper;
