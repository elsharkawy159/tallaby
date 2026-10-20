'use client'

import { useState, useTransition, useMemo } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@workspace/ui/components/dialog'
import { Button } from '@workspace/ui/components/button'
import { Input } from '@workspace/ui/components/input'
import { Label } from '@workspace/ui/components/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select'

import { createWebsitePage } from '@/actions/website-page-actions'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  websiteId: string
}

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function CreatePageDialog({ open, onOpenChange, projectId, websiteId }: Props) {
  const [nameEn, setNameEn] = useState('')
  const [nameAr, setNameAr] = useState('')
  const [slugOverride, setSlugOverride] = useState('')
  const [locale, setLocale] = useState<'en' | 'ar'>('en')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const autoSlug = useMemo(() => toSlug(nameEn || nameAr), [nameEn, nameAr])
  const slug = slugOverride || autoSlug

  function handleClose(open: boolean) {
    if (!open) {
      setNameEn('')
      setNameAr('')
      setSlugOverride('')
      setLocale('en')
      setError(null)
    }
    onOpenChange(open)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!nameEn && !nameAr) {
      setError('Provide at least one page name (English or Arabic).')
      return
    }
    if (!slug || slug.length < 2) {
      setError('Slug must be at least 2 characters.')
      return
    }

    startTransition(async () => {
      try {
        await createWebsitePage(projectId, {
          websiteId,
          name: { ...(nameEn ? { en: nameEn } : {}), ...(nameAr ? { ar: nameAr } : {}) },
          slug,
          locale,
        })
        toast.success('Page created')
        handleClose(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create page')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New page</DialogTitle>
          <DialogDescription>
            Add a page to your website. You can edit content in the builder after creating it.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="name-en" className="text-xs">
                Name <span className="text-muted-foreground">(English)</span>
              </Label>
              <Input
                id="name-en"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="About us"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name-ar" className="text-xs">
                Name <span className="text-muted-foreground">(Arabic)</span>
              </Label>
              <Input
                id="name-ar"
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                placeholder="من نحن"
                dir="rtl"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="slug" className="text-xs">
              Slug
            </Label>
            <div className="flex items-center rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
              <span className="ps-3 text-sm text-muted-foreground select-none">/</span>
              <Input
                id="slug"
                value={slugOverride || autoSlug}
                onChange={(e) => setSlugOverride(toSlug(e.target.value))}
                placeholder="about-us"
                className="border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 font-mono text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Default locale</Label>
            <Select value={locale} onValueChange={(v) => setLocale(v as 'en' | 'ar')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ar">Arabic</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleClose(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin me-2" /> : null}
              Create page
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
