import { VendorOrdersSkeleton } from "./orders-chunks";

export default function Loading() {
  return (
    <div className="min-h-screen p-6">
      <div className="mb-6">
        <div className="h-8 w-40 rounded bg-muted" />
        <div className="h-4 w-80 max-w-full mt-2 rounded bg-muted" />
      </div>
      <VendorOrdersSkeleton />
    </div>
  );
}
