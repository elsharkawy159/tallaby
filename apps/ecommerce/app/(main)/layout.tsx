import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { AuthDialogProvider } from "@/components/auth/auth-dialog-provider";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
      <AuthDialogProvider />
    </>
  );
}
