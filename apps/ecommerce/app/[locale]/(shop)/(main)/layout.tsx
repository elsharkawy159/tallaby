import Footer from "@/components/layout/Footer";
// import CartSheet from "@/components/layout/cart-sheet";
import { AuthDialogProvider } from "@/components/auth/auth-dialog-provider";
import Header from "@/components/layout/Header";
import { StoreHostShell } from "@/components/storefront/store-host-shell";

export default async function MainLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // On a store's website these pages wear the store's chrome, never Tallaby's.
  return (
    <StoreHostShell
      locale={locale}
      fallback={(content) => (
        <>
          <Header />
          <main>{content}</main>
          {/* <CartSheet /> */}
          <Footer />
          <AuthDialogProvider />
        </>
      )}
    >
      {children}
    </StoreHostShell>
  );
}
