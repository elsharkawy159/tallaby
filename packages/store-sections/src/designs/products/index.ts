import type { Design } from "../builder";
import { productsClassic } from "./products-classic";
import { productsFeature } from "./products-feature";
import { productsGrid } from "./products-grid";
import { productsList } from "./products-list";
import { productsRail } from "./products-rail";
import { productsShelf } from "./products-shelf";

/** First is the default for new stores (the Classic template's product grid). */
export const PRODUCT_DESIGNS: readonly Design[] = [productsClassic, productsGrid, productsRail, productsFeature, productsShelf, productsList];
