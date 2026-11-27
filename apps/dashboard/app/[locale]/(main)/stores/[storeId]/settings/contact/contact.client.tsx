'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { AlertCircle, Building2, CircleCheck, CloudUpload, Headphones, LoaderCircle, Mail, Phone } from 'lucide-react'

import { Field, FieldRow, InputGroup, SectionCard, TextInput } from '@/components/seller-ui'
import { cn } from '@/lib/utils'
import { useLocalizedResolver } from '@/lib/i18n/localized-resolver'

import { sellerProfileSchema, type SellerProfileForm } from './contact.dto'
import { handleUpdateSellerProfile } from './contact.server'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

const AUTOSAVE_DELAY_MS = 900

/**
 * Store settings › Business & contact (moved from /settings, owner 2026-11-27):
 * the account's business name and the support email and phone. Account data,
 * shown under whichever store is open; autosaves to the session seller only.
 */
export function ContactSettingsForm ({
  initial,
}: {
  initial: { businessName: string | null; supportEmail: string | null; supportPhone: string | null }
}) {
  const t = useTranslations('settings')
  const router = useRouter()
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedRef = useRef<string>('')
  const isSavingRef = useRef(false)

  const defaults: SellerProfileForm = useMemo(
    () => ({
      businessName: initial.businessName ?? '',
      supportEmail: initial.supportEmail ?? '',
      supportPhone: initial.supportPhone ?? '',
    }),
    [initial]
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

  return (
    <form className='flex min-w-0 flex-col gap-4' onSubmit={(e) => e.preventDefault()}>
      <SectionCard
        id='info'
        icon={Building2}
        title={t('sections.info.title')}
        description={t('sections.info.description')}
        action={<AutosaveIndicator status={saveStatus} />}
      >
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
