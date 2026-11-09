"use client";

import * as React from "react";
import { FileText, FolderTree, Image as ImageIcon, Languages, Search, Sparkles, Type, Zap } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { cn } from "@workspace/ui/lib/utils";
import { DemoCursor } from "./demo-cursor";
import { useDemoSteps, useTyped } from "./use-demo.client";

/** idle, typing the input, click, photo and price, names, description, category, SEO, hold. */
const STEPS = [900, 1900, 1100, 900, 1500, 2000, 900, 2200, 4200] as const;
const DONE = STEPS.length - 1;

/** The product being added: a Pexels shot on white, not used by any other demo (the input text in home.demo.ai). */
const PRODUCT_IMAGE = "https://images.pexels.com/photos/22432989/pexels-photo-22432989.jpeg?auto=compress&cs=tinysrgb&w=300";

/** Which row of the list beside the demo is lit, per step. */
const ROW_AT = [-1, -1, 0, 0, 1, 1, 2, 3, -1];

const SERVICES = [
  { icon: ImageIcon, key: "input" },
  { icon: Languages, key: "copy" },
  { icon: FolderTree, key: "category" },
  { icon: Search, key: "seo" },
] as const;

/** The text column's list and the product form filling in beside it. They share the same running step. */
export function AiDemo({ children }: { children: React.ReactNode }) {
  const t = useTranslations("home.demo.ai");
  const ts = useTranslations("home.ai.services");
  const { ref, step } = useDemoSteps<HTMLDivElement>(STEPS, DONE);

  const input = useTyped(t("input"), step === 0 ? "hidden" : step === 1 ? "typing" : "done", 45);
  const nameAr = useTyped(t("nameAr"), step < 4 ? "hidden" : step === 4 ? "typing" : "done", 40);
  const nameEn = useTyped(t("nameEn"), step < 4 ? "hidden" : step === 4 ? "typing" : "done", 28);
  const desc = useTyped(t("desc"), step < 5 ? "hidden" : step === 5 ? "typing" : "done", 16);
  const seoTitle = useTyped(t("seoTitle"), step < 7 ? "hidden" : step === 7 ? "typing" : "done", 24);
  const seoDesc = useTyped(t("seoDesc"), step < 7 ? "hidden" : step === 7 ? "typing" : "done", 12);
  const row = ROW_AT[step] ?? -1;
  const loading = step >= 3 && step < 7;

  return (
    <div className="grid items-center gap-12 min-[1081px]:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] min-[1081px]:gap-[72px]">
      <div className="flex flex-col items-start gap-[18px]">
      {children}
      <ul className="m-0 mt-1.5 flex w-full list-none flex-col gap-1.5 p-0">
        {SERVICES.map((service, i) => (
          <li
            key={service.key}
            className={cn(
              "flex items-start gap-3.5 rounded-2xl px-3.5 py-3 transition-[background-color,box-shadow] duration-300",
              row === i && "bg-white shadow-[0_8px_24px_rgba(13,55,67,0.08)]",
            )}
          >
            <span className={cn("grid size-10 flex-none place-items-center rounded-xl border transition-colors duration-300 [&_svg]:size-[18px]", row === i ? "border-transparent bg-teal-700 text-white" : "border-line bg-white text-teal-700")}>
              <service.icon aria-hidden />
            </span>
            <div>
              <b className="block text-[15.5px] text-teal-900">{ts(`${service.key}Title`)}</b>
              <small className="text-[13.5px] text-[#5f7277]">{ts(`${service.key}Body`)}</small>
            </div>
          </li>
        ))}
      </ul>
      <p className="flex items-center gap-2 text-sm text-ink-500">
        <Zap className="size-4 flex-none text-amber-700" aria-hidden />
        {t("credits")}
      </p>
      </div>

      <div ref={ref} aria-hidden className="relative flex flex-col gap-3.5 overflow-hidden rounded-[20px] border border-line bg-white p-3.5 shadow-[0_16px_40px_rgba(13,55,67,0.07)] min-[641px]:rounded-card min-[641px]:p-5">
        <div className="flex items-center justify-between">
          <b className="text-base text-teal-900">{t("title")}</b>
          <span className="flex items-center gap-1 rounded-full border border-amber-100 bg-amber-50 px-2.5 py-[3px] text-xs font-bold text-[#8a5300]">
            <Zap className="size-[13px]" />
            <span className="font-latin">{step >= 3 ? 99 : 100}</span> {t("creditsUnit")}
          </span>
        </div>
        <div className="flex h-[50px] items-center gap-2.5 rounded-[14px] border-[1.5px] border-[#dfe8ea] ps-3.5 pe-1.5 text-[#8aa0a6]">
          <Type className="size-4 flex-none" />
          <FileText className="size-4 flex-none" />
          <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[#33464b]">{input}</span>
          <span className={cn("flex h-[38px] flex-none items-center gap-1.5 rounded-[10px] bg-teal-900 px-3.5 text-[13px] font-bold text-white transition-transform duration-150", step === 2 && "scale-[0.94] delay-700")}>
            <Sparkles className="size-[15px]" />
            {t("generate")}
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="grid grid-cols-[76px_minmax(0,1fr)] items-start gap-3 min-[641px]:grid-cols-[96px_minmax(0,1fr)]">
            <span className="relative aspect-square overflow-hidden rounded-[14px] border border-[#e6eef0] bg-[#f1f5f6]">
              {step >= 1 ? <Image src={PRODUCT_IMAGE} alt={t("imageAlt")} fill sizes="96px" className="object-cover" style={{ objectPosition: "center 60%" }} /> : null}
            </span>
            <div className="flex flex-col gap-1">
              <FieldLabel>{t("nameArLabel")}</FieldLabel>
              <FieldValue loading={loading && !nameAr} done={step > 4}>{nameAr}</FieldValue>
              <FieldLabel>{t("nameEnLabel")}</FieldLabel>
              <FieldValue loading={loading && !nameEn} done={step > 4}>
                <span dir="ltr">{nameEn}</span>
              </FieldValue>
            </div>
          </div>
          <FieldLabel>{t("descLabel")}</FieldLabel>
          <FieldValue loading={loading && !desc} done={step > 5} className="min-h-[66px] leading-[1.7]">{desc}</FieldValue>
          <div className="grid grid-cols-[minmax(0,1fr)_96px] gap-2.5 min-[641px]:grid-cols-[minmax(0,1fr)_120px]">
            <div>
              <FieldLabel>{t("categoryLabel")}</FieldLabel>
              <FieldValue loading={loading && step < 6} done={step >= 6} className="flex items-center">
                {step >= 6 ? <span className="truncate rounded-full bg-teal-50 px-2.5 py-px text-[12.5px] font-semibold text-teal-900">{t("category")}</span> : null}
              </FieldValue>
            </div>
            <div>
              <FieldLabel>{t("priceLabel")}</FieldLabel>
              <FieldValue loading={loading && step < 3} done={step >= 3}>
                {step >= 3 ? (
                  <span>
                    <span className="font-latin">890</span> {t("egp")}
                  </span>
                ) : null}
              </FieldValue>
            </div>
          </div>
          <div className={cn("rounded-[14px] border border-[#e6eef0] px-3.5 py-3 transition-opacity duration-300", step >= 7 ? "opacity-100" : "opacity-35")}>
            <small dir="ltr" className="block text-start text-[11.5px] text-[#4d6166]">glow.tallaby.com › products</small>
            <b className="block min-h-[22px] text-[14.5px] font-semibold text-[#1a0dab]">{seoTitle}</b>
            <p className="min-h-5 text-[12.5px] text-[#4d5156]">{seoDesc}</p>
          </div>
        </div>
        {/* On the input before typing starts, then on Generate before it is pressed (the press waits 700ms for it). */}
        <DemoCursor x={step <= 1 ? 30 : step === 2 ? 86 : 60} y={step <= 2 ? 16 : 85} visible={step <= 3} />
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="mt-1 block text-xs font-semibold text-ink-400">{children}</span>;
}

function FieldValue({ loading, done, className, children }: { loading?: boolean; done?: boolean; className?: string; children?: React.ReactNode }) {
  return (
    <div
      className={cn(
        "relative min-h-10 overflow-hidden rounded-xl border border-[#e6eef0] bg-[#fbfcfd] px-3 py-2 text-start text-[13.5px] text-[#2d4146] transition-colors duration-300",
        done && "border-[#cfe6d6] bg-white",
        loading && "animate-pulse bg-[#eef4f5]",
        className,
      )}
    >
      {children}
    </div>
  );
}
