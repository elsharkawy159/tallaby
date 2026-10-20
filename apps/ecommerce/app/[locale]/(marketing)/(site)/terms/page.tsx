import type { Metadata } from "next";
import { BadgePercent, DoorOpen, Store } from "lucide-react";
import { LegalPage } from "@/components/marketing/legal/legal-page";
import { pageMetadata } from "@/lib/marketing/metadata.lib";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({ locale, page: "terms", path: "/terms" });
}

export default function TermsPage() {
  return <LegalPage doc="terms" summaryIcons={[Store, BadgePercent, DoorOpen]} updated="2026-10-01" minutes={6} />;
}
