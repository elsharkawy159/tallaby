'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import {
  CircleCheck,
  CircleAlert,
  Clock,
  Copy,
  ExternalLink,
  Link2,
  LoaderCircle,
  RefreshCw,
  Trash2,
} from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card'
import { Badge } from '@workspace/ui/components/badge'
import { Button } from '@workspace/ui/components/button'
import { Input } from '@workspace/ui/components/input'
import { normalizeCustomDomain, storeUrl } from '@workspace/lib/storefront'
import { cn } from '@/lib/utils'
import {
  addCustomDomain,
  removeCustomDomain,
  verifyCustomDomain,
  type CustomDomainResult,
  type CustomDomainView,
} from '@/actions/custom-domain'

/** Vercel's targets; mirrors packages/lib/src/storefront/vercel-domains.ts. */
const APEX_A_RECORD = '76.76.21.21'
const WWW_CNAME = 'cname.vercel-dns.com'

/** Reasons `checkCustomDomain` reports while a domain isn't live. */
const CHECK_KEYS = new Set(['unverified', 'dns', 'not_attached'])

type DnsRecord = { type: string; name: string; value: string }

function dnsRecords (view: CustomDomainView): DnsRecord[] {
  const records: DnsRecord[] = [
    { type: 'A', name: '@', value: APEX_A_RECORD },
    { type: 'CNAME', name: 'www', value: WWW_CNAME },
  ]
  for (const v of view.verification) {
    // `_vercel.faster-eg.com` → `_vercel` (registrars want the host part).
    const name = v.domain.endsWith(`.${view.domain}`)
      ? v.domain.slice(0, -(view.domain.length + 1))
      : v.domain
    records.push({ type: v.type, name, value: v.value })
  }
  return records
}

/**
 * Lets a seller serve their storefront from a domain they own (faster-eg.com):
 * add it, follow the DNS instructions at their registrar, then verify.
 */
export function CustomDomainCard ({ initial }: { initial: CustomDomainView | null }) {
  const t = useTranslations('settings.customDomain')
  const router = useRouter()
  const [view, setView] = useState(initial)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [action, setAction] = useState<'add' | 'verify' | 'remove' | null>(null)

  const run = (
    kind: 'add' | 'verify' | 'remove',
    fn: () => Promise<CustomDomainResult>,
    onSuccess?: (domain: CustomDomainView | null) => void
  ) => {
    setAction(kind)
    setError(null)
    startTransition(async () => {
      const res = await fn()
      setAction(null)
      if (!res.success) {
        setError(t(`errors.${res.error}`))
        return
      }
      setView(res.domain)
      onSuccess?.(res.domain)
      router.refresh()
    })
  }

  const add = () =>
    run('add', () => addCustomDomain(draft), () => {
      setDraft('')
      toast.success(t('added'))
    })

  const verify = () =>
    run('verify', verifyCustomDomain, (domain) => {
      if (domain?.status === 'active') toast.success(t('nowLive', { host: domain.domain }))
      else toast.info(t('notYet'))
    })

  const remove = () => {
    if (!view) return
    if (!window.confirm(t('removeConfirm', { host: view.domain }))) return
    run('remove', removeCustomDomain, () => toast.success(t('removed')))
  }

  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value)
    toast.success(t('copied'))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-base'>
          <Link2 className='size-4' />
          {t('title')}
        </CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {!view ? (
          <div className='space-y-2'>
            <label htmlFor='custom-domain' className='text-sm font-medium'>
              {t('fieldLabel')}
            </label>
            <div className='flex flex-col gap-2 sm:flex-row'>
              <Input
                id='custom-domain'
                dir='ltr'
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && draft.trim()) add()
                }}
                placeholder='example.com'
                autoComplete='off'
                spellCheck={false}
                aria-invalid={Boolean(error)}
                aria-describedby='custom-domain-status'
                className={cn('font-mono', error && 'border-destructive')}
              />
              <Button type='button' onClick={add} disabled={pending || !draft.trim()}>
                {action === 'add' && <LoaderCircle className='size-4 animate-spin' />}
                {t('connect')}
              </Button>
            </div>
            <p
              id='custom-domain-status'
              aria-live='polite'
              className={cn('text-sm', error ? 'text-destructive' : 'text-muted-foreground')}
            >
              {error ??
                (draft.trim()
                  ? t('willConnect', { host: normalizeCustomDomain(draft) })
                  : t('hint'))}
            </p>
          </div>
        ) : (
          <div className='space-y-4'>
            <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
              <div className='flex min-w-0 flex-1 items-center gap-2'>
                <span dir='ltr' className='truncate font-mono text-sm font-medium'>
                  {view.domain}
                </span>
                <StatusBadge status={view.status} />
              </div>
              <div className='flex gap-2'>
                {view.status === 'active' ? (
                  <Button type='button' variant='outline' asChild>
                    <a href={storeUrl('', view.domain)} target='_blank' rel='noopener noreferrer'>
                      <ExternalLink className='size-4' />
                      {t('open')}
                    </a>
                  </Button>
                ) : (
                  <Button type='button' onClick={verify} disabled={pending}>
                    {action === 'verify'
                      ? <LoaderCircle className='size-4 animate-spin' />
                      : <RefreshCw className='size-4' />}
                    {t('verify')}
                  </Button>
                )}
                <Button type='button' variant='ghost' onClick={remove} disabled={pending}>
                  {action === 'remove'
                    ? <LoaderCircle className='size-4 animate-spin' />
                    : <Trash2 className='size-4' />}
                  {t('remove')}
                </Button>
              </div>
            </div>

            {error && <p className='text-sm text-destructive'>{error}</p>}

            {view.status !== 'active' && (
              <div className='space-y-3 rounded-lg border bg-muted/30 p-4'>
                <p className='text-sm font-medium'>{t('dnsTitle')}</p>
                <p className='text-sm text-muted-foreground'>{t('dnsIntro')}</p>
                <div className='overflow-x-auto' dir='ltr'>
                  <table className='w-full text-sm'>
                    <thead>
                      <tr className='text-start text-muted-foreground'>
                        <th className='py-1.5 pe-4 text-start font-medium'>{t('type')}</th>
                        <th className='py-1.5 pe-4 text-start font-medium'>{t('name')}</th>
                        <th className='py-1.5 text-start font-medium'>{t('value')}</th>
                      </tr>
                    </thead>
                    <tbody className='font-mono'>
                      {dnsRecords(view).map((r) => (
                        <tr key={`${r.type}-${r.name}-${r.value}`} className='border-t'>
                          <td className='py-2 pe-4'>{r.type}</td>
                          <td className='py-2 pe-4'>{r.name}</td>
                          <td className='py-2'>
                            <span className='flex items-center gap-1'>
                              <span className='break-all'>{r.value}</span>
                              <Button
                                type='button'
                                variant='ghost'
                                size='icon'
                                className='size-7 shrink-0'
                                onClick={() => copy(r.value)}
                                aria-label={t('copyValue')}
                              >
                                <Copy className='size-3.5' />
                              </Button>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {view.lastError && (
                  <p className='text-sm text-muted-foreground'>
                    {t(`checks.${CHECK_KEYS.has(view.lastError) ? view.lastError : 'dns'}`)}
                  </p>
                )}
                <p className='text-xs text-muted-foreground'>{t('propagation')}</p>
                <p className='text-xs text-muted-foreground'>{t('cloudflare')}</p>
              </div>
            )}

            {view.status === 'active' && (
              <p className='text-sm text-muted-foreground'>{t('activeNote')}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function StatusBadge ({ status }: { status: CustomDomainView['status'] }) {
  const t = useTranslations('settings.customDomain.status')
  if (status === 'active') {
    return (
      <Badge className='gap-1 bg-emerald-600 text-white hover:bg-emerald-600'>
        <CircleCheck className='size-3' />
        {t('active')}
      </Badge>
    )
  }
  if (status === 'failed') {
    return (
      <Badge variant='destructive' className='gap-1'>
        <CircleAlert className='size-3' />
        {t('failed')}
      </Badge>
    )
  }
  return (
    <Badge variant='secondary' className='gap-1'>
      <Clock className='size-3' />
      {t('pending')}
    </Badge>
  )
}
