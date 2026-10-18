"use client";

import * as React from "react";
import { Monitor, Smartphone } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@workspace/ui/lib/utils";
import { BrowserBar } from "@/components/site/browser-frame";
import { ChoiceGroup } from "@/components/site/choice-group.client";
import { SignupTrigger } from "@/components/signup/signup-trigger.client";
import { applyVariant, findTemplate } from "@/lib/templates.data";
import { FullStore } from "./store-preview";

type Radius = "0px" | "10px" | "20px";

/** Live template preview with device, colour preset and corner controls. */
export function TemplatePreview({ templateId }: { templateId: string }) {
  const t = useTranslations("templates.detail");
  const template = findTemplate(templateId)!;
  const [mobile, setMobile] = React.useState(false);
  const [variant, setVariant] = React.useState(0);
  const [radius, setRadius] = React.useState<Radius>((["0px", "10px", "20px"].includes(template.look.radius) ? template.look.radius : "10px") as Radius);

  const look = applyVariant(template.look, template.variants[variant]!, radius);
  const label = "text-xs font-semibold text-neutral-600";

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 rounded-t-2xl border border-b-0 border-neutral-200 bg-white px-3.5 py-3">
        <ChoiceGroup
          look="light"
          label={t("device")}
          value={mobile ? "m" : "d"}
          onChange={(v) => setMobile(v === "m")}
          options={[
            { value: "d", label: t("desktop"), icon: <Monitor /> },
            { value: "m", label: t("mobile"), icon: <Smartphone /> },
          ]}
        />
        <span className={label}>{t("color")}</span>
        <div className="flex gap-2" role="group" aria-label={t("color")}>
          {template.variants.map(([accent, background], i) => (
            <button
              key={accent + background}
              type="button"
              aria-pressed={i === variant}
              aria-label={t("colorN", { n: i + 1 })}
              onClick={() => setVariant(i)}
              className="size-7 rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.15)] aria-pressed:shadow-[0_0_0_2px_#fff,0_0_0_4px_var(--color-teal-900)]"
              style={{ background: `linear-gradient(135deg, ${accent} 50%, ${background} 50%)` }}
            />
          ))}
        </div>
        <span className={label}>{t("corners")}</span>
        <ChoiceGroup
          look="light"
          label={t("corners")}
          value={radius}
          onChange={setRadius}
          options={[
            { value: "0px", label: t("sharp") },
            { value: "10px", label: t("soft") },
            { value: "20px", label: t("round") },
          ]}
        />
        <span className="hidden flex-1 sm:block" />
        <SignupTrigger size="sm">{t("start")}</SignupTrigger>
      </div>
      <div className="grid place-items-center rounded-b-2xl border border-neutral-200 bg-[#e9eeef] p-3.5 md:p-7">
        <div
          className={cn(
            "w-full overflow-hidden bg-white shadow-lift transition-[max-width] duration-300",
            mobile ? "max-w-[360px] rounded-[32px] border-8 border-[#0b0f10]" : "max-w-[1040px] rounded-xl",
          )}
        >
          {mobile ? null : <BrowserBar url={`${template.id}.tallaby.com`} />}
          <FullStore look={look} mobile={mobile} />
        </div>
      </div>
    </>
  );
}
