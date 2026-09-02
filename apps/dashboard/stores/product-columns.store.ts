import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { VisibilityState } from "@tanstack/react-table";

/**
 * Default order of the vendor products table. Kept here (rather than derived
 * from the column defs) so a stored order from an older release can always be
 * reconciled against the current column set.
 */
export const DEFAULT_PRODUCT_COLUMN_ORDER = [
  "image",
  "title",
  "category",
  "brand",
  "price",
  "rating",
  "quantity",
  "status",
  "actions",
];

/**
 * Reconciles a persisted order against the columns that actually exist today:
 * drops ids that were removed, appends ids that were added since it was saved.
 */
export function reconcileColumnOrder(
  storedOrder: string[],
  currentIds: string[]
): string[] {
  const known = new Set(currentIds);
  const kept = storedOrder.filter((id) => known.has(id));
  const added = currentIds.filter((id) => !kept.includes(id));
  return [...kept, ...added];
}

interface ProductColumnsState {
  visibility: VisibilityState;
  order: string[];
  setVisibility: (visibility: VisibilityState) => void;
  setOrder: (order: string[]) => void;
  reset: () => void;
}

export const useProductColumnsStore = create<ProductColumnsState>()(
  persist(
    (set) => ({
      visibility: {},
      order: DEFAULT_PRODUCT_COLUMN_ORDER,
      setVisibility: (visibility) => set({ visibility }),
      setOrder: (order) => set({ order }),
      reset: () =>
        set({ visibility: {}, order: DEFAULT_PRODUCT_COLUMN_ORDER }),
    }),
    {
      name: "vendor-product-columns",
      partialize: (state) => ({
        visibility: state.visibility,
        order: state.order,
      }),
      // The products table is server-rendered, so rehydrating during module
      // init would make the first client render disagree with the server's
      // column order. The section rehydrates from an effect instead.
      skipHydration: true,
    }
  )
);
