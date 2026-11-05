'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useForm, useWatch, type Resolver } from 'react-hook-form'
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
  FileText,
  Globe,
  Headphones,
  Landmark,
  LoaderCircle,
  Mail,
  Phone,
  Wallet,
  Warehouse,
  type LucideIcon,
} from 'lucide-react'

import {
  Field,
  FieldRow,
  IconTile,
  InputGroup,
  PageContainer,
  PageHeader,
  SectionCard,
  SellerButton,
  SellerCard,
  StatusBadge,
  TextInput,
} from '@/components/seller-ui'
import { cn } from '@/lib/utils'
import { useLocalizedResolver } from '@/lib/i18n/localized-resolver'

import type { SellerSettingsInitialData } from './seller-settings.types'
import {
  sellerProfileSchema,
  type SellerProfileForm,
} from './seller-settings.schema'
import { handleUpdateSellerProfile } from './seller-settings.server'
import type { SellerAccountView } from '@workspace/lib/sellers/server'
import { TALLABY_SERVICES_ENABLED } from '@workspace/lib/fulfillment'
import { LegalDetailsSection, PayoutDetailsSection, StoreDetailsMovedCard } from './account-sections.client'
import { DocumentsSection } from './seller-documents.client'
import { PoliciesSection } from './policies.client'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

type SectionId = 'info' | 'contact' | 'legal' | 'payout' | 'policies' | 'link' | 'docs'

// Store-level fields (logo, banner, description) moved to
// Store settings (PLAN.md P3-05); this page is the seller ACCOUNT.
const SECTIONS: { id: SectionId; icon: LucideIcon }[] = [
  { id: 'info', icon: Building2 },
  { id: 'contact', icon: Headphones },
  { id: 'legal', icon: Landmark },
  { id: 'payout', icon: Wallet },
  { id: 'policies', icon: FileText },
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
  /** Phone alerts card (F-06); null while push is not configured. */
  pushAlertsSection?: React.ReactNode
}

const AUTOSAVE_DELAY_MS = 900

export function SellerSettingsForm ({
  initialData,
  storeHref,
  linkSection,
  account,
  primaryStoreId,
  pushAlertsSection = null,
}: SellerSettingsFormProps) {
  const t = useTranslations('settings')
  const tSetup = useTranslations('storeSetup')
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
    // Optional: a store with no text shows a neutral default.
    policies: true,
    link: true,
    // Documents are optional, so the section never blocks completion.
    docs: true,
  }

  return (
    <PageContainer>
      <PageHeader
        title={tSetup('accountTitle')}
        description={tSetup('accountDescription')}
        actions={
          <>
            <AutosaveIndicator status={saveStatus} />
            <SellerButton variant='mini' size='sm' asChild>
              <a href={storeHref} target='_blank' rel='noopener noreferrer'>
                <ExternalLink className='rtl:-scale-x-100' aria-hidden />
                {t('viewStore')}
              </a>
            </SellerButton>
          </>
        }
      />

      <div className='grid grid-cols-[220px_minmax(0,1fr)] items-start gap-5 max-[860px]:grid-cols-1 max-[860px]:gap-3.5'>
        <SectionNav complete={complete} />

        <div className='flex min-w-0 flex-col gap-4'>
          <StoreDetailsMovedCard storeId={primaryStoreId} />

          <form className='flex min-w-0 flex-col gap-4' onSubmit={(e) => e.preventDefault()}>
            <SectionCard id='info' icon={Building2} title={t('sections.info.title')} description={t('sections.info.description')}>
              <Field
                label={t('fields.businessName')}
                hint={t('fields.businessNameNote')}
                htmlFor='businessName'
                error={form.formState.errors.businessName?.message}
              >
                <TextInput id='businessName' placeholder={t('fields.businessNamePlaceholder')} {...form.register('businessName')} />
              </Field>
            </SectionCard>

            <SectionCard id='contact' icon={Headphones} title={t('sections.contact.title')} description={t('sections.contact.description')}>
              <FieldRow>
                <Field label={t('fields.supportEmail')} htmlFor='supportEmail' error={form.formState.errors.supportEmail?.message}>
                  <InputGroup
                    id='supportEmail'
                    type='email'
                    dir='ltr'
                    start={<Mail className='size-4' aria-hidden />}
                    inputClassName='font-montserrat text-[13px]'
                    placeholder='support@example.com'
                    {...form.register('supportEmail')}
                  />
                </Field>
                <Field label={t('fields.supportPhone')} htmlFor='supportPhone' error={form.formState.errors.supportPhone?.message}>
                  <InputGroup
                    id='supportPhone'
                    type='tel'
                    dir='ltr'
                    start={<Phone className='size-4' aria-hidden />}
                    inputClassName='font-montserrat text-[13px]'
                    placeholder='+20 1XX XXX XXXX'
                    {...form.register('supportPhone')}
                  />
                </Field>
              </FieldRow>
            </SectionCard>
          </form>

          <LegalDetailsSection account={account} />
          <PayoutDetailsSection payout={account.payout} />
          <PoliciesSection
            returnPolicy={initialData.profile.returnPolicy}
            shippingPolicy={initialData.profile.shippingPolicy}
            privacyPolicy={initialData.profile.privacyPolicy}
          />

          <SectionCard
            id='link'
            icon={Globe}
            title={
              <>
                {t('sections.link.title')}
                <StatusBadge tone='success'>{t('sections.link.active')}</StatusBadge>
              </>
            }
            description={t('sections.link.description')}
          >
            {/* These two controls keep the shared kit; on phones their buttons still reach 40px. */}
            <div className='flex flex-col gap-4 max-[600px]:[&_a[data-slot=button]]:min-h-10 max-[600px]:[&_button]:min-h-10'>{linkSection}</div>
          </SectionCard>

          {pushAlertsSection}

          <DocumentsSection initialDocuments={initialData.documents} sellerId={initialData.profile.id ?? ''} onUploaded={() => router.refresh()} />

          {TALLABY_SERVICES_ENABLED && <FulfillmentLinkCard />}
        </div>
      </div>
    </PageContainer>
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
    <aside className='sticky top-[88px] z-20 flex min-w-0 flex-col gap-3 max-[1020px]:top-[72px] max-[600px]:top-[68px]'>
      <nav
        ref={listRef}
        aria-label={t('title')}
        className='flex flex-col gap-0.5 rounded-[20px] border border-(--s-line) bg-(--s-surface) p-2 max-[860px]:flex-row max-[860px]:gap-1 max-[860px]:overflow-x-auto max-[860px]:rounded-full max-[860px]:p-1 max-[860px]:shadow-[0_6px_18px_rgb(13_55_67/0.04)] max-[860px]:[scrollbar-width:none] max-[860px]:[&::-webkit-scrollbar]:hidden'
      >
        {SECTIONS.map(({ id, icon: Icon }) => (
          <a
            key={id}
            href={`#${id}`}
            data-section={id}
            aria-current={active === id ? 'location' : undefined}
            onClick={() => setActive(id)}
            className={cn(
              'flex min-h-[38px] shrink-0 items-center gap-2.5 rounded-xl px-3 text-[13.5px] font-semibold whitespace-nowrap text-(--s-body) no-underline transition-colors duration-150 hover:bg-(--s-hover) max-[860px]:min-h-10 max-[860px]:rounded-full',
              active === id && 'bg-(--s-solid) text-(--s-solid-fg) hover:bg-(--s-solid)'
            )}
          >
            <Icon className='size-4 shrink-0' aria-hidden />
            {t(`nav.${id}`)}
            {!complete[id] && (
              <span
                aria-label={t('progress.incomplete')}
                className='ms-auto size-[7px] shrink-0 rounded-full bg-accent max-[860px]:hidden'
              />
            )}
          </a>
        ))}
      </nav>

      <SellerCard className='overflow-hidden rounded-[20px] max-[860px]:hidden'>
        <button
          type='button'
          onClick={goToFirstIncomplete}
          disabled={!firstIncomplete}
          className='block w-full p-4 text-start transition-colors duration-150 enabled:cursor-pointer enabled:hover:bg-(--s-tint)'
        >
          <div className='flex items-baseline justify-between text-[13px] font-bold text-(--s-text)'>
            {t('progress.title')}
            <span dir='ltr' className='font-montserrat text-[15px] font-bold text-(--s-link)'>
              {percent}%
            </span>
          </div>
          <span
            role='progressbar'
            aria-label={t('progress.title')}
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            className='my-2.5 block h-1.5 overflow-hidden rounded-full bg-(--s-fill)'
          >
            <i className='block h-full rounded-full bg-(--s-primary)' style={{ width: `${percent}%` }} />
          </span>
          <p className='text-xs leading-relaxed text-(--s-subtle)'>
            {missing.length
              ? t('progress.remaining', { sections: missing.join(t('progress.separator')) })
              : t('progress.complete')}
          </p>
        </button>
      </SellerCard>
    </aside>
  )
}

/* ----------------------------------------------------------------------- */

/* ----------------------------------------------------------------------- */

function FulfillmentLinkCard () {
  const t = useTranslations('fulfillment')
  return (
    <SellerCard>
      <Link href='/settings/fulfillment' className='group flex items-center gap-3.5 rounded-[inherit] px-6 py-[18px] max-[720px]:gap-2.5 max-[720px]:px-4'>
        <IconTile icon={Warehouse} />
        <div className='min-w-0 flex-1'>
          <h2 className='text-[15.5px] font-bold text-(--s-ink)'>{t('title')}</h2>
          <p className='mt-0.5 text-[13px] text-(--s-subtle)'>{t('description')}</p>
        </div>
        <ChevronLeft className='size-[18px] shrink-0 text-(--s-faint) ltr:rotate-180' aria-hidden />
      </Link>
    </SellerCard>
  )
}

function AutosaveIndicator ({ status }: { status: SaveStatus }) {
  const t = useTranslations('settings.autosave')

  return (
    <span
      className={cn(
        'inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold whitespace-nowrap max-[600px]:h-10',
        status === 'saved' && 'bg-success-soft text-success',
        status === 'error' && 'bg-destructive-soft text-destructive',
        (status === 'saving' || status === 'idle') && 'bg-(--s-fill) text-(--s-muted)'
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
