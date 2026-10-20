"use client"

import * as Icons from "lucide-react"
import { useTranslations } from "next-intl"
import { Database, Pencil, Plus } from "lucide-react"
import { Link } from "@/i18n/navigation"
import { Button } from "@workspace/ui/components/button"
import { NewCollectionDialog } from "./new-collection-dialog"
import { PageHeader } from "@/components/navigation/page-header"
import { useCmsCollections } from "@/components/cms/cms-collections-provider"
import { projectCmsPath } from "@/lib/project-routes"
import type { CmsCollectionListItem } from "@/types/cms/cms.types"

interface CollectionsOverviewProps {
  collections: CmsCollectionListItem[]
  projectId: string
}

/** Max field pills shown on a card before collapsing into a "+N more" pill. */
const MAX_VISIBLE_FIELDS = 6

function CollectionIcon({ name }: { name: string | null }) {
  const Icon = (name && (Icons as unknown as Record<string, Icons.LucideIcon>)[name]) || Database
  return <Icon className="size-5" />
}

export function CollectionsOverview({ collections, projectId }: CollectionsOverviewProps) {
  const tHeaders = useTranslations('pages.pageHeaders')
  const t = useTranslations('cms.collections')
  const tNav = useTranslations('cms.nav')
  const { refresh } = useCmsCollections()

  const settingsHref = `${projectCmsPath(projectId)}/settings`

  return (
    <div className="space-y-6">
      <PageHeader
        title={tHeaders('projectCms.title')}
        description={tHeaders('projectCms.description')}
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={settingsHref as string}>{tNav('apiAndSettings')}</Link>
            </Button>
            <NewCollectionDialog projectId={projectId} onCreated={refresh} />
          </div>
        }
      />

      {collections.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-20 text-center">
          <Database className="size-8 text-muted-foreground" />
          <div>
            <p className="font-medium">{t('empty')}</p>
            <p className="text-sm text-muted-foreground">{t('emptyDescription')}</p>
          </div>
          <NewCollectionDialog projectId={projectId} onCreated={refresh} />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => {
            const collectionHref = projectCmsPath(projectId, collection.slug)
            const schemaHref = `${collectionHref}/schema`
            const fields = collection.fields ?? []
            const visibleFields = fields.slice(0, MAX_VISIBLE_FIELDS)
            const hiddenCount = fields.length - visibleFields.length

            return (
              <div
                key={collection.id}
                className="group relative flex flex-col gap-3 rounded-lg border border-border p-4 transition-colors hover:border-primary/40 hover:bg-muted/30"
              >
                {/* Whole-card click target; sits beneath the interactive controls. */}
                <Link
                  href={collectionHref as string}
                  aria-label={collection.name}
                  className="absolute inset-0 rounded-lg"
                />

                <div className="pointer-events-none relative flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <CollectionIcon name={collection.icon} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{collection.name}</p>
                    <p className="truncate text-xs text-muted-foreground">/{collection.slug}</p>
                  </div>
                  <Link
                    href={schemaHref as string}
                    aria-label={t('editFields')}
                    title={t('editFields')}
                    className="pointer-events-auto relative z-10 ms-auto flex size-8 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-all hover:bg-muted hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
                  >
                    <Pencil className="size-4" />
                  </Link>
                </div>

                {collection.description && (
                  <p className="pointer-events-none relative line-clamp-2 text-sm text-muted-foreground">
                    {collection.description}
                  </p>
                )}

                <p className="pointer-events-none relative text-xs text-muted-foreground">
                  {t('recordCount', { count: collection.itemCount })}
                  {collection.isSystem ? ` · ${t('builtIn')}` : ""}
                </p>

                <div className="pointer-events-none relative flex flex-wrap gap-1.5">
                  {visibleFields.map((field) => (
                    <span
                      key={field.key}
                      className="pointer-events-none rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                    >
                      {field.label}
                    </span>
                  ))}
                  {hiddenCount > 0 && (
                    <span className="pointer-events-none rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {t('moreFields', { count: hiddenCount })}
                    </span>
                  )}
                  <Link
                    href={schemaHref as string}
                    className="pointer-events-auto relative z-10 flex items-center gap-1 rounded-md border border-dashed border-border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                  >
                    <Plus className="size-3" />
                    {t('addColumn')}
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
