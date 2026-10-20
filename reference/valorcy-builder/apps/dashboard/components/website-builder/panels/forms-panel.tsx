'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ClipboardList, ExternalLink, Loader2, Plus, RefreshCw, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@workspace/ui/components/button'
import { Input } from '@workspace/ui/components/input'
import { Badge } from '@workspace/ui/components/badge'
import { Label } from '@workspace/ui/components/label'
import { ScrollArea } from '@workspace/ui/components/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select'
import { listForms, type FormSummary } from '@/actions/form-actions'
import { useBuilderStore } from '@/lib/builder/store'

export const FORM_EMBED_SECTION_ID = 'form-embed'

/** Loads the project's forms and reloads when the tab regains focus (forms are edited in /forms). */
function useProjectForms (projectId: string | null) {
  const [forms, setForms] = useState<FormSummary[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    try {
      setForms(await listForms(projectId))
      setError(false)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void load()
    const onVisible = () => {
      if (document.visibilityState === 'visible') void load()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [load])

  return { forms, loading, error, reload: load }
}

/** Builder left-rail "Forms" tab: the project's forms, insertable into the current page. */
export function FormsPanel ({ projectId }: { projectId: string }) {
  const { forms, loading, error, reload } = useProjectForms(projectId)
  const [q, setQ] = useState('')
  const sections = useBuilderStore((s) => s.sections)
  const selectedSectionId = useBuilderStore((s) => s.selectedSectionId)
  const addSection = useBuilderStore((s) => s.addSection)

  const usedFormIds = useMemo(
    () =>
      new Set(
        sections
          .filter((s) => s.sectionId === FORM_EMBED_SECTION_ID)
          .map((s) => String(s.props.formId ?? ''))
      ),
    [sections]
  )

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!forms) return []
    return needle ? forms.filter((f) => f.name.toLowerCase().includes(needle)) : forms
  }, [forms, q])

  function handleInsert (form: FormSummary) {
    const selectedIndex = sections.findIndex((s) => s.id === selectedSectionId)
    const inserted = addSection(
      FORM_EMBED_SECTION_ID,
      { formId: form.id, formName: form.name, headline: form.name },
      selectedIndex >= 0 ? selectedIndex + 1 : undefined
    )
    if (!inserted) {
      toast.error('Could not add the form to this page.')
      return
    }
    toast.success(`“${form.name}” added to the page.`)
    requestAnimationFrame(() => {
      document
        .querySelector(`[data-section-instance-id="${CSS.escape(inserted.id)}"]`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }

  return (
    <aside className="flex h-full min-h-0 w-full min-w-0 shrink-0 flex-col bg-background">
      <div className="space-y-2 border-b border-border p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold">Forms</p>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => void reload()}
              disabled={loading}
              aria-label="Refresh forms"
              title="Refresh forms"
            >
              <RefreshCw className={loading ? 'size-3.5 animate-spin' : 'size-3.5'} />
            </Button>
            <Button asChild type="button" variant="outline" size="sm" className="h-7 gap-1 px-2 text-xs">
              <a href={`/forms/new?project=${projectId}`} target="_blank" rel="noreferrer">
                <Plus className="size-3.5" />
                New
              </a>
            </Button>
          </div>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute start-2 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search forms…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="ps-8"
            aria-label="Search forms"
          />
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-2 p-3">
          {forms === null ? (
            error ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Could not load forms.</p>
            ) : (
              <div className="flex justify-center py-8 text-muted-foreground">
                <Loader2 className="size-5 animate-spin" aria-hidden />
              </div>
            )
          ) : forms.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border px-4 py-8 text-center">
              <ClipboardList className="size-7 text-muted-foreground/60" aria-hidden />
              <p className="text-sm font-medium">No forms yet</p>
              <p className="text-xs text-muted-foreground">
                Build a form with drag and drop, then add it to this page.
              </p>
              <Button asChild size="sm" className="mt-1">
                <a href={`/forms/new?project=${projectId}`} target="_blank" rel="noreferrer">
                  Create a form
                </a>
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No forms match “{q}”.</p>
          ) : (
            filtered.map((form) => (
              <div
                key={form.id}
                className="rounded-lg border border-border bg-card p-2.5 transition-colors hover:border-primary/40"
              >
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <ClipboardList className="size-3.5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{form.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {form.fieldCount} fields · {form.submissionCount} submissions
                    </p>
                  </div>
                  <a
                    href={`/forms/${form.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label={`Edit ${form.name}`}
                    title="Edit form"
                  >
                    <ExternalLink className="size-3.5" />
                  </a>
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  {form.status === 'disabled' ? (
                    <Badge variant="outline" className="h-5 px-1.5 text-[10px]">Disabled</Badge>
                  ) : null}
                  {usedFormIds.has(form.id) ? (
                    <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">On this page</Badge>
                  ) : null}
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="ms-auto h-7 gap-1 px-2 text-xs"
                    onClick={() => handleInsert(form)}
                  >
                    <Plus className="size-3.5" />
                    Add to page
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </aside>
  )
}

/** Content-panel control for a `form-embed` section: which form it shows. */
export function FormEmbedPicker ({ instanceId, formId }: { instanceId: string; formId: string }) {
  const projectId = useBuilderStore((s) => s.projectId)
  const updateSectionProps = useBuilderStore((s) => s.updateSectionProps)
  const { forms } = useProjectForms(projectId)

  const current = forms?.find((f) => f.id === formId)

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/40 p-3">
      <Label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <ClipboardList className="size-3.5" />
        Form
      </Label>
      <Select
        value={formId || undefined}
        onValueChange={(id) => {
          const form = forms?.find((f) => f.id === id)
          updateSectionProps(instanceId, { formId: id, formName: form?.name ?? '' })
        }}
        disabled={!forms}
      >
        <SelectTrigger className="h-8 text-xs">
          <SelectValue placeholder={forms ? 'Choose a form' : 'Loading forms…'} />
        </SelectTrigger>
        <SelectContent>
          {(forms ?? []).map((f) => (
            <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {forms && formId && !current ? (
        <p className="text-xs text-destructive">The selected form no longer exists.</p>
      ) : null}
      <div className="flex gap-2">
        {current ? (
          <Button asChild type="button" variant="outline" size="sm" className="h-7 gap-1.5 text-xs">
            <a href={`/forms/${current.id}`} target="_blank" rel="noreferrer">
              <ExternalLink className="size-3" />
              Edit form
            </a>
          </Button>
        ) : null}
        {projectId ? (
          <Button asChild type="button" variant="ghost" size="sm" className="h-7 gap-1.5 text-xs">
            <a href={`/forms/new?project=${projectId}`} target="_blank" rel="noreferrer">
              <Plus className="size-3" />
              New form
            </a>
          </Button>
        ) : null}
      </div>
    </div>
  )
}
