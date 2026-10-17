"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { snapshotWebsiteToTemplate, type SnapshotWebsiteToTemplateInput } from "@/actions/template-studio-actions"
import type { TemplateValidationIssue } from "@/lib/ai/validate-template"
import { flushBuilderAutosave } from "@/components/website-builder/use-builder-autosave"
import { INDUSTRY_GROUPS } from "@/lib/constants/industries"
import { TEMPLATE_CATEGORIES } from "@/lib/constants/template-categories"
import { slugify } from "@/lib/builder/slugify"

type Props = {
  websiteId: string
  templateId: string | null
  projectName: string
  defaultIndustry?: string | null
}

export function PublishTemplateVersionButton ({ websiteId, templateId, projectName, defaultIndustry }: Props) {
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState(projectName)
  const [slug, setSlug] = useState(slugify(projectName))
  const [industry, setIndustry] = useState(defaultIndustry || "saas")
  const [category, setCategory] = useState("single_page")
  const [blockingIssues, setBlockingIssues] = useState<TemplateValidationIssue[] | null>(null)

  async function publish (create?: SnapshotWebsiteToTemplateInput["create"]) {
    setLoading(true)
    setBlockingIssues(null)
    try {
      await flushBuilderAutosave()
      const result = await snapshotWebsiteToTemplate(websiteId, create ? { create } : {})
      if (!result.ok) {
        setBlockingIssues(result.issues.filter((i) => i.level === "error"))
        toast.error("Fix validation errors before publishing")
        return
      }
      const warnings = result.issues.filter((i) => i.level === "warning").length
      toast.success(
        `Template version ${result.version} published — quality score ${result.qualityScore}/100${warnings ? ` (${warnings} warning${warnings === 1 ? "" : "s"})` : ""}`
      )
      setCreateOpen(false)
      if (!templateId) window.location.reload()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't publish this template version.")
    } finally {
      setLoading(false)
    }
  }

  function handleClick () {
    if (templateId) {
      void publish()
      return
    }
    setCreateOpen(true)
  }

  return (
    <>
      <Button type="button" variant="default" size="sm" className="h-9 shrink-0 px-3" onClick={handleClick} disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="me-1.5 size-4 animate-spin" />
            <span className="hidden sm:inline">Publishing…</span>
          </>
        ) : templateId ? (
          "Publish template version"
        ) : (
          "Publish as template"
        )}
      </Button>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish as a new template</DialogTitle>
            <DialogDescription>
              This creates the template record and its first published version from what&apos;s
              currently in the editor.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-2">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Slug</Label>
              <Input value={slug} onChange={(e) => setSlug(slugify(e.target.value))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Industry</Label>
                <Select value={industry} onValueChange={setIndustry}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRY_GROUPS.map((group) => (
                      <SelectGroup key={group.label}>
                        <SelectLabel>{group.label}</SelectLabel>
                        {group.options.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                void publish({
                  slug,
                  name: { en: name },
                  industry,
                  category,
                })
              }
              disabled={loading || !name.trim() || !slug.trim()}
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : "Publish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={blockingIssues !== null} onOpenChange={(open) => !open && setBlockingIssues(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fix these before publishing</DialogTitle>
            <DialogDescription>
              Publishing is blocked until every error below is resolved. Warnings don&apos;t block
              publishing but are worth a look.
            </DialogDescription>
          </DialogHeader>
          <ul className="flex max-h-80 flex-col gap-2 overflow-y-auto py-2 text-sm">
            {blockingIssues?.map((issue, i) => (
              <li key={i} className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2">
                {issue.pageSlug ? <span className="font-mono text-xs text-muted-foreground">/{issue.pageSlug} — </span> : null}
                {issue.message}
              </li>
            ))}
          </ul>
          <DialogFooter>
            <Button onClick={() => setBlockingIssues(null)}>Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
