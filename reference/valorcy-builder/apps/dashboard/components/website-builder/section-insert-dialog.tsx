"use client"

import { useRef, useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { Plus, Search, X } from "lucide-react"
import { notify } from "@/services/toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import {
  CATEGORY_LABELS,
  SECTION_CATEGORY_ORDER,
} from "@/components/sections/categories"
import { sectionRegistry } from "@/components/sections"
import { SectionPreviewCard } from "@/components/website-builder/section-preview-card"
import { useBuilderStore } from "@/lib/builder/store"
import { getSectionBinding } from "@/lib/cms/section-bindings"
import { ensureCmsCollectionForSection } from "@/actions/cms/section-binding-actions"
import { SECTION_COMPLEXITY } from "@/components/sections/registry.constants"
import type { SectionInstance } from "@/components/sections/registry.types"
import { prepareSectionInstance } from "@/lib/builder/section-preparation"

interface SectionInsertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  atIndex?: number
}

const ALL = "all"

/**
 * Static class-string map for `KitSectionGroup.accentColor` — Tailwind's JIT scanner
 * only picks up class names it can see literally in source, so this can't be built
 * from a template string like `border-${accentColor}/25`. Unknown/missing tokens
 * fall back to `primary`.
 */
const ACCENT_CLASSES: Record<string, string> = {
  primary: "border-primary/25 bg-primary/5",
  "chart-1": "border-chart-1/25 bg-chart-1/5",
  "chart-2": "border-chart-2/25 bg-chart-2/5",
  "chart-3": "border-chart-3/25 bg-chart-3/5",
  "chart-4": "border-chart-4/25 bg-chart-4/5",
  "chart-5": "border-chart-5/25 bg-chart-5/5",
}
function accentClasses(accentColor?: string) {
  return ACCENT_CLASSES[accentColor ?? "primary"] ?? ACCENT_CLASSES.primary
}

function labelize(value: string) {
  return value
    .split(/[_-]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

export function SectionInsertDialog({
  open,
  onOpenChange,
  atIndex,
}: SectionInsertDialogProps) {
  const t = useTranslations('dialogs.sectionInsert')
  const addSection = useBuilderStore((s) => s.addSection)
  const projectId = useBuilderStore((s) => s.projectId)
  const insertSavedBlock = useBuilderStore((s) => s.insertSavedBlock)
  const savedBlocks = useBuilderStore((s) => s.savedBlocks)
  const kitSectionGroups = useBuilderStore((s) => s.kitSectionGroups)
  const savedSectionBlocks = useMemo(
    () => savedBlocks.filter((b) => b.blockType === "section"),
    [savedBlocks]
  )
  const scrollRef = useRef<HTMLDivElement>(null)
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const [loadingSectionId, setLoadingSectionId] = useState<string | null>(null)

  const [query, setQuery] = useState("")
  const [industry, setIndustry] = useState<string>(ALL)
  const [style, setStyle] = useState<string>(ALL)
  const [complexity, setComplexity] = useState<string>(ALL)

  const allSections = useMemo(
    () =>
      sectionRegistry.getAll().filter((s) => !s.hidden && s.id !== "custom"),
    []
  )

  // Distinct industry / style values actually present across the registry, so
  // the filter dropdowns never offer an option that returns zero results.
  const { industryOptions, styleOptions } = useMemo(() => {
    const industries = new Set<string>()
    const styles = new Set<string>()
    for (const def of allSections) {
      for (const i of def.industries ?? []) industries.add(i)
      for (const s of def.styles ?? []) styles.add(s)
    }
    return {
      industryOptions: [...industries].sort(),
      styleOptions: [...styles].sort(),
    }
  }, [allSections])

  const hasActiveFilter =
    query.trim().length > 0 ||
    industry !== ALL ||
    style !== ALL ||
    complexity !== ALL

  // Flat filtered list — only computed when a search / filter is active.
  const filteredSections = useMemo(() => {
    if (!hasActiveFilter) return []
    const q = query.trim().toLowerCase()
    return allSections.filter((def) => {
      if (
        industry !== ALL &&
        !(def.industries ?? []).includes(industry as never)
      )
        return false
      if (style !== ALL && !(def.styles ?? []).includes(style as never))
        return false
      if (complexity !== ALL && def.complexity !== complexity) return false
      if (q) {
        const haystack = [
          def.displayName,
          def.description,
          CATEGORY_LABELS[def.category] ?? def.category,
          ...(def.tags ?? []),
          ...(def.aiKeywords ?? []),
        ]
          .join(" ")
          .toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [allSections, hasActiveFilter, query, industry, style, complexity])

  const categoriesWithSections = useMemo(() => {
    return SECTION_CATEGORY_ORDER.map((cat) => ({
      category: cat,
      sections: allSections.filter((s) => s.category === cat),
    })).filter((c) => c.sections.length > 0)
  }, [allSections])

  // Industry-curated groups from the project's Business Kit — shown first, above
  // the generic categories, so users rarely need to scroll past their industry's
  // sections. Resolved against the live registry so a curated id that's since
  // been removed/hidden is silently dropped instead of rendering a broken card.
  const kitGroupRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const resolvedKitGroups = useMemo(() => {
    return kitSectionGroups
      .map((group) => ({
        ...group,
        sections: group.sectionIds
          .map((id) => sectionRegistry.get(id))
          .filter((def): def is NonNullable<typeof def> => def !== undefined && !def.hidden),
      }))
      .filter((group) => group.sections.length > 0)
  }, [kitSectionGroups])

  function scrollToCategory(category: string) {
    const el = categoryRefs.current[category]
    const container = scrollRef.current
    if (!el || !container) return
    container.scrollTo({ top: el.offsetTop - 8, behavior: "smooth" })
  }

  function scrollToKitGroup(key: string) {
    const el = kitGroupRefs.current[key]
    const container = scrollRef.current
    if (!el || !container) return
    container.scrollTo({ top: el.offsetTop - 8, behavior: "smooth" })
  }

  function resetFilters() {
    setQuery("")
    setIndustry(ALL)
    setStyle(ALL)
    setComplexity(ALL)
  }

  async function handleSelect(sectionId: string) {
    const binding = getSectionBinding(sectionId)

    if (binding && projectId) {
      setLoadingSectionId(sectionId)
      try {
        const result = await ensureCmsCollectionForSection({
          projectId,
          sectionId,
          category: binding.category,
        })
        if (result.ok) {
          const defaultProps: Record<string, unknown> = {
            dataSource: {
              type: "cms_collection",
              collectionId: result.collectionId,
              collectionSlug: result.collectionSlug,
              category: binding.category,
              itemsPropKey: result.itemsPropKey,
              itemLimit: result.mappedItems.length || 9,
            },
          }
          if (result.mappedItems.length > 0) {
            defaultProps[result.itemsPropKey] = result.mappedItems
          }
          const inserted = addSection(sectionId, defaultProps, atIndex)
          if (inserted) void prepareSectionInstance(inserted.id)
          notify.success(
            result.created
              ? t('toastCollectionCreated', { name: result.collectionName })
              : t('toastCollectionConnected', { name: result.collectionName })
          )
        } else {
          // Binding failed — add section without data source as fallback
          const inserted = addSection(sectionId, {}, atIndex)
          if (inserted) void prepareSectionInstance(inserted.id)
          notify.error(t('toastCollectionFailed', { error: result.error }))
        }
      } catch {
        const inserted = addSection(sectionId, {}, atIndex)
        if (inserted) void prepareSectionInstance(inserted.id)
      } finally {
        setLoadingSectionId(null)
      }
    } else {
      const inserted = addSection(sectionId, {}, atIndex)
      if (inserted) void prepareSectionInstance(inserted.id)
    }

    onOpenChange(false)
  }

  function handleInsertSavedBlock(blockId: string) {
    insertSavedBlock(blockId, atIndex)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-5xl! flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 px-6 pt-6 pb-4">
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>

        <Tabs
          defaultValue="sections"
          className="flex min-h-0 flex-1 flex-col gap-0"
        >
          <TabsList className="shrink-0 mx-auto">
            <TabsTrigger value="sections">{t('sectionsTab')}</TabsTrigger>
            <TabsTrigger value="saved">
              {t('savedSectionsTab')}
              {savedSectionBlocks.length > 0
                ? ` (${savedSectionBlocks.length})`
                : ""}
            </TabsTrigger>
          </TabsList>

          {/* ── Sections tab ──────────────────────────────────────────── */}
          <TabsContent
            value="sections"
            className="m-0 flex min-h-0 flex-1 flex-col"
          >
            {/* Search + filters */}
            <div className="flex shrink-0 flex-col gap-2 px-6 pt-3 pb-3">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  className="ps-9"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={industry} onValueChange={setIndustry}>
                  <SelectTrigger className="h-8 w-[150px] text-xs">
                    <SelectValue placeholder={t('industryPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>{t('allIndustries')}</SelectItem>
                    {industryOptions.map((i) => (
                      <SelectItem key={i} value={i}>
                        {labelize(i)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger className="h-8 w-[130px] text-xs">
                    <SelectValue placeholder={t('stylePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>{t('allStyles')}</SelectItem>
                    {styleOptions.map((s) => (
                      <SelectItem key={s} value={s}>
                        {labelize(s)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={complexity} onValueChange={setComplexity}>
                  <SelectTrigger className="h-8 w-[130px] text-xs">
                    <SelectValue placeholder={t('complexityPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>{t('anyComplexity')}</SelectItem>
                    {SECTION_COMPLEXITY.map((c) => (
                      <SelectItem key={c} value={c}>
                        {labelize(c)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {hasActiveFilter && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    <X className="size-3" />
                    {t('clear')}
                  </button>
                )}
              </div>
            </div>

            {/* Pinned Blank Section card */}
            <div className="shrink-0 border-b border-border px-6 pb-4">
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-lg border-2 border-dashed border-primary/40 p-4 transition-colors hover:border-primary/70 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                onClick={() => handleSelect("custom")}
              >
                <Plus className="size-4 shrink-0 text-primary" />
                <span className="text-sm font-semibold">{t('blankSection')}</span>
              </button>
            </div>

            {hasActiveFilter ? (
              /* Flat filtered results */
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-3">
                <p className="mb-3 text-xs text-muted-foreground">
                  {t('sectionsFound', { count: filteredSections.length })}
                </p>
                {filteredSections.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                    <p className="text-sm font-medium">
                      {t('noMatch')}
                    </p>
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="text-xs text-primary hover:underline"
                    >
                      {t('clearFilters')}
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {filteredSections.map((def) => (
                      <SectionPreviewCard
                        key={def.id}
                        def={def}
                        isLoading={loadingSectionId === def.id}
                        onClick={() => handleSelect(def.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex min-h-0 flex-1">
                {/* Category nav */}
                <div className="flex w-44 shrink-0 flex-col gap-0.5 overflow-y-auto border-e px-3 py-3 pb-6">
                  {resolvedKitGroups.length > 0 && (
                    <>
                      {resolvedKitGroups.map((group) => (
                        <button
                          key={group.key}
                          type="button"
                          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-start text-sm font-medium text-primary hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                          onClick={() => scrollToKitGroup(group.key)}
                        >
                          {group.badge ? <span>{group.badge}</span> : <span>{group.title}</span>}
                        </button>
                      ))}
                      <div className="my-2 border-t border-border" />
                    </>
                  )}
                  {categoriesWithSections.map(({ category }) => (
                    <button
                      key={category}
                      type="button"
                      className="rounded-md px-3 py-1.5 text-start text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                      onClick={() => scrollToCategory(category)}
                    >
                      {CATEGORY_LABELS[category]}
                    </button>
                  ))}
                </div>

                {/* Scrollable section grid */}
                <div
                  ref={scrollRef}
                  className="min-h-0 flex-1 overflow-y-auto px-6 py-3 pb-6"
                >
                  {resolvedKitGroups.length > 0 && (
                    <div className="mb-6 flex flex-col gap-4">
                      {resolvedKitGroups.map((group) => (
                        <div
                          key={group.key}
                          ref={(el) => {
                            kitGroupRefs.current[group.key] = el
                          }}
                          className={`rounded-xl border-2 p-4 ${accentClasses(group.accentColor)}`}
                        >
                          <div className="mb-1 flex items-center gap-2">
                            {group.badge && (
                              <span className="inline-flex items-center rounded-full bg-background/80 px-2.5 py-0.5 text-xs font-semibold">
                                {group.badge}
                              </span>
                            )}
                            <h3 className="text-sm font-semibold">{group.title}</h3>
                          </div>
                          {group.description && (
                            <p className="mb-3 text-xs text-muted-foreground">{group.description}</p>
                          )}
                          <div className="grid grid-cols-3 gap-3">
                            {group.sections.map((def) => (
                              <SectionPreviewCard
                                key={def.id}
                                def={def}
                                isLoading={loadingSectionId === def.id}
                                onClick={() => handleSelect(def.id)}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {categoriesWithSections.map(({ category, sections }) => (
                    <div
                      key={category}
                      ref={(el) => {
                        categoryRefs.current[category] = el
                      }}
                      className="mb-6"
                    >
                      <h3 className="mb-3 text-sm font-semibold">
                        {CATEGORY_LABELS[category]}
                      </h3>
                      <div className="grid grid-cols-3 gap-3">
                        {sections.map((def) => (
                          <SectionPreviewCard
                            key={def.id}
                            def={def}
                            isLoading={loadingSectionId === def.id}
                            onClick={() => handleSelect(def.id)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* ── Saved Sections tab ────────────────────────────────────── */}
          <TabsContent
            value="saved"
            className="m-0 min-h-0 flex-1 overflow-y-auto px-6 py-4"
          >
            {savedSectionBlocks.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-20 text-center">
                <p className="text-sm font-medium">{t('noSavedSections')}</p>
                <p className="max-w-sm text-xs text-muted-foreground">
                  {t('noSavedSectionsHint')}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {savedSectionBlocks.map((block) => (
                  <SectionPreviewCard
                    key={block.id}
                    instance={block.content as SectionInstance}
                    label={block.name}
                    onClick={() => handleInsertSavedBlock(block.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
