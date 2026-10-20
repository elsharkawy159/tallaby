"use client"

import { useState } from "react"
import { Link, usePathname } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import { ChevronRight, Database, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { projectCmsPath } from "@/lib/project-routes"
import { useCmsCollections } from "@/components/cms/cms-collections-provider"
import { NewCollectionDialog } from "@/components/cms/new-collection-dialog"

/**
 * The CMS entry in the project sidebar, rendered as an accordion: the label
 * links to the CMS overview, a chevron toggles the collection list, and a
 * "New collection" row sits at the bottom. Collections come from the shared
 * `CmsCollectionsProvider` so this stays in sync with the breadcrumb.
 */
export function CmsSidebarSection({
  projectId,
  compact,
}: {
  projectId: string
  compact: boolean
}) {
  const tNav = useTranslations("data.projectNav")
  const tCmsNav = useTranslations("cms.nav")
  const t = useTranslations("cms.newCollection")
  const pathname = usePathname() ?? ""
  const { collections, isLoading, refresh } = useCmsCollections()

  const cmsBase = projectCmsPath(projectId)
  const onCmsRoute = pathname === cmsBase || pathname.startsWith(`${cmsBase}/`)

  // Derive expansion from the route (auto-expand on CMS pages) unless the user
  // has manually toggled it. `null` = follow the route.
  const [manualOpen, setManualOpen] = useState<boolean | null>(null)
  const open = manualOpen ?? onCmsRoute

  // Collapsed sidebar: icon-only link, no accordion.
  if (compact) {
    return (
      <Link
        href={cmsBase as string}
        title={tNav("cms")}
        className={cn(
          "flex w-full items-center justify-center rounded-lg px-2 py-2.5 text-sm font-medium transition-all duration-200",
          onCmsRoute
            ? "bg-primary/10 text-primary shadow-sm"
            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        )}
      >
        <Database className="h-4.5 w-4.5 shrink-0" />
      </Link>
    )
  }

  const isOverview = pathname === cmsBase

  return (
    <div>
      <button
        type="button"
        onClick={() => setManualOpen(!open)}
        aria-expanded={open}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
          onCmsRoute
            ? "bg-primary/10 text-primary shadow-sm"
            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        )}
      >
        <Database className="h-4.5 w-4.5 shrink-0" />
        <span className="flex-1 text-start">{tNav("cms")}</span>
        <ChevronRight
          className={cn(
            "h-4 w-4 shrink-0 transition-transform rtl:rotate-180",
            open && "rotate-90 rtl:rotate-90"
          )}
        />
      </button>

      {open && (
        <div className="mt-0.5 space-y-px">
          <Link
            href={cmsBase as string}
            className={cn(
              "flex items-center rounded-lg px-3 py-1.5 text-xs mt-1 transition-colors",
              isOverview
                ? "bg-primary/10 font-medium text-primary"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <span className="truncate">{tCmsNav("overview")}</span>
          </Link>

          {isLoading && collections.length === 0 && (
            <div className="space-y-1 py-1">
              <div className="h-6 animate-pulse rounded-md bg-muted/60" />
              <div className="h-6 animate-pulse rounded-md bg-muted/40" />
            </div>
          )}

          {collections.map((collection) => {
            const href = projectCmsPath(projectId, collection.slug)
            const isActive =
              pathname === href || pathname.startsWith(`${href}/`)
            return (
              <Link
                key={collection.id}
                href={href as string}
                className={cn(
                  "flex items-center rounded-lg px-3 py-1.5 text-xs transition-colors",
                  isActive
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <span className="truncate">{collection.name}</span>
              </Link>
            )
          })}

          <NewCollectionDialog
            projectId={projectId}
            onCreated={refresh}
            trigger={
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
              >
                <Plus className="h-3.5 w-3.5 shrink-0" />
                <span>{t("newCollection")}</span>
              </button>
            }
          />
        </div>
      )}
    </div>
  )
}
