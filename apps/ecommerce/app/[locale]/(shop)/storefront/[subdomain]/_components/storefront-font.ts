import { Almarai, Cairo, El_Messiri, IBM_Plex_Sans_Arabic, Noto_Kufi_Arabic, Readex_Pro, Tajawal } from "next/font/google";

/** The storefront's default typeface (Tallaby Classic); covers Arabic and Latin. */
export const storefrontFont = Readex_Pro({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-storefront",
});

/*
 * Fonts a store's design system may pick on Website › Design system
 * (PLAN.md P4-13; the list and CSS variables are STORE_FONTS in
 * @workspace/store-sections). Not preloaded: a browser only downloads a font
 * the page actually uses, so stores on the default font pay nothing.
 */
const cairo = Cairo({ subsets: ["arabic", "latin"], variable: "--font-sf-cairo", preload: false });
const tajawal = Tajawal({ subsets: ["arabic", "latin"], weight: ["400", "500", "700"], variable: "--font-sf-tajawal", preload: false });
const almarai = Almarai({ subsets: ["arabic", "latin"], weight: ["400", "700"], variable: "--font-sf-almarai", preload: false });
const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sf-plex-arabic",
  preload: false,
});
const notoKufi = Noto_Kufi_Arabic({ subsets: ["arabic", "latin"], variable: "--font-sf-noto-kufi", preload: false });
const elMessiri = El_Messiri({ subsets: ["arabic", "latin"], variable: "--font-sf-el-messiri", preload: false });

/** Class names defining every store font variable (put on the storefront root). */
export const storeFontVariables = [cairo, tajawal, almarai, plexArabic, notoKufi, elMessiri].map((font) => font.variable).join(" ");
