import { cn } from "@/lib/utils";

/**
 * The bar that holds a page's Save (and Publish / Discard) buttons. Every
 * dashboard page that saves puts its buttons here, so Save is always in the
 * same place: stuck under the dashboard header, at the inline end, which is
 * the top-left corner in Arabic (top-right in English). The title or a status
 * note sits at the start. Dialogs and side sheets keep Save in their footer.
 *
 * The negative margins span the page's `p-4 sm:p-6` padding, so the bar runs
 * edge to edge like the product form's header.
 */
export function PageActionBar({
  title,
  children,
  className,
}: {
  /** Heading or status note at the start of the bar. */
  title?: React.ReactNode;
  /** The page's actions; the primary one (Save / Publish) goes last. */
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "sticky top-16 z-20 -mx-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-b bg-background/95 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6",
        className
      )}
    >
      {title && <div className="min-w-0 text-sm text-muted-foreground">{title}</div>}
      <div className="ms-auto flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}
