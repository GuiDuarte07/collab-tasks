export class ListTasksDto {
  page?: number;
  size?: number;
  status?: 'todo' | 'in_progress' | 'review' | 'done';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'deadline' | 'priority' | 'status';
  sortOrder?: 'ASC' | 'DESC';
}
