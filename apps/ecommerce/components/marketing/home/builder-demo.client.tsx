"use client";

import * as React from "react";
import Image from "next/image";
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
  Copy,
  Ellipsis,
  ExternalLink,
  Eye,
  FileText,
  GripVertical,
  Image as ImageIcon,
  Keyboard,
  Layers,
  LayoutPanelTop,
  LoaderCircle,
  Monitor,
  MousePointerClick,
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
const COLORS = ["#1f3d3a", "#b4532a", "#2a2420", "#5b6b4a"];

/** A Pexels photo (the host is allowed in next.config `images.remotePatterns`). */
const pexels = (id: number, width: number) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${width}`;

/**
 * One home-decor store, nine different photos (no people, no logos), none
 * shared with the hero or AI demos (they use the local /cosmetics.jpg and
 * /accessories.jpg). Taken from the approved furniture templates.
 */
const HERO_IMAGE = pexels(2079246, 1200);
const CATEGORIES = [
  { name: "Living", image: pexels(17168851, 400), position: "center 60%" },
  { name: "Lighting", image: pexels(16433482, 400), position: "center 45%" },
  { name: "Chairs", image: pexels(29350087, 400), position: "center 60%" },
  { name: "Decor", image: pexels(27180805, 400), position: "center 55%" },
];
const PRODUCTS = [
  { image: pexels(6053887, 500), position: "center 35%", name: "Brass table lamp", price: "2,600", was: "2,950" },
  { image: pexels(33126633, 500), position: "center 60%", name: "Sand jug vases", price: "950" },
  { image: pexels(32710106, 500), position: "35% 60%", name: "Walnut armchair", price: "11,500" },
  { image: pexels(7607461, 500), position: "center 45%", name: "Oak coffee table", price: "5,900" },
];
const LIBRARY = [
  { key: "hero", rows: [[1, 1], [2]] },
  { key: "announcement", rows: [[1]] },
  { key: "products", rows: [[1, 1, 1, 1]] },
  { key: "reviews", rows: [[1, 1, 1]] },
  { key: "countdown", rows: [[1, 1, 1, 1]] },
  { key: "faq", rows: [[1], [1], [1]] },
] as const;

/**
 * The website editor with a sample store being edited, drawn after the
 * redesigned editor (Claude Design "Seller Editor v3", packages/store-editor
 * since 7950ccdb): rail on the start side with the Add panel open, canvas in
 * the middle, the inspector on the end side. The canvas stays in English, as
 * a store's demo copy does.
 */
export function BuilderDemo() {
  const t = useTranslations("home.demo.builder");
  const { ref, step } = useDemoSteps<HTMLDivElement>(STEPS, FINAL);

  const dropped = step >= 3;
  const heroSelected = step === 4 || step === 5;
  const accent = step >= 5 ? COLORS[1]! : COLORS[0]!;
  const heading = useTyped("Calm corners for home", step < 4 ? "hidden" : step === 4 ? "typing" : "done", 70);
  const headingText = heading || "Made for living rooms";
  const saving = step === 3 || step === 5;
  const published = step >= 6;

  const rail = [
    { icon: Plus, label: t("rail.add"), on: true },
    { icon: Layers, label: t("rail.layers") },
    { icon: FileText, label: t("rail.pages") },
    { icon: ImageIcon, label: t("rail.media") },
    { icon: Palette, label: t("rail.brand") },
  ];
  const cursor =
    step <= 1 ? { x: 16, y: 30 } : step === 2 ? { x: 52, y: 88 } : step === 3 ? { x: 55, y: 70 } : step === 4 ? { x: 45, y: 40 } : step === 5 ? { x: 89, y: 60 } : { x: 95, y: 5 };

  return (
    <div ref={ref} aria-hidden className="relative mx-auto max-w-[1160px] overflow-hidden rounded-[18px] border border-[#e7e9e8] bg-white text-[12.5px] text-[#333] shadow-[0_16px_44px_rgba(13,55,67,0.08)] min-[641px]:rounded-[20px]">
      <div className="flex h-12 items-center gap-1.5 border-b border-[#e7e9e8] bg-white px-2 min-[641px]:h-[52px] min-[641px]:px-2.5">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="hidden size-8 flex-none place-items-center text-[#808080] min-[641px]:grid">
            <ArrowRight className="size-4 ltr:rotate-180" />
          </span>
          <span className="flex h-8 items-center gap-1.5 rounded-[10px] border border-[#e3e6e5] bg-white px-2.5 font-bold whitespace-nowrap text-[#171717]">
            <FileText className="size-3.5 text-[#808080]" />
            {t("home")}
            <ChevronsUpDown className="size-[13px] opacity-60" />
          </span>
          <span dir="ltr" className="hidden items-center gap-1 font-latin text-xs font-medium whitespace-nowrap text-[#808080] min-[1081px]:flex">
            dar.tallaby.com <ExternalLink className="size-[13px]" />
          </span>
        </div>
        <div className="hidden rounded-[11px] border border-[#e7e9e8] bg-[#f4f5f5] p-[3px] min-[641px]:flex">
          {[Monitor, Tablet, Smartphone].map((Icon, i) => (
            <span key={i} className={cn("grid h-7 w-9 place-items-center rounded-[8px] text-[#808080]", i === 0 && "bg-white text-[#171717] shadow-[0_1px_3px_rgba(0,0,0,0.1)]")}>
              <Icon className="size-[15px]" />
            </span>
          ))}
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-1">
          {[Undo2, Redo2].map((Icon, i) => (
            <span key={i} className="hidden size-8 flex-none place-items-center text-[#a3a3a3] min-[641px]:grid">
              <Icon className="size-4" />
            </span>
          ))}
          <span dir="ltr" className="hidden rounded-[9px] border border-[#e7e9e8] p-[3px] font-latin text-[10.5px] font-bold text-[#808080] min-[1081px]:flex">
            <b className="rounded-[6px] bg-teal-900 px-1.5 py-0.5 text-white">AR</b>
            <span className="px-1.5 py-0.5">EN</span>
          </span>
          {[Eye, Ellipsis].map((Icon, i) => (
            <span key={i} className="hidden size-8 flex-none place-items-center text-[#808080] min-[1081px]:grid">
              <Icon className="size-4" />
            </span>
          ))}
          <span className="flex items-center gap-1 px-1 text-[11.5px] whitespace-nowrap text-[#808080]">
            {saving ? <LoaderCircle className="size-3 animate-spin" /> : <Check className="size-3" />}
            <span className="hidden min-[641px]:inline">{saving ? t("saving") : t("saved")}</span>
          </span>
          <span
            className={cn(
              "flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[12.5px] font-bold whitespace-nowrap transition-colors duration-300",
              published ? "bg-[#e5f6ea] text-[#15803d]" : "bg-amber-600 text-teal-900 shadow-[0_6px_14px_rgba(253,173,40,0.35)]",
            )}
          >
            {published ? <Check className="size-4" /> : <UploadCloud className="size-4" />}
            {published ? t("published") : t("publish")}
          </span>
        </div>
      </div>

      <div className="grid min-h-0 min-[641px]:min-h-[520px] min-[641px]:grid-cols-[66px_196px_minmax(0,1fr)] min-[1081px]:grid-cols-[66px_204px_minmax(0,1fr)_224px]">
        <nav className="hidden flex-col items-stretch gap-1 border-e border-[#e7e9e8] p-1.5 min-[641px]:flex">
          {rail.map((item) => (
            <span
              key={item.label}
              className={cn("grid justify-items-center gap-1 rounded-[12px] px-1 py-2 text-[10px] font-medium text-[#6b7577]", item.on && "bg-[#eef3f4] font-bold text-teal-900")}
            >
              <item.icon className="size-[18px]" />
              {item.label}
            </span>
          ))}
          <span className="mt-auto grid justify-items-center gap-1 rounded-[12px] px-1 py-2 text-[10px] font-medium text-[#6b7577]">
            <Keyboard className="size-[18px]" />
            {t("rail.shortcuts")}
          </span>
        </nav>

        <aside className="flex items-center overflow-x-auto border-b border-[#edf1f2] p-3 [scrollbar-width:none] min-[641px]:flex-col min-[641px]:items-stretch min-[641px]:gap-2.5 min-[641px]:overflow-visible min-[641px]:border-e min-[641px]:border-b-0">
          <div className="hidden flex-col gap-2 min-[641px]:flex">
            <b className="text-[14px] text-[#171717]">{t("rail.add")}</b>
            <div className="flex rounded-[10px] bg-[#f4f5f5] p-[3px] text-[10.5px] font-semibold text-[#808080]">
              {[t("tabs.sections"), t("tabs.elements"), t("tabs.templates")].map((label, i) => (
                <span key={label} className={cn("flex h-[26px] min-w-0 flex-1 items-center justify-center truncate rounded-[7px] px-1", i === 0 && "bg-white text-[#171717] shadow-[0_1px_2px_rgba(0,0,0,0.08)]")}>
                  {label}
                </span>
              ))}
            </div>
            <span className="flex h-8 items-center gap-1.5 rounded-full border border-[#e7e9e8] px-2.5 text-[11.5px] text-[#9a9a9a]">
              <Search className="size-3.5" />
              {t("searchSections")}
            </span>
          </div>
          <div className="flex gap-2 min-[641px]:grid min-[641px]:grid-cols-2">
            {LIBRARY.map((item) => (
              <div
                key={item.key}
                className={cn(
                  "w-[84px] flex-none rounded-[10px] border border-[#e7e9e8] bg-white p-1.5 text-center text-[11px] transition-[border-color,box-shadow] duration-200 min-[641px]:w-auto",
                  item.key === "reviews" && (step === 1 || step === 2) && "border-teal-700 shadow-[0_0_0_2px_rgba(20,81,99,0.15)]",
                )}
              >
                <div className="mb-1 grid h-10 gap-[3px] rounded-md bg-[#f4f6f6] p-[5px]" style={{ gridTemplateRows: `repeat(${item.rows.length},1fr)` }}>
                  {item.rows.map((row, r) => (
                    <div key={r} className="grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${row.length},1fr)` }}>
                      {row.map((_, c) => (
                        <i key={c} className="block rounded-[3px] bg-[#d5e0e3]" />
                      ))}
                    </div>
                  ))}
                </div>
                <span className="block truncate">{t(`library.${item.key}`)}</span>
              </div>
            ))}
          </div>
        </aside>

        <div className="relative overflow-hidden bg-[#eef0ef] bg-[radial-gradient(#d9dedd_1px,transparent_1px)] bg-[length:14px_14px] p-3 min-[641px]:px-[18px] min-[641px]:pt-4 min-[641px]:pb-[18px]">
          <div dir="ltr" className="mx-auto max-w-[600px] overflow-hidden rounded-[14px] bg-[#f7f3ee] font-latin text-[#2a2420] shadow-[0_10px_30px_rgba(13,55,67,0.1)]">
            <div className="p-1.5 text-center text-[8.5px] font-semibold tracking-[0.08em] text-[#f7f3ee] transition-colors duration-300" style={{ background: accent }}>
              Free delivery across Egypt on orders over 1,500 EGP
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center bg-white px-4 py-2.5">
              <span className="flex gap-3 text-[9px] font-semibold tracking-[0.06em] text-[#2a2420]/75">
                <span>Living</span>
                <span>Lighting</span>
                <span className="hidden min-[861px]:inline">Decor</span>
              </span>
              <b className="flex items-center gap-1.5 text-[14px] font-extrabold tracking-[0.28em]">
                <i className="block size-2 rounded-full transition-colors duration-300" style={{ background: accent }} />
                DAR
              </b>
              <span className="flex items-center justify-end gap-2.5 text-[9px] font-semibold">
                <Search className="size-3 opacity-70" />
                <span className="rounded-full bg-[#2a2420] px-2 py-[3px] text-white">Bag · 2</span>
              </span>
            </div>
            <CanvasSection selected={heroSelected} label="Hero">
              <div className="px-3 pt-3">
                <div className="relative h-[172px] overflow-hidden rounded-[10px] min-[861px]:h-[204px]">
                  <Image src={HERO_IMAGE} alt="" fill sizes="(max-width: 640px) 100vw, 600px" className="object-cover" style={{ objectPosition: "center 55%" }} />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#1b1410]/75 via-[#1b1410]/35 to-transparent" />
                  <div className="relative z-[1] flex h-full max-w-[72%] flex-col items-start justify-end gap-1.5 p-4 text-white min-[861px]:p-5">
                    <small className="rounded-full bg-white/15 px-2 py-[3px] text-[8px] font-semibold tracking-[0.14em] uppercase backdrop-blur-sm">New season · Made in Egypt</small>
                    <b className="text-[21px] leading-[1.08] font-extrabold min-[861px]:text-[25px]">{headingText}</b>
                    <span className="text-[9px] leading-[1.4] opacity-85">Lamps, chairs and handmade pieces for a calmer home.</span>
                    <span className="mt-1 flex items-center gap-2.5">
                      <em className="rounded-full bg-white px-3.5 py-[6px] text-[9px] font-bold not-italic transition-colors duration-300" style={{ color: accent }}>
                        Shop the collection
                      </em>
                      <span className="text-[9px] font-semibold underline underline-offset-2">Our story</span>
                    </span>
                  </div>
                </div>
              </div>
            </CanvasSection>
            <div className="grid grid-cols-4 gap-2 px-3 pt-3.5">
              <b className="col-span-full text-[11px] font-extrabold">Shop by room</b>
              {CATEGORIES.map((c) => (
                <span key={c.name} className="relative block h-[46px] overflow-hidden rounded-[8px] min-[861px]:h-[54px]">
                  <Image src={c.image} alt="" fill sizes="140px" className="object-cover" style={{ objectPosition: c.position }} />
                  <span className="absolute inset-0 bg-gradient-to-t from-[#1b1410]/65 to-transparent" />
                  <span className="absolute start-2 bottom-1.5 text-[9px] font-bold text-white">{c.name}</span>
                </span>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-2 px-3 pt-3.5 pb-3.5">
              <div className="col-span-full flex items-baseline justify-between">
                <b className="text-[11px] font-extrabold">New arrivals</b>
                <span className="text-[9px] font-semibold opacity-70">View all →</span>
              </div>
              {PRODUCTS.map((p) => (
                <div key={p.name} className="overflow-hidden rounded-[8px] bg-white text-[9px] leading-[1.4] shadow-[0_1px_2px_rgba(42,36,32,0.06)]">
                  <span className="relative block aspect-[4/5] overflow-hidden bg-[#ebe4da]">
                    <Image src={p.image} alt="" fill sizes="140px" className="object-cover" style={{ objectPosition: p.position }} />
                    {p.was ? (
                      <i className="absolute start-1.5 top-1.5 rounded-full px-1.5 py-px text-[7.5px] font-bold text-white not-italic transition-colors duration-300" style={{ background: accent }}>
                        −12%
                      </i>
                    ) : null}
                  </span>
                  <span className="block px-1.5 pt-1 pb-1.5">
                    <span className="block truncate font-semibold">{p.name}</span>
                    <span className="flex items-baseline gap-1">
                      <b className="font-extrabold">{p.price} EGP</b>
                      {p.was ? <s className="hidden text-[8px] opacity-50 min-[861px]:inline">{p.was}</s> : null}
                    </span>
                  </span>
                </div>
              ))}
            </div>
            <div className={cn("mx-3 h-[3px] origin-center rounded-[3px] bg-amber-600 transition-transform duration-200", step === 2 ? "scale-x-100" : "scale-x-0")} />
            {dropped ? (
              <CanvasSection selected={step === 3} label="Reviews">
                <div className="grid grid-cols-3 gap-2 px-3 pt-1 pb-3.5">
                  {["The lamp light is so warm, just like the photos.", "Arrived in two days to Alex, packed with care.", "The vases look even better in person."].map((text) => (
                    <div key={text} className="rounded-[8px] bg-white p-[9px] text-[8.5px] leading-[1.45] text-[#4a403a] shadow-[0_1px_2px_rgba(42,36,32,0.06)]">
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

        <aside className="hidden flex-col gap-2 border-s border-[#e7e9e8] min-[1081px]:flex">
          <div className="flex items-center gap-2.5 border-b border-[#e7e9e8] p-3">
            <span className="grid size-9 flex-none place-items-center rounded-[11px] bg-[#eef3f4] text-teal-900">
              {heroSelected ? <LayoutPanelTop className="size-4" /> : <FileText className="size-4" />}
            </span>
            <div className="min-w-0">
              <b className="block truncate text-[13px] text-[#171717]">{heroSelected ? t("library.hero") : t("home")}</b>
              <small dir="ltr" className="block text-start font-latin text-[10.5px] text-[#808080]">{heroSelected ? t("props.page") : "/"}</small>
            </div>
          </div>
          {heroSelected ? (
            <div className="flex flex-col gap-2 px-3 pb-3">
              <div className="flex rounded-[10px] bg-[#f4f5f5] p-[3px] text-[11px] font-semibold text-[#808080]">
                {[t("props.content"), t("props.style")].map((label, i) => (
                  <span key={label} className={cn("grid h-[26px] flex-1 place-items-center rounded-[7px]", i === 0 && "bg-white text-[#171717] shadow-[0_1px_2px_rgba(0,0,0,0.08)]")}>
                    {label}
                  </span>
                ))}
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
              <div className="flex rounded-[10px] bg-[#f4f5f5] p-[3px] text-[11px] font-semibold text-[#808080]">
                {[t("props.split"), t("props.image"), t("props.center")].map((label, i) => (
                  <span key={label} className={cn("grid h-[26px] flex-1 place-items-center rounded-[7px]", i === 1 && "bg-white text-[#171717] shadow-[0_1px_2px_rgba(0,0,0,0.08)]")}>
                    {label}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2.5 px-4 pb-6 text-center">
              <span className="grid size-12 place-items-center rounded-2xl bg-[#eef3f4] text-teal-900">
                <MousePointerClick className="size-5" />
              </span>
              <b className="text-[13px] text-[#171717]">{t("empty.title")}</b>
              <p className="text-[11.5px] leading-[1.6] text-[#808080]">{t("empty.body")}</p>
              <span className="mt-1 flex h-8 items-center gap-1.5 rounded-full bg-teal-900 px-3.5 text-[11.5px] font-bold text-white">
                <Plus className="size-3.5" />
                {t("empty.add")}
              </span>
            </div>
          )}
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
