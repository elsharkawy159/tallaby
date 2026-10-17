'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Search, X } from 'lucide-react'
import { Input } from '@workspace/ui/components/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select'
import { ProjectCard, type ProjectCardData } from '@/components/websites/project-card'
import { industryLabel } from '@/lib/constants/industries'
import { isWebsiteLive } from '@/lib/builder/website-status'
import type { HeroPreviewData } from '@/lib/server/load-hero-preview'

export type ProjectBrowserItem = {
  data: ProjectCardData
  heroPreview: HeroPreviewData | null
}

type SortKey = 'updated' | 'name' | 'created' | 'published'

export function ProjectsBrowser ({ items }: { items: ProjectBrowserItem[] }) {
  const t = useTranslations('pages.projects')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('updated')
  const [industry, setIndustry] = useState<string>('all')

  const industries = useMemo(() => {
    const values = new Set<string>()
    for (const item of items) {
      if (item.data.project.industry) values.add(item.data.project.industry)
    }
    return Array.from(values).sort((a, b) => industryLabel(a).localeCompare(industryLabel(b)))
  }, [items])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()

    const filtered = items.filter((item) => {
      if (industry !== 'all' && item.data.project.industry !== industry) return false

      if (!q) return true
      const { name, slug, description, industry: projectIndustry } = item.data.project
      const industryText = projectIndustry ? industryLabel(projectIndustry).toLowerCase() : ''
      return (
        name.toLowerCase().includes(q) ||
        slug.toLowerCase().includes(q) ||
        (description?.toLowerCase().includes(q) ?? false) ||
        industryText.includes(q)
      )
    })

    const sorted = filtered.slice().sort((a, b) => {
      const pa = a.data.project
      const pb = b.data.project
      if (sort === 'name') return pa.name.localeCompare(pb.name)
      if (sort === 'created') {
        return new Date(pb.createdAt).getTime() - new Date(pa.createdAt).getTime()
      }
      if (sort === 'published') {
        const liveA = a.data.website && isWebsiteLive(a.data.website.status) ? 1 : 0
        const liveB = b.data.website && isWebsiteLive(b.data.website.status) ? 1 : 0
        if (liveA !== liveB) return liveB - liveA
      }
      const ta = new Date(a.data.website?.updatedAt ?? pa.updatedAt).getTime()
      const tb = new Date(b.data.website?.updatedAt ?? pb.updatedAt).getTime()
      return tb - ta
    })

    return sorted
  }, [items, query, sort, industry])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="ps-9 pe-9"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute end-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={t('clearSearch')}
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {industries.length > 1 && (
          <Select value={industry} onValueChange={setIndustry}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('allIndustries')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allIndustries')}</SelectItem>
              {industries.map((value) => (
                <SelectItem key={value} value={value}>
                  {industryLabel(value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="updated">{t('sortUpdated')}</SelectItem>
            <SelectItem value="name">{t('sortName')}</SelectItem>
            <SelectItem value="created">{t('sortCreated')}</SelectItem>
            <SelectItem value="published">{t('sortPublished')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {visible.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          {t('noMatches')}
        </p>
      ) : (
        <div className="flex flex-wrap gap-4">
          {visible.map((item, index) => (
            <motion.div
              key={item.data.project.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.4) }}
              className="w-full max-w-[360px]"
            >
              <ProjectCard data={item.data} heroPreview={item.heroPreview} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
