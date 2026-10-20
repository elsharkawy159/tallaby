'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from '@/i18n/navigation'
import { Loader2, Sparkles, Layout, Wand2, ArrowRight, ArrowLeft } from 'lucide-react'
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
import { cn } from '@/lib/utils'

import { createWebsitePage } from '@/actions/website-page-actions'

type CreatedPage = {
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
  useSharedHeader: boolean
  useSharedFooter: boolean
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  websiteId: string
  locale?: string
  /** Called after page is created — builder passes this to push page into store */
  onCreated?: (page: CreatedPage) => void
}

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

type Option = 'templates' | 'ai' | 'blank'

const OPTIONS: {
  id: Option
  icon: React.ReactNode
  title: string
  description: string
  accent: string
}[] = [
  {
    id: 'templates',
    icon: <Layout className="size-6" />,
    title: 'Pre-built template',
    description: 'Pick from a library of ready-made page layouts.',
    accent: 'from-blue-500/10 to-indigo-500/10 border-blue-200 dark:border-blue-800',
  },
  {
    id: 'ai',
    icon: <Wand2 className="size-6" />,
    title: 'Build with AI',
    description: 'Describe your page and let AI generate it for you.',
    accent: 'from-violet-500/10 to-purple-500/10 border-violet-200 dark:border-violet-800',
  },
  {
    id: 'blank',
    icon: <Sparkles className="size-6" />,
    title: 'Blank page',
    description: 'Start from scratch in the visual builder.',
    accent: 'from-emerald-500/10 to-teal-500/10 border-emerald-200 dark:border-emerald-800',
  },
]

export function AddPageDialog({
  open,
  onOpenChange,
  projectId,
  websiteId,
  locale = 'en',
  onCreated,
}: Props) {
  const router = useRouter()

  // Step 1 — name + slug
  const [nameEn, setNameEn] = useState('')
  const [nameAr, setNameAr] = useState('')
  const [slugOverride, setSlugOverride] = useState('')
  const [step, setStep] = useState<1 | 2>(1)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState<Option | null>(null)
  const [, startTransition] = useTransition()

  const autoSlug = useMemo(() => toSlug(nameEn || nameAr), [nameEn, nameAr])
  const slug = slugOverride || autoSlug

  function reset() {
    setNameEn('')
    setNameAr('')
    setSlugOverride('')
    setStep(1)
    setError(null)
    setCreating(null)
  }

  function handleClose(v: boolean) {
    if (!v) reset()
    onOpenChange(v)
  }

  function handleStep1Next() {
    if (!nameEn && !nameAr) {
      setError('Enter at least one page name.')
      return
    }
    if (!slug || slug.length < 2) {
      setError('Slug must be at least 2 characters.')
      return
    }
    setError(null)
    setStep(2)
  }

  async function handleOption(option: Option) {
    setCreating(option)
    try {
      if (option === 'templates') {
        // Redirect to marketing /templates with context so it can return here
        handleClose(false)
        const webUrl = process.env.NEXT_PUBLIC_WEB_URL ?? 'http://localhost:3000'
        const params = new URLSearchParams({
          returnTo: 'builder',
          websiteId,
          projectId,
          name: JSON.stringify({
            ...(nameEn ? { en: nameEn } : {}),
            ...(nameAr ? { ar: nameAr } : {}),
          }),
          slug,
          locale,
        })
        window.location.href = `${webUrl}/templates?${params.toString()}`
        return
      }

      const page = await createWebsitePage(projectId, {
        websiteId,
        name: {
          ...(nameEn ? { en: nameEn } : {}),
          ...(nameAr ? { ar: nameAr } : {}),
        },
        slug,
        locale,
      })

      if (!page) throw new Error('Failed to create page')

      onCreated?.(page as unknown as CreatedPage)

      handleClose(false)
      toast.success('Page created')

      if (option === 'ai') {
        router.push(`/website-builder/ai/${websiteId}?page=${encodeURIComponent(page.slug)}`)
      } else {
        router.push(
          `/website-builder/edit/${websiteId}?page=${encodeURIComponent(page.slug)}`,
        )
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create page')
    } finally {
      setCreating(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? 'New page' : 'How do you want to build it?'}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? 'Give your page a name and a URL slug.'
              : 'Choose how to get started with this page.'}
          </DialogDescription>
        </DialogHeader>

        {/* ── Step 1: Name + slug ─────────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-4 py-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ap-name-en" className="text-xs">
                  Name <span className="text-muted-foreground">(English)</span>
                </Label>
                <Input
                  id="ap-name-en"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="About us"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ap-name-ar" className="text-xs">
                  Name <span className="text-muted-foreground">(Arabic)</span>
                </Label>
                <Input
                  id="ap-name-ar"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  placeholder="من نحن"
                  dir="rtl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ap-slug" className="text-xs">Slug</Label>
              <div className="flex items-center rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
                <span className="ps-3 text-sm text-muted-foreground select-none">/</span>
                <Input
                  id="ap-slug"
                  value={slugOverride || autoSlug}
                  onChange={(e) => setSlugOverride(toSlug(e.target.value))}
                  placeholder="about-us"
                  className="border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 font-mono text-sm"
                />
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleClose(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleStep1Next}>
                Next <ArrowRight className="size-4 ms-1.5 rtl:rotate-180" />
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* ── Step 2: Choose build method ─────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-3 py-1">
            <div className="grid gap-3">
              {OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  disabled={creating !== null}
                  onClick={() => handleOption(opt.id)}
                  className={cn(
                    'relative flex items-start gap-4 rounded-xl border bg-gradient-to-br p-4 text-start',
                    'transition-all hover:shadow-md hover:scale-[1.01]',
                    'disabled:pointer-events-none disabled:opacity-60',
                    opt.accent,
                  )}
                >
                  <div className="mt-0.5 shrink-0 text-foreground/70">{opt.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{opt.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                  </div>
                  {creating === opt.id ? (
                    <Loader2 className="size-4 animate-spin shrink-0 mt-1 text-muted-foreground" />
                  ) : (
                    <ArrowRight className="size-4 shrink-0 mt-1 text-muted-foreground rtl:rotate-180" />
                  )}
                </button>
              ))}
            </div>

            <DialogFooter className="pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setStep(1)}
                disabled={creating !== null}
              >
                <ArrowLeft className="size-4 me-1.5 rtl:rotate-180" /> Back
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
