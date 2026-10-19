import Link from "next/link";
import { Button } from "@workspace/ui/components/button";

/** Previous / next links for server-paginated admin lists. Renders nothing for one page. */
export function AdminPager({ page, pages, href }: { page: number; pages: number; href: (page: number) => string }) {
  if (pages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-end gap-2 text-sm">
      <span className="text-muted-foreground">
        Page {page} of {pages}
      </span>
      {page > 1 ? (
        <Button asChild size="sm" variant="outline">
          <Link href={href(page - 1)}>Previous</Link>
        </Button>
      ) : (
        <Button size="sm" variant="outline" disabled>
          Previous
        </Button>
      )}
      {page < pages ? (
        <Button asChild size="sm" variant="outline">
          <Link href={href(page + 1)}>Next</Link>
        </Button>
      ) : (
        <Button size="sm" variant="outline" disabled>
          Next
        </Button>
      )}
    </div>
  );
}

/** Builds `/path?a=1&b=2`, skipping empty values. */
export function buildHref(path: string, params: Record<string, string | number | null | undefined>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== "") query.set(key, String(value));
  }
  const qs = query.toString();
  return qs ? `${path}?${qs}` : path;
}
