import { Almarai, Amiri, Cairo, El_Messiri, IBM_Plex_Sans_Arabic, Noto_Kufi_Arabic, Readex_Pro, Tajawal } from "next/font/google";

/*
 * The storefront fonts (STORE_FONTS in @workspace/store-sections, loaded the
 * same way in apps/ecommerce `storefront-font.ts`), so the Website previews
 * show a store exactly as its typography renders. Not preloaded: a browser
 * only downloads the fonts a preview actually uses.
 */
const readex = Readex_Pro({ subsets: ["arabic", "latin"], weight: ["400", "500", "600", "700"], variable: "--font-storefront", preload: false });
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
const amiri = Amiri({ subsets: ["arabic", "latin"], weight: ["400", "700"], variable: "--font-sf-amiri", preload: false });

/** Class names defining every store font variable. */
export const storeFontVariables = [readex, cairo, tajawal, almarai, plexArabic, notoKufi, elMessiri, amiri].map((font) => font.variable).join(" ");
