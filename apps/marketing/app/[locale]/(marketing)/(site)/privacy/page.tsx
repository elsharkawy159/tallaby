import type { Metadata } from "next";
import { Ban, Download, Lock } from "lucide-react";
import { LegalPage } from "@/components/marketing/legal/legal-page";
import { pageMetadata } from "@/lib/marketing/metadata.lib";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({ locale, page: "privacy", path: "/privacy" });
}

export default function PrivacyPage() {
  return <LegalPage doc="privacy" summaryIcons={[Ban, Lock, Download]} updated="2026-10-01" minutes={5} />;
}
