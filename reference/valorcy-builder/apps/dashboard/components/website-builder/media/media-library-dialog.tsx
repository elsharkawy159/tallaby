'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2, Search, Upload } from 'lucide-react'
import { notify } from '@/services/toast'
import { Button } from '@workspace/ui/components/button'
import { Input } from '@workspace/ui/components/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs'
import {
  uploadMediaAsset,
  getProjectMediaAssets,
  searchStockPhotos,
  importStockImage,
} from '@/actions/media-actions'
import { MediaGrid, type MediaAsset } from './media-grid'

export interface MediaLibraryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  /** The current image URL at the time the dialog was opened — used to revert on upload failure */
  previousUrl: string
  /** Optional stock search query pre-filled from AI context (CMS cover images). */
  initialStockQuery?: string
  /** Called with the new URL.
   *  Called up to three times per upload:
   *  1. Immediately with blob URL (optimistic preview)
   *  2. On success: with CDN publicUrl (replaces blob)
   *  3. On failure: with previousUrl (reverts canvas)
   *  The callback is idempotent (value-replacement) — multiple calls are safe. */
  onCommit: (url: string) => void
}

type StockPhoto = { url: string; alt?: string }

export function MediaLibraryDialog ({
  open,
  onOpenChange,
  projectId,
  previousUrl,
  initialStockQuery,
  onCommit,
}: MediaLibraryDialogProps) {
  const t = useTranslations('dialogs.mediaLibrary')
  const [assets, setAssets] = useState<MediaAsset[]>([])
  const [selectedUrl, setSelectedUrl] = useState<string | undefined>()
  const [query, setQuery] = useState('')
  const [stock, setStock] = useState<StockPhoto[]>([])
  const [stockQuery, setStockQuery] = useState('')
  const [isPending, startTransition] = useTransition()
  const [isStockPending, startStockTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load recent uploads when dialog opens
  useEffect(() => {
    if (!open) return
    startTransition(async () => {
      try {
        const rows = await getProjectMediaAssets(projectId)
        setAssets(rows.map((r) => ({ id: r.id, publicUrl: r.publicUrl, filename: r.filename ?? '' })))
      } catch {
        // Non-blocking — grid just shows empty state
      }
    })
  }, [open, projectId])

  useEffect(() => {
    if (!open || !initialStockQuery?.trim()) return
    setStockQuery(initialStockQuery)
    startStockTransition(async () => {
      try {
        const images = await searchStockPhotos(initialStockQuery)
        setStock(images.map((i) => ({ url: i.url, alt: i.alt })))
      } catch {
        // stock tab may still be searched manually
      }
    })
  }, [open, initialStockQuery])

  const filteredAssets = query.trim()
    ? assets.filter((a) => a.filename.toLowerCase().includes(query.trim().toLowerCase()))
    : assets

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? [])
      e.target.value = ''
      if (files.length === 0) return

      // Single-file path keeps original optimistic-preview + auto-close behavior.
      if (files.length === 1) {
        const file = files[0]!
        const blobUrl = URL.createObjectURL(file)
        onCommit(blobUrl)

        startTransition(async () => {
          try {
            const fd = new FormData()
            fd.append('file', file)
            fd.append('projectId', projectId)
            const { publicUrl, id, duplicate } = await uploadMediaAsset(fd)
            URL.revokeObjectURL(blobUrl)
            if (duplicate) {
              notify.info(t('toastDuplicate'))
            } else {
              setAssets((prev) => [{ id, publicUrl, filename: file.name }, ...prev])
            }
            onCommit(publicUrl)
            onOpenChange(false)
          } catch (err) {
            URL.revokeObjectURL(blobUrl)
            onCommit(previousUrl)
            notify.error(err instanceof Error ? err.message : t('toastUploadFailed'))
          }
        })
        return
      }

      // Multi-file path: upload in parallel, append to grid, leave dialog open.
      startTransition(async () => {
        const results = await Promise.allSettled(
          files.map(async (file) => {
            const fd = new FormData()
            fd.append('file', file)
            fd.append('projectId', projectId)
            const { id, publicUrl } = await uploadMediaAsset(fd)
            return { id, publicUrl, filename: file.name }
          }),
        )
        const uploaded: MediaAsset[] = []
        let failed = 0
        for (const r of results) {
          if (r.status === 'fulfilled') uploaded.push(r.value)
          else failed += 1
        }
        if (uploaded.length > 0) {
          setAssets((prev) => {
            const seen = new Set(prev.map((a) => a.id))
            const fresh = uploaded.filter((u) => !seen.has(u.id))
            return [...fresh, ...prev]
          })
          notify.success(t('toastImagesUploaded', { count: uploaded.length }))
        }
        if (failed > 0) {
          notify.error(t('toastUploadsFailed', { count: failed }))
        }
      })
    },
    [projectId, previousUrl, onCommit, onOpenChange, t],
  )

  const handleSelectExisting = useCallback(
    (url: string) => {
      setSelectedUrl(url)
      onCommit(url)
      onOpenChange(false)
    },
    [onCommit, onOpenChange],
  )

  const handleRemove = useCallback((id: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const runStockSearch = useCallback(() => {
    if (!stockQuery.trim()) return
    startStockTransition(async () => {
      try {
        const images = await searchStockPhotos(stockQuery)
        setStock(images.map((i) => ({ url: i.url, alt: i.alt })))
      } catch {
        notify.error(t('toastStockSearchFailed'))
      }
    })
  }, [stockQuery, t])

  const handlePickStock = useCallback(
    (photo: StockPhoto) => {
      onCommit(photo.url) // optimistic — show the remote URL immediately
      startStockTransition(async () => {
        try {
          const { publicUrl } = await importStockImage({
            projectId,
            url: photo.url,
            alt: photo.alt,
          })
          onCommit(publicUrl)
          onOpenChange(false)
        } catch (err) {
          onCommit(previousUrl)
          notify.error(err instanceof Error ? err.message : t('toastImportFailed'))
        }
      })
    },
    [projectId, previousUrl, onCommit, onOpenChange, t],
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg z-201">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="library">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="library">{t('libraryTab')}</TabsTrigger>
            <TabsTrigger value="stock">{t('stockTab')}</TabsTrigger>
          </TabsList>

          {/* Library tab */}
          <TabsContent value="library" className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('searchByFilename')}
                  className="h-8 ps-8 text-xs"
                />
              </div>
              <Button
                type="button"
                variant="default"
                size="sm"
                disabled={isPending}
                onClick={() => fileInputRef.current?.click()}
              >
                {isPending
                  ? <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  : <Upload className="me-2 h-4 w-4" />}
                {isPending ? t('uploading') : t('upload')}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            <div className="max-h-80 overflow-y-auto pe-1">
              {isPending && assets.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <span className="text-sm text-muted-foreground">{t('loading')}</span>
                </div>
              ) : (
                <MediaGrid
                  assets={filteredAssets}
                  selectedUrl={selectedUrl}
                  onSelect={handleSelectExisting}
                  onRemove={handleRemove}
                />
              )}
            </div>
          </TabsContent>

          {/* Stock photos tab */}
          <TabsContent value="stock" className="space-y-3">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                runStockSearch()
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <Search className="absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={stockQuery}
                  onChange={(e) => setStockQuery(e.target.value)}
                  placeholder={t('searchStockPlaceholder')}
                  className="h-8 ps-8 text-xs"
                />
              </div>
              <Button type="submit" size="sm" disabled={isStockPending || !stockQuery.trim()}>
                {isStockPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t('search')}
              </Button>
            </form>

            <div className="max-h-80 overflow-y-auto pe-1">
              {stock.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  {isStockPending ? t('searching') : t('searchStockPrompt')}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {stock.map((photo) => (
                    <button
                      key={photo.url}
                      type="button"
                      onClick={() => handlePickStock(photo)}
                      disabled={isStockPending}
                      className="group relative aspect-square overflow-hidden rounded-md border border-transparent bg-muted transition-colors hover:border-primary disabled:opacity-50"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.url}
                        alt={photo.alt ?? t('stockPhotoAlt')}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
