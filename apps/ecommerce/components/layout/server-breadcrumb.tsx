import { HomeIcon } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb";
import { cn } from "@workspace/ui/lib/utils";

interface BreadcrumbSegment {
  label: string;
  href: string;
  isLast: boolean;
}

interface ServerBreadcrumbProps {
  segments: BreadcrumbSegment[];
  className?: string;
  homeLabel?: string;
  separator?: React.ReactNode;
  itemClassName?: string;
  linkClassName?: string;
  pageClassName?: string;
  showHomeIcon?: boolean;
}

export function ServerBreadcrumb({
  segments,
  className,
  homeLabel = "Home",
  separator,
  itemClassName,
  linkClassName,
  pageClassName,
  showHomeIcon = true,
}: ServerBreadcrumbProps) {
  // Don't show if no segments
  if (!segments || segments.length === 0) {
    return null;
  }

  return (
    <nav className={cn("bg-white border-b border-gray-200", className)}>
      <div className="container mx-auto px-4 py-2 lg:py-3">
        <Breadcrumb>
          <BreadcrumbList className="text-xs lg:text-sm">
            {/* Home item */}
            <BreadcrumbItem className={itemClassName}>
              <BreadcrumbLink
                href="/"
                className={cn(
                  "hover:text-primary transition-colors",
                  linkClassName
                )}
              >
                {showHomeIcon && (
                  <>
                    <HomeIcon size={16} aria-hidden="true" className="mr-1" />
                    <span className="sr-only">Home</span>
                  </>
                )}
                {!showHomeIcon && homeLabel}
              </BreadcrumbLink>
            </BreadcrumbItem>

            {segments.length > 0 && (
              <BreadcrumbSeparator>{separator}</BreadcrumbSeparator>
            )}

            {/* Dynamic breadcrumb items */}
            {segments.map((segment, index) => (
              <div key={segment.href || index} className="flex items-center">
                <BreadcrumbItem className={itemClassName}>
                  {segment.isLast ? (
                    <BreadcrumbPage
                      className={cn(
                        "text-primary font-medium truncate max-w-[200px] lg:max-w-none",
                        pageClassName
                      )}
                    >
                      {segment.label}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      href={segment.href}
                      className={cn(
                        "hover:text-primary transition-colors whitespace-nowrap",
                        linkClassName
                      )}
                    >
                      {segment.label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>

                {!segment.isLast && (
                  <BreadcrumbSeparator>{separator}</BreadcrumbSeparator>
                )}
              </div>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </nav>
  );
}

// Helper function to create breadcrumb segments
export function createBreadcrumbSegments(
  items: Array<{ label: string; href?: string }>
): BreadcrumbSegment[] {
  return items.map((item, index) => ({
    label: item.label,
    href: item.href || "#",
    isLast: index === items.length - 1,
  }));
}
