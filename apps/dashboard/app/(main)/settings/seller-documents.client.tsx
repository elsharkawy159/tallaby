'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { toast } from 'sonner'
import {
  Clock,
  CircleCheck,
  Eye,
  File,
  FileBadge,
  FileCheck2,
  LoaderCircle,
  Receipt,
  RefreshCw,
  Upload,
  type LucideIcon,
} from 'lucide-react'

import { Badge } from '@workspace/ui/components/badge'
import { Button } from '@workspace/ui/components/button'
import {
  SELLER_IMAGE_ACCEPT_ATTR,
  useSellerUpload,
} from '@/components/inputs/use-seller-upload'
import { cn, getPublicUrl } from '@/lib/utils'
import { formatDate } from '@/lib/i18n/format'
import { humanizeStatus } from '@/lib/i18n/status'

import type { SellerDocument } from './seller-settings.types'
import { handleUploadDocument } from './seller-settings.server'
import { SMALL_BUTTON_CLASS, SectionCard } from './settings-ui'

const DOCUMENT_SLOTS: { type: string; icon: LucideIcon; required: boolean }[] = [
  { type: 'business_license', icon: FileBadge, required: true },
  { type: 'tax_certificate', icon: Receipt, required: true },
  { type: 'general', icon: File, required: false },
]

const REQUIRED_TYPES = DOCUMENT_SLOTS.filter((s) => s.required).map((s) => s.type)
const VERIFIED_STATUSES = new Set(['approved', 'verified'])

/** Documents arrive newest first, so the first match is the current one. */
function latestOf (documents: SellerDocument[], type: string) {
  return documents.find((doc) => doc.documentType === type)
}

export function requiredDocumentsUploaded (documents: SellerDocument[]) {
  return REQUIRED_TYPES.every((type) => latestOf(documents, type))
}

export function DocumentsSection ({
  initialDocuments,
  onUploaded,
}: {
  initialDocuments: SellerDocument[]
  onUploaded: () => void
}) {
  const t = useTranslations('settings.documents')
  const [documents, setDocuments] = useState(initialDocuments)

  useEffect(() => {
    setDocuments(initialDocuments)
  }, [initialDocuments])

  const required = REQUIRED_TYPES.map((type) => latestOf(documents, type))
  const tag = required.every((doc) => doc && VERIFIED_STATUSES.has(doc.status ?? ''))
    ? (
      <Badge variant='success' className='h-6 px-2.5'>
        <CircleCheck />
        {t('tag.verified')}
      </Badge>
      )
    : required.every(Boolean)
      ? (
        <Badge variant='info' className='h-6 px-2.5'>
          <Clock />
          {t('tag.review')}
        </Badge>
        )
      : (
        <Badge variant='warning' className='h-6 px-2.5'>
          <Clock />
          {t('tag.required')}
        </Badge>
        )

  return (
    <SectionCard
      id='docs'
      icon={FileCheck2}
      title={t('title')}
      description={t('description')}
      tag={tag}
    >
      <div className='flex flex-col gap-2.5'>
        {DOCUMENT_SLOTS.map((slot) => (
          <DocumentRow
            key={slot.type}
            {...slot}
            document={latestOf(documents, slot.type)}
            onUploaded={(doc) => {
              setDocuments((prev) => [doc, ...prev])
              onUploaded()
            }}
          />
        ))}
      </div>
    </SectionCard>
  )
}

function DocumentRow ({
  type,
  icon: Icon,
  required,
  document,
  onUploaded,
}: {
  type: string
  icon: LucideIcon
  required: boolean
  document: SellerDocument | undefined
  onUploaded: (doc: SellerDocument) => void
}) {
  const t = useTranslations('settings.documents')
  const locale = useLocale()
  const inputRef = useRef<HTMLInputElement>(null)
  const { upload, isUploading } = useSellerUpload({ folder: 'documents' })
  const [isSaving, startSaving] = useTransition()
  const busy = isUploading || isSaving

  const onFile = async (file: File) => {
    const fileUrl = await upload(file)
    if (!fileUrl) return
    startSaving(async () => {
      const res = await handleUploadDocument({ documentType: type, fileUrl })
      if (res.success) {
        toast.success(res.message)
        if ('document' in res && res.document) onUploaded(res.document as SellerDocument)
      } else {
        toast.error(res.message)
      }
    })
  }

  const status = document?.status
  const statusLabel = status
    ? t.has(`status.${status}`) ? t(`status.${status}`) : humanizeStatus(status)
    : null
  const statusVariant =
    status === 'rejected' || status === 'expired'
      ? 'danger'
      : status && VERIFIED_STATUSES.has(status)
        ? 'success'
        : 'info'

  return (
    <div className='flex flex-wrap items-center gap-3.5 rounded-xl border bg-card px-4 py-3.5 sm:flex-nowrap'>
      <div
        className={cn(
          'grid size-10 shrink-0 place-items-center rounded-[10px]',
          document ? 'bg-success-soft text-success' : 'bg-muted text-muted-foreground'
        )}
      >
        <Icon className='size-[18px]' />
      </div>
      <div className='min-w-0 flex-1'>
        <p className='flex flex-wrap items-center gap-2 text-sm font-semibold'>
          {t(`type.${type}`)}
          {document && statusLabel ? (
            <Badge variant={statusVariant}>{statusLabel}</Badge>
          ) : (
            <Badge variant={required ? 'warning' : 'muted'}>
              {required ? t('required') : t('optional')}
            </Badge>
          )}
        </p>
        <p className='truncate text-xs text-muted-foreground'>
          {document?.uploadedAt
            ? t('uploadedOn', { date: formatDate(document.uploadedAt, locale) })
            : type === 'general'
              ? t('generalHint')
              : t('formats')}
          {document?.expiryDate
            ? ` · ${t('expires', { date: formatDate(document.expiryDate, locale) })}`
            : null}
        </p>
      </div>
      <div className='flex w-full gap-1.5 sm:w-auto'>
        {document && (
          <Button variant='neutral' className={cn(SMALL_BUTTON_CLASS, 'flex-1 sm:flex-none')} asChild>
            <a
              href={getPublicUrl(document.fileUrl, 'sellers')}
              target='_blank'
              rel='noopener noreferrer'
            >
              <Eye />
              {t('view')}
            </a>
          </Button>
        )}
        <Button
          type='button'
          variant={document ? 'soft' : 'neutral'}
          className={cn(SMALL_BUTTON_CLASS, 'flex-1 sm:flex-none')}
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? (
            <LoaderCircle className='animate-spin' />
          ) : document ? (
            <RefreshCw />
          ) : (
            <Upload />
          )}
          {document ? t('replace') : t('upload')}
        </Button>
        <input
          ref={inputRef}
          type='file'
          accept={SELLER_IMAGE_ACCEPT_ATTR}
          className='hidden'
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (file) void onFile(file)
          }}
        />
      </div>
    </div>
  )
}
