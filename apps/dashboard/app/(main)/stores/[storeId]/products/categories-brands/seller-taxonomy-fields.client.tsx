"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { SellerTaxonomyOption } from "./categories-brands.dto";

type SellerTaxonomyOptions = { categories: SellerTaxonomyOption[] };

type SellerTaxonomyContextValue = SellerTaxonomyOptions & {
  /** Put a category the seller just created into the list, so the picker shows it. */
  addCategory: (option: SellerTaxonomyOption) => void;
};

const SellerTaxonomyContext = createContext<SellerTaxonomyContextValue | null>(null);

/** Gives the product form the seller's own category list (Products › Categories). */
export function SellerTaxonomyProvider({ value, children }: { value: SellerTaxonomyOptions; children: React.ReactNode }) {
  const [categories, setCategories] = useState(value.categories);
  useEffect(() => setCategories(value.categories), [value.categories]);

  const addCategory = useCallback((option: SellerTaxonomyOption) => {
    setCategories((prev) => (prev.some((o) => o.id === option.id) ? prev : [...prev, option]));
  }, []);

  const context = useMemo(() => ({ categories, addCategory }), [categories, addCategory]);
  return <SellerTaxonomyContext.Provider value={context}>{children}</SellerTaxonomyContext.Provider>;
}

/**
 * Hides the list from what's inside: bulk import sends form values straight
 * to the server, so its category box offers Tallaby categories only.
 */
export function WithoutSellerTaxonomy({ children }: { children: React.ReactNode }) {
  return <SellerTaxonomyContext.Provider value={null}>{children}</SellerTaxonomyContext.Provider>;
}

/** The seller's category list, or null outside a provider. */
export function useSellerTaxonomy(): SellerTaxonomyContextValue | null {
  return useContext(SellerTaxonomyContext);
}
