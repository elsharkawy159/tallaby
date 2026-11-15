"use client";

import { createContext, useContext } from "react";
import { STOREFRONT_URL } from "@/lib/constants";

const STOREFRONT_HOST = STOREFRONT_URL.replace(/^https?:\/\/(www\.)?/, "");

const ProductLinkHostContext = createContext<string | null>(null);

/** The seller's live custom domain, when they have one (see loadProductLinkHost). */
export const ProductLinkHostProvider = ProductLinkHostContext.Provider;

/** Host shown before `/products/<slug>`: the custom domain, else the Tallaby host. */
export function useProductLinkHost(): string {
  return useContext(ProductLinkHostContext) ?? STOREFRONT_HOST;
}
