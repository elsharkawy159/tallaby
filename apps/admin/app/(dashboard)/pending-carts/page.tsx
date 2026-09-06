import { PendingCartsDataWrapper } from "./pending-carts.data";

export const dynamic = "force-dynamic";

export default function PendingCartsPage() {
  return (
    <div className="space-y-6">
      <PendingCartsDataWrapper />
    </div>
  );
}
