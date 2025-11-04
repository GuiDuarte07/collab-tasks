import { useState, useMemo } from 'react'
import { useComments } from '@/hooks/useComments'
import { Button } from '@/components/ui/button'

interface CommentListProps {
  taskId: string
  pageSize?: number
}

export function CommentList({ taskId, pageSize = 10 }: CommentListProps) {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError } = useComments(taskId, page, pageSize)

  const totalPages = useMemo(() => {
    if (!data) return 1
    return Math.max(1, Math.ceil(data.total / data.size))
  }, [data])

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="h-4 w-48 animate-pulse rounded bg-muted" />
        <div className="h-20 w-full animate-pulse rounded bg-muted" />
        <div className="h-20 w-full animate-pulse rounded bg-muted" />
      </div>
    )
  }

  if (isError) {
    return <p className="text-sm text-destructive">Erro ao carregar comentários.</p>
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-4">
        {data?.data?.length === 0 && (
          <li className="text-sm text-muted-foreground">Sem comentários ainda.</li>
        )}
        {data?.data?.map((comment) => (
          <li key={comment.id} className="rounded-md border p-3">
            <div className="mb-2 text-xs text-muted-foreground">
              {new Date(comment.createdAt).toLocaleString('pt-BR')}
            </div>
            <div className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: comment.content }} />
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-muted-foreground">
          Página {data?.page} de {totalPages}
        </span>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Próxima
          </Button>
        </div>
      </div>
    </div>
  )
}
