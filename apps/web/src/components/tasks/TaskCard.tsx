import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Task } from '@/types';
import { Calendar, User } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onClick: () => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const priorityColors = {
    LOW: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
    MEDIUM: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
    HIGH: 'bg-orange-100 text-orange-800 hover:bg-orange-100',
    URGENT: 'bg-red-100 text-red-800 hover:bg-red-100',
  };

  return (
    <Card 
      className="p-4 cursor-pointer hover:shadow-md transition-shadow mb-3"
      onClick={onClick}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium line-clamp-2 flex-1">{task.title}</h3>
          <Badge className={priorityColors[task.priority]}>
            {task.priority}
          </Badge>
        </div>
        
        {task.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {task.deadline && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(task.deadline).toLocaleDateString('pt-BR')}
            </div>
          )}
          
            {task.assignments && task.assignments.length > 0 && (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
                {task.assignments.length} {task.assignments.length === 1 ? 'pessoa' : 'pessoas'}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
