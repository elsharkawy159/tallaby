import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CartSheet from "@/components/layout/cart-sheet";
import { AuthDialogProvider } from "@/components/auth/auth-dialog-provider";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <CartSheet />
      <main>{children}</main>
      <Footer />
      <AuthDialogProvider />
    </>
  );
}
