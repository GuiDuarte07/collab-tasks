export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  DONE = 'DONE',
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  deadline: string | Date | null;
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: string | Date;
  updatedAt: string | Date;
}
