// @ts-nocheck
import { createFileRoute } from '@tanstack/react-router'
import { TaskBoard } from '@/components/tasks/TaskBoard'

export const Route = createFileRoute('/_authenticated/board')({
  component: () => (
    <div>
      <h1 className="text-2xl font-bold mb-6">Board</h1>
      <TaskBoard />
    </div>
  ),
})
