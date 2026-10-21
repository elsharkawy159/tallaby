import Link from "next/link";
import { Badge } from "@workspace/ui/components/badge";
import { cn } from "@workspace/ui/lib/utils";
import { sellerHref } from "./entity-href.lib";

const SELLER_STATUS: Record<string, string> = {
  approved: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  pending: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200",
  suspended: "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-200",
  restricted: "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-200",
};

/** Roles worth calling out; `customer` and `seller` are shown by the badges above. */
const STAFF_ROLES = new Set(["admin", "support", "driver", "marketing"]);

/**
 * What one account is on Tallaby. Everyone who signs up is a customer; a
 * seller row (same id) makes them a seller too, and the seller badge links
 * to that seller account.
 */
export function RoleBadges({
  role,
  isGuest,
  seller,
  className,
}: {
  role?: string | null;
  isGuest?: boolean | null;
  seller?: { id: string; status?: string | null } | null;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex flex-wrap items-center gap-1.5", className)}>
      <Badge variant="outline" className="font-normal">
        {isGuest ? "Guest" : "Customer"}
      </Badge>
      {seller ? (
        <Badge asChild variant="outline" className={cn("font-normal", SELLER_STATUS[seller.status ?? "pending"])}>
          <Link href={sellerHref(seller.id)}>
            Seller
            {seller.status && seller.status !== "approved" ? ` · ${seller.status}` : ""}
          </Link>
        </Badge>
      ) : null}
      {role && STAFF_ROLES.has(role) ? (
        <Badge variant="secondary" className="font-normal capitalize">
          {role}
        </Badge>
      ) : null}
    </span>
  );
}
