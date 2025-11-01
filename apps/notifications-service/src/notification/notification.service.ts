import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity } from '../entities/notification.entity';
import type {
  TaskCreatedEvent,
  TaskUpdatedEvent,
  CommentCreatedEvent,
} from './events.interface';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationRepo: Repository<NotificationEntity>,
  ) {}

  async handleTaskCreated(event: TaskCreatedEvent): Promise<void> {
    this.logger.log(
      `Processando notification.task.create: taskId=${event.taskId}, assignedUsers=${event.assignedUserIds.length}`,
    );

    console.log(event);

    const notifications = event.assignedUserIds
      .filter((userId) => userId !== event.creatorId)
      .map((userId) =>
        this.notificationRepo.create({
          userId,
          taskId: event.taskId,
          type: 'TASK_CREATED',
          message: `Nova tarefa criada: "${event.title}"`,
          read: false,
        }),
      );

    if (notifications.length > 0) {
      await this.notificationRepo.insert(notifications);
      this.logger.log(
        `${notifications.length} notificação(ões) criada(s) para task.create`,
      );
    }
  }

  async handleTaskUpdated(event: TaskUpdatedEvent): Promise<void> {
    this.logger.log(
      `Processando notification.task.update: taskId=${event.taskId}, assignedUsers=${event.assignedUserIds.length}, newUsers=${event.newlyAddedUserIds.length}`,
    );

    const notifications: NotificationEntity[] = [];

    // Notificar todos os usuários atribuídos (exceto quem atualizou)
    const updateNotifications = event.assignedUserIds
      .filter((userId) => userId !== event.updatedBy)
      .map((userId) =>
        this.notificationRepo.create({
          userId,
          taskId: event.taskId,
          type: 'TASK_UPDATED',
          message: `Tarefa atualizada: "${event.title}"`,
          read: false,
        }),
      );
    notifications.push(...updateNotifications);

    // Notificar novos usuários adicionados com mensagem específica
    const assignmentNotifications = event.newlyAddedUserIds.map((userId) =>
      this.notificationRepo.create({
        userId,
        taskId: event.taskId,
        type: 'ASSIGNMENT_ADDED',
        message: `Você foi adicionado à tarefa: "${event.title}"`,
        read: false,
      }),
    );
    notifications.push(...assignmentNotifications);

    if (notifications.length > 0) {
      await this.notificationRepo.insert(notifications);
      this.logger.log(
        `${notifications.length} notificação(ões) criada(s) para task.update`,
      );
    }
  }

  async handleCommentCreated(event: CommentCreatedEvent): Promise<void> {
    this.logger.log(
      `Processando notification.task.comment: taskId=${event.taskId}, assignedUsers=${event.assignedUserIds.length}`,
    );

    // Notificar todos os usuários atribuídos (exceto o autor do comentário)
    const notifications = event.assignedUserIds
      .filter((userId) => userId !== event.authorId)
      .map((userId) =>
        this.notificationRepo.create({
          userId,
          taskId: event.taskId,
          type: 'COMMENT_NEW',
          message: `Novo comentário na tarefa "${event.title}"`,
          read: false,
        }),
      );

    if (notifications.length > 0) {
      await this.notificationRepo.insert(notifications);
      this.logger.log(
        `${notifications.length} notificação(ões) criada(s) para task.comment`,
      );
    }
  }
}
