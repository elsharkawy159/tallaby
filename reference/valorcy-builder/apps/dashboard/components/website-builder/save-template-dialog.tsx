"use client"

import { useCallback, useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import {
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  LayoutTemplate,
  Loader2,
  Settings2,
} from "lucide-react"
import { notify } from "@/services/toast"

import { Button } from "@workspace/ui/components/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Textarea } from "@workspace/ui/components/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"

import { saveTemplateFromBuilder } from "@/actions/template-actions"
import { flushBuilderAutosave } from "@/components/website-builder/use-builder-autosave"
import {
  TemplateCard,
  type TemplateCardData,
  type TemplateCardPreview,
} from "@/components/templates/template-card"
import { TemplateThumbnailUploader } from "@/components/website-builder/template-thumbnail-uploader"
import { sectionRegistry } from "@/components/sections"
import type { SectionInstance } from "@/components/sections/registry.types"
import { useBuilderStore } from "@/lib/builder/store"
import { slugify } from "@/lib/builder/slugify"
import { INDUSTRY_GROUPS, type IndustryValue } from "@/lib/constants/industries"
import { TEMPLATE_CATEGORIES } from "@/lib/constants/template-categories"

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "valorcy.com"

type Props = {
  locale: string
  projectId: string
  defaultIndustry?: string | null
  triggerClassName?: string
  iconOnly?: boolean
}

/** Prefer the homepage hero; otherwise the first non-navbar section. */
function pickPreviewSection(
  sections: SectionInstance[]
): SectionInstance | null {
  const isNavbar = (s: SectionInstance) =>
    s.sectionId.startsWith("navbar-") ||
    sectionRegistry.get(s.sectionId)?.category === "navbar"
  const isHero = (s: SectionInstance) =>
    s.sectionId.startsWith("hero-") ||
    sectionRegistry.get(s.sectionId)?.category === "hero"
  return sections.find(isHero) ?? sections.find((s) => !isNavbar(s)) ?? null
}

export function SaveTemplateDialog({
  locale,
  projectId,
  defaultIndustry,
  triggerClassName,
  iconOnly = false,
}: Props) {
  const t = useTranslations('dialogs.saveTemplate')
  const [open, setOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [savedSlug, setSavedSlug] = useState<string | null>(null)

  const pageId = useBuilderStore((s) => s.pageId)
  const projectName = useBuilderStore((s) => s.projectName)
  const sections = useBuilderStore((s) => s.sections)
  const designSystem = useBuilderStore((s) => s.designSystem)
  const elementStyles = useBuilderStore((s) => s.elementStyles)
  const elementAttributes = useBuilderStore((s) => s.elementAttributes)
  const projectLogoUrl = useBuilderStore((s) => s.projectLogoUrl)
  const defaultLocale = useBuilderStore((s) => s.defaultLocale)
  const supportedLocales = useBuilderStore((s) => s.supportedLocales)

  const [name, setName] = useState(projectName || t('defaultName'))
  const [description, setDescription] = useState("")
  const [industry, setIndustry] = useState(defaultIndustry || "saas")
  const [category, setCategory] = useState("single_page")
  const [tags, setTags] = useState("")
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState("")
  const [priceDollars, setPriceDollars] = useState("0")
  const [currency, setCurrency] = useState("USD")
  const [publish, setPublish] = useState(true)

  const slug = useMemo(() => slugify(name || "my-template"), [name])
  const priceCents = useMemo(() => {
    const n = Number.parseFloat(priceDollars.replace(/,/g, ""))
    if (Number.isNaN(n) || n < 0) return 0
    return Math.round(n * 100)
  }, [priceDollars])
  const tagList = useMemo(
    () =>
      tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    [tags]
  )

  const heroPreview = useMemo<TemplateCardPreview | null>(() => {
    const section = pickPreviewSection(sections)
    if (!section) return null
    return {
      section,
      designSystem,
      elementStyles,
      elementAttributes,
      projectLogoUrl,
      projectName,
      defaultLocale,
      supportedLocales,
    }
  }, [
    sections,
    designSystem,
    elementStyles,
    elementAttributes,
    projectLogoUrl,
    projectName,
    defaultLocale,
    supportedLocales,
  ])

  const cardData = useMemo<TemplateCardData>(
    () => ({
      name: { [locale]: name || t('defaultUntitled') },
      description: description ? { [locale]: description } : null,
      thumbnailUrl,
      industry,
      category,
      tags: tagList,
      isFeatured: false,
      isPremium: priceCents > 0,
    }),
    [
      locale,
      name,
      description,
      thumbnailUrl,
      industry,
      category,
      tagList,
      priceCents,
    ]
  )

  const resetForm = useCallback(() => {
    setName(projectName || t('defaultName'))
    setDescription("")
    setIndustry(defaultIndustry || "saas")
    setCategory("single_page")
    setTags("")
    setThumbnailUrl(null)
    setPreviewUrl("")
    setPriceDollars("0")
    setCurrency("USD")
    setPublish(true)
    setAdvancedOpen(false)
    setSavedSlug(null)
  }, [projectName, defaultIndustry, t])

  const handleOpenChange = useCallback(
    (next: boolean) => {
      setOpen(next)
      if (next) resetForm()
    },
    [resetForm]
  )

  const publicUrl = savedSlug
    ? `https://${ROOT_DOMAIN}/templates/${savedSlug}`
    : ""

  async function handleSave() {
    if (!pageId) {
      notify.error(t('toastNoPage'))
      return
    }
    const trimmedName = name.trim()
    if (!trimmedName) {
      notify.error(t('toastNameRequired'))
      return
    }

    setIsSaving(true)
    try {
      const flushed = await flushBuilderAutosave()
      if (!flushed) {
        notify.error(t('toastSavePageFirst'))
        return
      }

      const result = await saveTemplateFromBuilder({
        projectId,
        pageId,
        name: { [locale]: trimmedName, en: trimmedName },
        description: description.trim()
          ? { [locale]: description.trim(), en: description.trim() }
          : undefined,
        industry: industry as IndustryValue,
        category: category as "single_page",
        tags: tagList,
        thumbnailUrl,
        previewUrl: previewUrl.trim() || null,
        priceCents,
        currency,
        publishToMarketplace: publish,
      })

      setSavedSlug(result.slug)
      notify.success(t('toastSaved'))
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('toastSaveFailed')
      notify.error(msg)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(publicUrl)
      notify.success(t('toastUrlCopied'))
    } catch {
      notify.error(t('toastCopyFailed'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {iconOnly ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn("size-9 shrink-0", triggerClassName)}
              >
                <LayoutTemplate className="size-4" />
                <span className="sr-only">{t('trigger')}</span>
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {t('trigger')}
          </TooltipContent>
        </Tooltip>
      ) : (
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={triggerClassName}
          >
            <LayoutTemplate className="me-1.5 size-3.5" />
            {t('trigger')}
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-6xl">
        {savedSlug ? (
          <SuccessView
            publicUrl={publicUrl}
            onCopy={handleCopy}
            onBackToEditor={() => setOpen(false)}
          />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{t('title')}</DialogTitle>
              <DialogDescription>
                {t('description')}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 py-2 md:grid-cols-2">
              {/* Form */}
              <div className="grid content-start gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="tps-name">{t('nameLabel')}</Label>
                  <Input
                    id="tps-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    {t('urlPrefix', { domain: ROOT_DOMAIN })}
                    <span className="font-medium text-foreground">{slug}</span>
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="tps-desc">{t('descriptionLabel')}</Label>
                  <Textarea
                    id="tps-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label>{t('industryLabel')}</Label>
                    <Select value={industry} onValueChange={setIndustry}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('selectIndustry')} />
                      </SelectTrigger>
                      <SelectContent>
                        {INDUSTRY_GROUPS.map((group) => (
                          <SelectGroup key={group.label}>
                            <SelectLabel>{group.label}</SelectLabel>
                            {group.options.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>{t('categoryLabel')}</Label>
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

                <div className="grid gap-2">
                  <Label htmlFor="tps-tags">{t('tagsLabel')}</Label>
                  <Input
                    id="tps-tags"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder={t('tagsPlaceholder')}
                  />
                </div>

                <div className="grid gap-2">
                  <Label>{t('thumbnailLabel')}</Label>
                  <TemplateThumbnailUploader
                    projectId={projectId}
                    value={thumbnailUrl}
                    onChange={setThumbnailUrl}
                    disabled={isSaving}
                  />
                </div>

                <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
                  <CollapsibleTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-full justify-between px-2 text-xs text-muted-foreground"
                    >
                      <span className="flex items-center gap-1.5">
                        <Settings2 className="size-3.5" />
                        {t('advancedSettings')}
                      </span>
                      <ChevronDown
                        className={cn(
                          "size-3.5 transition-transform",
                          advancedOpen && "rotate-180"
                        )}
                      />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="grid gap-4 pt-3">
                    <div className="grid gap-2">
                      <Label htmlFor="tps-preview">
                        {t('previewUrlLabel')}
                      </Label>
                      <Input
                        id="tps-preview"
                        value={previewUrl}
                        onChange={(e) => setPreviewUrl(e.target.value)}
                        placeholder="https://…"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-2">
                        <Label htmlFor="tps-price">{t('priceLabel')}</Label>
                        <Input
                          id="tps-price"
                          type="number"
                          min={0}
                          step="0.01"
                          value={priceDollars}
                          onChange={(e) => setPriceDollars(e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>{t('currencyLabel')}</Label>
                        <Select value={currency} onValueChange={setCurrency}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={publish}
                        onChange={(e) => setPublish(e.target.checked)}
                        className="size-4 rounded border"
                      />
                      {t('publishToMarketplace')}
                    </label>
                  </CollapsibleContent>
                </Collapsible>
              </div>

              {/* Live preview */}
              <div className="md:sticky md:top-0 md:self-start">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  {t('livePreview')}
                </p>
                <TemplateCard
                  data={cardData}
                  locale={locale}
                  heroPreview={heroPreview}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSaving}
              >
                {t('cancel')}
              </Button>
              <Button
                type="button"
                onClick={() => void handleSave()}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="me-2 size-4 animate-spin" />
                    {t('saving')}
                  </>
                ) : (
                  t('saveTemplateAction')
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function SuccessView({
  publicUrl,
  onCopy,
  onBackToEditor,
}: {
  publicUrl: string
  onCopy: () => void
  onBackToEditor: () => void
}) {
  const t = useTranslations('dialogs.saveTemplate')
  return (
    <div className="flex flex-col items-center gap-5 py-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
        <Check className="size-7 text-primary" />
      </div>
      <div className="space-y-1">
        <DialogTitle className="text-xl">
          {t('savedTitle')}
        </DialogTitle>
        <DialogDescription>
          {t('savedDescription')}
        </DialogDescription>
      </div>

      <div className="flex w-full max-w-md items-center gap-2 rounded-lg border bg-muted/30 p-2">
        <span className="flex-1 truncate px-1 text-start text-sm text-muted-foreground">
          {publicUrl}
        </span>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="gap-1.5"
          onClick={onCopy}
        >
          <Copy className="size-3.5" />
          {t('copy')}
        </Button>
      </div>

      <div className="flex w-full max-w-md flex-col gap-2 sm:flex-row">
        <Button asChild className="flex-1 gap-1.5">
          <a href={publicUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="size-4" />
            {t('openTemplate')}
          </a>
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={onBackToEditor}
        >
          {t('backToEditor')}
        </Button>
      </div>
    </div>
  )
}
