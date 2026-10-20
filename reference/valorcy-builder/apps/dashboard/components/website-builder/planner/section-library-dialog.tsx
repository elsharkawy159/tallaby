'use client'

import { useState, useMemo } from 'react'
import { Search, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@workspace/ui/components/dialog'
import { Input } from '@workspace/ui/components/input'
import { Button } from '@workspace/ui/components/button'
import { Badge } from '@workspace/ui/components/badge'
import { ScrollArea } from '@workspace/ui/components/scroll-area'
import { cn } from '@/lib/utils'
import { SECTION_DEFINITIONS } from '@/components/sections/section-definitions'
import { SECTION_CATEGORIES } from '@/components/sections/registry.constants'

const CATEGORY_LABELS: Record<string, string> = {
  hero: 'Hero',
  features: 'Features',
  pricing: 'Pricing',
  testimonials: 'Testimonials',
  faq: 'FAQ',
  cta: 'CTA',
  about: 'About',
  team: 'Team',
  gallery: 'Gallery',
  stats: 'Stats',
  timeline: 'Timeline',
  blog: 'Blog',
  contact: 'Contact',
  'logo-cloud': 'Logo Cloud',
  logos: 'Logos',
  footer: 'Footer',
  navbar: 'Navbar',
  content: 'Content',
  'social-proof': 'Social Proof',
  booking: 'Booking',
  menu: 'Menu',
  listings: 'Listings',
}

const VISIBLE_CATEGORIES = SECTION_CATEGORIES.filter(
  (c) => !['custom', 'navbar', 'footer'].includes(c)
)

interface SectionLibraryDialogProps {
  open: boolean
  onClose: () => void
  onSelect: (sectionId: string, type: string, variant?: string) => void
}

export function SectionLibraryDialog({ open, onClose, onSelect }: SectionLibraryDialogProps) {
  const [activeCategory, setActiveCategory] = useState<string>('hero')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const defs = SECTION_DEFINITIONS.filter((d) => !d.hidden)
    if (search.trim()) {
      const q = search.toLowerCase()
      return defs.filter(
        (d) =>
          d.displayName.toLowerCase().includes(q) ||
          d.category.includes(q) ||
          d.description?.toLowerCase().includes(q)
      )
    }
    return defs.filter((d) => d.category === activeCategory)
  }, [activeCategory, search])

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex h-[80vh] max-w-4xl flex-col gap-0 p-0">
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">Section Library</DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="size-4" />
            </Button>
          </div>
          <div className="relative mt-3">
            <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search sections…"
              className="ps-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </DialogHeader>

        <div className="flex min-h-0 flex-1">
          {!search && (
            <aside className="w-44 shrink-0 border-e">
              <ScrollArea className="h-full">
                <div className="space-y-0.5 p-2">
                  {VISIBLE_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={cn(
                        'w-full rounded-md px-3 py-1.5 text-start text-sm transition-colors',
                        activeCategory === cat
                          ? 'bg-primary/10 font-medium text-primary'
                          : 'text-muted-foreground hover:bg-accent'
                      )}
                    >
                      {CATEGORY_LABELS[cat] ?? cat}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </aside>
          )}

          <ScrollArea className="flex-1">
            <div className="grid grid-cols-2 gap-3 p-4 md:grid-cols-3">
              {filtered.map((def) => (
                <button
                  key={def.id}
                  onClick={() => {
                    onSelect(def.id, def.category, def.id)
                    onClose()
                  }}
                  className="group flex flex-col gap-2 rounded-lg border bg-card p-3 text-start transition-all hover:border-primary/40 hover:shadow-sm"
                >
                  <div className="flex aspect-video items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
                    {def.thumbnailUrl ? (
                      <img
                        src={def.thumbnailUrl}
                        alt={def.displayName}
                        className="h-full w-full rounded-md object-cover"
                      />
                    ) : (
                      <span className="capitalize">{def.category}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium leading-tight">{def.displayName}</p>
                    {def.description && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{def.description}</p>
                    )}
                  </div>
                  {def.isPremium && (
                    <Badge variant="secondary" className="w-fit text-xs">Pro</Badge>
                  )}
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="col-span-full py-12 text-center text-sm text-muted-foreground">
                  No sections found.
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
