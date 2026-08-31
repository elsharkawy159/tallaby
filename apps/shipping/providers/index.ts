import { bostaAdapter } from "./bosta";
import { egyptPostAdapter } from "./egypt-post";
import { manualAdapter } from "./manual";
import { shipBluAdapter } from "./shipblu";
import { tallabyAdapter } from "./tallaby";
import type { ShippingProviderAdapter } from "./types";

const ADAPTERS: Record<string, ShippingProviderAdapter> = {
  [bostaAdapter.code]: bostaAdapter,
  [shipBluAdapter.code]: shipBluAdapter,
  [egyptPostAdapter.code]: egyptPostAdapter,
  [tallabyAdapter.code]: tallabyAdapter,
};

/**
 * Resolve a provider adapter by its `shipping_providers.code`. Unknown codes
 * fall back to the manual adapter, so adding a provider row without shipping
 * adapter code degrades to manual handling rather than throwing.
 */
export function getProviderAdapter(code: string | null | undefined): ShippingProviderAdapter {
  if (!code) return manualAdapter;
  return ADAPTERS[code] ?? manualAdapter;
}

export { manualAdapter, bostaAdapter, shipBluAdapter, egyptPostAdapter, tallabyAdapter };
export * from "./types";
