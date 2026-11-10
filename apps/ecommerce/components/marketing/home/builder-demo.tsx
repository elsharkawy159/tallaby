import Image from "next/image";
import { Check, ChevronsUpDown, FileText, UploadCloud } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { cn } from "@workspace/ui/lib/utils";
import { formatNumber } from "@/lib/marketing/pricing.lib";

const ACCENT = "#b4532a";
const COLORS = ["#1f3d3a", ACCENT, "#2a2420", "#5b6b4a"];
const LIBRARY = ["hero", "announcement", "products", "reviews", "countdown", "faq"] as const;

/** A Pexels photo (the host is allowed in next.config `images.remotePatterns`). */
const pexels = (id: number, width: number) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${width}`;
/** One home-decor store (no people, no logos), from the approved furniture templates. */
const HERO_IMAGE = pexels(2079246, 1000);
const PRODUCTS = [
  { key: "lamp", image: pexels(6053887, 300), position: "center 35%", price: 2600 },
  { key: "vases", image: pexels(33126633, 300), position: "center 60%", price: 950 },
  { key: "armchair", image: pexels(32710106, 300), position: "35% 60%", price: 11500 },
  { key: "table", image: pexels(7607461, 300), position: "center 45%", price: 5900 },
] as const;

/**
 * The website editor, a still frame: the section library, a sample store on
 * the canvas with its hero selected, and (desktop) the hero's settings. The
 * store speaks the page's language, so the whole mockup mirrors in Arabic.
 */
export async function BuilderDemo() {
  const [t, locale] = await Promise.all([getTranslations("home.demo.builder"), getLocale()]);
  const ar = locale === "ar";

  return (
    <div aria-hidden className="mx-auto max-w-[1160px] overflow-hidden rounded-[20px] border border-[#e7e9e8] bg-white text-[12.5px] text-[#333] shadow-soft">
      <div className="flex h-12 items-center gap-2 border-b border-[#e7e9e8] px-2.5">
        <span className="flex h-8 items-center gap-1.5 rounded-[10px] border border-[#e3e6e5] px-2.5 font-bold whitespace-nowrap text-[#171717]">
          <FileText className="size-3.5 text-[#808080]" />
          {t("home")}
          <ChevronsUpDown className="size-[13px] opacity-60" />
        </span>
        <span className="ms-auto flex items-center gap-1 text-[11.5px] text-[#808080]">
          <Check className="size-3" />
          {t("saved")}
        </span>
        <span className="flex h-9 items-center gap-1.5 rounded-full bg-amber-600 px-3.5 font-bold text-teal-900">
          <UploadCloud className="size-4" />
          {t("publish")}
        </span>
      </div>

      <div className="grid min-[641px]:grid-cols-[180px_minmax(0,1fr)] min-[1081px]:grid-cols-[180px_minmax(0,1fr)_210px]">
        <aside className="flex gap-2 overflow-hidden border-b border-[#edf1f2] p-3 min-[641px]:flex-col min-[641px]:border-e min-[641px]:border-b-0">
          <b className="hidden text-[14px] text-[#171717] min-[641px]:block">{t("rail.add")}</b>
          <div className="flex gap-2 min-[641px]:grid min-[641px]:grid-cols-2">
            {LIBRARY.map((key) => (
              <span key={key} className="w-[78px] flex-none rounded-[10px] border border-[#e7e9e8] p-1.5 text-center text-[11px] min-[641px]:w-auto">
                <i className="mb-1 block h-8 rounded-md bg-[#eef2f3]" />
                <span className="block truncate">{t(`library.${key}`)}</span>
              </span>
            ))}
          </div>
        </aside>

        <div className="bg-[#eef0ef] p-3 min-[641px]:p-[18px]">
          <div lang={ar ? "ar" : "en"} className={cn("mx-auto max-w-[600px] overflow-hidden rounded-[14px] bg-[#f7f3ee] text-[#2a2420]", !ar && "font-latin")}>
            <p className="p-1.5 text-center text-[8.5px] font-semibold text-[#f7f3ee]" style={{ background: ACCENT }}>
              {t("store.announcement")}
            </p>
            <div className="flex items-center justify-between bg-white px-4 py-2.5">
              <b className="text-[14px] font-extrabold">{t("store.name")}</b>
              <span className="rounded-full bg-[#2a2420] px-2 py-[3px] text-[9px] font-semibold text-white">{t("store.bag")}</span>
            </div>
            {/* The selected section: outlined, with its name on the corner, as in the editor. */}
            <div className="relative m-3 h-[172px] overflow-hidden rounded-[10px] outline-2 outline-offset-2 outline-[#145163] min-[861px]:h-[204px]">
              <Image src={HERO_IMAGE} alt="" fill sizes="(max-width: 640px) 100vw, 600px" className="object-cover" style={{ objectPosition: "center 55%" }} />
              <span className="absolute inset-0 bg-[#1b1410]/45" />
              <span className="absolute start-0 top-0 rounded-ee-md bg-[#145163] px-2 py-0.5 text-[10px] font-bold text-white">{t("library.hero")}</span>
              <div className="relative flex h-full max-w-[75%] flex-col items-start justify-end gap-1.5 p-4 text-white">
                <b className={cn("text-[21px] font-extrabold min-[861px]:text-[25px]", ar ? "leading-[1.3]" : "leading-[1.08]")}>{t("store.heading")}</b>
                <span className="text-[9px] opacity-85">{t("store.body")}</span>
                <em className="mt-1 rounded-full bg-white px-3.5 py-1.5 text-[9px] font-bold not-italic" style={{ color: ACCENT }}>
                  {t("store.shop")}
                </em>
              </div>
            </div>
            <b className="block px-3 text-[11px] font-extrabold">{t("store.arrivals")}</b>
            <div className="grid grid-cols-4 gap-2 p-3 text-[9px]">
              {PRODUCTS.map((p) => (
                <span key={p.key} className="overflow-hidden rounded-[8px] bg-white">
                  <span className="relative block aspect-[4/5]">
                    <Image src={p.image} alt="" fill sizes="140px" className="object-cover" style={{ objectPosition: p.position }} />
                  </span>
                  <span className="block truncate px-1.5 pt-1 font-semibold">{t(`store.products.${p.key}`)}</span>
                  <b className="block px-1.5 pb-1.5 whitespace-nowrap">{t("store.price", { amount: formatNumber(p.price) })}</b>
                </span>
              ))}
            </div>
          </div>
        </div>

        <aside className="hidden flex-col gap-2 border-s border-[#e7e9e8] p-3 min-[1081px]:flex">
          <b className="text-[13px] text-[#171717]">{t("library.hero")}</b>
          <span className="text-[11.5px] font-semibold text-[#808080]">{t("props.heading")}</span>
          <span className="rounded-[10px] border border-teal-700 px-2.5 py-2 font-semibold text-[#1d2a2e]">{t("store.heading")}</span>
          <span className="text-[11.5px] font-semibold text-[#808080]">{t("props.button")}</span>
          <span className="rounded-[10px] border border-[#e3ebed] px-2.5 py-2 font-semibold text-[#1d2a2e]">{t("store.shop")}</span>
          <span className="text-[11.5px] font-semibold text-[#808080]">{t("props.buttonColor")}</span>
          <span className="flex gap-2">
            {COLORS.map((color) => (
              <i key={color} className={cn("size-[26px] rounded-full", color === ACCENT && "outline-2 outline-offset-2 outline-[#2c6e80]")} style={{ background: color }} />
            ))}
          </span>
        </aside>
      </div>
    </div>
  );
}
