export class ListTasksDto {
  page?: number;
  size?: number;
  status?: 'backlog' | 'todo' | 'in_progress' | 'done';
  priority?: 'low' | 'medium' | 'high';
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'deadline' | 'priority' | 'status';
  sortOrder?: 'ASC' | 'DESC';
}
