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

import { IconTile, Rows, SectionCard, SellerButton, Tag } from '@/components/seller-ui'
import {
  SELLER_IMAGE_ACCEPT_ATTR,
  useSellerUpload,
} from '@/components/inputs/use-seller-upload'
import { getPublicUrl } from '@/lib/utils'
import { formatDate } from '@/lib/i18n/format'
import { humanizeStatus } from '@/lib/i18n/status'

import type { SellerDocument } from './seller-settings.types'
import { handleUploadDocument } from './seller-settings.server'

/**
 * Every document is optional (owner, 2026-10-21): sellers may upload the
 * business license and tax certificate, but nothing requires them.
 */
const DOCUMENT_SLOTS: { type: string; icon: LucideIcon }[] = [
  { type: 'business_license', icon: FileBadge },
  { type: 'tax_certificate', icon: Receipt },
  { type: 'general', icon: File },
]

const LEGAL_TYPES = ['business_license', 'tax_certificate']
const VERIFIED_STATUSES = new Set(['approved', 'verified'])

/** Documents arrive newest first, so the first match is the current one. */
function latestOf (documents: SellerDocument[], type: string) {
  return documents.find((doc) => doc.documentType === type)
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

  const uploaded = LEGAL_TYPES.map((type) => latestOf(documents, type)).filter(
    (doc): doc is SellerDocument => Boolean(doc)
  )
  const tag = uploaded.length === 0
    ? (
      <Tag>{t('tag.optional')}</Tag>
      )
    : uploaded.every((doc) => VERIFIED_STATUSES.has(doc.status ?? ''))
    ? (
      <Tag tone='success'>
        <CircleCheck aria-hidden />
        {t('tag.verified')}
      </Tag>
      )
    : (
      <Tag tone='info'>
        <Clock aria-hidden />
        {t('tag.review')}
      </Tag>
      )

  return (
    <SectionCard
      id='docs'
      icon={FileCheck2}
      title={
        <>
          {t('title')}
          {tag}
        </>
      }
      description={t('description')}
    >
      <Rows>
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
      </Rows>
    </SectionCard>
  )
}

function DocumentRow ({
  type,
  icon: Icon,
  document,
  onUploaded,
}: {
  type: string
  icon: LucideIcon
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
      ? ('danger' as const)
      : status && VERIFIED_STATUSES.has(status)
        ? ('success' as const)
        : ('info' as const)

  return (
    <div className='flex flex-wrap items-center gap-3 px-3.5 py-3 transition-colors duration-150 hover:bg-(--s-tint) [&+&]:border-t [&+&]:border-(--s-line-soft)'>
      <IconTile icon={Icon} tone={document ? 'success' : 'neutral'} />
      <div className='min-w-0 flex-1 basis-[180px]'>
        <b className='flex flex-wrap items-center gap-2 text-sm font-bold text-(--s-text)'>
          {t(`type.${type}`)}
          {document && statusLabel ? (
            <Tag tone={statusVariant}>{statusLabel}</Tag>
          ) : (
            <Tag>{t('optional')}</Tag>
          )}
        </b>
        <small className='block truncate text-xs text-(--s-subtle)'>
          {document?.uploadedAt
            ? t('uploadedOn', { date: formatDate(document.uploadedAt, locale) })
            : type === 'general'
              ? t('generalHint')
              : t('formats')}
          {document?.expiryDate
            ? ` · ${t('expires', { date: formatDate(document.expiryDate, locale) })}`
            : null}
        </small>
      </div>
      <div className='ms-auto flex gap-1.5'>
        {document && (
          <SellerButton variant='mini' size='xs' asChild>
            <a
              href={getPublicUrl(document.fileUrl, 'sellers')}
              target='_blank'
              rel='noopener noreferrer'
            >
              <Eye />
              {t('view')}
            </a>
          </SellerButton>
        )}
        <SellerButton
          variant={document ? 'mini' : 'solid'}
          size='xs'
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
        </SellerButton>
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
