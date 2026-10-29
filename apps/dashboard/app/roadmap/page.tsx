import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { RoadmapPage } from "./roadmap.client";
import { getRoadmapItems, getRoadmapViewer } from "./roadmap.data";

// Public page (no login): the proxy lets /roadmap through. Votes change often, so never cached.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("roadmap");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function Roadmap({ searchParams }: { searchParams: Promise<{ idea?: string | string[] }> }) {
  const [locale, { viewer, sellerId }, params] = await Promise.all([getLocale(), getRoadmapViewer(), searchParams]);
  const items = await getRoadmapItems(sellerId, locale);
  const idea = typeof params.idea === "string" ? params.idea : null;
  const initialOpenId = idea && items.some((i) => i.id === idea) ? idea : null;

  return <RoadmapPage initialItems={items} viewer={viewer} initialOpenId={initialOpenId} />;
}
