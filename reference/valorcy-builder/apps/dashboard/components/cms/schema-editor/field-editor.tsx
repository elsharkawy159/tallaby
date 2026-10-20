"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { notify } from "@/services/toast"
import { GripVertical, Plus, Trash2, Loader2 } from "lucide-react"
import {
  SortableListProvider,
  useSortableListItem,
} from "@/components/dnd/sortable-list"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Switch } from "@workspace/ui/components/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@workspace/ui/components/dialog"
import { cn } from "@workspace/ui/lib/utils"
import { ADDABLE_FIELD_TYPES, FIELD_TYPE_META } from "@/lib/cms/field-meta"
import { updateCollectionAction } from "@/actions/cms/collection-actions"
import type { CmsCollection, CmsFieldDef, CmsFieldType } from "@/types/cms/cms.types"

export interface ReferenceTarget {
  id: string
  slug: string
  name: string
}

interface FieldEditorProps {
  collection: CmsCollection
  projectId: string
  referenceTargets?: ReferenceTarget[]
}

function blankField(type: CmsFieldType): CmsFieldDef {
  return {
    key: "",
    label: "",
    type,
    showInTable: false,
  }
}

function slugifyKey(label: string) {
  const camel = label
    .trim()
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .split(/\s+/)
    .map((w, i) => (i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join("")
  return camel || "field"
}

const FIELDS_GROUP = "cms-fields"

function SortableFieldRow({
  field,
  index,
  onEdit,
  onRemove,
}: {
  field: CmsFieldDef
  index: number
  onEdit: () => void
  onRemove: () => void
}) {
  const t = useTranslations('cms.fieldEditor')
  const { ref, handleRef, isDragging } = useSortableListItem({
    id: field.key,
    index,
    group: FIELDS_GROUP,
  })
  const meta = FIELD_TYPE_META[field.type]

  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center gap-3 rounded-md border border-border bg-background px-3 py-2.5",
        isDragging && "opacity-60 shadow-lg"
      )}
    >
      <button
        type="button"
        ref={handleRef}
        aria-label={`Reorder ${field.label || field.key}`}
        aria-roledescription="draggable field"
        className="cursor-grab text-muted-foreground active:cursor-grabbing"
      >
        <GripVertical className="size-4" />
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {field.label || field.key}
          {field.isSystem && <span className="ms-1.5 text-xs text-muted-foreground">{t('system')}</span>}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {meta?.label ?? field.type} · {field.key}
          {field.required ? ` · ${t('required')}` : ""}
        </p>
      </div>
      <Button variant="ghost" size="sm" onClick={onEdit}>
        {t('edit')}
      </Button>
      {!field.isSystem && (
        <Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive" onClick={onRemove}>
          <Trash2 className="size-4" />
        </Button>
      )}
    </div>
  )
}

export function FieldEditor({ collection, projectId, referenceTargets = [] }: FieldEditorProps) {
  const t = useTranslations('cms.fieldEditor')
  const router = useRouter()
  const [fields, setFields] = useState<CmsFieldDef[]>(collection.fields)
  const [editing, setEditing] = useState<{ index: number; field: CmsFieldDef } | null>(null)
  const [adding, setAdding] = useState<CmsFieldType | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleReorder = (from: number, to: number) => {
    setFields((prev) => {
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      if (!moved) return prev
      next.splice(to, 0, moved)
      return next
    })
  }

  const persist = async (next: CmsFieldDef[]) => {
    setIsSaving(true)
    try {
      const result = await updateCollectionAction({ id: collection.id, projectId, fields: next })
      if (!result.ok) {
        notify.error(result.error)
        return
      }
      setFields(result.data.fields)
      notify.success(t('toastSchemaUpdated'))
      router.refresh()
    } finally {
      setIsSaving(false)
    }
  }

  const removeField = (index: number) => {
    const next = fields.filter((_, i) => i !== index)
    setFields(next)
    persist(next)
  }

  const saveFieldEdit = (field: CmsFieldDef, index: number | null) => {
    let next: CmsFieldDef[]
    if (index === null) {
      if (fields.some((f) => f.key === field.key)) {
        notify.error(t('toastDuplicateKey'))
        return
      }
      next = [...fields, field]
    } else {
      next = fields.map((f, i) => (i === index ? field : f))
    }
    setFields(next)
    setEditing(null)
    setAdding(null)
    persist(next)
  }

  return (
    <div className="space-y-4">
      <SortableListProvider onReorder={handleReorder}>
        <div className="space-y-2">
          {fields.map((field, index) => (
            <SortableFieldRow
              key={field.key}
              field={field}
              index={index}
              onEdit={() => setEditing({ index, field })}
              onRemove={() => removeField(index)}
            />
          ))}
        </div>
      </SortableListProvider>

      <SaveOrderButton fields={fields} collectionFields={collection.fields} onSave={persist} isSaving={isSaving} />

      <div className="flex flex-wrap gap-2 border-t border-border pt-4">
        <p className="w-full text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('addAField')}</p>
        {ADDABLE_FIELD_TYPES.map((type) => {
          const meta = FIELD_TYPE_META[type]
          return (
            <Button key={type} variant="outline" size="sm" onClick={() => setAdding(type)}>
              <Plus className="size-3.5" /> {meta.label}
            </Button>
          )
        })}
      </div>

      {(editing || adding) && (
        <FieldDialog
          field={editing?.field ?? blankField(adding!)}
          isNew={!editing}
          referenceTargets={referenceTargets}
          onClose={() => { setEditing(null); setAdding(null) }}
          onSave={(field) => saveFieldEdit(field, editing?.index ?? null)}
        />
      )}
    </div>
  )
}

/** Persists a reorder once it differs from the saved collection order. */
function SaveOrderButton({
  fields,
  collectionFields,
  onSave,
  isSaving,
}: {
  fields: CmsFieldDef[]
  collectionFields: CmsFieldDef[]
  onSave: (fields: CmsFieldDef[]) => void
  isSaving: boolean
}) {
  const t = useTranslations('cms.fieldEditor')
  const reordered = fields.map((f) => f.key).join(",") !== collectionFields.map((f) => f.key).join(",")
  if (!reordered) return null

  return (
    <div className="flex justify-end">
      <Button size="sm" onClick={() => onSave(fields)} disabled={isSaving}>
        {isSaving && <Loader2 className="size-3.5 animate-spin" />}
        {t('saveFieldOrder')}
      </Button>
    </div>
  )
}

function FieldDialog({
  field,
  isNew,
  referenceTargets,
  onClose,
  onSave,
}: {
  field: CmsFieldDef
  isNew: boolean
  referenceTargets: ReferenceTarget[]
  onClose: () => void
  onSave: (field: CmsFieldDef) => void
}) {
  const t = useTranslations('cms.fieldEditor')
  const [label, setLabel] = useState(field.label)
  const [key, setKey] = useState(field.key)
  const [keyTouched, setKeyTouched] = useState(!isNew)
  const [required, setRequired] = useState(field.required ?? false)
  const [unique, setUnique] = useState(field.unique ?? false)
  const [showInTable, setShowInTable] = useState(field.showInTable ?? false)
  const [helpText, setHelpText] = useState(field.helpText ?? "")
  const [defaultValue, setDefaultValue] = useState(
    field.defaultValue === undefined || field.defaultValue === null ? "" : String(field.defaultValue)
  )
  const [optionsText, setOptionsText] = useState((field.options ?? []).map((o) => o.label).join("\n"))
  const [referenceSlug, setReferenceSlug] = useState(field.referenceCollectionSlug ?? "")
  const [minStr, setMinStr] = useState(field.config?.min !== undefined ? String(field.config.min) : "")
  const [maxStr, setMaxStr] = useState(field.config?.max !== undefined ? String(field.config.max) : "")
  const [maxLengthStr, setMaxLengthStr] = useState(field.config?.maxLength !== undefined ? String(field.config.maxLength) : "")

  const meta = FIELD_TYPE_META[field.type]
  const isReference = Boolean(meta?.isReference)
  const isNumeric = field.type === "number" || field.type === "price"
  const isTextual = field.type === "text" || field.type === "textarea"
  const supportsDefault = ["text", "textarea", "number", "boolean", "select", "url", "email", "color"].includes(field.type)

  const handleLabelChange = (v: string) => {
    setLabel(v)
    if (!keyTouched) setKey(slugifyKey(v))
  }

  const coerceDefault = (): unknown => {
    if (defaultValue.trim() === "") return undefined
    if (field.type === "number") return Number.isFinite(Number(defaultValue)) ? Number(defaultValue) : undefined
    if (field.type === "boolean") return defaultValue === "true"
    return defaultValue
  }

  const handleSave = () => {
    if (!label.trim() || !key.trim()) {
      notify.error(t('toastLabelKeyRequired'))
      return
    }

    if (isReference && !referenceSlug) {
      notify.error(t('toastChooseReference'))
      return
    }

    const options = meta?.hasOptions
      ? optionsText
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line) => ({ value: slugifyKey(line), label: line }))
      : field.options

    const num = (s: string) => (s.trim() === "" || !Number.isFinite(Number(s)) ? undefined : Number(s))
    const config = {
      ...field.config,
      ...(isNumeric ? { min: num(minStr), max: num(maxStr) } : {}),
      ...(isTextual ? { maxLength: num(maxLengthStr) } : {}),
    }
    const hasConfig = Object.values(config).some((v) => v !== undefined)

    const target = referenceTargets.find((t) => t.slug === referenceSlug)

    onSave({
      ...field,
      key: key.trim(),
      label: label.trim(),
      required,
      unique,
      showInTable,
      helpText: helpText.trim() || undefined,
      defaultValue: supportsDefault ? coerceDefault() : field.defaultValue,
      options,
      referenceCollectionSlug: isReference ? referenceSlug : field.referenceCollectionSlug,
      referenceCollectionId: isReference ? (target?.id ?? null) : field.referenceCollectionId,
      config: hasConfig ? config : undefined,
    })
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isNew ? t('addFieldType', { type: meta?.label ?? "field" }) : t('editField')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{t('labelLabel')}</Label>
            <Input value={label} onChange={(e) => handleLabelChange(e.target.value)} placeholder={t('labelPlaceholder')} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{t('keyLabel')}</Label>
            <Input
              value={key}
              disabled={field.isSystem}
              onChange={(e) => { setKeyTouched(true); setKey(e.target.value) }}
              placeholder={t('keyPlaceholder')}
            />
            <p className="text-xs text-muted-foreground">{t('keyHelp')}</p>
          </div>

          {isReference && (
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{t('referencesCollection')}</Label>
              <Select value={referenceSlug} onValueChange={setReferenceSlug}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('chooseCollection')} />
                </SelectTrigger>
                <SelectContent>
                  {referenceTargets.length === 0 && (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">{t('createAnotherCollectionFirst')}</div>
                  )}
                  {referenceTargets.map((target) => (
                    <SelectItem key={target.id} value={target.slug}>{target.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {meta?.hasOptions && (
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{t('optionsLabel')}</Label>
              <textarea
                className="min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                value={optionsText}
                onChange={(e) => setOptionsText(e.target.value)}
                placeholder={"Option A\nOption B"}
              />
            </div>
          )}

          {isNumeric && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">{t('minLabel')}</Label>
                <Input type="number" value={minStr} onChange={(e) => setMinStr(e.target.value)} placeholder={t('nonePlaceholder')} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">{t('maxLabel')}</Label>
                <Input type="number" value={maxStr} onChange={(e) => setMaxStr(e.target.value)} placeholder={t('nonePlaceholder')} />
              </div>
            </div>
          )}

          {isTextual && (
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{t('maxLengthLabel')}</Label>
              <Input type="number" value={maxLengthStr} onChange={(e) => setMaxLengthStr(e.target.value)} placeholder={t('nonePlaceholder')} />
            </div>
          )}

          {supportsDefault && (
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{t('defaultValueLabel')}</Label>
              {field.type === "boolean" ? (
                <Select value={defaultValue || "false"} onValueChange={setDefaultValue}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">{t('off')}</SelectItem>
                    <SelectItem value="true">{t('on')}</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type={field.type === "number" ? "number" : "text"}
                  value={defaultValue}
                  onChange={(e) => setDefaultValue(e.target.value)}
                  placeholder={t('optionalPlaceholder')}
                />
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{t('helpTextLabel')}</Label>
            <Input value={helpText} onChange={(e) => setHelpText(e.target.value)} placeholder={t('helpTextPlaceholder')} />
          </div>

          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2.5">
            <div>
              <p className="text-sm font-medium">{t('requiredTitle')}</p>
              <p className="text-xs text-muted-foreground">{t('requiredDescription')}</p>
            </div>
            <Switch checked={required} onCheckedChange={setRequired} disabled={field.isSystem} />
          </div>

          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2.5">
            <div>
              <p className="text-sm font-medium">{t('uniqueTitle')}</p>
              <p className="text-xs text-muted-foreground">{t('uniqueDescription')}</p>
            </div>
            <Switch checked={unique} onCheckedChange={setUnique} disabled={field.isSystem} />
          </div>

          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2.5">
            <div>
              <p className="text-sm font-medium">{t('showInTableTitle')}</p>
              <p className="text-xs text-muted-foreground">{t('showInTableDescription')}</p>
            </div>
            <Switch checked={showInTable} onCheckedChange={setShowInTable} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t('cancel')}</Button>
          <Button onClick={handleSave}>{isNew ? t('addField') : t('saveChanges')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
