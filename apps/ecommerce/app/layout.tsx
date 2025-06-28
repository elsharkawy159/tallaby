import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "@workspace/ui/globals.css";
import { Providers } from "./providers";


const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Multi-Vendor Ecommerce",
  description: "A modern multi-vendor ecommerce platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${montserrat.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
