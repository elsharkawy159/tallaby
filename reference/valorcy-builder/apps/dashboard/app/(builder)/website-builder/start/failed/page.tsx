import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { AlertCircle } from 'lucide-react'
import { Button } from '@workspace/ui/components/button'
import { requireUser } from '@/lib/server/auth'

export const metadata: Metadata = {
  title: 'Something went wrong - Valorcy',
  robots: { index: false, follow: false },
}

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

const PROMPT_MAX = 2000

/**
 * Where `/website-builder/start` sends a visitor whose project could not be
 * created. It keeps their idea in front of them so "Try again" is one click,
 * rather than dropping them on /projects with nothing.
 */
export default async function StartFailedRoute ({ searchParams }: Props) {
  await requireUser()
  const sp = (await searchParams) ?? {}
  const raw = sp.ai_prompt
  const prompt = (Array.isArray(raw) ? raw[0] : raw)?.trim().slice(0, PROMPT_MAX) ?? ''

  // Nothing to retry with — this page is only ever reached from the handoff.
  if (!prompt) redirect('/projects')

  const t = await getTranslations('aiStart')
  const retryHref = `/website-builder/start?${new URLSearchParams({ ai_prompt: prompt })}`

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-6">
      <div className="flex w-full max-w-md flex-col items-center text-center">
        <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertCircle className="size-6" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight">{t('errorTitle')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('error')}</p>
        <blockquote
          dir="auto"
          className="mt-6 w-full rounded-xl border bg-card px-4 py-3 text-start text-sm text-card-foreground"
        >
          {prompt}
        </blockquote>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button asChild>
            <Link href={retryHref}>{t('retry')}</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/projects">{t('back')}</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
