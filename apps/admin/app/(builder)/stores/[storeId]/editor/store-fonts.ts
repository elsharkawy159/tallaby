import { Alexandria, Almarai, Amiri, Aref_Ruqaa, Baloo_Bhaijaan_2, Cairo, Changa, El_Messiri, IBM_Plex_Sans_Arabic, Lalezar, Lemonada, Noto_Kufi_Arabic, Noto_Naskh_Arabic, Noto_Sans_Arabic, Readex_Pro, Reem_Kufi, Rubik, Tajawal } from "next/font/google";

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
const rubik = Rubik({ subsets: ["arabic", "latin"], variable: "--font-sf-rubik", preload: false });
const notoSansArabic = Noto_Sans_Arabic({ subsets: ["arabic", "latin"], variable: "--font-sf-noto-sans-arabic", preload: false });
const alexandria = Alexandria({ subsets: ["arabic", "latin"], variable: "--font-sf-alexandria", preload: false });
const changa = Changa({ subsets: ["arabic", "latin"], variable: "--font-sf-changa", preload: false });
const notoNaskh = Noto_Naskh_Arabic({ subsets: ["arabic", "latin"], variable: "--font-sf-noto-naskh", preload: false });
const lalezar = Lalezar({ subsets: ["arabic", "latin"], weight: "400", variable: "--font-sf-lalezar", preload: false });
const arefRuqaa = Aref_Ruqaa({ subsets: ["arabic", "latin"], weight: ["400", "700"], variable: "--font-sf-aref-ruqaa", preload: false });
const reemKufi = Reem_Kufi({ subsets: ["arabic", "latin"], variable: "--font-sf-reem-kufi", preload: false });
const balooBhaijaan = Baloo_Bhaijaan_2({ subsets: ["arabic", "latin"], variable: "--font-sf-baloo-bhaijaan", preload: false });
const lemonada = Lemonada({ subsets: ["arabic", "latin"], variable: "--font-sf-lemonada", preload: false });

/** Class names defining every store font variable. */
export const storeFontVariables = [readex, cairo, tajawal, almarai, plexArabic, notoKufi, elMessiri, amiri, rubik, notoSansArabic, alexandria, changa, notoNaskh, lalezar, arefRuqaa, reemKufi, balooBhaijaan, lemonada].map((font) => font.variable).join(" ");
