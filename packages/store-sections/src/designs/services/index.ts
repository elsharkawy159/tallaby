import type { Design } from "../builder";
import { serviceAreas } from "./service-areas";
import { serviceBooking } from "./service-booking";
import { serviceCards } from "./service-cards";
import { serviceFastFix } from "./service-fast-fix";
import { serviceJourney } from "./service-journey";
import { servicePlans } from "./service-plans";
import { servicePriceMenu } from "./service-price-menu";
import { serviceRepairRequest } from "./service-repair-request";
import { serviceSupport } from "./service-support";
import { serviceTradeIn } from "./service-trade-in";
import { serviceWarranty } from "./service-warranty";

/**
 * Services (Claude Design library W-a…W-k): what the store does besides
 * selling. Service names, prices, areas and times are text the seller types;
 * requests go to the store's forms, WhatsApp or contact page. First is the
 * default.
 */
export const SERVICE_DESIGNS: readonly Design[] = [
  serviceCards,
  serviceTradeIn,
  serviceBooking,
  serviceWarranty,
  servicePriceMenu,
  servicePlans,
  serviceJourney,
  serviceAreas,
  serviceRepairRequest,
  serviceFastFix,
  serviceSupport,
];
