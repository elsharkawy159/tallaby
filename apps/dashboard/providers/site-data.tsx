"use client";
import { getSiteData } from "@/actions/site-data";
import { createContext, use, useContext } from "react";

type SiteData = Awaited<ReturnType<typeof getSiteData>>;
// Create the context
const SiteDataContext = createContext<SiteData | undefined>(undefined);

// Custom hook to use the site data context
export const useSiteData = () => {
  const context = useContext(SiteDataContext);
  if (!context) {
    throw new Error("useSiteData must be used within a SiteDataProvider");
  }
  return context;
};

export function SiteDataProvider({
  children,
  promise,
}: {
  children: React.ReactNode;
  promise: Promise<SiteData>;
}) {
  try {
    const siteData = use(promise);
    return (
      <SiteDataContext.Provider value={siteData}>
        {children}
      </SiteDataContext.Provider>
    );
  } catch (error) {
    // Handle build-time errors gracefully
    console.warn("Site data loading failed:", error);
    const fallbackData = {
      seller: { success: false, error: "Failed to load seller data" },
    };
    return (
      <SiteDataContext.Provider value={fallbackData}>
        {children}
      </SiteDataContext.Provider>
    );
  }
}
