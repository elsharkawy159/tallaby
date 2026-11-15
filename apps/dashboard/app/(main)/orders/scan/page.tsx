import { notFound } from "next/navigation";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

// import { ScanReturnsView } from "./scan-returns.client";

/**
 * Orders › Scan returns (ROADMAP.md F-04e). Hidden for now (owner, 2026-10-31):
 * the search on /orders already finds an order, so this page returns 404.
 * Restore the body below and the sidebar/route entries to bring it back.
 */
export default function ScanReturnsPage() {
  notFound();
  // return (
  //   <div className="min-h-screen p-4 sm:p-6">
  //     <ScanReturnsView />
  //   </div>
  // );
}
