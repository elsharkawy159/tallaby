import { StoreHostShell } from "@/components/storefront/store-host-shell";

/** On a store's website this page wears the store's chrome, never Tallaby's. */
export default async function AuthLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <StoreHostShell locale={locale} fallback={(content) => content}>
      {children}
    </StoreHostShell>
  );
}
