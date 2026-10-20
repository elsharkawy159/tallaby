'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, RefreshCw, Sparkles, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@workspace/ui/components/button'
import { Badge } from '@workspace/ui/components/badge'
import { reapplySiteGeneration } from '@/actions/ai-site-generation-actions'

type GenerationRow = {
  id: string
  status: string
  prompt: string
  pageCount: number
  createdAt: string
}

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  completed: 'default',
  failed: 'destructive',
  cancelled: 'outline',
  generating: 'secondary',
  planning: 'secondary',
  pending: 'secondary',
}

interface GenerationHistoryProps {
  locale: string
  websiteId: string
  generations: GenerationRow[]
}

export function GenerationHistory({ locale, websiteId, generations }: GenerationHistoryProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [reapplyingId, setReapplyingId] = useState<string | null>(null)

  function handleReapply(id: string) {
    setReapplyingId(id)
    startTransition(async () => {
      try {
        await reapplySiteGeneration(id)
        toast.success('Re-applying generation… your website is being rebuilt.')
        router.push(`/website-builder/edit/${websiteId}`)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to re-apply generation')
      } finally {
        setReapplyingId(null)
      }
    })
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/95 px-6 backdrop-blur">
        <Button asChild variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
          <Link href={`/website-builder/new/${websiteId}`}>
            <ArrowLeft className="size-4 rtl:rotate-180" />
            Back
          </Link>
        </Button>
        <h1 className="text-sm font-semibold">Generation history</h1>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        {generations.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-20 text-center">
            <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-primary/10">
              <Sparkles className="size-6 text-primary" />
            </div>
            <p className="text-sm font-medium">No generations yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Generate your first website to see its history here.
            </p>
            <Button asChild className="mt-6 gap-2">
              <Link href={`/website-builder/new/${websiteId}`}>
                <Sparkles className="size-4" />
                Generate a website
              </Link>
            </Button>
          </div>
        ) : (
          <ul className="space-y-3">
            {generations.map((gen) => (
              <li
                key={gen.id}
                className="flex items-start gap-4 rounded-xl border bg-card px-4 py-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={STATUS_VARIANT[gen.status] ?? 'secondary'} className="capitalize">
                      {gen.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {gen.pageCount} {gen.pageCount === 1 ? 'page' : 'pages'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      · {new Date(gen.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-foreground/90">{gen.prompt}</p>
                </div>
                {gen.status === 'completed' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 gap-1.5"
                    disabled={pending && reapplyingId === gen.id}
                    onClick={() => handleReapply(gen.id)}
                  >
                    {pending && reapplyingId === gen.id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="size-3.5" />
                    )}
                    Re-apply
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
