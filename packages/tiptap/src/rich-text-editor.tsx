"use client"



import { useEffect, useRef, useState, type ReactNode } from "react"

import { EditorContent, useEditor } from "@tiptap/react"

import {

  AlignCenter,

  AlignLeft,

  AlignRight,

  Bold,

  Heading1,

  Heading2,

  Heading3,

  Highlighter,

  ImageIcon,

  Italic,

  Link2,

  List,

  ListOrdered,

  Quote,

  Redo2,

  Underline as UnderlineIcon,

  Undo2,

} from "lucide-react"

import { Button } from "@workspace/ui/components/button"

import { cn } from "@workspace/ui/lib/utils"

import { createRichTextExtensions } from "./editor-extensions"



interface RichTextEditorProps {

  value?: string

  onChange?: (html: string) => void

  placeholder?: string

  className?: string

  dir?: "ltr" | "rtl"

  disabled?: boolean

  onImageUpload?: (file: File) => Promise<string | null>

}



function ToolbarButton({

  active,

  disabled,

  onClick,

  children,

  label,

}: {

  active?: boolean

  disabled?: boolean

  onClick: () => void

  children: ReactNode

  label: string

}) {

  return (

    <Button

      type="button"

      variant={active ? "default" : "ghost"}

      size="sm"

      className="h-8 w-8 p-0"

      disabled={disabled}

      onMouseDown={(event) => event.preventDefault()}

      onClick={onClick}

      aria-label={label}

      title={label}

    >

      {children}

    </Button>

  )

}



export function RichTextEditor({

  value = "",

  onChange,

  placeholder,

  className,

  dir = "ltr",

  disabled = false,

  onImageUpload,

}: RichTextEditorProps) {

  const imageInputRef = useRef<HTMLInputElement>(null)

  const [isUploadingImage, setIsUploadingImage] = useState(false)



  const editor = useEditor({

    immediatelyRender: false,

    extensions: createRichTextExtensions({ placeholder }),

    content: value,

    editable: !disabled,

    editorProps: {

      attributes: {

        class: "rich-text-editor-content",

        dir,

      },

    },

    onUpdate: ({ editor: currentEditor }) => {

      onChange?.(currentEditor.getHTML())

    },

  })



  useEffect(() => {

    if (!editor) return

    const current = editor.getHTML()

    if (value !== current) {

      editor.commands.setContent(value || "", { emitUpdate: false })

    }

  }, [editor, value])



  useEffect(() => {

    if (!editor) return

    editor.setEditable(!disabled)

  }, [editor, disabled])



  const handleSetLink = () => {

    if (!editor) return

    const previousUrl = editor.getAttributes("link").href as string | undefined

    const url = window.prompt("Link URL", previousUrl ?? "https://")

    if (url === null) return

    if (url === "") {

      editor.chain().focus().extendMarkRange("link").unsetLink().run()

      return

    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()

  }



  const insertImage = (src: string, alt?: string) => {

    if (!editor) return

    editor.chain().focus().setImage({ src, alt: alt ?? "" }).run()

  }



  const handleAddImageByUrl = () => {

    if (!editor) return

    const url = window.prompt("Image URL", "https://")

    if (!url?.trim()) return

    insertImage(url.trim())

  }



  const handleImageButtonClick = () => {

    if (onImageUpload) {

      imageInputRef.current?.click()

      return

    }

    handleAddImageByUrl()

  }



  const handleImageFileChange = async (

    event: React.ChangeEvent<HTMLInputElement>

  ) => {

    const file = event.target.files?.[0]

    event.target.value = ""



    if (!file || !editor || !onImageUpload) return



    setIsUploadingImage(true)

    try {

      const src = await onImageUpload(file)

      if (src) {

        insertImage(src, file.name)

      }

    } finally {

      setIsUploadingImage(false)

    }

  }



  if (!editor) return null



  return (

    <div

      className={cn(

        "rich-text-editor overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm",

        disabled && "opacity-60",

        className

      )}

    >

      <input

        ref={imageInputRef}

        type="file"

        accept="image/jpeg,image/png"

        className="hidden"

        onChange={handleImageFileChange}

      />



      <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 bg-gray-50/80 p-2">

        <ToolbarButton

          label="Heading 1"

          active={editor.isActive("heading", { level: 1 })}

          disabled={disabled}

          onClick={() =>

            editor.chain().focus().toggleHeading({ level: 1 }).run()

          }

        >

          <Heading1 className="h-4 w-4" />

        </ToolbarButton>

        <ToolbarButton

          label="Heading 2"

          active={editor.isActive("heading", { level: 2 })}

          disabled={disabled}

          onClick={() =>

            editor.chain().focus().toggleHeading({ level: 2 }).run()

          }

        >

          <Heading2 className="h-4 w-4" />

        </ToolbarButton>

        <ToolbarButton

          label="Heading 3"

          active={editor.isActive("heading", { level: 3 })}

          disabled={disabled}

          onClick={() =>

            editor.chain().focus().toggleHeading({ level: 3 }).run()

          }

        >

          <Heading3 className="h-4 w-4" />

        </ToolbarButton>



        <div className="mx-1 h-6 w-px bg-gray-200" />



        <ToolbarButton

          label="Bold"

          active={editor.isActive("bold")}

          disabled={disabled}

          onClick={() => editor.chain().focus().toggleBold().run()}

        >

          <Bold className="h-4 w-4" />

        </ToolbarButton>

        <ToolbarButton

          label="Italic"

          active={editor.isActive("italic")}

          disabled={disabled}

          onClick={() => editor.chain().focus().toggleItalic().run()}

        >

          <Italic className="h-4 w-4" />

        </ToolbarButton>

        <ToolbarButton

          label="Underline"

          active={editor.isActive("underline")}

          disabled={disabled}

          onClick={() => editor.chain().focus().toggleUnderline().run()}

        >

          <UnderlineIcon className="h-4 w-4" />

        </ToolbarButton>

        <ToolbarButton

          label="Highlight"

          active={editor.isActive("highlight")}

          disabled={disabled}

          onClick={() => editor.chain().focus().toggleHighlight().run()}

        >

          <Highlighter className="h-4 w-4" />

        </ToolbarButton>



        <div className="mx-1 h-6 w-px bg-gray-200" />



        <ToolbarButton

          label="Bullet list"

          active={editor.isActive("bulletList")}

          disabled={disabled}

          onClick={() => editor.chain().focus().toggleBulletList().run()}

        >

          <List className="h-4 w-4" />

        </ToolbarButton>

        <ToolbarButton

          label="Numbered list"

          active={editor.isActive("orderedList")}

          disabled={disabled}

          onClick={() => editor.chain().focus().toggleOrderedList().run()}

        >

          <ListOrdered className="h-4 w-4" />

        </ToolbarButton>

        <ToolbarButton

          label="Quote"

          active={editor.isActive("blockquote")}

          disabled={disabled}

          onClick={() => editor.chain().focus().toggleBlockquote().run()}

        >

          <Quote className="h-4 w-4" />

        </ToolbarButton>

        <ToolbarButton

          label="Link"

          active={editor.isActive("link")}

          disabled={disabled}

          onClick={handleSetLink}

        >

          <Link2 className="h-4 w-4" />

        </ToolbarButton>

        <ToolbarButton

          label="Image"

          disabled={disabled || isUploadingImage}

          onClick={handleImageButtonClick}

        >

          <ImageIcon className="h-4 w-4" />

        </ToolbarButton>



        <div className="mx-1 h-6 w-px bg-gray-200" />



        <ToolbarButton

          label="Align left"

          active={editor.isActive({ textAlign: "left" })}

          disabled={disabled}

          onClick={() => editor.chain().focus().setTextAlign("left").run()}

        >

          <AlignLeft className="h-4 w-4" />

        </ToolbarButton>

        <ToolbarButton

          label="Align center"

          active={editor.isActive({ textAlign: "center" })}

          disabled={disabled}

          onClick={() => editor.chain().focus().setTextAlign("center").run()}

        >

          <AlignCenter className="h-4 w-4" />

        </ToolbarButton>

        <ToolbarButton

          label="Align right"

          active={editor.isActive({ textAlign: "right" })}

          disabled={disabled}

          onClick={() => editor.chain().focus().setTextAlign("right").run()}

        >

          <AlignRight className="h-4 w-4" />

        </ToolbarButton>



        <ToolbarButton

          label="Primary color"

          disabled={disabled}

          onClick={() =>

            editor.chain().focus().setColor("var(--primary)").run()

          }

        >

          <span className="h-3 w-3 rounded-full bg-primary" />

        </ToolbarButton>



        <div className="mx-1 h-6 w-px bg-gray-200" />



        <ToolbarButton

          label="Undo"

          disabled={disabled || !editor.can().undo()}

          onClick={() => editor.chain().focus().undo().run()}

        >

          <Undo2 className="h-4 w-4" />

        </ToolbarButton>

        <ToolbarButton

          label="Redo"

          disabled={disabled || !editor.can().redo()}

          onClick={() => editor.chain().focus().redo().run()}

        >

          <Redo2 className="h-4 w-4" />

        </ToolbarButton>

      </div>



      <EditorContent editor={editor} />

    </div>

  )

}


