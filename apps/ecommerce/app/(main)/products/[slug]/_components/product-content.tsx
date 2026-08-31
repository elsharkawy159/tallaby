import { RichTextContent, isRichTextEmpty } from "@workspace/tiptap/content"

interface ProductContentProps {
  html: string | null | undefined
  dir?: "ltr" | "rtl"
}

export function ProductContent({ html, dir = "ltr" }: ProductContentProps) {
  if (isRichTextEmpty(html)) return null

  return (
    <section className="border-t border-gray-100 bg-white py-8 lg:py-12">
      <div className="container">
        <RichTextContent
          html={html}
          dir={dir}
          className="mx-auto max-w-4xl"
        />
      </div>
    </section>
  )
}
