import { StoreHostShell } from "@/components/storefront/store-host-shell";
import { MetaPixel } from "@/components/meta/meta-pixel";

/** On a store's website this page wears the store's chrome, never Tallaby's (nor Tallaby's pixel). */
export default async function CheckoutLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <StoreHostShell
      locale={locale}
      fallback={(content) => (
        <>
          {content}
          <MetaPixel />
        </>
      )}
    >
      {children}
    </StoreHostShell>
  );
}
