import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
// import CartSheet from "@/components/layout/cart-sheet";
import { AuthDialogProvider } from "@/components/auth/auth-dialog-provider";

// Force dynamic rendering for all pages under (main) since they use auth providers
export const dynamic = "force-dynamic";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      {/* <CartSheet /> */}
      <main>{children}</main>
      <Footer />
      <AuthDialogProvider />
    </>
  );
}
