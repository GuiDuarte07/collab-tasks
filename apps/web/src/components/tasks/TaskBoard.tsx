import { useState } from 'react';
import { TaskCard } from './TaskCard';
import { Button } from '@/components/ui/button';
import { TaskCreateDialog } from './TaskCreateDialog';
import { TaskDetail } from './TaskDetail.tsx';
import { useTasks } from '@/hooks/useTasks.ts';
import type { Task, TaskStatus } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { getStatusLabel } from '@/lib/task-utils';

const COLUMNS: { status: TaskStatus; color: string }[] = [
  { status: 'TODO', color: 'bg-gray-100' },
  { status: 'IN_PROGRESS', color: 'bg-blue-100' },
  { status: 'REVIEW', color: 'bg-yellow-100' },
  { status: 'DONE', color: 'bg-green-100' },
];

export function TaskBoard() {
  const { data: tasks, isLoading } = useTasks();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [openCreate, setOpenCreate] = useState(false);

  console.log('Tasks:', tasks); 

  const getTasksByStatus = (status: TaskStatus) => {
  return tasks?.filter((task: Task) => task.status === status) || [];
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {COLUMNS.map((column) => (
          <div key={column.status} className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Board</h1>
        <Button onClick={() => setOpenCreate(true)}>Nova tarefa</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {COLUMNS.map((column) => {
          const columnTasks = getTasksByStatus(column.status);
          
          return (
            <div key={column.status} className="flex flex-col">
              <div className={`${column.color} rounded-lg p-3 mb-3`}>
                <h2 className="font-semibold text-sm flex items-center justify-between">
                  {getStatusLabel(column.status)}
                  <span className="text-xs bg-white px-2 py-1 rounded-full">
                    {columnTasks.length}
                  </span>
                </h2>
              </div>
              
              <div className="flex-1 space-y-2">
                {columnTasks.map((task: Task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onClick={() => setSelectedTask(task)}
                  />
                ))}
                
                {columnTasks.length === 0 && (
                  <div className="text-center text-sm text-muted-foreground py-8">
                    Nenhuma tarefa
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedTask && (
        <TaskDetail
          task={selectedTask}
          open={!!selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}

      <TaskCreateDialog open={openCreate} onOpenChange={setOpenCreate} />
    </>
  );
}
