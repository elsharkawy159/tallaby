import * as React from "react";
import Image from "next/image";
import { FolderTree, Image as ImageIcon, Languages, Search, Sparkles, Zap } from "lucide-react";
import { getTranslations } from "next-intl/server";

/** The product being added: a Pexels shot on white, not used by any other demo. */
const PRODUCT_IMAGE = "https://images.pexels.com/photos/22432989/pexels-photo-22432989.jpeg?auto=compress&cs=tinysrgb&w=200";

const SERVICES = [
  { icon: ImageIcon, key: "input" },
  { icon: Languages, key: "copy" },
  { icon: FolderTree, key: "category" },
  { icon: Search, key: "seo" },
] as const;

/** The text column's list beside a still product form that AI has filled from one line. */
export async function AiDemo({ children }: { children: React.ReactNode }) {
  const [t, ts] = await Promise.all([getTranslations("home.demo.ai"), getTranslations("home.ai.services")]);

  return (
    <div className="grid items-center gap-12 min-[1081px]:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] min-[1081px]:gap-[72px]">
      <div className="flex flex-col items-start gap-[18px]">
        {children}
        <ul className="m-0 mt-1.5 flex w-full list-none flex-col gap-4 p-0">
          {SERVICES.map((service) => (
            <li key={service.key} className="flex items-start gap-3.5">
              <span className="grid size-10 flex-none place-items-center rounded-xl border border-line bg-white text-teal-700 [&_svg]:size-[18px]">
                <service.icon aria-hidden />
              </span>
              <div>
                <b className="block text-[15.5px] text-teal-900">{ts(`${service.key}Title`)}</b>
                <small className="text-[13.5px] text-ink-500">{ts(`${service.key}Body`)}</small>
              </div>
            </li>
          ))}
        </ul>
        <p className="flex items-center gap-2 text-sm text-ink-500">
          <Zap className="size-4 flex-none text-amber-700" aria-hidden />
          {t("credits")}
        </p>
      </div>

      <div aria-hidden className="flex flex-col gap-2 rounded-[20px] border border-line bg-white p-3.5 text-[13.5px] text-ink-700 shadow-soft min-[641px]:rounded-card min-[641px]:p-5">
        <b className="text-base text-teal-900">{t("title")}</b>
        <div className="flex h-[50px] items-center gap-2.5 rounded-[14px] border-[1.5px] border-[#dfe8ea] ps-3.5 pe-1.5">
          <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{t("input")}</span>
          <span className="flex h-[38px] items-center gap-1.5 rounded-[10px] bg-teal-900 px-3.5 text-[13px] font-bold text-white">
            <Sparkles className="size-[15px]" />
            {t("generate")}
          </span>
        </div>
        <div className="grid grid-cols-[76px_minmax(0,1fr)] items-start gap-3 min-[641px]:grid-cols-[96px_minmax(0,1fr)]">
          <span className="relative mt-1 aspect-square overflow-hidden rounded-[14px] bg-[#f1f5f6]">
            <Image src={PRODUCT_IMAGE} alt="" fill sizes="96px" className="object-cover" style={{ objectPosition: "center 60%" }} />
          </span>
          <div className="flex min-w-0 flex-col gap-1">
            <Field label={t("nameArLabel")}>{t("nameAr")}</Field>
            <Field label={t("nameEnLabel")}>
              <span dir="ltr">{t("nameEn")}</span>
            </Field>
          </div>
        </div>
        <Field label={t("descLabel")}>{t("desc")}</Field>
        <div className="grid grid-cols-[minmax(0,1fr)_96px] gap-2.5 min-[641px]:grid-cols-[minmax(0,1fr)_120px]">
          <Field label={t("categoryLabel")}>{t("category")}</Field>
          <Field label={t("priceLabel")}>
            <span className="font-latin">890</span> {t("egp")}
          </Field>
        </div>
        <div className="mt-1 rounded-[14px] border border-[#e6eef0] px-3.5 py-3">
          <small dir="ltr" className="block text-start text-[11.5px] text-[#4d6166]">glow.tallaby.com › products</small>
          <b className="block text-[14.5px] font-semibold text-[#1a0dab]">{t("seoTitle")}</b>
          <p className="text-[12.5px] text-[#4d5156]">{t("seoDesc")}</p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <span className="mt-1 block text-xs font-semibold text-ink-400">{label}</span>
      <p className="rounded-xl border border-[#cfe6d6] px-3 py-2 leading-[1.7]">{children}</p>
    </div>
  );
}
