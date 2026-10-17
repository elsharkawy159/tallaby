"use client"

import Image from "next/image"
import { useTranslations, useLocale } from "next-intl"
import { formatDate } from "@workspace/i18n"
import { Badge } from "@workspace/ui/components/badge"
import { ImageIcon } from "lucide-react"
import { useCurrency } from "@workspace/currency/react"
import { priceAmount } from "@/lib/storefront/catalog-format"
import type { CmsFieldDef, CmsImageValue, CmsReferenceRef } from "@/types/cms/cms.types"

export interface FieldCellProps {
  field: CmsFieldDef
  value: unknown
  references?: CmsReferenceRef[]
}

function TextCell({ value }: FieldCellProps) {
  const text = value === null || value === undefined ? "" : String(value)
  return <span className="truncate text-sm">{text || "—"}</span>
}

function RichtextExcerptCell({ field, value }: FieldCellProps & { value: Record<string, unknown> | undefined }) {
  void value
  void field
  const t = useTranslations('cms.fieldCells')
  return <span className="truncate text-sm text-muted-foreground">{t('richText')}</span>
}

function BooleanCell({ value }: FieldCellProps) {
  const t = useTranslations('cms.fieldCells')
  return (
    <Badge variant={value ? "default" : "secondary"} className="font-normal">
      {value ? t('yes') : t('no')}
    </Badge>
  )
}

function DateCell({ value }: FieldCellProps) {
  const locale = useLocale()
  if (!value) return <span className="text-sm text-muted-foreground">—</span>
  return <span className="text-sm text-muted-foreground">{formatDate(String(value), locale)}</span>
}

function ImageCell({ value }: FieldCellProps) {
  const image = value as CmsImageValue | null
  if (!image?.url) {
    return (
      <div className="flex size-9 items-center justify-center rounded bg-muted text-muted-foreground">
        <ImageIcon className="size-4" />
      </div>
    )
  }
  return (
    <div className="relative size-9 overflow-hidden rounded">
      <Image src={image.url} alt={image.alt ?? ""} fill className="object-cover" sizes="36px" />
    </div>
  )
}

function GalleryCell({ value }: FieldCellProps) {
  const t = useTranslations('cms.fieldCells')
  const images = Array.isArray(value) ? (value as CmsImageValue[]) : []
  return <span className="text-sm text-muted-foreground">{t('imageCount', { count: images.length })}</span>
}

function SelectCell({ field, value }: FieldCellProps) {
  const opt = field.options?.find((o) => o.value === value)
  if (!opt) return <span className="text-sm text-muted-foreground">—</span>
  return <Badge variant="secondary" className="font-normal" style={opt.color ? { backgroundColor: `${opt.color}22`, color: opt.color } : undefined}>{opt.label}</Badge>
}

function MultiSelectCell({ field, value }: FieldCellProps) {
  const values = Array.isArray(value) ? (value as string[]) : []
  if (!values.length) return <span className="text-sm text-muted-foreground">—</span>
  return (
    <div className="flex flex-wrap gap-1">
      {values.slice(0, 3).map((v) => {
        const opt = field.options?.find((o) => o.value === v)
        return (
          <Badge key={v} variant="secondary" className="font-normal">
            {opt?.label ?? v}
          </Badge>
        )
      })}
      {values.length > 3 && <span className="text-xs text-muted-foreground">+{values.length - 3}</span>}
    </div>
  )
}

function ReferenceCell({ references }: FieldCellProps) {
  const refs = references ?? []
  if (!refs.length) return <span className="text-sm text-muted-foreground">—</span>
  return (
    <div className="flex flex-wrap gap-1">
      {refs.slice(0, 3).map((r) => (
        <Badge key={r.id} variant="secondary" className="font-normal">
          {r.label}
        </Badge>
      ))}
      {refs.length > 3 && <span className="text-xs text-muted-foreground">+{refs.length - 3}</span>}
    </div>
  )
}

function PriceCell({ value }: FieldCellProps) {
  // Display in the project's currency (single source of truth), tolerant of both
  // the numeric field and the legacy { amount, currency } shape.
  const { format } = useCurrency()
  const amount = priceAmount(value)
  if (amount === null) return <span className="text-sm text-muted-foreground">—</span>
  return <span className="text-sm">{format(amount)}</span>
}

function ColorCell({ value }: FieldCellProps) {
  if (!value) return <span className="text-sm text-muted-foreground">—</span>
  return (
    <div className="flex items-center gap-2">
      <span className="size-4 rounded-full border border-border" style={{ backgroundColor: String(value) }} />
      <span className="text-sm text-muted-foreground">{String(value)}</span>
    </div>
  )
}

export const FIELD_CELLS: Record<string, React.ComponentType<FieldCellProps>> = {
  text: TextCell,
  slug: TextCell,
  url: TextCell,
  email: TextCell,
  textarea: TextCell,
  richtext: RichtextExcerptCell as React.ComponentType<FieldCellProps>,
  number: TextCell,
  boolean: BooleanCell,
  date: DateCell,
  color: ColorCell,
  image: ImageCell,
  gallery: GalleryCell,
  select: SelectCell,
  multiselect: MultiSelectCell,
  reference: ReferenceCell,
  multireference: ReferenceCell,
  price: PriceCell,
}
