import { notFound } from "next/navigation";

// Hidden 2026-10-18 (SaaS pivot), see docs/admin-saas.md §2.2. The client,
// actions/external-orders.ts and external-orders.types.ts stay: the order
// invoice page still imports PlacedExternalOrderResult from this folder.
//
// import { ExternalOrdersClient } from './external-orders.client'
//
// export const dynamic = 'force-dynamic'
//
// export default function ExternalOrdersPage() {
//   return <ExternalOrdersClient />
// }

export default function ExternalOrdersPage() {
  notFound();
}
