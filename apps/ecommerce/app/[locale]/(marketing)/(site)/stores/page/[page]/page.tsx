import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StoreDirectoryPage, storeDirectoryMetadata } from "@/components/marketing/stores/store-directory";
import { permanentRedirect } from "@/i18n/navigation";
import { parseDirectoryPage } from "@/lib/marketing/store-directory.lib";

type Props = { params: Promise<{ locale: string; page: string }> };

export const revalidate = 900;

/** No page is built ahead: each one is rendered on its first visit, then cached like /stores. */
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, page } = await params;
  const n = parseDirectoryPage(page);
  return n && n > 1 ? storeDirectoryMetadata(locale, n) : {};
}

/** /stores/page/<n> for n ≥ 2; page 1 lives at /stores. */
export default async function StoresListPage({ params }: Props) {
  const { locale, page } = await params;
  const n = parseDirectoryPage(page);
  if (!n) notFound();
  if (n === 1) permanentRedirect({ href: "/stores", locale });
  return <StoreDirectoryPage page={n} />;
}
