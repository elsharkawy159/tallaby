"use client";

import * as React from "react";
import Image from "next/image";
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
  ClipboardList,
  Compass,
  Copy,
  ExternalLink,
  Eye,
  FileText,
  Grid3x3,
  GripVertical,
  Image as ImageIcon,
  Layers,
  LayoutPanelTop,
  LoaderCircle,
  Monitor,
  Palette,
  Plus,
  Redo2,
  Search,
  Smartphone,
  Tablet,
  Trash2,
  Undo2,
  UploadCloud,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@workspace/ui/lib/utils";
import { DemoCursor } from "./demo-cursor";
import { useDemoSteps, useTyped } from "./use-demo.client";

/** idle, pick up, drag, drop, select hero and type, change colour, publish, hold. */
const STEPS = [1000, 900, 700, 1400, 1900, 1300, 1200, 3200] as const;
const FINAL = STEPS.length - 1;
const COLORS = ["#2a2420", "#7a3b2e", "#1f3a5f", "#5b6b4a"];
const PRODUCTS = [
  { position: "15% 30%", name: "Linen shirt", price: "890" },
  { position: "60% 60%", name: "Wide trousers", price: "1,150" },
  { position: "90% 40%", name: "Knit set", price: "1,400" },
  { position: "40% 20%", name: "Overshirt", price: "990" },
];
const LIBRARY = [
  { key: "hero", rows: [[1, 1], [2]] },
  { key: "announcement", rows: [[1]] },
  { key: "products", rows: [[1, 1, 1, 1]] },
  { key: "reviews", rows: [[1, 1, 1]] },
  { key: "countdown", rows: [[1, 1, 1, 1]] },
  { key: "faq", rows: [[1], [1], [1]] },
] as const;

/** The website builder's shell, with a sample store being edited. The canvas stays in English, as a store's demo copy does. */
export function BuilderDemo() {
  const t = useTranslations("home.demo.builder");
  const { ref, step } = useDemoSteps<HTMLDivElement>(STEPS, FINAL);

  const dropped = step >= 3;
  const heroSelected = step === 4 || step === 5;
  const accent = step >= 5 ? COLORS[1]! : COLORS[0]!;
  const heading = useTyped("Summer linen edit", step < 4 ? "hidden" : step === 4 ? "typing" : "done", 70);
  const headingText = heading || "The new season edit";
  const saving = step === 3 || step === 5;
  const published = step >= 6;

  const rail = [
    { icon: Plus, label: t("rail.add"), on: true },
    { icon: Layers, label: t("rail.layers") },
    { icon: ImageIcon, label: t("rail.images") },
    { icon: Compass, label: t("rail.explore") },
    { icon: ClipboardList, label: t("rail.forms") },
    { icon: FileText, label: t("rail.pages") },
    { icon: Palette, label: t("rail.brand") },
  ];
  const cursor =
    step <= 1 ? { x: 16, y: 30 } : step === 2 ? { x: 55, y: 88 } : step === 3 ? { x: 58, y: 70 } : step === 4 ? { x: 48, y: 40 } : step === 5 ? { x: 90, y: 58 } : { x: 93, y: 5 };

  return (
    <div ref={ref} aria-hidden className="relative mx-auto max-w-[1160px] overflow-hidden rounded-[18px] border border-[#e7e9e8] bg-white text-[12.5px] text-[#333] shadow-[0_16px_44px_rgba(13,55,67,0.08)] min-[641px]:rounded-[20px]">
      <div className="flex h-12 items-center gap-1.5 border-b border-[#e7e9e8] bg-white px-2">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <span className="hidden size-8 flex-none place-items-center text-[#808080] min-[641px]:grid">
            <ArrowRight className="size-4 ltr:rotate-180" />
          </span>
          <span className="flex h-8 items-center gap-1.5 rounded-lg border border-[#d9dddc] px-2.5 font-semibold whitespace-nowrap text-[#171717]">
            {t("home")}
            <ChevronsUpDown className="size-[13px] opacity-60" />
          </span>
          <span dir="ltr" className="hidden items-center gap-1 font-latin text-xs font-medium whitespace-nowrap text-[#808080] min-[1081px]:flex">
            glow.tallaby.com <ExternalLink className="size-[13px]" />
          </span>
        </div>
        <div className="hidden rounded-[9px] border border-[#e7e9e8] bg-[#f7f7f7]/60 p-0.5 min-[641px]:flex">
          {[Monitor, Tablet, Smartphone].map((Icon, i) => (
            <span key={i} className={cn("grid h-7 w-8 place-items-center rounded-[7px] text-[#808080]", i === 0 && "bg-white text-[#145163] shadow-[0_1px_3px_rgba(0,0,0,0.1)]")}>
              <Icon className="size-[15px]" />
            </span>
          ))}
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-1">
          {[Undo2, Redo2].map((Icon, i) => (
            <span key={i} className="hidden size-8 flex-none place-items-center text-[#808080] min-[641px]:grid">
              <Icon className="size-4" />
            </span>
          ))}
          <span dir="ltr" className="hidden rounded-[7px] border border-[#e7e9e8] p-0.5 font-latin text-[10.5px] font-bold text-[#808080] uppercase min-[1081px]:flex">
            <b className="rounded-[5px] bg-[#f7f7f7] px-1.5 py-0.5 text-[#171717]">ar</b>
            <span className="px-1.5 py-0.5">en</span>
          </span>
          {[Grid3x3, Eye].map((Icon, i) => (
            <span key={i} className="hidden size-8 flex-none place-items-center text-[#808080] min-[1081px]:grid">
              <Icon className="size-4" />
            </span>
          ))}
          <span className="flex items-center gap-1 px-1 text-[11.5px] whitespace-nowrap text-[#808080]">
            {saving ? <LoaderCircle className="size-3 animate-spin" /> : <Check className="size-3" />}
            <span className="hidden min-[641px]:inline">{saving ? t("saving") : t("saved")}</span>
          </span>
          <span className={cn("flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold whitespace-nowrap transition-colors duration-300", published ? "bg-[#e5f6ea] text-[#15803d]" : "bg-amber-600 text-teal-900")}>
            {published ? <Check className="size-3.5" /> : <UploadCloud className="size-3.5" />}
            {published ? t("published") : t("publish")}
          </span>
        </div>
      </div>

      <div className="grid min-h-0 min-[641px]:grid-cols-[64px_200px_minmax(0,1fr)] min-[641px]:min-h-[520px] min-[1081px]:grid-cols-[64px_200px_minmax(0,1fr)_220px]">
        <nav className="hidden flex-col gap-1 border-e border-[#e7e9e8] p-1.5 min-[641px]:flex">
          {rail.map((item) => (
            <span key={item.label} className={cn("grid justify-items-center gap-0.5 rounded-lg px-1 py-1.5 text-[10px] text-[#808080]", item.on && "bg-[#eef3f4] font-bold text-[#145163]")}>
              <item.icon className="size-4" />
              {item.label}
            </span>
          ))}
        </nav>

        <aside className="flex items-center overflow-x-auto border-b border-[#edf1f2] p-3 [scrollbar-width:none] min-[641px]:flex-col min-[641px]:items-stretch min-[641px]:gap-2.5 min-[641px]:overflow-visible min-[641px]:border-e min-[641px]:border-b-0">
          <div className="hidden flex-col gap-2 min-[641px]:flex">
            <b className="text-[13px] text-[#171717]">{t("rail.add")}</b>
            <div className="flex rounded-[9px] bg-[#f4f5f5] p-[3px] text-[11px] font-semibold text-[#808080]">
              {[t("tabs.sections"), t("tabs.elements"), t("tabs.templates")].map((label, i) => (
                <span key={label} className={cn("grid h-[26px] flex-1 place-items-center rounded-[7px]", i === 0 && "bg-white text-[#171717] shadow-[0_1px_2px_rgba(0,0,0,0.08)]")}>
                  {label}
                </span>
              ))}
            </div>
            <span className="flex h-8 items-center gap-1.5 rounded-lg border border-[#e7e9e8] px-2 text-[11.5px] text-[#808080]">
              <Search className="size-3.5" />
              {t("searchSections")}
            </span>
          </div>
          <div className="flex gap-2 min-[641px]:grid min-[641px]:grid-cols-2">
            {LIBRARY.map((item) => (
              <div key={item.key} className={cn("w-[84px] flex-none rounded-lg border border-[#e7e9e8] p-1.5 text-center text-[11px] transition-[border-color,box-shadow] duration-200 min-[641px]:w-auto", item.key === "reviews" && (step === 1 || step === 2) && "border-teal-700 shadow-[0_0_0_2px_rgba(20,81,99,0.15)]")}>
                <div className="mb-1 grid h-10 gap-[3px] rounded-md bg-[#f4f6f6] p-[5px]" style={{ gridTemplateRows: `repeat(${item.rows.length},1fr)` }}>
                  {item.rows.map((row, r) => (
                    <div key={r} className="grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${row.length},1fr)` }}>
                      {row.map((_, c) => (
                        <i key={c} className="block rounded-[3px] bg-[#d5e0e3]" />
                      ))}
                    </div>
                  ))}
                </div>
                {t(`library.${item.key}`)}
              </div>
            ))}
          </div>
        </aside>

        <div className="relative overflow-hidden bg-[#f1f3f3] bg-[radial-gradient(#dfe4e5_1px,transparent_1px)] bg-[length:14px_14px] p-3 min-[641px]:px-[18px] min-[641px]:pt-3.5 min-[641px]:pb-[18px]">
          <div className="mb-2 flex justify-center">
            <span dir="ltr" className="rounded-full border border-[#e7e9e8] bg-white px-2 py-px font-latin text-[10px] font-semibold text-[#808080]">1280px</span>
          </div>
          <div dir="ltr" className="mx-auto max-w-[600px] overflow-hidden rounded-[10px] bg-[#f4efe8] font-latin shadow-[0_6px_24px_rgba(13,55,67,0.08)]">
            <div className="p-1.5 text-center text-[8.5px] font-semibold tracking-[0.08em] text-[#f4efe8] transition-colors duration-300" style={{ background: accent }}>
              Free delivery across Egypt on orders over 1,500 EGP
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center border-b border-[#2a2420]/10 px-4 py-3 text-[#2a2420]">
              <span className="flex gap-3 text-[9px] font-semibold tracking-[0.08em] uppercase"><span>New in</span><span>Women</span><span className="hidden min-[861px]:inline">Men</span></span>
              <b className="text-[15px] font-extrabold tracking-[0.32em]">ATELIER</b>
              <span className="flex justify-end gap-3 text-[9px] font-semibold tracking-[0.08em] uppercase"><span>Bag (0)</span></span>
            </div>
            <CanvasSection selected={heroSelected} label="Hero">
              <div className="relative h-[190px] overflow-hidden min-[861px]:h-[230px]">
                <Image src="/fashion.png" alt="" fill sizes="600px" className="object-cover" style={{ objectPosition: "center 30%" }} />
                <div className="absolute inset-0 bg-gradient-to-r from-[#140e0a]/60 to-[#140e0a]/10" />
                <div className="relative z-[1] flex h-full flex-col items-start justify-end gap-2 p-5 text-white">
                  <small className="text-[8.5px] font-semibold tracking-[0.16em] uppercase opacity-85">SS26 · Made in Cairo</small>
                  <b className="text-[26px] leading-[1.05] font-extrabold">{headingText}</b>
                  <em className="bg-[#f4efe8] px-3.5 py-[7px] text-[9px] font-bold tracking-[0.08em] uppercase not-italic transition-colors duration-300" style={{ color: accent }}>
                    Shop the collection
                  </em>
                </div>
              </div>
            </CanvasSection>
            <div className="grid grid-cols-4 gap-2.5 p-4 text-[#2a2420]">
              <div className="col-span-full flex items-baseline justify-between">
                <b className="text-xs font-extrabold tracking-[0.1em] uppercase">New arrivals</b>
                <u className="text-[9px]">View all</u>
              </div>
              {PRODUCTS.map((p) => (
                <div key={p.name} className="text-[9px] leading-[1.45] font-semibold">
                  <span className="relative mb-1.5 block aspect-[3/4] overflow-hidden bg-[#e8e0d6]">
                    <Image src="/fashion.png" alt="" fill sizes="130px" className="object-cover" style={{ objectPosition: p.position }} />
                  </span>
                  {p.name}
                  <br />
                  <i className="font-medium not-italic opacity-70">{p.price} EGP</i>
                </div>
              ))}
            </div>
            <div className={cn("mx-4 h-[3px] origin-center rounded-[3px] bg-amber-600 transition-transform duration-200", step === 2 ? "scale-x-100" : "scale-x-0")} />
            {dropped ? (
              <CanvasSection selected={step === 3} label="Reviews">
                <div className="grid grid-cols-3 gap-2 px-4 pt-1 pb-4">
                  {["The linen is so soft, fits true to size.", "Arrived in two days to Alex.", "Beautiful packaging and cut."].map((text) => (
                    <div key={text} className="border border-[#2a2420]/10 p-[9px] text-[8.5px] leading-[1.45] text-[#4a403a]">
                      <b className="mb-[3px] block text-[9px] tracking-[0.1em] transition-colors duration-300" style={{ color: accent }}>★★★★★</b>
                      {text}
                    </div>
                  ))}
                </div>
              </CanvasSection>
            ) : null}
          </div>
          {step === 1 || step === 2 ? (
            <span
              className="absolute z-[6] flex w-[150px] items-center gap-2 rounded-xl border-[1.5px] border-teal-700 bg-white px-2.5 py-2 text-xs font-bold text-teal-900 shadow-[0_18px_40px_rgba(13,55,67,0.22)] transition-[inset-inline-start,top] duration-700"
              style={step === 1 ? { insetInlineStart: "2%", top: "20%" } : { insetInlineStart: "32%", top: "78%" }}
            >
              <GripVertical className="size-4 text-teal-700" />
              {t("library.reviews")}
            </span>
          ) : null}
        </div>

        <aside className="hidden flex-col gap-2 border-s border-[#e7e9e8] p-3 min-[1081px]:flex">
          <div className="flex rounded-[9px] bg-[#f4f5f5] p-[3px] text-[11px] font-semibold text-[#808080]">
            {[t("props.content"), t("props.style")].map((label, i) => (
              <span key={label} className={cn("grid h-[26px] flex-1 place-items-center rounded-[7px]", i === 0 && "bg-white text-[#171717] shadow-[0_1px_2px_rgba(0,0,0,0.08)]")}>
                {label}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2.5 rounded-[10px] border border-[#e7e9e8] p-2">
            <span className="grid size-[30px] place-items-center rounded-lg bg-[#eef3f4] text-[#145163]">
              <LayoutPanelTop className="size-4" />
            </span>
            <div>
              <b className="block text-[12.5px] text-[#171717]">{t("library.hero")}</b>
              <small className="text-[10.5px] text-[#808080]">{t("props.page")}</small>
            </div>
          </div>
          <PropLabel>{t("props.heading")}</PropLabel>
          <div dir="ltr" className={cn("min-h-9 rounded-[10px] border border-[#e3ebed] bg-white px-2.5 py-2 text-start font-latin text-[12.5px] font-semibold text-[#1d2a2e]", step === 4 && "border-teal-700 shadow-[0_0_0_3px_rgba(20,81,99,0.1)]")}>
            {headingText}
          </div>
          <PropLabel>{t("props.button")}</PropLabel>
          <div dir="ltr" className="min-h-9 rounded-[10px] border border-[#e3ebed] bg-white px-2.5 py-2 text-start font-latin text-[12.5px] font-semibold text-[#1d2a2e]">Shop the collection</div>
          <PropLabel>{t("props.buttonColor")}</PropLabel>
          <div className="flex gap-2">
            {COLORS.map((color) => (
              <i key={color} className={cn("size-[26px] rounded-full shadow-[0_0_0_2px_#fff,0_0_0_3px_transparent] transition-shadow duration-200", color === accent && "shadow-[0_0_0_2px_#fff,0_0_0_4px_#2c6e80]")} style={{ background: color }} />
            ))}
          </div>
          <PropLabel>{t("props.layout")}</PropLabel>
          <div className="flex rounded-[9px] bg-[#f4f5f5] p-[3px] text-[11px] font-semibold text-[#808080]">
            {[t("props.split"), t("props.image"), t("props.center")].map((label, i) => (
              <span key={label} className={cn("grid h-[26px] flex-1 place-items-center rounded-[7px]", i === 1 && "bg-white text-[#171717] shadow-[0_1px_2px_rgba(0,0,0,0.08)]")}>
                {label}
              </span>
            ))}
          </div>
        </aside>
      </div>
      <DemoCursor x={cursor.x} y={cursor.y} visible={step < 7} className="hidden min-[641px]:block" />
    </div>
  );
}

function PropLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-[11.5px] font-semibold text-[#808080]">{children}</span>;
}

function CanvasSection({ selected, label, children }: { selected: boolean; label: string; children: React.ReactNode }) {
  const tools = [ChevronUp, ChevronDown, Copy, Trash2];
  return (
    <div className={cn("relative outline-2 -outline-offset-2 outline-transparent transition-[outline-color] duration-300", selected && "outline-[#145163]")}>
      <span className={cn("absolute top-0 left-0 z-[2] rounded-ee-md bg-[#145163] px-2 py-0.5 text-[10px] font-bold text-white transition-opacity duration-300", selected ? "opacity-100" : "opacity-0")}>{label}</span>
      <span className={cn("absolute top-1.5 right-1.5 z-[2] flex gap-0.5 rounded-lg border border-[#e7e9e8] bg-white p-0.5 shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-opacity duration-300", selected ? "opacity-100" : "opacity-0")}>
        {tools.map((Icon, i) => (
          <i key={i} className="grid size-5 place-items-center rounded-[5px] text-[#4a4a4a]">
            <Icon className="size-3" />
          </i>
        ))}
      </span>
      {children}
    </div>
  );
}
