"use client";

import React from "react";
import { usePathname, Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
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

// Fallback English labels, used only if a segment has no "breadcrumb.*"
// translation key (e.g. an unexpected/legacy route).
const fallbackLabels: Record<string, string> = {
  products: "Products",
  categories: "Categories",
  brands: "Brands",
  stores: "Stores",
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
  shipping: "Shipping",
  payment: "Payment",
  privacy: "Privacy",
  cookies: "Cookies",
  terms: "Terms",
  auth: "Authentication",
  login: "Login",
  register: "Register",
  "reset-password": "Reset Password",
  unauthorized: "Unauthorized",
  sell: "Sell on Tallaby",
};

function formatLabel(
  segment: string,
  translate: (segment: string) => string | undefined,
  customLabels?: Record<string, string>
): string {
  // Check custom labels first
  if (customLabels?.[segment]) {
    return customLabels[segment];
  }

  // Localized label from the "breadcrumb" messages namespace
  const translated = translate(segment);
  if (translated) {
    return translated;
  }

  // Check default labels
  if (fallbackLabels[segment]) {
    return fallbackLabels[segment];
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
  translate: (segment: string) => string | undefined,
  customLabels?: Record<string, string>
): BreadcrumbSegment[] {
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs: BreadcrumbSegment[] = [];

  segments.forEach((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join("/")}`;
    const isLast = index === segments.length - 1;
    const label = formatLabel(segment, translate, customLabels);

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
  homeLabel,
  separator,
  maxItems,
  itemClassName,
  linkClassName,
  pageClassName,
  showHomeIcon = true,
  customLabels,
}: DynamicBreadcrumbProps) {
  const pathname = usePathname();
  const t = useTranslations("breadcrumb");
  const translate = (segment: string) => (t.has(segment) ? t(segment) : undefined);

  // Don't show breadcrumbs on home page
  if (pathname === "/") {
    return null;
  }

  const breadcrumbs = generateBreadcrumbs(pathname, translate, customLabels);

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
      <div className="container py-2.5 lg:py-5">
        <Breadcrumb>
          <BreadcrumbList className="text-xs lg:text-sm">
            {/* Home item */}
            <BreadcrumbItem className={itemClassName}>
              <BreadcrumbLink asChild>
                <Link
                  href="/"
                  className={cn(
                    "hover:text-primary transition-colors",
                    linkClassName
                  )}
                >
                  {showHomeIcon && (
                    <>
                      <HomeIcon size={16} aria-hidden="true" className="mr-1" />
                      <span className="sr-only">{t("home")}</span>
                    </>
                  )}
                  {!showHomeIcon && (homeLabel ?? t("home"))}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>

            {displayBreadcrumbs.length > 0 && (
              <BreadcrumbSeparator>{separator}</BreadcrumbSeparator>
            )}

            {/* Dynamic breadcrumb items */}
            {displayBreadcrumbs.map((breadcrumb, index) => (
              <React.Fragment key={breadcrumb.href}>
                <BreadcrumbItem className={itemClassName}>
                  {breadcrumb.isLast ? (
                    <BreadcrumbPage
                      className={cn(
                        "text-primary font-medium truncate max-w-[300px]",
                        pageClassName
                      )}
                    >
                      {breadcrumb.label}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link
                        href={breadcrumb.href}
                        className={cn(
                          "hover:text-primary truncate max-w-[300px] transition-colors whitespace-nowrap",
                          linkClassName
                        )}
                      >
                        {breadcrumb.label}
                      </Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>

                {!breadcrumb.isLast && (
                  <BreadcrumbSeparator>{separator}</BreadcrumbSeparator>
                )}
              </React.Fragment>
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
  const t = useTranslations("breadcrumb");
  const translate = (segment: string) => (t.has(segment) ? t(segment) : undefined);

  if (pathname === "/") {
    return [];
  }

  return generateBreadcrumbs(pathname, translate, customLabels);
}
