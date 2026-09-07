import { Suspense } from "react";
import Footer from "@/components/layout/Footer";
// import CartSheet from "@/components/layout/cart-sheet";
import { AuthDialogProvider } from "@/components/auth/auth-dialog-provider";
import Header from "@/components/layout/Header";
import { AffiliateCouponCapture } from "@/components/product/affiliate-coupon-capture.client";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Suspense fallback={null}>
        <AffiliateCouponCapture />
      </Suspense>
      <Header />
      <main>{children}</main>
      {/* <CartSheet /> */}
      <Footer />
      <AuthDialogProvider />
    </>
  );
}
