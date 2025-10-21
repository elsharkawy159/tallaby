import Footer from "@/components/layout/Footer";
// import CartSheet from "@/components/layout/cart-sheet";
import { AuthDialogProvider } from "@/components/auth/auth-dialog-provider";
import Header from "@/components/layout/Header";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
    
      <Header />
      <main>{children}</main>
      {/* <CartSheet /> */}
      <Footer />
      <AuthDialogProvider />
    </>
  );
}
