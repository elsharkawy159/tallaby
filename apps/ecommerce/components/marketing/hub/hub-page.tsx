import * as React from "react";
import { getTranslations } from "next-intl/server";
import { BidiText, ClosingCta, PageTrail } from "@/components/marketing/pages/content-blocks";
import { Container, Eyebrow } from "@/components/marketing/site/layout-primitives";
import { richTags } from "@/components/marketing/site/rich-text";
import type { HubMark } from "@/lib/marketing/integrations-hub.lib";

/** A hub's picture: a coloured tile with the brand's initial, or an icon for our own features. */
export function HubMarkView({ mark }: { mark: HubMark }) {
  const box = "grid size-[46px] flex-none place-items-center overflow-hidden rounded-2xl border border-[#e3ebed] min-[561px]:size-[52px]";
  if ("icon" in mark) {
    const Icon = mark.icon;
    return (
      <span className={`${box} bg-white text-teal-700`} aria-hidden>
        <Icon className="size-6" />
      </span>
    );
  }
  return (
    <span className={`${box} font-latin text-xl font-extrabold`} style={{ backgroundColor: mark.color, color: mark.onColor ?? "#fff" }} aria-hidden>
      {mark.initial}
    </span>
  );
}

/** The frame shared by both hubs: trail, centred header, listing, explainer and closing band. */
export async function HubPageFrame({
  namespace,
  path,
  children,
}: {
  namespace: "integrationsHub" | "compareHub";
  path: string;
  children: React.ReactNode;
}) {
  const t = await getTranslations(namespace);
  return (
    <>
      <PageTrail path={path} items={[{ label: t("crumb") }]} />
      <section className="pt-8 pb-6 text-center sm:pt-12 sm:pb-9">
        <Container>
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <h1 className="text-[clamp(34px,5.6vw,60px)] leading-[1.25] font-bold text-balance text-teal-900 en:leading-[1.1] en:tracking-[-0.02em]">
            {t.rich("title", richTags)}
          </h1>
          <p className="mx-auto mt-5 max-w-[640px] text-[clamp(16px,2vw,19px)] text-pretty text-ink-500">
            <BidiText text={t("lead")} />
          </p>
          {children}
        </Container>
      </section>
      <section>
        <Container className="max-w-[860px] pt-6 pb-[72px]">
          <h2 className="mb-3.5 text-[clamp(24px,3vw,32px)] leading-[1.4] font-bold text-teal-900">{t("explainerTitle")}</h2>
          <p className="text-[17px] leading-[1.95] text-pretty text-[#3d5055]">
            <BidiText text={t("explainer")} />
          </p>
        </Container>
      </section>
      <ClosingCta title={t("closingTitle")} body={t("closingBody")} />
    </>
  );
}
