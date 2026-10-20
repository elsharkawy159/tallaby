"use client"

import { useState, useTransition } from "react"
import dynamic from "next/dynamic"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { ImageIcon, Plus, X } from "lucide-react"

import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"
import { Switch } from "@workspace/ui/components/switch"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@workspace/ui/components/command"
import { MediaLibraryDialog } from "@/components/website-builder/media/media-library-dialog"
import { AiRewriteButton } from "@/components/ai/ai-rewrite-button"
import { buildExploreImageContextAction } from "@/actions/website-ai-section-actions"
import { getPublishedItemsAction } from "@/actions/cms/item-reference-actions"
import { useCurrency } from "@workspace/currency/react"
import type { CmsFieldDef, CmsImageValue, CmsPriceValue } from "@/types/cms/cms.types"
import type { JSONContent } from "@workspace/tiptap-editor/utils"

const BlogEditor = dynamic(
  () => import("@workspace/tiptap-editor/editor").then((m) => m.BlogEditor),
  { ssr: false, loading: () => <div className="h-64 animate-pulse rounded-md bg-muted" /> }
)

export interface FieldInputProps {
  field: CmsFieldDef
  value: unknown
  onChange: (value: unknown) => void
  projectId: string
  /** Collection kind (articles/products/…) so AI rewrite can tailor its prompt. */
  collectionKind?: string
  /** Sibling field values for contextual AI (cover image search, blog metadata). */
  cmsItemData?: Record<string, unknown>
  /** Patch multiple fields at once (blog AI metadata suggest). */
  onPatchFields?: (patch: Record<string, unknown>) => void
}

function TextInput({ field, value, onChange, projectId, collectionKind }: FieldInputProps) {
  const input = (
    <Input
      value={(value as string) ?? ""}
      placeholder={field.placeholder}
      maxLength={field.config?.maxLength}
      onChange={(e) => onChange(e.target.value)}
      className={field.type === "text" ? "pe-9" : undefined}
    />
  )
  // Only plain text gets AI rewrite — TextInput also serves slug/url/email.
  if (field.type !== "text") return input
  return (
    <div className="relative">
      {input}
      <AiRewriteButton
        className="absolute end-1 top-1"
        value={(value as string) ?? ""}
        onRewritten={(text) => onChange(text)}
        projectId={projectId}
        fieldKey={field.key}
        fieldLabel={field.label}
        entityType="cms_item"
        collectionKind={collectionKind}
      />
    </div>
  )
}

function TextareaInput({ field, value, onChange, projectId, collectionKind }: FieldInputProps) {
  return (
    <div className="relative">
      <Textarea
        value={(value as string) ?? ""}
        placeholder={field.placeholder}
        rows={field.config?.rows ?? 4}
        onChange={(e) => onChange(e.target.value)}
        className="pe-9"
      />
      <AiRewriteButton
        className="absolute end-1 top-1"
        value={(value as string) ?? ""}
        onRewritten={(text) => onChange(text)}
        projectId={projectId}
        fieldKey={field.key}
        fieldLabel={field.label}
        entityType="cms_item"
        collectionKind={collectionKind}
      />
    </div>
  )
}

function NumberInput({ field, value, onChange }: FieldInputProps) {
  return (
    <Input
      type="number"
      value={value === null || value === undefined ? "" : String(value)}
      placeholder={field.placeholder}
      min={field.config?.min}
      max={field.config?.max}
      onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
    />
  )
}

function BooleanInput({ value, onChange }: FieldInputProps) {
  return <Switch checked={Boolean(value)} onCheckedChange={onChange} />
}

function DateInput({ value, onChange }: FieldInputProps) {
  return (
    <Input
      type="date"
      value={value ? String(value).slice(0, 10) : ""}
      onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : null)}
    />
  )
}

function ColorInput({ value, onChange }: FieldInputProps) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={(value as string) || "#000000"}
        onChange={(e) => onChange(e.target.value)}
        className="size-9 cursor-pointer rounded-md border border-input bg-transparent p-1"
      />
      <Input value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} placeholder="#000000" />
    </div>
  )
}

function RichtextInput({ value, onChange }: FieldInputProps) {
  const doc = (value as JSONContent) ?? { type: "doc", content: [] }
  return (
    <div className="rounded-md border border-input">
      <BlogEditor value={doc} onChange={(next: JSONContent) => onChange(next)} />
    </div>
  )
}

function SelectInput({ field, value, onChange }: FieldInputProps) {
  const t = useTranslations('cms.fieldInputs')
  const options = field.options ?? []
  return (
    <Select value={(value as string) || ""} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={t('selectOption')} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function MultiSelectInput({ field, value, onChange }: FieldInputProps) {
  const t = useTranslations('cms.fieldInputs')
  const options = field.options ?? []
  const selected = Array.isArray(value) ? (value as string[]) : []

  const toggle = (v: string) => {
    onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v])
  }

  if (!options.length) {
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {selected.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <button type="button" onClick={() => toggle(tag)}>
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
        <Input
          placeholder={t('addTagPlaceholder') ?? 'Type a tag and press Enter'}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return
            e.preventDefault()
            const next = e.currentTarget.value.trim().toLowerCase()
            e.currentTarget.value = ''
            if (!next || selected.includes(next)) return
            onChange([...selected, next])
          }}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const active = selected.includes(opt.value)
        return (
          <button
            type="button"
            key={opt.value}
            onClick={() => toggle(opt.value)}
            className="rounded-full"
          >
            <Badge variant={active ? "default" : "secondary"} className="cursor-pointer select-none">
              {opt.label}
            </Badge>
          </button>
        )
      })}
      {!options.length && <p className="text-xs text-muted-foreground">{t('noOptions')}</p>}
    </div>
  )
}

function ImageInput({ field, value, onChange, projectId, collectionKind, cmsItemData }: FieldInputProps) {
  const t = useTranslations('cms.fieldInputs')
  const [open, setOpen] = useState(false)
  const [initialStockQuery, setInitialStockQuery] = useState<string | undefined>()
  const [, startTransition] = useTransition()
  const image = (value as CmsImageValue | null) ?? null

  const openDialog = () => {
    setOpen(true)
    if (collectionKind === 'articles' && cmsItemData) {
      startTransition(async () => {
        const result = await buildExploreImageContextAction({
          projectId,
          cmsItem: cmsItemData,
          element: { key: field.key, label: field.label, role: field.key === 'coverImage' ? 'hero image' : 'social image' },
        })
        if (!('error' in result)) setInitialStockQuery(result.primaryQuery)
      })
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={openDialog}
        className="group relative flex h-32 w-full items-center justify-center overflow-hidden rounded-md border border-dashed border-input bg-muted/40 hover:border-primary"
      >
        {image?.url ? (
          <Image src={image.url} alt={image.alt ?? ""} fill className="object-cover" sizes="320px" />
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <ImageIcon className="size-6" />
            <span className="text-xs">{t('chooseImage')}</span>
          </div>
        )}
      </button>
      {image?.url && (
        <Input
          placeholder={t('altText')}
          value={image.alt ?? ""}
          onChange={(e) => onChange({ ...image, alt: e.target.value })}
        />
      )}
      <MediaLibraryDialog
        open={open}
        onOpenChange={setOpen}
        projectId={projectId}
        previousUrl={image?.url ?? ""}
        initialStockQuery={initialStockQuery}
        onCommit={(url) => onChange({ url, alt: image?.alt ?? "" })}
      />
    </div>
  )
}

function GalleryInput({ field, value, onChange, projectId }: FieldInputProps) {
  const [open, setOpen] = useState(false)
  const images = Array.isArray(value) ? (value as CmsImageValue[]) : []

  const remove = (idx: number) => onChange(images.filter((_, i) => i !== idx))

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {images.map((img, idx) => (
          <div key={`${img.url}-${idx}`} className="group relative aspect-square overflow-hidden rounded-md border border-border">
            <Image src={img.url} alt={img.alt ?? ""} fill className="object-cover" sizes="120px" />
            <button
              type="button"
              onClick={() => remove(idx)}
              className="absolute end-1 top-1 hidden rounded-full bg-background/90 p-1 group-hover:block"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex aspect-square items-center justify-center rounded-md border border-dashed border-input text-muted-foreground hover:border-primary"
        >
          <Plus className="size-5" />
        </button>
      </div>
      <MediaLibraryDialog
        open={open}
        onOpenChange={setOpen}
        projectId={projectId}
        previousUrl=""
        onCommit={(url) => {
          if (!url) return
          onChange([...images, { url, alt: "" }])
        }}
      />
    </div>
  )
}

function PriceInput({ value, onChange }: FieldInputProps) {
  // Currency is inherited from Project Settings (single source of truth) — the
  // merchant edits the amount only; there is no per-field currency selector.
  const { currency, meta } = useCurrency()
  const price = (value as CmsPriceValue | null) ?? { amount: 0, currency }
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
        {meta.symbol}
      </span>
      <Input
        type="number"
        step="0.01"
        value={price.amount ?? 0}
        onChange={(e) => onChange({ amount: Number(e.target.value), currency })}
        className="pl-9"
        aria-label={`Price in ${currency}`}
      />
    </div>
  )
}

function ReferenceInput({ field, value, onChange, projectId }: FieldInputProps) {
  const t = useTranslations('cms.fieldInputs')
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [options, setOptions] = useState<{ id: string; label: string }[]>([])

  const load = async (q: string) => {
    if (!field.referenceCollectionSlug) return
    const items = await getPublishedItemsAction(field.referenceCollectionSlug, projectId, q)
    setOptions(items)
  }

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (o) load(search) }}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start font-normal">
          {(value as string) ? options.find((o) => o.id === value)?.label ?? t('selectedItem') : t('selectItem')}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={t('search')}
            value={search}
            onValueChange={(v) => { setSearch(v); load(v) }}
          />
          <CommandList>
            <CommandEmpty>{t('noItemsFound')}</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => (
                <CommandItem key={opt.id} onSelect={() => { onChange(opt.id); setOpen(false) }}>
                  {opt.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function MultiReferenceInput({ field, value, onChange, projectId }: FieldInputProps) {
  const t = useTranslations('cms.fieldInputs')
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [options, setOptions] = useState<{ id: string; label: string }[]>([])
  const selected = Array.isArray(value) ? (value as string[]) : []

  const load = async (q: string) => {
    if (!field.referenceCollectionSlug) return
    const items = await getPublishedItemsAction(field.referenceCollectionSlug, projectId, q)
    setOptions(items)
  }

  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id])
  }

  const labelFor = (id: string) => options.find((o) => o.id === id)?.label ?? id

  return (
    <div className="space-y-2">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((id) => (
            <Badge key={id} variant="secondary" className="gap-1">
              {labelFor(id)}
              <button type="button" onClick={() => toggle(id)}>
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <Popover open={open} onOpenChange={(o) => { setOpen(o); if (o) load(search) }}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="font-normal">
            <Plus className="size-3.5" /> {t('addReference')}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput placeholder={t('search')} value={search} onValueChange={(v) => { setSearch(v); load(v) }} />
            <CommandList>
              <CommandEmpty>{t('noItemsFound')}</CommandEmpty>
              <CommandGroup>
                {options.map((opt) => (
                  <CommandItem key={opt.id} onSelect={() => toggle(opt.id)}>
                    <span className={selected.includes(opt.id) ? "font-medium" : ""}>{opt.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export const FIELD_INPUTS: Record<string, React.ComponentType<FieldInputProps>> = {
  text: TextInput,
  slug: TextInput,
  url: TextInput,
  email: TextInput,
  textarea: TextareaInput,
  richtext: RichtextInput,
  number: NumberInput,
  boolean: BooleanInput,
  date: DateInput,
  color: ColorInput,
  image: ImageInput,
  gallery: GalleryInput,
  select: SelectInput,
  multiselect: MultiSelectInput,
  reference: ReferenceInput,
  multireference: MultiReferenceInput,
  price: PriceInput,
}
