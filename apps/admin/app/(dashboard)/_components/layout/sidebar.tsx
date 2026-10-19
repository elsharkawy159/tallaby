"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@workspace/ui/lib/utils";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { SidebarCounts, SidebarProps } from "./sidebar.types";
import { SIDEBAR_COUNT_BADGE_CLASS } from "./sidebar.types";
import { useMobileNav } from "./mobile-nav";
import { activeHref, visibleSections } from "./sidebar.config";

const sections = visibleSections();

export default function Sidebar({ counts }: SidebarProps) {
  const [expanded, setExpanded] = useState(true);
  const { open, setOpen } = useMobileNav();

  return (
    <>
      {/* Desktop / tablet sidebar */}
      <div
        className={cn(
          "hidden h-full shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300 lg:flex",
          expanded ? "w-64" : "w-16",
        )}
      >
        <div className="flex items-center justify-between border-b border-sidebar-border p-4 py-3.5">
          {expanded ? (
            <h1 className="text-xl font-bold text-primary">Admin</h1>
          ) : (
            <h1 className="mx-auto text-xl font-bold text-primary">A</h1>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </Button>
        </div>
        <ScrollArea className="min-h-0 flex-1">
          <SidebarNav counts={counts} expanded={expanded} />
        </ScrollArea>
        <SidebarFooter expanded={expanded} />
      </div>

      {/* Mobile drawer */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          className="w-72 max-w-[85vw] gap-0 bg-sidebar p-0 text-sidebar-foreground lg:hidden"
        >
          <SheetHeader className="border-b border-sidebar-border p-4">
            <SheetTitle className="text-xl font-bold text-primary">
              Admin
            </SheetTitle>
          </SheetHeader>
          <ScrollArea className="min-h-0 flex-1">
            <SidebarNav counts={counts} expanded />
          </ScrollArea>
          <SidebarFooter expanded />
        </SheetContent>
      </Sheet>
    </>
  );
}

function SidebarNav({
  counts,
  expanded,
}: {
  counts: SidebarCounts;
  expanded: boolean;
}) {
  const pathname = usePathname();
  const current = activeHref(pathname, sections);

  return (
    <nav className="p-2">
      {sections.map((section, index) => (
        <div key={section.key} className={cn(index > 0 && "mt-3")}>
          {expanded ? (
            <p className="px-3 pb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {section.title}
            </p>
          ) : (
            index > 0 && <div className="mx-2 mb-3 h-px bg-sidebar-border" />
          )}
          <ul className="flex flex-col gap-0.5">
            {section.links.map((link) => {
              const active = current === link.href;
              const count = link.countKey ? counts[link.countKey] : 0;
              return (
                <li key={link.key}>
                  <Link
                    href={link.href}
                    title={expanded ? undefined : link.title}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex items-center rounded-md px-3 py-2 text-sm",
                      "transition-colors hover:bg-sidebar-accent",
                      expanded && "justify-between",
                      active &&
                        "bg-primary font-medium text-primary-foreground hover:bg-primary [&_svg]:text-primary-foreground",
                    )}
                  >
                    <span className="flex min-w-0 items-center">
                      <link.icon
                        className={cn(
                          "size-5 shrink-0 text-muted-foreground",
                          expanded ? "mr-2" : "mx-auto",
                        )}
                      />
                      {expanded && <span className="truncate">{link.title}</span>}
                    </span>
                    {count > 0 &&
                      (expanded ? (
                        <Badge
                          variant="secondary"
                          className={SIDEBAR_COUNT_BADGE_CLASS}
                          title={link.countLabel}
                        >
                          {count.toLocaleString()}
                        </Badge>
                      ) : (
                        <span
                          className="absolute top-1 right-1 size-2 rounded-full bg-destructive"
                          aria-label={link.countLabel}
                        />
                      ))}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function SidebarFooter({ expanded }: { expanded: boolean }) {
  return (
    <div className="border-t border-sidebar-border p-4">
      <div className="flex items-center">
        <div className="flex size-8 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground">
          A
        </div>
        {expanded && (
          <div className="ml-3">
            <p className="text-sm font-medium">Admin User</p>
            <p className="text-xs text-muted-foreground">admin@example.com</p>
          </div>
        )}
      </div>
    </div>
  );
}
