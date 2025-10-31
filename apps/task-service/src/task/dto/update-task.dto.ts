import { TaskPriority, TaskStatus } from '../../entities/task.entity';

export class UpdateTaskDto {
  title?: string;
  description?: string | null;
  deadline?: Date | null;
  priority?: TaskPriority;
  status?: TaskStatus;
}
