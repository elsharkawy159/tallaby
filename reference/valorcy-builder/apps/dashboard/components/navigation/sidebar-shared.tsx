"use client"

import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Button } from "@workspace/ui/components/button"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import { Separator } from "@workspace/ui/components/separator"
import { Badge } from "@workspace/ui/components/badge"
import { LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { ProjectSwitcher } from "@/components/projects/project-switcher"
import { useDashboardUser } from "@/components/providers/dashboard-user-provider"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { ValorcyLogo } from "@workspace/ui/components/valorcy-logo"
import type { KitNavGroup } from "@/lib/kits/types"

export type SidebarProject = {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  faviconUrl: string | null
  industry: string | null
  /** The project's resolved Business Kit nav groups (kits are DB-backed/async now — resolved server-side in dashboard-shell-wrapper.tsx). */
  kitNavGroups?: KitNavGroup[]
  websiteId?: string | null
}

export function SidebarBrand({
  compact,
  onToggleCollapse,
}: {
  compact: boolean
  onToggleCollapse?: () => void
}) {
  const t = useTranslations("pages.dashboard")

  return (
    <div
      className={cn(
        "flex items-center py-3.5",
        onToggleCollapse
          ? cn(
              "gap-2",
              compact ? "justify-center px-2" : "justify-between px-4"
            )
          : "gap-2.5 px-4"
      )}
    >
      {compact ? (
        <ValorcyLogo variant="mark" className="h-7 w-7" />
      ) : (
        <ValorcyLogo className="h-6 w-auto" />
      )}
      {onToggleCollapse && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={onToggleCollapse}
          aria-label={compact ? t("expandSidebar") : t("collapseSidebar")}
        >
          {compact ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>
      )}
    </div>
  )
}

export function SidebarFooter({
  projects,
  selectedProjectId,
  compact,
  onSignOut,
  currentPathname,
}: {
  projects: SidebarProject[]
  selectedProjectId: string | null
  compact: boolean
  onSignOut: () => void
  currentPathname?: string | null
}) {
  const t = useTranslations("pages.dashboard")
  const { profile } = useDashboardUser()
  const displayName =
    profile?.fullName || profile?.username || profile?.email || "—"
  const displayEmail = profile?.email || ""
  const initials = String(displayName)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("")
  const planLabel = profile?.plan
    ? profile.plan === "pro"
      ? t("proPlan")
      : profile.plan
    : t("proPlan")

  return (
    <div
      className={cn(
        "space-y-3",
        compact ? "flex flex-col items-center p-2" : "p-4"
      )}
    >
      <ProjectSwitcher
        projects={projects}
        selectedProjectId={selectedProjectId}
        collapsed={compact}
        selectProjectLabel={t("selectProject")}
        currentPathname={currentPathname}
      />

      <div
        className={cn(
          "flex items-center",
          compact ? "flex-col gap-2" : "justify-between gap-2"
        )}
      >
        <div
          className={cn(
            "flex min-w-0 items-center gap-3",
            compact && "flex-col gap-2"
          )}
        >
          <Avatar className="h-9 w-9 border border-primary/10">
            {profile?.avatarUrl && (
              <AvatarImage src={profile.avatarUrl} alt={displayName} />
            )}
            <AvatarFallback className="bg-linear-to-br from-primary/15 to-chart-1/15 text-xs font-semibold text-primary">
              {initials || "U"}
            </AvatarFallback>
          </Avatar>

          {!compact && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{displayName}</p>
              {/* {displayEmail && (
                <p className="truncate text-xs text-muted-foreground">
                  {displayEmail}
                </p>
              )} */}
              <Badge
                variant="outline"
                className="mt-1 w-fit border-primary/20 bg-primary/5 px-1.5 py-0 text-[11px] font-semibold text-primary capitalize"
              >
                {planLabel}
              </Badge>
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-destructive/5 hover:text-destructive"
          onClick={onSignOut}
          aria-label={t("signOut")}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export function SidebarShell({
  children,
  footer,
  compact,
  onToggleCollapse,
}: {
  children: React.ReactNode
  footer: React.ReactNode
  compact: boolean
  onToggleCollapse?: () => void
}) {
  return (
    <div className="flex h-full flex-col">
      <SidebarBrand compact={compact} onToggleCollapse={onToggleCollapse} />
      <Separator className="opacity-60" />
      <ScrollArea
        className={cn("flex-1 overflow-y-auto py-3", compact ? "px-2" : "px-3")}
      >
        {children}
      </ScrollArea>
      <Separator className="opacity-60" />
      {footer}
    </div>
  )
}
