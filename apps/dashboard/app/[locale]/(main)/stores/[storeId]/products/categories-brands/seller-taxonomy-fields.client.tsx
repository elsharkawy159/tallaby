"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { SellerTaxonomyOption } from "./categories-brands.dto";

type SellerTaxonomyOptions = { categories: SellerTaxonomyOption[]; brands: SellerTaxonomyOption[] };

type SellerTaxonomyContextValue = SellerTaxonomyOptions & {
  /** Put a category the seller just created into the list, so the picker shows it. */
  addCategory: (option: SellerTaxonomyOption) => void;
  /** Put a brand the seller just created into the list, so the picker shows it. */
  addBrand: (option: SellerTaxonomyOption) => void;
};

const SellerTaxonomyContext = createContext<SellerTaxonomyContextValue | null>(null);

const withOption = (prev: SellerTaxonomyOption[], option: SellerTaxonomyOption) =>
  prev.some((o) => o.id === option.id) ? prev : [...prev, option];

/** Gives the product form the store's own category and brand lists (Products › Categories, Products › Brands). */
export function SellerTaxonomyProvider({ value, children }: { value: SellerTaxonomyOptions; children: React.ReactNode }) {
  const [categories, setCategories] = useState(value.categories);
  const [brands, setBrands] = useState(value.brands);
  // Fresh lists from the server (after a refresh) replace the local ones, set during render rather than in an effect.
  const [source, setSource] = useState(value);
  if (source.categories !== value.categories || source.brands !== value.brands) {
    setSource(value);
    if (source.categories !== value.categories) setCategories(value.categories);
    if (source.brands !== value.brands) setBrands(value.brands);
  }

  const addCategory = useCallback((option: SellerTaxonomyOption) => setCategories((prev) => withOption(prev, option)), []);
  const addBrand = useCallback((option: SellerTaxonomyOption) => setBrands((prev) => withOption(prev, option)), []);

  const context = useMemo(() => ({ categories, brands, addCategory, addBrand }), [categories, brands, addCategory, addBrand]);
  return <SellerTaxonomyContext.Provider value={context}>{children}</SellerTaxonomyContext.Provider>;
}

/** The store's category and brand lists, or null outside a provider. */
export function useSellerTaxonomy(): SellerTaxonomyContextValue | null {
  return useContext(SellerTaxonomyContext);
}
