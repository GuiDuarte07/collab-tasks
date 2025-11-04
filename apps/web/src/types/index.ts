// API Types
export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export type TaskStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  deadline: string | null;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
  assignments?: TaskAssignment[];
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  taskId: string;
  type: "TASK_CREATED" | "TASK_UPDATED" | "COMMENT_NEW" | "ASSIGNMENT_ADDED";
  message: string;
  read: boolean;
  createdAt: string;
}

// WebSocket Events
export interface TaskCreatedEvent {
  taskId: string;
  title: string;
  creatorId: string;
  assignedUserIds: string[];
}

export interface TaskUpdatedEvent {
  taskId: string;
  title: string;
  updatedBy: string;
  assignedUserIds: string[];
  newlyAddedUserIds: string[];
}

export interface CommentCreatedEvent {
  taskId: string;
  commentId: string;
  authorId: string;
  assignedUserIds: string[];
}

export interface TaskAssignment {
  id: string;
  taskId: string;
  userId: string;
  role: string;
  assignedAt: string;
  // Preenchidos depois
  name: string;
  username: string;
  email: string;
}
