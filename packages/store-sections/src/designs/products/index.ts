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
import { productsBoxed } from "./products-boxed";
import { productsCampaign } from "./products-campaign";
import { productsCarousel } from "./products-carousel";
import { productsCategoryCarousel } from "./products-category-carousel";
import { productsDeal } from "./products-deal";
import { productsMinimal } from "./products-minimal";
import { productsSpotlight } from "./products-spotlight";
import { productsTabsGrid } from "./products-tabs-grid";

/** First is the default for new stores (the Classic template's product grid). */
export const PRODUCT_DESIGNS: readonly Design[] = [productsClassic, productsGrid, productsRail, productsFeature, productsShelf, productsList, productsTabbed, productsBento, productsRows, productsPanelRail, productsTabsGrid, productsCarousel, productsCategoryCarousel, productsSpotlight, productsMinimal, productsBoxed, productsCampaign, productsDeal];
