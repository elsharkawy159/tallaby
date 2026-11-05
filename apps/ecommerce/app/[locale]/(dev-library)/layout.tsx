import type { Metadata } from "next";
import "@workspace/ui/globals.css";
import "../(shop)/globals.css";
import { BaseMessagesProvider } from "@/components/layout/base-messages-provider";

/** Section and template library (`dev-library/dev-library.server.ts`): open, never indexed. */
export const metadata: Metadata = {
  title: "Section & template library",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default function DevLibraryLayout({ children }: { children: React.ReactNode }) {
  return <BaseMessagesProvider>{children}</BaseMessagesProvider>;
}
