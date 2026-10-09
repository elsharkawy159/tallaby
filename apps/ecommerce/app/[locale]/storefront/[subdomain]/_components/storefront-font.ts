import { Readex_Pro } from "next/font/google";

/** The storefront's single typeface; covers Arabic and Latin. */
export const storefrontFont = Readex_Pro({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-storefront",
});
