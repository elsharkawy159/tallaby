import type { Metadata } from "next";
import { BadgePercent, DoorOpen, Store } from "lucide-react";
import { LegalPage } from "@/components/marketing/legal/legal-page";
import { pageMetadata } from "@/lib/marketing/metadata.lib";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({ locale, page: "terms", path: "/terms" });
}

/**
 * Set on the day of the USD switch (docs/usd-switch-checklist.md). Until then the
 * clause "The move to US dollars" stays hidden, because it has no date to name.
 */
const USD_SWITCH_DATE: string | null = null;

export default function TermsPage() {
  return <LegalPage doc="terms" summaryIcons={[Store, BadgePercent, DoorOpen]} updated="2026-11-04" minutes={8} usdSwitchDate={USD_SWITCH_DATE} />;
}
