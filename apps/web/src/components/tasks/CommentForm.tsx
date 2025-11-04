import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useCreateComment } from '@/hooks/useComments'
import { RichTextEditor } from '@/components/ui/rich-text-editor'

interface CommentFormProps {
  taskId: string
}

export function CommentForm({ taskId }: CommentFormProps) {
  const { mutateAsync, isPending } = useCreateComment(taskId)
  const [error, setError] = useState<string | null>(null)
  const [content, setContent] = useState('')

  const handleSubmit = async () => {
    try {
      setError(null)
      if (!content || content.trim() === '' || content === '<p></p>') return
      await mutateAsync(content)
      setContent('')
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Erro ao enviar comentário')
    }
  }

  const isEmpty = !content || content.trim() === '' || content === '<p></p>'

  return (
    <div className="space-y-2">
      <RichTextEditor
        content={content}
        onChange={setContent}
        placeholder="Escreva um comentário..."
        minHeight="120px"
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={isPending || isEmpty}>
          {isPending ? 'Enviando...' : 'Comentar'}
        </Button>
      </div>
    </div>
  )
}
