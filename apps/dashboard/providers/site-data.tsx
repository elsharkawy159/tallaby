"use client";
import type { getSiteData } from "@/actions/site-data";
import { createContext, use } from "react";

type SiteData = Awaited<ReturnType<typeof getSiteData>>;
// The layout passes the read as a promise, so the frame never waits for it.
const SiteDataContext = createContext<Promise<SiteData> | undefined>(undefined);

/** Suspends until the seller summary arrives: call it under a <Suspense> boundary. */
export const useSiteData = () => {
  const promise = use(SiteDataContext);
  if (!promise) {
    throw new Error("useSiteData must be used within a SiteDataProvider");
  }
  return use(promise);
};

export function SiteDataProvider({
  children,
  promise,
}: {
  children: React.ReactNode;
  promise: Promise<SiteData>;
}) {
  return <SiteDataContext value={promise}>{children}</SiteDataContext>;
}
