"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { notify } from "@/services/toast"
import { Upload, Loader2, FileSpreadsheet, CheckCircle2, AlertTriangle } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Label } from "@workspace/ui/components/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { parseCsv, isImportableField, type ParsedCsv } from "@/lib/cms/csv"
import { importItemsAction, type ImportResult } from "@/actions/cms/item-import-actions"
import type { CmsCollection } from "@/types/cms/cms.types"

interface CsvImportDialogProps {
  collection: CmsCollection
  projectId: string
}

type Step = "upload" | "map" | "result"

const NONE = "__none__"

function autoMatch(fieldKey: string, fieldLabel: string, headers: string[]): string {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "")
  const target = [norm(fieldKey), norm(fieldLabel)]
  const found = headers.find((h) => target.includes(norm(h)))
  return found ?? NONE
}

export function CsvImportDialog({ collection, projectId }: CsvImportDialogProps) {
  const t = useTranslations('cms.csvImport')
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>("upload")
  const [parsed, setParsed] = useState<ParsedCsv | null>(null)
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [slugColumn, setSlugColumn] = useState<string>(NONE)
  const [duplicateStrategy, setDuplicateStrategy] = useState<"skip" | "overwrite">("skip")
  const [status, setStatus] = useState<"draft" | "published">("draft")
  const [isImporting, setIsImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  const importableFields = collection.fields.filter(isImportableField)

  const reset = () => {
    setStep("upload")
    setParsed(null)
    setMapping({})
    setSlugColumn(NONE)
    setDuplicateStrategy("skip")
    setStatus("draft")
    setResult(null)
  }

  const handleFile = async (file: File) => {
    const text = await file.text()
    const data = parseCsv(text)
    if (!data.headers.length || !data.rows.length) {
      notify.error(t('toastNoRows'))
      return
    }
    setParsed(data)
    const initial: Record<string, string> = {}
    for (const field of importableFields) {
      initial[field.key] = autoMatch(field.key, field.label, data.headers)
    }
    setMapping(initial)
    setStep("map")
  }

  const runImport = async () => {
    if (!parsed) return
    const cleanMapping: Record<string, string> = {}
    for (const [key, header] of Object.entries(mapping)) {
      if (header && header !== NONE) cleanMapping[key] = header
    }
    if (!Object.keys(cleanMapping).length) {
      notify.error(t('toastMapField'))
      return
    }

    setIsImporting(true)
    try {
      const res = await importItemsAction({
        projectId,
        collectionId: collection.id,
        mapping: cleanMapping,
        rows: parsed.rows,
        duplicateStrategy,
        status,
        slugColumn: slugColumn === NONE ? undefined : slugColumn,
      })
      setResult(res)
      setStep("result")
      if (res.created || res.updated) router.refresh()
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset() }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="size-4" /> {t('importCsv')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('importTitle', { collectionName: collection.name })}</DialogTitle>
          <DialogDescription>
            {step === "upload" && t('stepUpload')}
            {step === "map" && t('stepMap', { rowCount: parsed?.rows.length ?? 0 })}
            {step === "result" && t('stepResult')}
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-input py-12 text-center hover:border-primary">
            <FileSpreadsheet className="size-8 text-muted-foreground" />
            <span className="text-sm font-medium">{t('chooseFile')}</span>
            <span className="text-xs text-muted-foreground">{t('dragAndDrop')}</span>
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />
          </label>
        )}

        {step === "map" && parsed && (
          <div className="space-y-4">
            <div className="max-h-64 space-y-2 overflow-y-auto pe-1">
              {importableFields.map((field) => (
                <div key={field.key} className="grid grid-cols-[1fr_1fr] items-center gap-2">
                  <Label className="flex items-center gap-1 text-sm">
                    {field.label}
                    {field.required && <span className="text-destructive">*</span>}
                  </Label>
                  <Select
                    value={mapping[field.key] ?? NONE}
                    onValueChange={(v) => setMapping((prev) => ({ ...prev, [field.key]: v }))}
                  >
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>{t('skip')}</SelectItem>
                      {parsed.headers.map((h) => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <div className="grid gap-3 border-t border-border pt-3">
              <div className="grid grid-cols-[1fr_1fr] items-center gap-2">
                <Label className="text-sm">{t('slugColumnLabel')}</Label>
                <Select value={slugColumn} onValueChange={setSlugColumn}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>{t('autoGenerate')}</SelectItem>
                    {parsed.headers.map((h) => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-[1fr_1fr] items-center gap-2">
                <Label className="text-sm">{t('onDuplicateLabel')}</Label>
                <Select value={duplicateStrategy} onValueChange={(v) => setDuplicateStrategy(v as "skip" | "overwrite")}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="skip">{t('duplicateSkip')}</SelectItem>
                    <SelectItem value="overwrite">{t('duplicateOverwrite')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-[1fr_1fr] items-center gap-2">
                <Label className="text-sm">{t('importAsLabel')}</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as "draft" | "published")}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">{t('statusDraft')}</SelectItem>
                    <SelectItem value="published">{t('statusPublished')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {step === "result" && result && (
          <div className="space-y-3 py-2">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="size-4 text-green-600" />
              <span>{t('resultSummary', { created: result.created, updated: result.updated, skipped: result.skipped })}</span>
            </div>
            {result.errors.length > 0 && (
              <div className="space-y-1 rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/40 dark:bg-amber-900/10">
                <div className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-300">
                  <AlertTriangle className="size-4" /> {t('errorCount', { count: result.errors.length })}
                </div>
                <ul className="max-h-32 overflow-y-auto text-xs text-muted-foreground">
                  {result.errors.slice(0, 20).map((err, i) => (
                    <li key={i}>{t('rowError', { row: err.row, message: err.message })}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {step === "map" && (
            <>
              <Button variant="outline" onClick={() => setStep("upload")}>{t('back')}</Button>
              <Button onClick={runImport} disabled={isImporting}>
                {isImporting && <Loader2 className="size-4 animate-spin" />}
                {t('importRows', { count: parsed?.rows.length ?? 0 })}
              </Button>
            </>
          )}
          {step === "result" && (
            <Button onClick={() => { setOpen(false); reset() }}>{t('done')}</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
