import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@workspace/ui/components/button";

interface ListPaginationProps {
  page: number;
  pageSize: number;
  totalCount: number;
  /** Current search params. `page` is replaced, everything else carried over. */
  baseParams: Record<string, string | undefined>;
}

/**
 * Server-rendered prev/next pager. Links rather than buttons, so the page is
 * part of the URL and the list stays shareable and back-button friendly.
 */
export function ListPagination({
  page,
  pageSize,
  totalCount,
  baseParams,
}: ListPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const first = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, totalCount);

  const href = (target: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(baseParams)) {
      if (value && key !== "page") params.set(key, value);
    }
    if (target > 1) params.set("page", String(target));
    const query = params.toString();
    return query ? `/orders?${query}` : "/orders";
  };

  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm text-muted-foreground">
        {totalCount === 0
          ? "No orders"
          : `${first}–${last} of ${totalCount} order${totalCount === 1 ? "" : "s"}`}
      </p>

      <div className="flex items-center gap-2">
        <span className="hidden text-sm text-muted-foreground sm:inline">
          Page {page} of {totalPages}
        </span>

        {page <= 1 ? (
          <Button variant="outline" size="sm" disabled>
            <ChevronLeft className="size-4" />
            Previous
          </Button>
        ) : (
          <Button variant="outline" size="sm" asChild>
            <Link href={href(page - 1)}>
              <ChevronLeft className="size-4" />
              Previous
            </Link>
          </Button>
        )}

        {page >= totalPages ? (
          <Button variant="outline" size="sm" disabled>
            Next
            <ChevronRight className="size-4" />
          </Button>
        ) : (
          <Button variant="outline" size="sm" asChild>
            <Link href={href(page + 1)}>
              Next
              <ChevronRight className="size-4" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
