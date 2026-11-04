import type { Metadata } from "next";
import { TemplatesPageContent } from "@/components/marketing/templates/templates-page";
import { pageMetadata } from "@/lib/marketing/metadata.lib";
import { getTemplateGallery } from "@/lib/marketing/templates.server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({ locale, page: "templates", path: "/templates" });
}

export default async function TemplatesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const entries = await getTemplateGallery(locale);
  // The hero leads with Kasr, Volt and Pure, then one template per category.
  return <TemplatesPageContent entries={entries} leadKeys={["kasr", "volt", "pure"]} />;
}
