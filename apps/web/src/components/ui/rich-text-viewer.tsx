import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

interface RichTextViewerProps {
  html?: string | null
  className?: string
}

export function RichTextViewer({ html, className }: RichTextViewerProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
    ],
    content: html || '',
    editable: false,
    editorProps: {
      attributes: {
        class: `prose prose-sm max-w-none text-sm p-0 ${className ?? ''}`,
      },
    },
  })

  if (!html) return null

  return (
    <div className="rounded-md border bg-background/50 p-3">
      <EditorContent editor={editor} />
    </div>
  )
}
