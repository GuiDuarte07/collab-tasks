// @ts-nocheck
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/tasks')({
  component: () => <div>Lista de tarefas (em breve)</div>,
})
