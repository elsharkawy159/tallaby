import type { RawSearchParams } from "../_components/data-table/search-params";
import { PendingCartsDataWrapper } from "./pending-carts.data";

export const dynamic = "force-dynamic";

export default function PendingCartsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  return (
    <div className="space-y-6">
      <PendingCartsDataWrapper searchParams={searchParams} />
    </div>
  );
}
