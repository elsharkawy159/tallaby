'use client'

import { useState, useTransition, useEffect } from 'react'
import { CheckCircle2, XCircle, AlertCircle, Loader2, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@workspace/ui/components/sheet'
import { Input } from '@workspace/ui/components/input'
import { Button } from '@workspace/ui/components/button'
import { Label } from '@workspace/ui/components/label'
import { Badge } from '@workspace/ui/components/badge'
import { Separator } from '@workspace/ui/components/separator'

import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { checkSubdomainAvailability, verifyCustomDomain } from '@/actions/domain-actions'
import { updateWebsiteDomains } from '@/actions/website-actions'
import { DnsInstructions } from './dns-instructions'
import { UpgradePromptBanner } from '@/components/billing/upgrade-prompt'
import { usePlanTier } from '@/lib/plan-client'

type DomainStatus = 'pending' | 'verified' | 'failed'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  initialSubdomain: string | null
  initialCustomDomain: string | null
  domainStatus: DomainStatus
}

type AvailabilityState =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'available' }
  | { status: 'unavailable'; reason: 'invalid' | 'reserved' | 'taken' }

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'valorcy.com'

function availabilityMessage(state: AvailabilityState) {
  if (state.status === 'checking') return null
  if (state.status === 'available') return { text: 'Available', color: 'text-green-500', Icon: CheckCircle2 }
  if (state.status === 'unavailable') {
    const messages = {
      taken: 'Already taken',
      reserved: 'Reserved subdomain',
      invalid: 'Invalid — use lowercase letters, numbers, and hyphens only (min 3 chars)',
    }
    return { text: messages[state.reason], color: 'text-destructive', Icon: XCircle }
  }
  return null
}

function domainStatusBadge(status: DomainStatus) {
  if (status === 'verified') return <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">Verified</Badge>
  if (status === 'failed') return <Badge variant="outline" className="text-red-600 border-red-300 bg-red-50">Failed</Badge>
  return <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">Pending DNS</Badge>
}

export function ConfigureDomainSheet({
  open,
  onOpenChange,
  projectId,
  initialSubdomain,
  initialCustomDomain,
  domainStatus,
}: Props) {
  // ── Subdomain section ──────────────────────────────────────────────────────
  const [subdomain, setSubdomain] = useState(initialSubdomain ?? '')
  const [savedSubdomain, setSavedSubdomain] = useState(initialSubdomain ?? '')
  const [availability, setAvailability] = useState<AvailabilityState>({ status: 'idle' })
  const [savingSubdomain, startSubdomainTransition] = useTransition()

  const debouncedSubdomain = useDebouncedValue(subdomain, 350)
  const subdomainDirty = subdomain !== savedSubdomain

  useEffect(() => {
    if (!open) return
    if (!debouncedSubdomain || debouncedSubdomain === savedSubdomain) {
      setAvailability({ status: 'idle' })
      return
    }
    setAvailability({ status: 'checking' })
    checkSubdomainAvailability(debouncedSubdomain, projectId).then((result) => {
      if (result.available) {
        setAvailability({ status: 'available' })
      } else {
        setAvailability({ status: 'unavailable', reason: result.reason! })
      }
    })
  }, [debouncedSubdomain, savedSubdomain, projectId, open])

  function handleSubdomainSave() {
    startSubdomainTransition(async () => {
      try {
        await updateWebsiteDomains(projectId, { subdomain: subdomain || null })
        setSavedSubdomain(subdomain)
        setAvailability({ status: 'idle' })
        toast.success('Subdomain saved')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to save subdomain')
      }
    })
  }

  const subdomainSaveDisabled =
    !subdomainDirty ||
    savingSubdomain ||
    availability.status === 'checking' ||
    availability.status === 'unavailable' ||
    (subdomainDirty && availability.status === 'idle' && subdomain !== savedSubdomain)

  // ── Custom domain section ──────────────────────────────────────────────────
  const [customDomain, setCustomDomain] = useState(initialCustomDomain ?? '')
  const [savedCustomDomain, setSavedCustomDomain] = useState(initialCustomDomain ?? '')
  const [currentDomainStatus, setCurrentDomainStatus] = useState<DomainStatus>(domainStatus)
  const [savingDomain, startDomainTransition] = useTransition()
  const [verifying, startVerifyTransition] = useTransition()

  const customDomainDirty = customDomain !== savedCustomDomain

  function handleCustomDomainSave() {
    startDomainTransition(async () => {
      try {
        await updateWebsiteDomains(projectId, { customDomain: customDomain || null })
        setSavedCustomDomain(customDomain)
        setCurrentDomainStatus('pending')
        toast.success('Custom domain saved')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to save domain')
      }
    })
  }

  function handleVerify() {
    startVerifyTransition(async () => {
      try {
        await verifyCustomDomain(projectId)
        setCurrentDomainStatus('verified')
        toast.success('Domain verified')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Verification failed')
      }
    })
  }

  const availMsg = availabilityMessage(availability)
  const { isPaid } = usePlanTier()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>Configure Domain</SheetTitle>
          <SheetDescription>
            Set up your platform subdomain or connect a custom domain.
          </SheetDescription>
        </SheetHeader>

        {/* ── Platform subdomain ───────────────────────────────────────────── */}
        <section className="space-y-4 px-4">
          <div>
            <h3 className="text-sm font-medium">Platform Subdomain</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Free subdomain on {ROOT_DOMAIN}. Available on all plans.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="subdomain-input" className="text-xs text-muted-foreground">
              Subdomain
            </Label>
            <div className="flex items-center gap-2">
              <div className="flex flex-1 items-center rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
                <Input
                  id="subdomain-input"
                  value={subdomain}
                  onChange={(e) =>
                    setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                  }
                  placeholder="your-site"
                  className="border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <span className="shrink-0 pe-3 text-sm text-muted-foreground">
                  .{ROOT_DOMAIN}
                </span>
              </div>
              <Button
                size="sm"
                disabled={
                  !subdomainDirty ||
                  savingSubdomain ||
                  availability.status === 'checking' ||
                  availability.status === 'unavailable'
                }
                onClick={handleSubdomainSave}
              >
                {savingSubdomain ? <Loader2 className="size-4 animate-spin" /> : 'Save'}
              </Button>
            </div>

            {/* Availability feedback */}
            <div className="h-4 flex items-center gap-1.5">
              {availability.status === 'checking' && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Loader2 className="size-3 animate-spin" /> Checking…
                </span>
              )}
              {availMsg && (
                <span className={`flex items-center gap-1 text-xs ${availMsg.color}`}>
                  <availMsg.Icon className="size-3 shrink-0" />
                  {availMsg.text}
                </span>
              )}
            </div>
          </div>

          {savedSubdomain && (
            <a
              href={`https://${savedSubdomain}.${ROOT_DOMAIN}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline"
            >
              <ExternalLink className="size-3" />
              {savedSubdomain}.{ROOT_DOMAIN}
            </a>
          )}
        </section>

        <Separator className="my-6" />

        {/* ── Custom domain ────────────────────────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-medium">Custom Domain</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Connect your own domain. Requires a paid plan.
              </p>
            </div>
            {isPaid && savedCustomDomain && domainStatusBadge(currentDomainStatus)}
          </div>

          {!isPaid && <UpgradePromptBanner feature="Custom domains" requiredPlan="pro" />}

          <div className="space-y-1.5">
            <Label htmlFor="custom-domain-input" className="text-xs text-muted-foreground">
              Domain
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="custom-domain-input"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value.toLowerCase().trim())}
                placeholder="yourdomain.com"
                disabled={!isPaid}
              />
              <Button
                size="sm"
                variant="outline"
                disabled={!isPaid || !customDomainDirty || savingDomain}
                onClick={handleCustomDomainSave}
              >
                {savingDomain ? <Loader2 className="size-4 animate-spin" /> : 'Save'}
              </Button>
            </div>
          </div>

          {isPaid && savedCustomDomain && currentDomainStatus !== 'verified' && (
            <>
              <DnsInstructions domain={savedCustomDomain} />
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                disabled={verifying}
                onClick={handleVerify}
              >
                {verifying ? (
                  <><Loader2 className="size-4 animate-spin me-2" /> Verifying…</>
                ) : (
                  <>
                    <AlertCircle className="size-4 me-2 text-amber-500" />
                    Verify Domain
                  </>
                )}
              </Button>
            </>
          )}

          {isPaid && savedCustomDomain && currentDomainStatus === 'verified' && (
            <div className="flex items-center gap-1.5 text-sm text-green-600">
              <CheckCircle2 className="size-4" />
              Domain is active and serving traffic.
            </div>
          )}
        </section>
      </SheetContent>
    </Sheet>
  )
}
