import type { Metadata } from "next";
import { Ban, Store, Wallet } from "lucide-react";
import { LegalPage } from "@/components/marketing/legal/legal-page";
import { pageMetadata } from "@/lib/marketing/metadata.lib";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({ locale, page: "refund", path: "/refund-policy" });
}

export default function RefundPolicyPage() {
  return <LegalPage doc="refund" summaryIcons={[Wallet, Ban, Store]} updated="2026-11-16" minutes={3} />;
}
