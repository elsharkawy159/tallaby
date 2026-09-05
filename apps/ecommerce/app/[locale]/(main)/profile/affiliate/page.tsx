import { Suspense } from "react";
import type { Metadata } from "next";

import { generateNoIndexMetadata } from "@/lib/metadata";
import {
  getMyAffiliateOverview,
  getMyAffiliateOrders,
} from "@/actions/affiliate";

import {
  AffiliateJoinPrompt,
  AffiliateSignInPrompt,
  AffiliateUnavailable,
} from "./_components/affiliate.chunks";
import { AffiliateClient } from "./affiliate.client";

export const metadata: Metadata = generateNoIndexMetadata();

// The viewer's own affiliate account, orders and wallet-derived earnings.
// Never cached, never prerendered — same posture as /profile/wallet.
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function AffiliatePage() {
  const overview = await getMyAffiliateOverview();

  if (!overview.success) {
    if (overview.error === "authenticationRequired") {
      return <AffiliateSignInPrompt />;
    }
    if (overview.error === "notAnAffiliate") {
      return <AffiliateJoinPrompt />;
    }
    return <AffiliateUnavailable />;
  }

  const orders = await getMyAffiliateOrders({ limit: 20 });

  return (
    <Suspense>
      <AffiliateClient
        overview={overview.data}
        initialOrders={orders.success ? orders.data : []}
      />
    </Suspense>
  );
}
