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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { EntityAvatar } from "../entity/entity-avatar";
import type { SidebarCounts, SidebarProps, SidebarUser } from "./sidebar.types";
import { SIDEBAR_COUNT_BADGE_CLASS } from "./sidebar.types";
import { useMobileNav } from "./mobile-nav";
import {
  PINNED_SECTION_KEY,
  activeHref,
  activeSectionKey,
  sectionCount,
  visibleSections,
  type SidebarLink,
} from "./sidebar.config";
import { useSidebarGroups } from "./sidebar-groups.client";

const sections = visibleSections();

export default function Sidebar({ counts, user }: SidebarProps) {
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
        <SidebarFooter expanded={expanded} user={user} />
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
          <SidebarFooter expanded user={user} />
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
  const activeKey = activeSectionKey(pathname, sections);
  const groups = useSidebarGroups(activeKey);

  // The collapsed icon rail stays flat: every icon, groups split by a rule.
  if (!expanded) {
    return (
      <nav className="p-2" aria-label="Admin">
        {sections.map((section, index) => (
          <div key={section.key}>
            {index > 0 && <div className="mx-2 my-2 h-px bg-sidebar-border" />}
            <LinkList links={section.links} counts={counts} current={current} expanded={false} />
          </div>
        ))}
      </nav>
    );
  }

  return (
    <nav className="space-y-1 p-2" aria-label="Admin">
      {sections.map((section) => {
        if (section.key === PINNED_SECTION_KEY) {
          return (
            <div key={section.key} className="pb-1">
              <LinkList links={section.links} counts={counts} current={current} expanded />
            </div>
          );
        }
        const open = groups.isOpen(section.key);
        const holdsActive = section.key === activeKey;
        const total = sectionCount(section, counts);
        return (
          <Collapsible
            key={section.key}
            open={open}
            onOpenChange={(next) => groups.setOpen(section.key, next)}
          >
            <CollapsibleTrigger
              className={cn(
                "group/trigger flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-start text-[13px] font-medium",
                "text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground",
                "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                holdsActive && !open && "text-primary-ink",
              )}
            >
              <ChevronDown
                className="size-3.5 shrink-0 -rotate-90 transition-transform duration-200 group-data-[state=open]/trigger:rotate-0 motion-reduce:transition-none rtl:rotate-90"
                aria-hidden
              />
              <span className="flex-1 truncate">{section.title}</span>
              {!open && holdsActive ? (
                <span className="size-1.5 rounded-full bg-primary" aria-label="Current page is in this group" />
              ) : null}
              {!open && total > 0 ? (
                <Badge variant="secondary" className={SIDEBAR_COUNT_BADGE_CLASS}>
                  {total.toLocaleString()}
                </Badge>
              ) : null}
            </CollapsibleTrigger>
            <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down motion-reduce:animate-none">
              <div className="ms-[1.15rem] mt-0.5 mb-1 border-s border-sidebar-border ps-1.5">
                <LinkList links={section.links} counts={counts} current={current} expanded />
              </div>
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </nav>
  );
}

function LinkList({
  links,
  counts,
  current,
  expanded,
}: {
  links: SidebarLink[];
  counts: SidebarCounts;
  current: string | null;
  expanded: boolean;
}) {
  return (
    <ul className="flex flex-col gap-0.5">
      {links.map((link) => {
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
                "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                expanded && "justify-between",
                active &&
                  "bg-primary font-medium text-primary-foreground hover:bg-primary [&_svg]:text-primary-foreground",
              )}
            >
              <span className="flex min-w-0 items-center">
                <link.icon
                  className={cn(
                    "size-[18px] shrink-0 text-muted-foreground",
                    expanded ? "me-2.5" : "mx-auto",
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
  );
}

function SidebarFooter({ expanded, user }: { expanded: boolean; user: SidebarUser }) {
  return (
    <div className="border-t border-sidebar-border p-4">
      <div className="flex items-center" title={expanded ? undefined : user.email}>
        <EntityAvatar name={user.name || "Admin"} seed={user.email} size="sm" className="size-8" />
        {expanded && (
          <div className="ms-3 min-w-0">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
        )}
      </div>
    </div>
  );
}
