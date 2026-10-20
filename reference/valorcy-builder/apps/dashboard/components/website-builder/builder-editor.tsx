'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Toaster } from '@workspace/ui/components/sonner'
import { toast } from 'sonner'
import { useBuilderStore, type DesignSystem, type WebsitePageRow } from '@/lib/builder/store'
import { normalizePageContent } from '@/lib/builder/normalize-page-content'
import { hydrateSavedBlocks } from '@/lib/builder/saved-blocks-sync'
import { mapDbDesignSystemToBuilder } from '@/lib/builder/design-system-map'
import { BuilderNavbar } from '@/components/website-builder/builder-navbar'
import { BuilderWorkspace } from '@/components/website-builder/builder-workspace'
import { useBuilderAutosave } from '@/components/website-builder/use-builder-autosave'
import { KeyboardShortcutsDialog } from './keyboard-shortcuts-dialog'
import { flushBuilderAutosave } from './use-builder-autosave'
import { BuilderDndProvider } from '@/components/website-builder/dnd/builder-dnd-provider'
import { QuickInsertPalette } from '@/components/website-builder/insert/quick-insert-palette'
import { useBuilderShortcuts } from '@/components/website-builder/use-builder-shortcuts'
import type { WebsiteStatus } from '@/lib/builder/website-status'
import type { KitSectionGroup } from '@workspace/kits'

export type BuilderEditorProps = {
  locale: string
  websiteId: string
  projectId: string
  projectName: string
  projectSlug: string
  initialWebsiteStatus: WebsiteStatus
  subdomain: string | null
  /**
   * Non-null when this website is a Template Studio source
   * (`projects.kind = 'template'`) rather than a real user's site — swaps the
   * navbar's Publish for "Publish template version" and hides site-only
   * affordances (custom domain, analytics, billing). `templateId` is null
   * until the first publish creates the linked `templates` row.
   */
  templateMode?: { templateId: string | null } | null
  designSystemRow: {
    colors: unknown
    typography: unknown
    spacing: unknown
    customCss: string | null
    version: number | null
  } | null
  initialPageSlug?: string
  /** Section instance to select once the page loads (deep link from the AI builder). */
  initialSectionId?: string
  sharedHeader?: unknown | null
  sharedFooter?: unknown | null
  projectLogoUrl?: string | null
  defaultIndustry?: string | null
  kitSectionGroups?: KitSectionGroup[]
  /** Resolved Business Kit id for industry-specific section defaults. */
  kitId?: string | null
  projectLocale?: string
  supportedLocales?: string[]
  pages: Array<{
    id: string
    websiteId: string
    projectId: string
    name: Record<string, string>
    slug: string
    isHome: boolean
    locale: string
    orderIndex: number
    status: string
    version: number
    draftContent: unknown
    publishedContent: unknown | null
    useSharedHeader?: boolean
    useSharedFooter?: boolean
  }>
}

function toPageRows (pages: BuilderEditorProps['pages']): WebsitePageRow[] {
  return pages.map((p) => ({
    id: p.id,
    websiteId: p.websiteId,
    projectId: p.projectId,
    name: p.name,
    slug: p.slug,
    isHome: p.isHome,
    locale: p.locale,
    orderIndex: p.orderIndex,
    status: p.status,
    version: p.version,
    draftContent: normalizePageContent(p.draftContent),
    publishedContent: p.publishedContent
      ? normalizePageContent(p.publishedContent)
      : null,
    useSharedHeader: p.useSharedHeader ?? true,
    useSharedFooter: p.useSharedFooter ?? true,
  }))
}

export function BuilderEditor (props: BuilderEditorProps) {
  useBuilderAutosave({
    projectId: props.projectId,
    websiteId: props.websiteId
  })

  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [quickInsertOpen, setQuickInsertOpen] = useState(false)

  const openQuickInsert = useCallback(() => setQuickInsertOpen(true), [])
  useBuilderShortcuts({ onQuickInsert: openQuickInsert })

  const initialized = useRef(false)
  const ds = useMemo(
    () => mapDbDesignSystemToBuilder(props.designSystemRow) as DesignSystem,
    [props.designSystemRow]
  )

  useEffect(() => {
    const isTyping = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false
      if (target.isContentEditable) return true
      const tag = target.tagName
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
    }

    const handler = (e: KeyboardEvent) => {
      if (e.repeat) return

      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        if (isTyping(e.target)) return
        e.preventDefault()
        setShortcutsOpen((open) => !open)
        return
      }

      const mod = e.ctrlKey || e.metaKey
      if (!mod) return

      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        const { undo, pastStates } = useBuilderStore.temporal.getState()
        if (pastStates.length === 0) return
        undo()
        toast.message('Undo', { duration: 1500 })
      } else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
        e.preventDefault()
        const { redo, futureStates } = useBuilderStore.temporal.getState()
        if (futureStates.length === 0) return
        redo()
        toast.message('Redo', { duration: 1500 })
      } else if (e.key === 's') {
        e.preventDefault()
        void flushBuilderAutosave().then((ok) => {
          if (ok) toast.success('Saved', { duration: 1500 })
        })
      } else if (e.key === 'd') {
        if (isTyping(e.target)) return
        const { selectedSectionId, duplicateSection } = useBuilderStore.getState()
        if (!selectedSectionId) return
        e.preventDefault()
        duplicateSection(selectedSectionId)
        toast.message('Section duplicated', { duration: 1500 })
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const rows = toPageRows(props.pages)
    useBuilderStore.getState().initPages(rows)
    useBuilderStore.getState().initWebsite(
      props.websiteId,
      (props.sharedHeader as import('@/components/sections/registry.types').SectionInstance | null) ?? null,
      (props.sharedFooter as import('@/components/sections/registry.types').SectionInstance | null) ?? null,
      props.projectLogoUrl ?? null,
      props.kitSectionGroups ?? [],
      props.kitId ?? null,
    )

    const fromQuery = props.initialPageSlug
      ? rows.find((r) => r.slug === props.initialPageSlug)
      : undefined
    const initial = fromQuery ?? rows.find((r) => r.isHome) ?? rows[0]
    if (!initial) return

    useBuilderStore.getState().initBuilder(
      props.projectId,
      initial.id,
      props.projectName,
      props.projectSlug,
      initial.draftContent,
      initial.publishedContent,
      initial.version,
      ds,
      props.designSystemRow?.version ?? 0,
      {
        defaultLocale: props.projectLocale ?? 'en',
        supportedLocales: props.supportedLocales ?? [props.projectLocale ?? 'en'],
      }
    )
    useBuilderStore.getState().setDsVersion(props.designSystemRow?.version ?? 0)

    const targetSectionId = props.initialSectionId
    if (targetSectionId && initial.draftContent.sections.some((s) => s.id === targetSectionId)) {
      useBuilderStore.getState().setSelectedSection(targetSectionId)
      // Give the canvas a moment to mount before bringing the section into view.
      window.setTimeout(() => {
        document
          .querySelector(`[data-section-instance-id="${CSS.escape(targetSectionId)}"]`)
          ?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      }, 400)
    }

    const autoFillPref = window.localStorage.getItem('valorcy:auto-fill-new-sections-ai')
    if (autoFillPref === '0' || autoFillPref === '1') {
      useBuilderStore.getState().setAutoFillNewSectionsWithAi(autoFillPref === '1')
    }

    void hydrateSavedBlocks(props.projectId)
  }, [props.projectId, props.projectName, props.projectSlug, props.pages, props.initialPageSlug, props.designSystemRow, ds])

  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden bg-muted/30">
      <Toaster richColors />
      <BuilderNavbar
        locale={props.locale}
        websiteId={props.websiteId}
        projectId={props.projectId}
        initialWebsiteStatus={props.initialWebsiteStatus}
        subdomain={props.subdomain}
        defaultIndustry={props.defaultIndustry ?? null}
        templateMode={props.templateMode ?? null}
      />
      <BuilderDndProvider
        projectId={props.projectId}
        websiteId={props.websiteId}
      >
        <BuilderWorkspace
          websiteId={props.websiteId}
          projectId={props.projectId}
        />
      </BuilderDndProvider>
      <KeyboardShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      <QuickInsertPalette open={quickInsertOpen} onOpenChange={setQuickInsertOpen} />
    </div>
  )
}
