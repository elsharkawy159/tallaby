"use client";

import { usePathname } from "next/navigation";
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

interface DynamicBreadcrumbProps {
  className?: string;
  homeLabel?: string;
  separator?: React.ReactNode;
  maxItems?: number;
  itemClassName?: string;
  linkClassName?: string;
  pageClassName?: string;
  showHomeIcon?: boolean;
  customLabels?: Record<string, string>;
}

interface BreadcrumbSegment {
  label: string;
  href: string;
  isLast: boolean;
}

const defaultLabels: Record<string, string> = {
  products: "Products",
  categories: "Categories",
  cart: "Cart",
  checkout: "Checkout",
  profile: "Profile",
  addresses: "Addresses",
  security: "Security",
  wishlist: "Wishlist",
  about: "About",
  contact: "Contact",
  help: "Help",
  faq: "FAQ",
  careers: "Careers",
  returns: "Returns",
  terms: "Terms",
  stores: "Stores",
  auth: "Authentication",
  login: "Login",
  register: "Register",
  "reset-password": "Reset Password",
  unauthorized: "Unauthorized",
  "become-seller": "Become Seller",
};

function formatLabel(
  segment: string,
  customLabels?: Record<string, string>
): string {
  // Check custom labels first
  if (customLabels?.[segment]) {
    return customLabels[segment];
  }

  // Check default labels
  if (defaultLabels[segment]) {
    return defaultLabels[segment];
  }

  // Handle dynamic segments (like slugs)
  if (segment.startsWith("[") && segment.endsWith("]")) {
    return segment.slice(1, -1); // Remove brackets
  }

  // Format kebab-case to Title Case
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function generateBreadcrumbs(
  pathname: string,
  customLabels?: Record<string, string>
): BreadcrumbSegment[] {
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs: BreadcrumbSegment[] = [];

  segments.forEach((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join("/")}`;
    const isLast = index === segments.length - 1;
    const label = formatLabel(segment, customLabels);

    breadcrumbs.push({
      label,
      href,
      isLast,
    });
  });

  return breadcrumbs;
}

export function DynamicBreadcrumb({
  className,
  homeLabel = "Home",
  separator,
  maxItems,
  itemClassName,
  linkClassName,
  pageClassName,
  showHomeIcon = true,
  customLabels,
}: DynamicBreadcrumbProps) {
  const pathname = usePathname();

  // Don't show breadcrumbs on home page
  if (pathname === "/") {
    return null;
  }

  const breadcrumbs = generateBreadcrumbs(pathname, customLabels);

  // Handle maxItems limitation
  let displayBreadcrumbs = breadcrumbs;
  if (maxItems && breadcrumbs.length > maxItems - 1) {
    // Always show first and last items, with ellipsis in between if needed
    const firstItems = breadcrumbs.slice(0, 1);
    const lastItems = breadcrumbs.slice(-(maxItems - 2));
    displayBreadcrumbs = [...firstItems, ...lastItems];
  }

  return (
    <nav className={cn(className)}>
      <div className="container mx-auto px-4 py-2 lg:py-5">
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

            {displayBreadcrumbs.length > 0 && (
              <BreadcrumbSeparator>{separator}</BreadcrumbSeparator>
            )}

            {/* Dynamic breadcrumb items */}
            {displayBreadcrumbs.map((breadcrumb, index) => (
              <div key={breadcrumb.href} className="flex items-center">
                <BreadcrumbItem className={itemClassName}>
                  {breadcrumb.isLast ? (
                    <BreadcrumbPage
                      className={cn(
                        "text-primary font-medium truncate max-w-[200px] lg:max-w-none",
                        pageClassName
                      )}
                    >
                      {breadcrumb.label}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      href={breadcrumb.href}
                      className={cn(
                        "hover:text-primary transition-colors whitespace-nowrap",
                        linkClassName
                      )}
                    >
                      {breadcrumb.label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>

                {!breadcrumb.isLast && (
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

// Hook for getting current breadcrumb data (useful for SEO)
export function useBreadcrumbs(customLabels?: Record<string, string>) {
  const pathname = usePathname();

  if (pathname === "/") {
    return [];
  }

  return generateBreadcrumbs(pathname, customLabels);
}
