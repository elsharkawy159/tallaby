import type { Design } from "../builder";
import { payDays } from "./pay-days";
import { payFaq } from "./pay-faq";
import { payInstallmentTable } from "./pay-installment-table";
import { payInstallments } from "./pay-installments";
import { payMethods } from "./pay-methods";
import { payOpenBox } from "./pay-open-box";
import { payPickup } from "./pay-pickup";
import { payPromise } from "./pay-promise";
import { payReceipt } from "./pay-receipt";
import { paySecure } from "./pay-secure";
import { payZones } from "./pay-zones";

/**
 * The Claude Design "Payment & delivery" sections (U-a…U-k), in design
 * order; the first is the default. Methods, zones, fees, rates and times are
 * text the seller types; only the installments design shows a product.
 */
export const PAYMENT_DESIGNS: readonly Design[] = [
  payMethods,
  payInstallments,
  payZones,
  payPromise,
  payOpenBox,
  payPickup,
  paySecure,
  payInstallmentTable,
  payDays,
  payReceipt,
  payFaq,
];
