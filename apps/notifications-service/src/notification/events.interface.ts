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
  title: string;
  commentId: string;
  authorId: string;
  assignedUserIds: string[];
}
