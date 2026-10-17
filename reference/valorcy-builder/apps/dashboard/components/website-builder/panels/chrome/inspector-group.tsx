'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@workspace/ui/components/accordion'
import { LucideIcon } from '@/components/website-builder/icons/lucide-icon'

/**
 * The inspector's search term, shared with every group so a group can hide
 * itself when nothing inside it matches. Context rather than props so groups
 * stay composable and the search box can live anywhere above them.
 */
const SearchContext = createContext<string>('')

export function InspectorSearchProvider ({
  query,
  children,
}: {
  query: string
  children: ReactNode
}) {
  return <SearchContext.Provider value={query.trim().toLowerCase()}>{children}</SearchContext.Provider>
}

export function useInspectorSearch (): string {
  return useContext(SearchContext)
}

/** Whether a group's title/keywords match the active search. */
export function useGroupMatches (title: string, keywords: string[] = []): boolean {
  const query = useInspectorSearch()
  return useMemo(() => {
    if (!query) return true
    return [title, ...keywords].some((k) => k.toLowerCase().includes(query))
  }, [query, title, keywords])
}

export interface InspectorGroupSpec {
  id: string
  title: string
  /** Lucide icon key (kebab-case). */
  icon: string
  /** Extra terms the settings search should match this group on. */
  keywords?: string[]
  /** Short status shown on the right of the header (e.g. "4 items"). */
  meta?: string
  content: ReactNode
}

/**
 * Renders the inspector's collapsible groups, filtered by the active search.
 * Groups are open by default when searching so a hit is immediately visible.
 */
export function InspectorGroups ({
  groups,
  defaultOpen,
}: {
  groups: InspectorGroupSpec[]
  defaultOpen: string[]
}) {
  const query = useInspectorSearch()

  const visible = useMemo(() => {
    if (!query) return groups
    return groups.filter((g) =>
      [g.title, ...(g.keywords ?? [])].some((k) => k.toLowerCase().includes(query))
    )
  }, [groups, query])

  if (visible.length === 0) {
    return (
      <p className="px-1 py-6 text-center text-xs text-muted-foreground">
        No settings match your search.
      </p>
    )
  }

  return (
    <Accordion
      type="multiple"
      // Re-mounting on search change is what re-opens matched groups.
      key={query || 'all'}
      defaultValue={query ? visible.map((g) => g.id) : defaultOpen}
      className="w-full"
    >
      {visible.map((group) => (
        <AccordionItem key={group.id} value={group.id} className="border-border">
          <AccordionTrigger className="items-center gap-2 py-2 text-start text-xs font-semibold hover:no-underline">
            {/* Wrapped: the trigger rotates its *direct* svg children when open. */}
            <span className="flex shrink-0 items-center text-muted-foreground">
              <LucideIcon name={group.icon} size={13} />
            </span>
            <span className="flex-1">{group.title}</span>
            {group.meta ? (
              <span className="text-[10px] font-normal text-muted-foreground">
                {group.meta}
              </span>
            ) : null}
          </AccordionTrigger>
          <AccordionContent className="flex flex-col gap-3 pb-3 pt-1">
            {group.content}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
