import type { Metadata } from "next";
import { storeUrl } from "@workspace/lib/storefront";
import { getPublicUrl } from "@workspace/ui/lib/utils";
import { cn } from "@workspace/ui/lib/utils";
import { AuthDialogProvider } from "@/components/auth/auth-dialog-provider";
import { resolveStorefront } from "@/lib/storefront.server";
import { StorefrontHeader } from "./_components/storefront-header";
import { StorefrontFooter } from "./_components/storefront-footer";
import { MobileCartBar } from "./_components/mobile-cart-bar.client";
import { ByTallabyBadge } from "./_components/by-tallaby-badge";
import { storefrontFont } from "./_components/storefront-font";
import s from "./storefront.module.css";

type StorefrontLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string; subdomain: string }>;
};

export async function generateMetadata({
  params,
}: StorefrontLayoutProps): Promise<Metadata> {
  const { locale, subdomain } = await params;
  const store = await resolveStorefront(subdomain);
  const url = storeUrl(store.subdomain);
  const description = store.description || store.storeDescription || undefined;
  const image = store.bannerUrl || store.logoUrl;

  return {
    // The store is the brand here, not Tallaby.
    title: { default: store.displayName, template: `%s | ${store.displayName}` },
    description,
    metadataBase: new URL(url),
    alternates: {
      canonical: locale === "ar" ? url : `${url}/${locale}`,
      languages: { ar: url, en: `${url}/en`, "x-default": url },
    },
    openGraph: {
      type: "website",
      url,
      siteName: store.displayName,
      title: store.displayName,
      description,
      images: image ? [getPublicUrl(image, "sellers")] : undefined,
    },
    icons: store.logoUrl ? { icon: getPublicUrl(store.logoUrl, "sellers") } : undefined,
  };
}

export default async function StorefrontLayout({
  children,
  params,
}: StorefrontLayoutProps) {
  const { subdomain } = await params;
  const store = await resolveStorefront(subdomain);

  return (
    <div className={cn(storefrontFont.variable, s.root)}>
      <StorefrontHeader store={store} />
      <main className="flex-1">{children}</main>
      <StorefrontFooter store={store} />
      <MobileCartBar />
      <ByTallabyBadge />
      <AuthDialogProvider />
    </div>
  );
}
