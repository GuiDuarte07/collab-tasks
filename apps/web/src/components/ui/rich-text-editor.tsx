import { useEditor, EditorContent, useEditorState } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Button } from '@/components/ui/button'
import {
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Pilcrow,
  List as ListBulleted,
  ListOrdered,
  Quote,
  Minus,
  Undo2,
  Redo2,
  RemoveFormatting,
} from 'lucide-react'
import { useEffect } from 'react'

interface RichTextEditorProps {
  content?: string
  onChange?: (html: string) => void
  placeholder?: string
  minHeight?: string
  maxHeight?: string
}

export function RichTextEditor({
  content = '',
  onChange,
  placeholder,
  minHeight = '160px',
  maxHeight = '400px',
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: `prose prose-sm max-w-none min-h-[${minHeight}] rounded-md border bg-background p-3 text-sm focus:outline-none focus-visible:ring-1 focus-visible:ring-ring`,
        'data-placeholder': placeholder || '',
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
  })

  const editorState = useEditorState({
    editor,
    selector: (ctx) => {
      if (!ctx.editor) return {}
      return {
        isBold: ctx.editor.isActive('bold'),
        canBold: ctx.editor.can().chain().focus().toggleBold().run(),
        isItalic: ctx.editor.isActive('italic'),
        canItalic: ctx.editor.can().chain().focus().toggleItalic().run(),
        isStrike: ctx.editor.isActive('strike'),
        canStrike: ctx.editor.can().chain().focus().toggleStrike().run(),
        isCode: ctx.editor.isActive('code'),
        canCode: ctx.editor.can().chain().focus().toggleCode().run(),
        isParagraph: ctx.editor.isActive('paragraph'),
        isH1: ctx.editor.isActive('heading', { level: 1 }),
        isH2: ctx.editor.isActive('heading', { level: 2 }),
        isH3: ctx.editor.isActive('heading', { level: 3 }),
        isBulletList: ctx.editor.isActive('bulletList'),
        isOrderedList: ctx.editor.isActive('orderedList'),
        isBlockquote: ctx.editor.isActive('blockquote'),
        canUndo: ctx.editor.can().chain().focus().undo().run(),
        canRedo: ctx.editor.can().chain().focus().redo().run(),
      }
    },
  })

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  if (!editor) return null

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 rounded-md border bg-muted/50 p-1">
        {/* Text style */}
        <Button
          type="button"
          variant={editorState?.isBold ? 'default' : 'outline'}
          size="sm"
          className="h-8 px-2"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editorState?.canBold}
          title="Negrito (Ctrl+B)"
        >
          <BoldIcon className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant={editorState?.isItalic ? 'default' : 'outline'}
          size="sm"
          className="h-8 px-2"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editorState?.canItalic}
          title="Itálico (Ctrl+I)"
        >
          <ItalicIcon className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant={editorState?.isStrike ? 'default' : 'outline'}
          size="sm"
          className="h-8 px-2"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editorState?.canStrike}
          title="Riscado"
        >
          <Strikethrough className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant={editorState?.isCode ? 'default' : 'outline'}
          size="sm"
          className="h-8 px-2"
          onClick={() => editor.chain().focus().toggleCode().run()}
          disabled={!editorState?.canCode}
          title="Código inline"
        >
          <Code className="h-4 w-4" />
        </Button>

        <div className="mx-1 h-5 w-px bg-border" />

        {/* Block types */}
        <Button
          type="button"
          variant={editorState?.isParagraph ? 'default' : 'outline'}
          size="sm"
          className="h-8 px-2"
          onClick={() => editor.chain().focus().setParagraph().run()}
          title="Parágrafo"
        >
          <Pilcrow className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant={editorState?.isH1 ? 'default' : 'outline'}
          size="sm"
          className="h-8 px-2"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          title="Título H1"
        >
          <Heading1 className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant={editorState?.isH2 ? 'default' : 'outline'}
          size="sm"
          className="h-8 px-2"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Título H2"
        >
          <Heading2 className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant={editorState?.isH3 ? 'default' : 'outline'}
          size="sm"
          className="h-8 px-2"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="Título H3"
        >
          <Heading3 className="h-4 w-4" />
        </Button>

        <div className="mx-1 h-5 w-px bg-border" />

        {/* Lists */}
        <Button
          type="button"
          variant={editorState?.isBulletList ? 'default' : 'outline'}
          size="sm"
          className="h-8 px-2"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Lista com marcadores"
        >
          <ListBulleted className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant={editorState?.isOrderedList ? 'default' : 'outline'}
          size="sm"
          className="h-8 px-2"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Lista numerada"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <div className="mx-1 h-5 w-px bg-border" />

        {/* Other blocks */}
        <Button
          type="button"
          variant={editorState?.isBlockquote ? 'default' : 'outline'}
          size="sm"
          className="h-8 px-2"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Citação"
        >
          <Quote className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 px-2"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Linha horizontal"
        >
          <Minus className="h-4 w-4" />
        </Button>

        <div className="mx-1 h-5 w-px bg-border" />

        {/* Clear formatting */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 px-2"
          onClick={() => editor.chain().focus().unsetAllMarks().run()}
          title="Limpar formatação"
        >
          <RemoveFormatting className="h-4 w-4" />
        </Button>

        <div className="mx-1 h-5 w-px bg-border" />

        {/* Undo/Redo */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 px-2"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editorState?.canUndo}
          title="Desfazer (Ctrl+Z)"
        >
          <Undo2 className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 px-2"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editorState?.canRedo}
          title="Refazer (Ctrl+Y)"
        >
          <Redo2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor */}
      <div 
        className="overflow-y-auto" 
        style={{ 
          minHeight: minHeight,
          maxHeight: maxHeight 
        }}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
