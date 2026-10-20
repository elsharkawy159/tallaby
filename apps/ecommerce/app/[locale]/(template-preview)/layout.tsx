import type { Metadata } from "next";
import "@workspace/ui/globals.css";
import "../(shop)/globals.css";

/**
 * Template preview frames for the tallaby.com gallery (lib/marketing,
 * owner 2026-10-19). Only the storefront styles: no marketplace chrome,
 * chatbot or top loader inside a frame. Never indexed.
 */
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function TemplatePreviewLayout({ children }: { children: React.ReactNode }) {
  return children;
}
