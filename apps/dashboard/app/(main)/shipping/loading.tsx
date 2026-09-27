import { ShippingSkeleton } from "./shipping.skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen p-4 sm:p-6">
      <ShippingSkeleton />
    </div>
  );
}
