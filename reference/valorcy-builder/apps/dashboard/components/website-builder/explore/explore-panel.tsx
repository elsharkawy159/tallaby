'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Search, Heart, X, ExternalLink, Loader2, Upload, Link2, ImageIcon } from 'lucide-react'
import { Input } from '@workspace/ui/components/input'
import { Button } from '@workspace/ui/components/button'
import { ScrollArea } from '@workspace/ui/components/scroll-area'
import { Tabs, TabsList, TabsTrigger } from '@workspace/ui/components/tabs'
import { cn } from '@/lib/utils'
import { useBuilderStore } from '@/lib/builder/store'
import type { PexelsResult } from '@/app/api/explore/search/route'
import { buildExploreImageContextAction } from '@/actions/website-ai-section-actions'
import { sectionRegistry } from '@/components/sections'

const RECENT_KEY = 'explore_recent_searches'
const FAVORITES_KEY = 'explore_favorites'

function getStored<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback } catch { return fallback }
}
function setStored<T>(key: string, value: T) {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(value))
}

type StockProvider = 'pexels' | 'unsplash'
type ExploreTab = 'stock' | 'uploads' | 'url'

/** Masonry column grid for photos */
function MasonryGrid ({
  photos,
  selectedElementId,
  onHover,
  onHoverEnd,
  onSelect,
  favorites,
  onToggleFavorite,
  draggingId,
  onDragStart,
  onDragEnd,
}: {
  photos: PexelsResult[]
  selectedElementId: string | null
  onHover: (url: string) => void
  onHoverEnd: () => void
  onSelect: (url: string, alt?: string) => void
  favorites: string[]
  onToggleFavorite: (id: string) => void
  draggingId: string | null
  onDragStart: (e: React.DragEvent, photo: PexelsResult) => void
  onDragEnd: () => void
}) {
  const col1 = photos.filter((_, i) => i % 2 === 0)
  const col2 = photos.filter((_, i) => i % 2 !== 0)

  return (
    <div className="flex gap-1.5 px-2 pb-4">
      {[col1, col2].map((col, ci) => (
        <div key={ci} className="flex flex-1 flex-col gap-1.5">
          {col.map((photo) => (
            <div
              key={photo.id}
              draggable
              onDragStart={(e) => onDragStart(e, photo)}
              onDragEnd={onDragEnd}
              onMouseEnter={() => selectedElementId && onHover(photo.url)}
              onMouseLeave={() => selectedElementId && onHoverEnd()}
              onClick={() => onSelect(photo.url, photo.alt)}
              className={cn(
                'group relative cursor-pointer overflow-hidden rounded-md transition-transform',
                draggingId === photo.id && 'opacity-60',
                selectedElementId && 'hover:ring-2 hover:ring-primary/70 hover:ring-offset-1'
              )}
              style={{ aspectRatio: `${photo.width}/${photo.height}` }}
            >
              <img
                src={photo.url}
                alt={photo.alt ?? 'Photo'}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                style={{ background: photo.avgColor ?? '#f0f0f0' }}
              />
              <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
              {/* Apply badge when an image element is selected */}
              {selectedElementId && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground shadow">
                    Apply
                  </span>
                </div>
              )}
              <div className="absolute end-1 top-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleFavorite(photo.id) }}
                  className={cn(
                    'flex size-6 items-center justify-center rounded-full bg-white/90 shadow-sm transition-colors',
                    favorites.includes(photo.id) ? 'text-red-500' : 'text-muted-foreground'
                  )}
                >
                  <Heart className={cn('size-3', favorites.includes(photo.id) && 'fill-current')} />
                </button>
                {photo.pexelsUrl && (
                  <a
                    href={photo.pexelsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex size-6 items-center justify-center rounded-full bg-white/90 shadow-sm text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="size-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

interface ExplorePanelProps {
  defaultQuery?: string
  projectId?: string
}

export function ExplorePanel({ defaultQuery = 'business', projectId }: ExplorePanelProps) {
  const setImagePreview = useBuilderStore((s) => s.setImagePreview)
  const commitImageUrl = useBuilderStore((s) => s.commitImageUrl)
  const selectedElementId = useBuilderStore((s) => s.selectedElementId)
  const sections = useBuilderStore((s) => s.sections)
  const activePageId = useBuilderStore((s) => s.activePageId)
  const builderLocale = useBuilderStore((s) => s.builderLocale)

  // Determine if the selected element is any kind of image — covers:
  //  • ComponentTree 'image' nodes (custom sections)
  //  • SectionEditableImage slots (data-element-type="image")
  //  • Auto-instrumented bare <img> tags (data-element-kind="image" or tagName=IMG)
  const selectedIsImage = useMemo(() => {
    if (!selectedElementId) return false

    // 1. DOM check — covers SectionEditableImage + auto-instrumented elements
    if (typeof document !== 'undefined') {
      const domEl = document.querySelector<HTMLElement>(`[data-element-id="${selectedElementId.replace(/"/g, '\\"')}"]`)
      if (domEl) {
        const kind = domEl.getAttribute('data-element-kind') ?? domEl.getAttribute('data-element-type')
        if (kind === 'image') return true
        if (domEl.tagName === 'IMG' || domEl.tagName === 'PICTURE') return true
      }
    }

    // 2. ComponentTree node fallback (no DOM attrs set by tree renderer)
    const sep = selectedElementId.indexOf('::')
    if (sep < 0) return false
    const sectionId = selectedElementId.slice(0, sep)
    const nodeId = selectedElementId.slice(sep + 2)
    if (nodeId.startsWith('__i:')) return false
    const section = sections.find((s) => s.id === sectionId)
    if (!section?.componentTree) return false
    function findNode(tree: import('@/lib/builder/component-node').ComponentNode[]): boolean {
      for (const n of tree) {
        if (n.id === nodeId) return n.type === 'image'
        if (findNode(n.children)) return true
      }
      return false
    }
    return findNode(section.componentTree)
  }, [selectedElementId, sections])

  const [tab, setTab] = useState<ExploreTab>('stock')
  const [provider, setProvider] = useState<StockProvider>('pexels')
  const [query, setQuery] = useState(defaultQuery)

  const [input, setInput] = useState(defaultQuery)

  useEffect(() => {
    if (!projectId) return

    const sectionInstanceId = selectedElementId?.split('::')[0]
    const section = sectionInstanceId
      ? sections.find((candidate) => candidate.id === sectionInstanceId)
      : null
    const def = section ? sectionRegistry.get(section.sectionId) : undefined

    let element: { key?: string; label?: string; role?: string } | undefined
    let cmsItem: Record<string, unknown> | undefined

    if (selectedElementId && typeof document !== 'undefined') {
      const domEl = document.querySelector<HTMLElement>(
        `[data-element-id="${selectedElementId.replace(/"/g, '\\"')}"]`,
      )
      const srcProp =
        domEl?.getAttribute('data-element-item-src-prop') ??
        domEl?.getAttribute('data-element-src-prop') ??
        selectedElementId.split('::')[1]
      const collectionKey = domEl?.getAttribute('data-element-collection')
      const indexRaw = domEl?.getAttribute('data-element-index')
      if (section && collectionKey && indexRaw !== null) {
        const index = Number(indexRaw)
        const items = section.props[collectionKey] as Record<string, unknown>[] | undefined
        if (Array.isArray(items) && items[index]) cmsItem = items[index]
      }
      element = {
        key: srcProp ?? undefined,
        label: domEl?.getAttribute('aria-label') ?? undefined,
        role: selectedIsImage ? 'selected image' : undefined,
      }
    }

    let cancelled = false
    void buildExploreImageContextAction({
      projectId,
      pageId: activePageId ?? undefined,
      sectionMeta: def
        ? { id: def.id, displayName: def.displayName, category: def.category }
        : undefined,
      currentProps: section?.props,
      element,
      cmsItem,
      locale: builderLocale,
    }).then((result) => {
      if (cancelled || 'error' in result) return
      setQuery(result.primaryQuery)
      setInput(result.primaryQuery)
    })

    return () => {
      cancelled = true
    }
  }, [projectId, selectedElementId, selectedIsImage, sections, activePageId, builderLocale])
  const [photos, setPhotos] = useState<PexelsResult[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [favorites, setFavorites] = useState<string[]>([])
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [urlInput, setUrlInput] = useState('')
  const observerRef = useRef<IntersectionObserver | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setRecentSearches(getStored<string[]>(RECENT_KEY, []))
    setFavorites(getStored<string[]>(FAVORITES_KEY, []))
  }, [])

  const fetchPhotos = useCallback(async (q: string, p: number, reset: boolean, prov: StockProvider) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ q, page: String(p), per_page: '20', provider: prov })
      const res = await fetch(`/api/explore/search?${params}`)
      if (!res.ok) return
      const data = await res.json() as { photos: PexelsResult[]; hasMore: boolean }
      setPhotos((prev) => reset ? data.photos : [...prev, ...data.photos])
      setHasMore(!!data.hasMore)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (tab !== 'stock') return
    setPage(1)
    fetchPhotos(query, 1, true, provider)
  }, [query, tab, provider, fetchPhotos])

  // Infinite scroll
  useEffect(() => {
    if (!sentinelRef.current || tab !== 'stock') return
    observerRef.current?.disconnect()
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loading) {
          const nextPage = page + 1
          setPage(nextPage)
          fetchPhotos(query, nextPage, false, provider)
        }
      },
      { threshold: 0.1 }
    )
    observerRef.current.observe(sentinelRef.current)
    return () => observerRef.current?.disconnect()
  }, [hasMore, loading, page, query, tab, provider, fetchPhotos])

  function handleSearch(q: string) {
    const trimmed = q.trim()
    if (!trimmed) return
    setQuery(trimmed)
    const updated = [trimmed, ...recentSearches.filter((r) => r !== trimmed)].slice(0, 8)
    setRecentSearches(updated)
    setStored(RECENT_KEY, updated)
  }

  useEffect(() => {
    const t = setTimeout(() => handleSearch(input), 500)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input])

  function toggleFavorite(id: string) {
    const updated = favorites.includes(id)
      ? favorites.filter((f) => f !== id)
      : [...favorites, id]
    setFavorites(updated)
    setStored(FAVORITES_KEY, updated)
  }

  function handleDragStart(e: React.DragEvent, photo: PexelsResult) {
    setDraggingId(photo.id)
    e.dataTransfer.setData('text/uri-list', photo.url)
    e.dataTransfer.setData('application/x-explore-image', JSON.stringify({ url: photo.url, alt: photo.alt }))
    e.dataTransfer.effectAllowed = 'copy'
  }

  function handleImageHover(url: string) {
    if (selectedIsImage && selectedElementId) {
      setImagePreview(selectedElementId, url)
    }
  }

  function handleImageHoverEnd() {
    setImagePreview(null)
  }

  function handleImageSelect(url: string) {
    if (selectedIsImage && selectedElementId) {
      commitImageUrl(selectedElementId, url)
    }
  }

  function handleUrlApply() {
    const trimmed = urlInput.trim()
    if (!trimmed) return
    handleImageSelect(trimmed)
    setUrlInput('')
  }

  const targetLabel = selectedIsImage
    ? <span className="text-[10px] font-medium text-primary bg-primary/10 rounded px-1.5 py-0.5">Image selected — click to apply</span>
    : null

  return (
    <div className="flex h-full flex-col gap-0">
      {/* Header */}
      <div className="shrink-0 border-b border-border px-3 pb-2 pt-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold">Explore Images</p>
          {targetLabel}
        </div>

        {/* Source tabs */}
        <Tabs value={tab} onValueChange={(v) => setTab(v as ExploreTab)}>
          <TabsList className="w-full h-7">
            <TabsTrigger value="stock" className="flex-1 text-xs">Stock</TabsTrigger>
            <TabsTrigger value="uploads" className="flex-1 text-xs">Uploads</TabsTrigger>
            <TabsTrigger value="url" className="flex-1 text-xs">URL</TabsTrigger>
          </TabsList>
        </Tabs>

        {tab === 'stock' && (
          <>
            {/* Provider toggle */}
            <div className="flex gap-1">
              {(['pexels', 'unsplash'] as StockProvider[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setProvider(p)}
                  className={cn(
                    'rounded-full border px-2 py-0.5 text-[11px] capitalize transition-colors',
                    provider === p
                      ? 'border-primary bg-primary/10 text-primary font-medium'
                      : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
                  )}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Search */}
            <form onSubmit={(e) => { e.preventDefault(); handleSearch(input) }} className="relative">
              {loading
                ? <Loader2 className="absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
                : <Search className="absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              }
              <Input
                placeholder="Search images…"
                className="h-8 ps-8 pe-8 text-sm"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              {input && (
                <button
                  type="button"
                  onClick={() => { setInput(''); handleSearch(defaultQuery) }}
                  className="absolute end-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </form>

            {/* Recent searches */}
            {recentSearches.length > 0 && !input && (
              <div className="flex flex-wrap gap-1">
                {recentSearches.slice(0, 5).map((r) => (
                  <button
                    key={r}
                    onClick={() => { setInput(r); handleSearch(r) }}
                    className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground hover:border-primary hover:text-primary"
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Stock tab content */}
      {tab === 'stock' && (
        <ScrollArea className="flex-1">
          <MasonryGrid
            photos={photos}
            selectedElementId={selectedIsImage ? selectedElementId : null}
            onHover={handleImageHover}
            onHoverEnd={handleImageHoverEnd}
            onSelect={handleImageSelect}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            draggingId={draggingId}
            onDragStart={handleDragStart}
            onDragEnd={() => setDraggingId(null)}
          />
          <div ref={sentinelRef} className="h-4" />
          {loading && (
            <div className="flex justify-center py-4 dark:bg-background">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {!loading && photos.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No images found for &ldquo;{query}&rdquo;
              {provider === 'unsplash' && (
                <p className="mt-1 text-xs">Make sure UNSPLASH_ACCESS_KEY is set.</p>
              )}
            </div>
          )}
        </ScrollArea>
      )}

      {/* Uploads tab */}
      {tab === 'uploads' && (
        <UploadsBrowser
          projectId={projectId}
          selectedIsImage={selectedIsImage}
          onHover={handleImageHover}
          onHoverEnd={handleImageHoverEnd}
          onSelect={handleImageSelect}
        />
      )}

      {/* URL tab */}
      {tab === 'url' && (
        <div className="flex flex-col gap-3 p-3">
          <p className="text-xs text-muted-foreground">Paste any image URL to preview and apply.</p>
          <div className="relative">
            <Link2 className="absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="https://…"
              className="ps-8 text-sm"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleUrlApply() }}
            />
          </div>
          {urlInput && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={urlInput}
              alt="Preview"
              className="w-full rounded-md object-cover"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
            />
          )}
          <Button
            size="sm"
            disabled={!urlInput.trim() || !selectedIsImage}
            onClick={handleUrlApply}
          >
            {selectedIsImage ? 'Apply to image' : 'Select an image element first'}
          </Button>
        </div>
      )}
    </div>
  )
}

/** Inline uploads browser used inside the Explore panel's Uploads tab */
function UploadsBrowser({
  projectId,
  selectedIsImage,
  onHover,
  onHoverEnd,
  onSelect,
}: {
  projectId?: string
  selectedIsImage: boolean
  onHover: (url: string) => void
  onHoverEnd: () => void
  onSelect: (url: string) => void
}) {
  const [assets, setAssets] = useState<{ id: string; publicUrl: string; filename: string }[]>([])
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    try {
      const { getProjectMediaAssets } = await import('@/actions/media-actions')
      const rows = await getProjectMediaAssets(projectId)
      setAssets(rows
        .filter((r) => r.mimeType?.startsWith('image/') !== false)
        .map((r) => ({ id: r.id, publicUrl: r.publicUrl, filename: r.filename ?? '' }))
      )
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => { load() }, [load])

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (!files.length || !projectId) return
    setLoading(true)
    try {
      const { uploadMediaAsset } = await import('@/actions/media-actions')
      for (const file of files) {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('projectId', projectId)
        const { id, publicUrl } = await uploadMediaAsset(fd)
        setAssets((prev) => [{ id, publicUrl, filename: file.name }, ...prev])
      }
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }, [projectId])

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
        >
          <Upload className="me-1 size-3" />
          Upload
        </Button>
        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
        {loading && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
      </div>
      <ScrollArea className="flex-1">
        {assets.length === 0 && !loading ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <ImageIcon className="size-8 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">No uploads yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1.5 p-2">
            {assets.map((a) => (
              <div
                key={a.id}
                className={cn(
                  'group relative cursor-pointer overflow-hidden rounded-md border border-border aspect-square',
                  selectedIsImage && 'hover:ring-2 hover:ring-primary/70 hover:ring-offset-1'
                )}
                onMouseEnter={() => selectedIsImage && onHover(a.publicUrl)}
                onMouseLeave={() => selectedIsImage && onHoverEnd()}
                onClick={() => onSelect(a.publicUrl)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.publicUrl} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                {selectedIsImage && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20">
                    <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground opacity-0 group-hover:opacity-100 shadow">
                      Apply
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
