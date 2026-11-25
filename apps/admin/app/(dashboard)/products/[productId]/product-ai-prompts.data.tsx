import { Badge } from "@workspace/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import type { ProductAiPromptRow } from "@workspace/lib/products/ai-prompts/server";
import { Sparkles } from "lucide-react";

/**
 * "AI prompt" card on Admin › Products › <product> (0181): what the seller (or
 * an admin for the store) typed for each AI fill saved into this product.
 * Rendered as plain text (React escapes it), never as HTML. `prompts` is null
 * when they could not be read (0181 not applied).
 */

const CAIRO_DATE_TIME = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Africa/Cairo",
  dateStyle: "medium",
  timeStyle: "short",
});

const NOT_RECORDED = "Prompt not recorded (products made before 2026-11-26 or by a file import)";

export function ProductAiPromptsCard({ prompts }: { prompts: ProductAiPromptRow[] | null }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-600" />
          AI prompt
        </CardTitle>
        <CardDescription>What was typed for the AI fill. Photos and PDFs are not kept, only counted.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!prompts?.length ? (
          <p className="text-sm text-muted-foreground">{NOT_RECORDED}</p>
        ) : (
          prompts.map((prompt) => (
            <div key={prompt.id} className="space-y-2 rounded-md border p-3">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-200">
                  {prompt.mode === "edit" ? "Edited with AI" : "Added with AI"}
                </Badge>
                {prompt.source === "admin" && <Badge variant="secondary">By a Tallaby admin</Badge>}
                <span className="text-muted-foreground">{CAIRO_DATE_TIME.format(new Date(prompt.createdAt))} (Cairo)</span>
                <span className="text-muted-foreground">
                  · {prompt.imageCount} {prompt.imageCount === 1 ? "photo" : "photos"} · PDF: {prompt.hasPdf ? "yes" : "no"}
                </span>
                {prompt.cached && <span className="text-muted-foreground">· from cache (no new model call)</span>}
              </div>
              {prompt.promptText ? (
                <pre dir="auto" className="whitespace-pre-wrap break-words rounded bg-muted p-3 font-sans text-sm">
                  {prompt.promptText}
                </pre>
              ) : (
                <p className="text-sm text-muted-foreground">No text (photos or a PDF only).</p>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
