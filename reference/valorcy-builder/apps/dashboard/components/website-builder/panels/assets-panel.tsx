'use client'

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useDraggable } from '@dnd-kit/react'
import { DND_TYPE } from '@/lib/builder/dnd/types'
import { Copy, ImageIcon, Loader2, Upload, Video, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@workspace/ui/components/button'
import { Tabs, TabsList, TabsTrigger } from '@workspace/ui/components/tabs'
import { ScrollArea } from '@workspace/ui/components/scroll-area'
import { cn } from '@workspace/ui/lib/utils'
import {
  deleteMediaAsset,
  getProjectMediaAssets,
  uploadMediaAsset,
} from '@/actions/media-actions'

type AssetRow = {
  id: string
  publicUrl: string
  filename: string
  mimeType: string | null
}

function AssetDraggableCard ({
  asset,
  dragId,
  onRemove,
  isRemoving,
}: {
  asset: AssetRow
  dragId: string
  onRemove: (id: string) => void
  isRemoving: boolean
}) {
  const { ref, isDragging } = useDraggable({
    id: dragId,
    type: DND_TYPE.element,
    data: useMemo(() => ({ drag: { source: 'media-asset', publicUrl: asset.publicUrl } }), [asset.publicUrl]),
  })
  const isVideo = asset.mimeType?.startsWith('video/')

  const handleCopyUrl = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(asset.publicUrl)
      toast.success('URL copied to clipboard.')
    } catch {
      toast.error('Failed to copy URL.')
    }
  }

  return (
    <div
      ref={ref}
      className={cn(
        'group relative flex cursor-grab flex-col gap-1 rounded-lg border border-border bg-card p-1.5 active:cursor-grabbing',
        'hover:border-primary/30',
        isDragging && 'opacity-60',
        isRemoving && 'pointer-events-none opacity-50'
      )}
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-md bg-muted">
        {isVideo ? (
          <div className="flex size-full items-center justify-center">
            <Video className="size-8 text-muted-foreground" />
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={asset.publicUrl}
            alt=""
            className="size-full object-cover"
          />
        )}
        <button
          type="button"
          aria-label="Copy image URL"
          title="Copy URL"
          className="absolute start-1 top-1 z-10 flex size-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={handleCopyUrl}
        >
          <Copy className="size-2.5" strokeWidth={2.5} />
        </button>
        <button
          type="button"
          aria-label="Remove asset"
          title="Remove"
          className="absolute end-1 top-1 z-10 flex size-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            onRemove(asset.id)
          }}
        >
          <X className="size-2.5" strokeWidth={3} />
        </button>
      </div>
      <p className="truncate px-0.5 text-[10px] text-muted-foreground">{asset.filename}</p>
    </div>
  )
}

async function loadAssets (projectId: string): Promise<AssetRow[]> {
  const rows = await getProjectMediaAssets(projectId)
  return rows.map((r) => ({
    id: r.id,
    publicUrl: r.publicUrl,
    filename: r.filename ?? '',
    mimeType: r.mimeType ?? null,
  }))
}

export function AssetsPanel ({ projectId }: { projectId: string }) {
  const [assets, setAssets] = useState<AssetRow[]>([])
  const [filter, setFilter] = useState<'all' | 'image' | 'video' | 'svg'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const refreshAssets = useCallback(() => {
    startTransition(async () => {
      try {
        setAssets(await loadAssets(projectId))
      } catch {
        setAssets([])
      }
    })
  }, [projectId])

  useEffect(() => {
    refreshAssets()
  }, [refreshAssets])

  const handleUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? [])
      e.target.value = ''
      if (files.length === 0) return

      const existingNames = new Set(assets.map((a) => a.filename))
      const toUpload: File[] = []
      let skipped = 0
      for (const file of files) {
        if (existingNames.has(file.name)) {
          skipped += 1
        } else {
          toUpload.push(file)
        }
      }
      if (skipped > 0) {
        toast.info(`${skipped} file${skipped === 1 ? ' was' : 's were'} already uploaded and skipped.`)
      }
      if (toUpload.length === 0) return

      startTransition(async () => {
        const results = await Promise.allSettled(
          toUpload.map(async (file) => {
            const fd = new FormData()
            fd.append('file', file)
            fd.append('projectId', projectId)
            const { id, publicUrl } = await uploadMediaAsset(fd)
            return { id, publicUrl, filename: file.name, mimeType: file.type } as AssetRow
          }),
        )

        const uploaded: AssetRow[] = []
        let failed = 0
        for (const r of results) {
          if (r.status === 'fulfilled') uploaded.push(r.value)
          else failed += 1
        }
        if (uploaded.length > 0) {
          setAssets((prev) => [...uploaded, ...prev])
          toast.success(`${uploaded.length} image${uploaded.length === 1 ? '' : 's'} uploaded.`)
        }
        if (failed > 0) {
          toast.error(`${failed} upload${failed === 1 ? '' : 's'} failed. Please try again.`)
        }
      })
    },
    [assets, projectId]
  )

  const handleRemove = useCallback((assetId: string) => {
    setRemovingId(assetId)
    startTransition(async () => {
      try {
        await deleteMediaAsset(assetId)
        setAssets((prev) => prev.filter((a) => a.id !== assetId))
        toast.success('Image removed.')
      } catch {
        toast.error('Failed to remove image.')
      } finally {
        setRemovingId(null)
      }
    })
  }, [])

  const filtered = useMemo(() => {
    let result = assets
    if (filter === 'image') {
      result = result.filter((a) => a.mimeType?.startsWith('image/') && a.mimeType !== 'image/svg+xml')
    } else if (filter === 'video') {
      result = result.filter((a) => a.mimeType?.startsWith('video/'))
    } else if (filter === 'svg') {
      result = result.filter((a) => a.mimeType === 'image/svg+xml')
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter((a) => a.filename.toLowerCase().includes(q))
    }
    return result
  }, [assets, filter, searchQuery])

  return (
    <div className="flex h-full min-h-0 flex-col border-e border-border bg-background">
      <div className="border-b border-border p-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold">Assets</p>
            <p className="text-xs text-muted-foreground">Upload or drag onto the canvas</p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="default"
            disabled={isPending}
            onClick={() => fileInputRef.current?.click()}
          >
            {isPending
              ? <Loader2 className="me-1.5 size-3.5 animate-spin" />
              : <Upload className="me-1.5 size-3.5" />}
            {isPending ? 'Uploading…' : 'Upload'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
            multiple
            className="hidden"
            onChange={handleUpload}
          />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search assets…"
          className="mt-2 w-full rounded-md border border-border bg-muted px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
      <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'image' | 'video' | 'svg')} className="flex min-h-0 flex-1 flex-col gap-0 px-2">
        <TabsList className="mt-2 w-full">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="image">Images</TabsTrigger>
          <TabsTrigger value="video">Videos</TabsTrigger>
          <TabsTrigger value="svg">SVG</TabsTrigger>
        </TabsList>
        <ScrollArea className="min-h-0 flex-1">
          <div className="py-2">
            {isPending && filtered.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground">Loading…</p>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <ImageIcon className="size-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No assets match this filter.</p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {isPending && <Loader2 className="me-1.5 size-3.5 animate-spin" />}
                  {isPending ? 'Uploading…' : 'Upload image'}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {filtered.map((asset) => (
                  <AssetDraggableCard
                    key={asset.id}
                    asset={asset}
                    dragId={`media-asset:${asset.id}`}
                    onRemove={handleRemove}
                    isRemoving={removingId === asset.id}
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </Tabs>
    </div>
  )
}