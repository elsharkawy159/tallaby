import type { Design } from "../builder";
import { productsBento } from "./products-bento";
import { productsClassic } from "./products-classic";
import { productsFeature } from "./products-feature";
import { productsGrid } from "./products-grid";
import { productsList } from "./products-list";
import { productsPanelRail } from "./products-panel-rail";
import { productsRail } from "./products-rail";
import { productsRows } from "./products-rows";
import { productsShelf } from "./products-shelf";
import { productsTabbed } from "./products-tabbed";

/** First is the default for new stores (the Classic template's product grid). */
export const PRODUCT_DESIGNS: readonly Design[] = [productsClassic, productsGrid, productsRail, productsFeature, productsShelf, productsList, productsTabbed, productsBento, productsRows, productsPanelRail];
