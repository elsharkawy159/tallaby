import { cn } from "@workspace/ui/lib/utils"
import { sanitizeRichTextHtml, isRichTextEmpty } from "./sanitize-html"

interface RichTextContentProps {
  html: string | null | undefined
  className?: string
  dir?: "ltr" | "rtl"
}

export function RichTextContent({ html, className, dir }: RichTextContentProps) {
  if (isRichTextEmpty(html)) return null

  const sanitized = sanitizeRichTextHtml(html ?? "")

  return (
    <div
      className={cn("rich-text-content", className)}
      dir={dir}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  )
}

export { isRichTextEmpty, sanitizeRichTextHtml }
