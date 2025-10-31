import { TaskPriority, TaskStatus } from '../../entities/task.entity';

export class CreateTaskDto {
  title!: string;
  description?: string;
  deadline?: Date;
  priority?: TaskPriority;
  status?: TaskStatus;
  assignments?: Array<{ userId: string; role: string }>;
}
