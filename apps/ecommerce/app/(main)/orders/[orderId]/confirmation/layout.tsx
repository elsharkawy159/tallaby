import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order Confirmation | Your Order is Confirmed",
  description:
    "Thank you for your purchase! Your order has been successfully placed and confirmed.",
  robots: {
    index: false, // Don't index order confirmation pages
    follow: false,
  },
};

export default function OrderConfirmationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
