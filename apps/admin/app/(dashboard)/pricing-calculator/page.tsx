import { notFound } from "next/navigation";

// Hidden 2026-10-18 (SaaS pivot), see docs/admin-saas.md §2.2.
//
// import { PricingCalculatorClient } from "./pricing-calculator.client";
//
// export default function PricingCalculatorPage() {
//   return <PricingCalculatorClient />;
// }

export default function PricingCalculatorPage() {
  notFound();
}
