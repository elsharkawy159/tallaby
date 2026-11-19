import type { Metadata } from "next";
import { StoreDirectoryPage, storeDirectoryMetadata } from "@/components/marketing/stores/store-directory";

// The list is a cached read (15 minutes); the page itself is rebuilt at most this often.
export const revalidate = 900;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return storeDirectoryMetadata(locale, 1);
}

/** tallaby.com/stores: the stores selling on Tallaby (owner, 2026-11-14). */
export default function StoresPage() {
  return <StoreDirectoryPage page={1} />;
}
