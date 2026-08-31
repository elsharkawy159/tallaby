import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import { TextStyle } from "@tiptap/extension-text-style"
import { Color } from "@tiptap/extension-color"
import Highlight from "@tiptap/extension-highlight"
import Placeholder from "@tiptap/extension-placeholder"
import type { Extensions } from "@tiptap/react"

export function createRichTextExtensions(options?: {
  placeholder?: string
}): Extensions {
  return [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3],
      },
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: "text-primary underline underline-offset-2 hover:opacity-80",
        rel: "noopener noreferrer",
        target: "_blank",
      },
    }),
    Image.configure({
      inline: false,
      allowBase64: false,
      HTMLAttributes: {
        class: "rich-text-image",
      },
    }),
    Underline,
    TextAlign.configure({
      types: ["heading", "paragraph"],
    }),
    TextStyle,
    Color,
    Highlight.configure({
      multicolor: true,
    }),
    Placeholder.configure({
      placeholder: options?.placeholder ?? "Write product content...",
    }),
  ]
}
