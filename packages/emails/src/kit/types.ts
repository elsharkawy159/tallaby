import type { EmailLocale } from "../i18n/locale.js";
import type { EmailBrand } from "./brand.js";

/** One product line, already formatted for display. */
export interface EmailLineItem {
  name: string;
  variant?: string | null | undefined;
  quantity: number;
  /** Pre-formatted line total, e.g. "350 ج.م". */
  price?: string | null | undefined;
  imageUrl?: string | null | undefined;
  sellerName?: string | null | undefined;
  sku?: string | null | undefined;
}

export interface EmailAddress {
  fullName: string;
  /** Street, area, city… one display line each. */
  lines: string[];
  phone?: string | null | undefined;
}

export interface BaseEmailProps {
  locale?: EmailLocale | undefined;
  /** Defaults to Tallaby's. Customer mail for a storefront order passes the store's. */
  brand?: EmailBrand | undefined;
}

export interface EmailCustomer {
  name: string;
  email: string;
}
