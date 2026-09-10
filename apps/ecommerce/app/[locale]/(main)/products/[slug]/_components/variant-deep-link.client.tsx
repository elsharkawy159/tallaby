"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

interface VariantDeepLinkProps {
  onToken: (token: string) => void;
}

/**
 * Reads `?variant=` (e.g. a color slug linked from a product-card swatch) and
 * hands it to the product display so it can preselect that variant.
 *
 * Isolated behind its own <Suspense> boundary on purpose: `useSearchParams`
 * client-renders everything up to the nearest boundary, so keeping it in a
 * leaf that renders nothing lets the product page stay prerendered (ISR).
 */
export function VariantDeepLink({ onToken }: VariantDeepLinkProps) {
  const searchParams = useSearchParams();
  const appliedRef = useRef<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("variant");
    if (!token || appliedRef.current === token) return;

    appliedRef.current = token;
    onToken(token);
  }, [searchParams, onToken]);

  return null;
}
