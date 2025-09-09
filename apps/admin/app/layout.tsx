import { Montserrat } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { AdminProvider } from "@/contexts/admin-context";
import "./globals.css";
import "@workspace/ui/globals.css";
import { Toaster } from "@workspace/ui/components/sonner";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["400", "500", "600", "700"],
});

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Admin Dashboard",
  description: "Admin Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${montserrat.variable} bg-background text-foreground`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AdminProvider>{children}</AdminProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
