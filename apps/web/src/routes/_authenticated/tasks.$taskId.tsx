// @ts-nocheck
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTask } from '@/hooks/useTasks'
import { TaskDetail } from '@/components/tasks/TaskDetail'
import { useEffect } from 'react'

export const Route = createFileRoute('/_authenticated/tasks/$taskId')({
  component: TaskDetailPage,
})

function TaskDetailPage() {
  const { taskId } = Route.useParams()
  const navigate = useNavigate()
  const { data: task, isLoading, error } = useTask(taskId)

  useEffect(() => {
    if (!isLoading && (error || !task)) {
      navigate({ to: '/board' })
    }
  }, [isLoading, error, task, navigate])

  const handleClose = () => {
    navigate({ to: '/board' })
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!task) {
    return null
  }

  return <TaskDetail task={task} open={true} onClose={handleClose} />
}
