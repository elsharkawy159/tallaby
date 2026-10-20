"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Languages, Loader2 } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { addProjectLanguage } from "@/actions/project-language-actions"
import { translateWebsiteToLocale } from "@/actions/translation-actions"

/**
 * Adds Arabic to the template source's supported locales (if not already
 * present) and fills every section's `translations.ar` overlay via the
 * existing AI translator — the same mechanism a regular user's project
 * settings page uses. Publishing (`snapshotWebsiteToTemplate`) checks
 * coverage is 100% before allowing an `ar`-flagged template to publish.
 */
export function TranslateToArabicButton ({ projectId }: { projectId: string }) {
  const [loading, setLoading] = useState(false)

  async function run () {
    setLoading(true)
    try {
      await addProjectLanguage(projectId, "ar")
      const progress = await translateWebsiteToLocale(projectId, "ar")
      toast.success(`Arabic translation ${progress.percent}% complete`, {
        description: progress.missing > 0 ? `${progress.missing} field(s) still need review.` : undefined,
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Translation failed.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button type="button" variant="outline" size="icon" className="size-9" onClick={run} disabled={loading} aria-label="Translate to Arabic">
      {loading ? <Loader2 className="size-4 animate-spin" /> : <Languages className="size-4" />}
    </Button>
  )
}
