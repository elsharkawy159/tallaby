"use client";

import * as React from "react";
import { AlignCenter, CircleCheck, Columns2, Image as ImageIcon, Monitor, Send, Smartphone } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@workspace/ui/lib/utils";
import { BrowserBar } from "@/components/site/browser-frame";
import { ChoiceGroup } from "@/components/site/choice-group.client";
import { CtaButton } from "@/components/site/cta-button";
import { MiniStore } from "@/components/templates/store-preview";
import { ROOT_DOMAIN, slugify } from "@/lib/site.lib";
import { IMG, type BannerLayout, type StoreLook } from "@/lib/templates.data";

const BRAND_COLORS = [
  { value: "#145163", key: "teal" },
  { value: "#111111", key: "ink" },
  { value: "#c8586b", key: "rose" },
  { value: "#e4572e", key: "vermilion" },
  { value: "#5b7a4f", key: "sage" },
] as const;

type Device = "desk" | "mob";
type Radius = "0px" | "8px" | "18px";
type PublishState = "draft" | "publishing" | "live";

/** "Try it" store builder demo on the home page. Nothing is saved. */
export function BuilderStudio() {
  const t = useTranslations("home.builder");
  const [name, setName] = React.useState("Nour");
  const [accent, setAccent] = React.useState<string>(BRAND_COLORS[0].value);
  const [layout, setLayout] = React.useState<BannerLayout>("split");
  const [radius, setRadius] = React.useState<Radius>("8px");
  const [device, setDevice] = React.useState<Device>("desk");
  const [publish, setPublish] = React.useState<PublishState>("draft");
  const timer = React.useRef<number>(undefined);

  const host = `${slugify(name) || "yourbrand"}.${ROOT_DOMAIN}`;

  // Any edit makes the demo "unpublished" again.
  const edit = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setPublish("draft");
  };

  React.useEffect(() => () => window.clearTimeout(timer.current), []);

  const look: StoreLook = {
    name: name || "Your store",
    background: "#ffffff",
    foreground: "#1d2a2e",
    accent,
    radius,
    muted: "#1451630f",
    layout,
    contain: layout === "split",
    hero: layout === "split" ? IMG.hayato : IMG.banner,
    headline: layout === "center" ? "New arrivals every week" : "Made for your everyday",
    subline: "Free delivery on your first order.",
    products: [
      { image: IMG.watch6, name: "Product one", price: "1,730" },
      { image: IMG.hayato, name: "Product two", price: "1,210" },
      { image: IMG.quencher, name: "Product three", price: "1,080" },
    ],
  };

  const label = "mb-2 block text-xs font-semibold text-haze";

  return (
    <div className="rounded-[20px] bg-teal-900 p-3.5 text-white">
      <div className="flex flex-wrap items-center gap-2 px-1 pt-1 pb-3.5">
        <ChoiceGroup
          look="dark"
          label={t("device")}
          value={device}
          onChange={setDevice}
          options={[
            { value: "desk", label: t("desktop"), icon: <Monitor /> },
            { value: "mob", label: t("mobile"), icon: <Smartphone /> },
          ]}
        />
        <span className="flex-1" />
        <CtaButton
          size="sm"
          onClick={() => {
            setPublish("publishing");
            window.clearTimeout(timer.current);
            timer.current = window.setTimeout(() => setPublish("live"), 700);
          }}
        >
          <Send />
          {t("publish")}
        </CtaButton>
      </div>

      <div className="grid gap-3.5 md:grid-cols-[170px_minmax(0,1fr)]">
        <div className="grid gap-3.5 text-[13px] sm:grid-cols-2 md:flex md:flex-col md:gap-4">
          <div>
            <label htmlFor="builder-name" className={label}>
              {t("storeName")}
            </label>
            <input
              id="builder-name"
              type="text"
              value={name}
              maxLength={16}
              onChange={(e) => edit(setName)(e.target.value)}
              className="h-[38px] w-full rounded-[10px] border border-white/20 bg-white/5 px-3 font-latin text-white outline-none focus:border-amber-600"
            />
          </div>
          <div>
            <span className={label}>{t("brandColor")}</span>
            <div className="flex flex-wrap gap-2" role="group" aria-label={t("brandColor")}>
              {BRAND_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  aria-pressed={c.value === accent}
                  aria-label={t(`colors.${c.key}`)}
                  onClick={() => edit(setAccent)(c.value)}
                  className="size-8 rounded-full shadow-[inset_0_0_0_2px_rgba(255,255,255,0.15)] aria-pressed:shadow-[0_0_0_2px_var(--color-teal-900),0_0_0_4px_#fff]"
                  style={{ background: c.value }}
                />
              ))}
            </div>
          </div>
          <div>
            <span className={label}>{t("bannerLayout")}</span>
            <ChoiceGroup
              look="dark"
              label={t("bannerLayout")}
              value={layout}
              onChange={edit(setLayout)}
              className="md:w-full md:flex-col md:items-stretch"
              itemClassName="md:justify-start"
              options={[
                { value: "split", label: t("split"), icon: <Columns2 /> },
                { value: "full", label: t("full"), icon: <ImageIcon /> },
                { value: "center", label: t("center"), icon: <AlignCenter /> },
              ]}
            />
          </div>
          <div>
            <span className={label}>{t("corners")}</span>
            <ChoiceGroup
              look="dark"
              label={t("corners")}
              value={radius}
              onChange={edit(setRadius)}
              className="md:w-full md:flex-col md:items-stretch"
              itemClassName="md:justify-start"
              options={[
                { value: "0px", label: t("sharp") },
                { value: "8px", label: t("soft") },
                { value: "18px", label: t("round") },
              ]}
            />
          </div>
        </div>

        <div className="grid place-items-center rounded-xl bg-[#e9eeef] p-2.5 sm:min-h-[400px] sm:p-[18px]">
          <div
            className={cn(
              "w-full overflow-hidden bg-white shadow-lift transition-[max-width,border-radius] duration-300",
              device === "mob" ? "max-w-[230px] rounded-[26px] border-[6px] border-[#0b0f10]" : "max-w-[520px] rounded-xl",
            )}
          >
            {device === "desk" ? <BrowserBar url={host} /> : null}
            <MiniStore look={look} phone={device === "mob"} />
          </div>
        </div>
      </div>

      <div
        role="status"
        aria-live="polite"
        className={cn("flex min-h-10 items-center gap-2 px-1 pt-3 pb-0.5 text-[13px]", publish === "live" ? "text-[#86efac]" : "text-mist")}
      >
        {publish === "draft" ? t("unpublished") : null}
        {publish === "publishing" ? t("publishing") : null}
        {publish === "live" ? (
          <>
            <CircleCheck className="size-4" aria-hidden />
            {t("liveAt")} <bdi className="font-latin">{host}</bdi>
          </>
        ) : null}
      </div>
    </div>
  );
}
