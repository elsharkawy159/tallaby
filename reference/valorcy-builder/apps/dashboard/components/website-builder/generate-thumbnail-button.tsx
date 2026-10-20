"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Camera, Loader2 } from "lucide-react"
import { Button } from "@workspace/ui/components/button"

export function GenerateThumbnailButton ({ templateId }: { templateId: string }) {
  const [loading, setLoading] = useState(false)

  async function run () {
    setLoading(true)
    try {
      const res = await fetch(`/api/templates/${templateId}/thumbnail`, { method: "POST" })
      const data = (await res.json()) as { ok: boolean; error?: string }
      if (!data.ok) throw new Error(data.error ?? "Screenshot failed")
      toast.success("Thumbnail updated")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't generate a thumbnail.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button type="button" variant="outline" size="icon" className="size-9" onClick={run} disabled={loading} aria-label="Generate thumbnail">
      {loading ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
    </Button>
  )
}
