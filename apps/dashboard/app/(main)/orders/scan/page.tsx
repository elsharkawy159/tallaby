import { ScanReturnsView } from "./scan-returns.client";

/** Orders › Scan returns (ROADMAP.md F-04e). The lookup runs per scan, scoped to the session seller. */
export default function ScanReturnsPage() {
  return (
    <div className="min-h-screen p-4 sm:p-6">
      <ScanReturnsView />
    </div>
  );
}
