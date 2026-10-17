'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import { Search, SlidersHorizontal } from 'lucide-react'

import { Input } from '@workspace/ui/components/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select'

import { WebsiteCard } from './website-card'
import { WebsitesEmptyState } from './websites-empty-state'
import { isWebsiteLive, type WebsiteStatus } from '@/lib/builder/website-status'

type DomainStatus = 'pending' | 'verified' | 'failed'

type WebsiteItem = {
  project: { id: string; name: string; slug: string; updatedAt: string; createdAt: string }
  website: {
    id: string
    subdomain: string | null
    customDomain: string | null
    domainStatus: DomainStatus
    status: WebsiteStatus
    updatedAt: string
    createdAt: string
  } | null
}

type Props = {
  items: WebsiteItem[]
  rootDomain: string
  onCreateClick: () => void
}

type FilterValue = 'all' | 'published' | 'draft'
type SortValue = 'updated' | 'created' | 'name'

export function WebsitesGrid({ items, rootDomain, onCreateClick }: Props) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<FilterValue>('all')
  const [sort, setSort] = useState<SortValue>('updated')

  const filtered = useMemo(() => {
    let list = [...items]

    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(
        ({ project, website }) =>
          project.name.toLowerCase().includes(q) ||
          project.slug.toLowerCase().includes(q) ||
          website?.subdomain?.includes(q) ||
          website?.customDomain?.includes(q),
      )
    }

    if (filter === 'published') list = list.filter(({ website }) => website && isWebsiteLive(website.status))
    if (filter === 'draft') list = list.filter(({ website }) => website && !isWebsiteLive(website.status))

    list.sort((a, b) => {
      if (sort === 'name') return a.project.name.localeCompare(b.project.name)
      if (sort === 'created') {
        return new Date(b.project.createdAt).getTime() - new Date(a.project.createdAt).getTime()
      }
      // updated (default)
      const aDate = a.website?.updatedAt ?? a.project.updatedAt
      const bDate = b.website?.updatedAt ?? b.project.updatedAt
      return new Date(bDate).getTime() - new Date(aDate).getTime()
    })

    return list
  }, [items, query, filter, sort])

  const handleCreate = useCallback(() => onCreateClick(), [onCreateClick])

  if (items.length === 0) {
    return <WebsitesEmptyState />
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search websites…"
            className="ps-9"
          />
        </div>
        <div className="flex gap-2 shrink-0">
          <Select value={filter} onValueChange={(v) => setFilter(v as FilterValue)}>
            <SelectTrigger className="w-32">
              <SlidersHorizontal className="size-4 me-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as SortValue)}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updated">Last updated</SelectItem>
              <SelectItem value="created">Date created</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-12 text-center">
          No websites match your search.
        </p>
      ) : (
        <LayoutGroup>
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {filtered.map(({ project, website }) => (
                <motion.div
                  key={project.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                >
                  <WebsiteCard
                    project={project}
                    website={website}
                    rootDomain={rootDomain}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </LayoutGroup>
      )}
    </div>
  )
}
