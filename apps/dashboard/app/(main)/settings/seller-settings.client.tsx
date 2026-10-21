'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useForm, useWatch, type Control, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import {
  AlertCircle,
  Building2,
  ChevronLeft,
  CircleCheck,
  CloudUpload,
  ExternalLink,
  FileCheck2,
  Globe,
  Headphones,
  Landmark,
  LoaderCircle,
  Mail,
  Phone,
  Store,
  Wallet,
  Warehouse,
  type LucideIcon,
} from 'lucide-react'

import { Card } from '@workspace/ui/components/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@workspace/ui/components/form'
import { Input } from '@workspace/ui/components/input'
import { Button } from '@workspace/ui/components/button'
import { Progress } from '@workspace/ui/components/progress'
import { cn } from '@/lib/utils'
import { useLocalizedResolver } from '@/lib/i18n/localized-resolver'

import type { SellerSettingsInitialData } from './seller-settings.types'
import {
  sellerProfileSchema,
  type SellerProfileForm,
} from './seller-settings.schema'
import { handleUpdateSellerProfile } from './seller-settings.server'
import type { SellerAccountView } from '@workspace/lib/sellers/server'
import { LegalDetailsSection, PayoutDetailsSection, StoreDetailsMovedCard } from './account-sections.client'
import { DocumentsSection } from './seller-documents.client'
import {
  FIELD_CLASS,
  INPUT_GROUP_CLASS,
  INPUT_IN_GROUP_CLASS,
  ADDON_CLASS,
  LabelNote,
  SMALL_BUTTON_CLASS,
  SectionCard,
  SectionIcon,
  FieldHint,
} from './settings-ui'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

type SectionId = 'info' | 'contact' | 'legal' | 'payout' | 'link' | 'docs'

// Store-level fields (logo, banner, description) moved to
// Store settings (PLAN.md P3-05); this page is the seller ACCOUNT.
const SECTIONS: { id: SectionId; icon: LucideIcon }[] = [
  { id: 'info', icon: Building2 },
  { id: 'contact', icon: Headphones },
  { id: 'legal', icon: Landmark },
  { id: 'payout', icon: Wallet },
  { id: 'link', icon: Globe },
  { id: 'docs', icon: FileCheck2 },
]

interface SellerSettingsFormProps {
  initialData: SellerSettingsInitialData
  /** Public storefront URL, for the "View store" button. */
  storeHref: string
  /** Store link + custom domain controls; they save on their own. */
  linkSection: React.ReactNode
  /** Business type, legal address and masked payout account (P3-05). */
  account: SellerAccountView
  /** The main store, whose settings now hold logo and description. */
  primaryStoreId: string | null
}

const AUTOSAVE_DELAY_MS = 900

export function SellerSettingsForm ({
  initialData,
  storeHref,
  linkSection,
  account,
  primaryStoreId,
}: SellerSettingsFormProps) {
  const t = useTranslations('settings')
  const router = useRouter()
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedRef = useRef<string>('')
  const isSavingRef = useRef(false)

  const defaults: SellerProfileForm = useMemo(
    () => ({
      businessName: initialData.profile.businessName ?? '',
      supportEmail: initialData.profile.supportEmail ?? '',
      supportPhone: initialData.profile.supportPhone ?? '',
    }),
    [initialData.profile]
  )

  const resolver = useLocalizedResolver(
    zodResolver(sellerProfileSchema) as Resolver<SellerProfileForm>
  )
  const form = useForm<SellerProfileForm>({
    resolver,
    defaultValues: defaults,
    mode: 'onChange',
  })

  useEffect(() => {
    lastSavedRef.current = JSON.stringify(defaults)
  }, [defaults])

  const persistProfile = useCallback(
    async (values: SellerProfileForm) => {
      const payload = JSON.stringify(values)
      if (payload === lastSavedRef.current) {
        setSaveStatus('saved')
        return
      }

      const valid = await form.trigger()
      if (!valid) {
        setSaveStatus('error')
        return
      }

      if (isSavingRef.current) {
        // Queue another save after the in-flight one finishes
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
        saveTimerRef.current = setTimeout(() => {
          void form.handleSubmit((next) => persistProfile(next))()
        }, 400)
        return
      }

      isSavingRef.current = true
      setSaveStatus('saving')

      try {
        const res = await handleUpdateSellerProfile(values)
        if (res.success) {
          lastSavedRef.current = payload
          form.reset(values)
          setSaveStatus('saved')
          router.refresh()
        } else {
          setSaveStatus('error')
          toast.error(res.message)
          if ('errors' in res && res.errors) {
            Object.entries(res.errors).forEach(([field, messages]) => {
              form.setError(field as keyof SellerProfileForm, {
                type: 'server',
                message: messages[0],
              })
            })
          }
        }
      } catch {
        setSaveStatus('error')
        toast.error(t('saveFailed'))
      } finally {
        isSavingRef.current = false
      }
    },
    [form, router, t]
  )

  const scheduleAutosave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      void form.handleSubmit(
        (values) => persistProfile(values),
        () => setSaveStatus('error')
      )()
    }, AUTOSAVE_DELAY_MS)
  }, [form, persistProfile])

  useEffect(() => {
    const subscription = form.watch((_values, info) => {
      if (info.type !== 'change') return
      setSaveStatus('idle')
      scheduleAutosave()
    })

    return () => {
      subscription.unsubscribe()
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [form, scheduleAutosave])

  const values = useWatch({ control: form.control })
  const has = (value: string | undefined) => Boolean(value?.trim())
  const complete: Record<SectionId, boolean> = {
    info: has(values.businessName) && Boolean(account.businessType),
    contact: has(values.supportEmail) && has(values.supportPhone),
    legal: Boolean(account.legalAddress.state && account.legalAddress.street),
    payout: account.payout !== null,
    link: true,
    // Documents are optional, so the section never blocks completion.
    docs: true,
  }

  return (
    <div className='w-full p-4 pb-20 sm:p-6 sm:pb-24'>
      <div className='mb-6 flex flex-wrap items-end justify-between gap-4'>
        <p className='min-w-0 flex-[1_1_320px] text-sm text-pretty text-muted-foreground'>
          {t('subtitle')}
        </p>
        <div className='flex flex-wrap items-center gap-2'>
          <AutosaveIndicator status={saveStatus} />
          <Button variant='neutral' className={SMALL_BUTTON_CLASS} asChild>
            <a href={storeHref} target='_blank' rel='noopener noreferrer'>
              <ExternalLink className='rtl:-scale-x-100' />
              {t('viewStore')}
            </a>
          </Button>
        </div>
      </div>

      <div className='grid grid-cols-1 items-start gap-0 md:grid-cols-[200px_minmax(0,1fr)] md:gap-5 xl:grid-cols-[240px_minmax(0,1fr)] xl:gap-7'>
        <SectionNav complete={complete} />

        <div className='flex min-w-0 flex-col gap-5'>
        <StoreDetailsMovedCard storeId={primaryStoreId} />

        <Form {...form}>
          <form
            className='flex min-w-0 flex-col gap-5'
            onSubmit={(e) => e.preventDefault()}
          >

            <SectionCard
              id='info'
              icon={Building2}
              title={t('sections.info.title')}
              description={t('sections.info.description')}
            >
              <FormField
                control={form.control}
                name='businessName'
                render={({ field }) => (
                  <FormItem className='gap-1.5'>
                    <FormLabel className='justify-between text-[13px] font-semibold'>
                      {t('fields.businessName')}
                      <LabelNote>{t('fields.businessNameNote')}</LabelNote>
                    </FormLabel>
                    <FormControl>
                      <Input
                        className={FIELD_CLASS}
                        placeholder={t('fields.businessNamePlaceholder')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </SectionCard>

            <SectionCard
              id='contact'
              icon={Headphones}
              title={t('sections.contact.title')}
              description={t('sections.contact.description')}
            >
              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5'>
                <FormField
                  control={form.control}
                  name='supportEmail'
                  render={({ field }) => (
                    <FormItem className='gap-1.5'>
                      <FormLabel className='text-[13px] font-semibold'>
                        {t('fields.supportEmail')}
                      </FormLabel>
                      <div className={INPUT_GROUP_CLASS}>
                        <span className={cn(ADDON_CLASS, 'border-e')}>
                          <Mail className='size-4' />
                        </span>
                        <FormControl>
                          <Input
                            type='email'
                            dir='ltr'
                            className={cn(INPUT_IN_GROUP_CLASS, 'font-mono text-[13px]')}
                            placeholder='support@example.com'
                            {...field}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='supportPhone'
                  render={({ field }) => (
                    <FormItem className='gap-1.5'>
                      <FormLabel className='text-[13px] font-semibold'>
                        {t('fields.supportPhone')}
                      </FormLabel>
                      <div className={INPUT_GROUP_CLASS}>
                        <span className={cn(ADDON_CLASS, 'border-e')}>
                          <Phone className='size-4' />
                        </span>
                        <FormControl>
                          <Input
                            type='tel'
                            dir='ltr'
                            className={cn(INPUT_IN_GROUP_CLASS, 'font-mono text-[13px]')}
                            placeholder='+20 1XX XXX XXXX'
                            {...field}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </SectionCard>

          </form>
        </Form>

            <LegalDetailsSection account={account} />
            <PayoutDetailsSection payout={account.payout} />

            <SectionCard
              id='link'
              icon={Globe}
              title={t('sections.link.title')}
              description={t('sections.link.description')}
              tag={
                <span className='inline-flex h-6 items-center gap-1 rounded-full bg-success-soft px-2.5 text-xs font-medium text-success'>
                  <CircleCheck className='size-3.5' />
                  {t('sections.link.active')}
                </span>
              }
            >
              {linkSection}
            </SectionCard>


            <DocumentsSection
              initialDocuments={initialData.documents}
              onUploaded={() => router.refresh()}
            />

            <FulfillmentLinkCard />
        </div>
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------------- */

function SectionNav ({ complete }: { complete: Record<SectionId, boolean> }) {
  const t = useTranslations('settings')
  const [active, setActive] = useState<SectionId>('info')
  const listRef = useRef<HTMLElement>(null)

  // Highlight the section crossing the upper third of the viewport.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id as SectionId)
        }
      },
      { rootMargin: '-30% 0px -60% 0px' }
    )
    for (const { id } of SECTIONS) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [])

  // On narrow screens the nav is a horizontal strip; keep the active chip in view.
  useEffect(() => {
    const list = listRef.current
    const link = list?.querySelector<HTMLElement>(`[data-section="${active}"]`)
    if (!list || !link || list.scrollWidth <= list.clientWidth) return
    list.scrollTo({
      left: link.offsetLeft - list.clientWidth / 2 + link.clientWidth / 2,
      behavior: 'smooth',
    })
  }, [active])

  const done = SECTIONS.filter(({ id }) => complete[id]).length
  const percent = Math.round((done / SECTIONS.length) * 100)
  const missing = SECTIONS.filter(({ id }) => !complete[id]).map(({ id }) =>
    t(`nav.${id}`)
  )
  const firstIncomplete = SECTIONS.find(({ id }) => !complete[id])?.id

  // Jump to the first unfinished section and focus its first empty text field.
  const goToFirstIncomplete = () => {
    if (!firstIncomplete) return
    const section = document.getElementById(firstIncomplete)
    if (!section) return
    setActive(firstIncomplete)
    section.scrollIntoView({ behavior: 'smooth', block: 'start' })
    const emptyField = Array.from(
      section.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
        'input:not([type=file]):not([type=hidden]):not([disabled]), textarea:not([disabled])'
      )
    ).find((el) => !el.value.trim())
    emptyField?.focus({ preventScroll: true })
  }

  return (
    <aside className='sticky top-16 z-20 -mx-4 mb-5 flex flex-col gap-4 border-b bg-background px-4 py-2.5 sm:-mx-6 sm:px-6 md:top-[88px] md:mx-0 md:mb-0 md:border-0 md:bg-transparent md:p-0'>
      <nav
        ref={listRef}
        aria-label={t('title')}
        className='flex gap-1.5 overflow-x-auto [scrollbar-width:none] md:flex-col md:gap-0.5 md:overflow-visible [&::-webkit-scrollbar]:hidden'
      >
        {SECTIONS.map(({ id, icon: Icon }) => (
          <a
            key={id}
            href={`#${id}`}
            data-section={id}
            aria-current={active === id ? 'location' : undefined}
            onClick={() => setActive(id)}
            className={cn(
              'flex shrink-0 items-center gap-2.5 rounded-[10px] border bg-card px-3 py-[7px] text-sm whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground md:border-transparent md:bg-transparent md:py-[9px] md:hover:bg-card',
              active === id &&
                'font-medium text-primary-ink md:border-border md:bg-card md:shadow-xs'
            )}
          >
            <Icon className='size-[18px] shrink-0' />
            {t(`nav.${id}`)}
            {!complete[id] && (
              <span
                aria-label={t('progress.incomplete')}
                className='ms-auto hidden size-[7px] rounded-full bg-accent md:block'
              />
            )}
          </a>
        ))}
      </nav>

      <Card className='hidden gap-0 overflow-hidden rounded-[14px] p-0 md:flex dark:shadow-none'>
        <button
          type='button'
          onClick={goToFirstIncomplete}
          disabled={!firstIncomplete}
          className='p-4 text-start transition-colors focus-visible:bg-muted/50 focus-visible:outline-none enabled:cursor-pointer enabled:hover:bg-muted/50'
        >
          <div className='flex items-baseline justify-between text-[13px] font-semibold'>
            {t('progress.title')}
            <span dir='ltr' className='font-montserrat text-[15px] text-primary-ink'>
              {percent}%
            </span>
          </div>
          <Progress
            value={percent}
            aria-label={t('progress.title')}
            className='my-2.5 h-1.5 bg-border'
          />
          <p className='text-xs leading-relaxed text-muted-foreground'>
            {missing.length
              ? t('progress.remaining', { sections: missing.join(t('progress.separator')) })
              : t('progress.complete')}
          </p>
        </button>
      </Card>
    </aside>
  )
}

/* ----------------------------------------------------------------------- */

/* ----------------------------------------------------------------------- */

function FulfillmentLinkCard () {
  const t = useTranslations('fulfillment')
  return (
    <Card className='gap-0 rounded-2xl p-0 dark:shadow-none'>
      <Link
        href='/settings/fulfillment'
        className='group flex items-center gap-3.5 rounded-2xl p-4 outline-none focus-visible:ring-[3px] focus-visible:ring-primary/20 sm:px-6 sm:py-5'
      >
        <SectionIcon icon={Warehouse} />
        <div className='min-w-0 flex-1'>
          <h2 className='text-base font-bold'>{t('title')}</h2>
          <p className='mt-0.5 text-[13px] text-muted-foreground'>{t('description')}</p>
        </div>
        <ChevronLeft className='size-[18px] shrink-0 text-faint transition-transform group-hover:-translate-x-[3px] group-hover:text-primary-ink ltr:rotate-180 ltr:group-hover:translate-x-[3px]' />
      </Link>
    </Card>
  )
}

function AutosaveIndicator ({ status }: { status: SaveStatus }) {
  const t = useTranslations('settings.autosave')

  return (
    <span
      className={cn(
        'inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium whitespace-nowrap',
        status === 'saved' && 'bg-success-soft text-success',
        status === 'error' && 'bg-destructive-soft text-destructive',
        (status === 'saving' || status === 'idle') && 'bg-muted text-muted-foreground'
      )}
      aria-live='polite'
    >
      {status === 'saving' ? (
        <LoaderCircle className='size-3.5 animate-spin' />
      ) : status === 'saved' ? (
        <CircleCheck className='size-3.5' />
      ) : status === 'error' ? (
        <AlertCircle className='size-3.5' />
      ) : (
        <CloudUpload className='size-3.5' />
      )}
      {t(status)}
    </span>
  )
}
