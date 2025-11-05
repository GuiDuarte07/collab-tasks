// @ts-nocheck
import { createFileRoute } from '@tanstack/react-router';
import { TaskList } from '@/components/tasks/TaskList';

export const Route = createFileRoute('/_authenticated/tasks-list')({
  component: TaskListPage,
});

function TaskListPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Lista de Tarefas</h1>
      <TaskList />
    </div>
  );
}
