import { Suspense } from "react";
import type { Metadata } from "next";

import { generateNoIndexMetadata } from "@/lib/metadata";

import {
  WalletSignInPrompt,
  WalletUnavailable,
} from "./_components/wallet.chunks";
import { WALLET_UNAUTHENTICATED_ERROR } from "./_components/wallet.lib";
import { getWalletOverview } from "./_components/wallet.server";
import { WalletClient } from "./wallet.client";

export const metadata: Metadata = generateNoIndexMetadata();

// The viewer's own balance and ledger. Never cached, never prerendered —
// see docs/caching-and-data-fetching.md §3.
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function WalletPage() {
  const result = await getWalletOverview();

  if (!result.success) {
    // Guests and signed-out visitors have no wallet at all; anything else is a
    // real failure and must not be dressed up as "please sign in".
    return result.error === WALLET_UNAUTHENTICATED_ERROR ? (
      <WalletSignInPrompt />
    ) : (
      <WalletUnavailable />
    );
  }

  return (
    <Suspense>
      <WalletClient overview={result.data} />
    </Suspense>
  );
}
