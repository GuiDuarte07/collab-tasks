import { Controller, Logger } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { NotificationService } from './notification.service';
import type {
  TaskCreatedEvent,
  TaskUpdatedEvent,
  CommentCreatedEvent,
} from './events.interface';
import { Result, AppError } from '@repo/shared-types';

@Controller()
export class NotificationController {
  private readonly logger = new Logger(NotificationController.name);

  constructor(private readonly notificationService: NotificationService) {}

  @EventPattern('notification.task.create')
  async handleTaskCreated(@Payload() event: TaskCreatedEvent): Promise<void> {
    this.logger.log(
      `Evento recebido: notification.task.create (taskId=${event.taskId})`,
    );
    try {
      await this.notificationService.handleTaskCreated(event);
    } catch (err) {
      this.logger.error(
        `Erro ao processar notification.task.create: ${err instanceof Error ? err.message : String(err)}`,
        err instanceof Error ? err.stack : undefined,
      );
    }
  }

  @EventPattern('notification.task.update')
  async handleTaskUpdated(@Payload() event: TaskUpdatedEvent): Promise<void> {
    this.logger.log(
      `Evento recebido: notification.task.update (taskId=${event.taskId})`,
    );
    try {
      await this.notificationService.handleTaskUpdated(event);
    } catch (err) {
      this.logger.error(
        `Erro ao processar notification.task.update: ${err instanceof Error ? err.message : String(err)}`,
        err instanceof Error ? err.stack : undefined,
      );
    }
  }

  @EventPattern('notification.task.comment')
  async handleCommentCreated(
    @Payload() event: CommentCreatedEvent,
  ): Promise<void> {
    this.logger.log(
      `Evento recebido: notification.task.comment (taskId=${event.taskId})`,
    );
    try {
      await this.notificationService.handleCommentCreated(event);
    } catch (err) {
      this.logger.error(
        `Erro ao processar notification.task.comment: ${err instanceof Error ? err.message : String(err)}`,
        err instanceof Error ? err.stack : undefined,
      );
    }
  }

  @MessagePattern('notification.user.list')
  async getUserNotifications(@Payload() data: { userId: string }) {
    try {
      const result = await this.notificationService.getUserNotifications(
        data.userId,
      );
      return Result.ok(result);
    } catch (err) {
      this.logger.error(
        `Erro ao listar notificações: ${err instanceof Error ? err.message : String(err)}`,
      );
      return Result.err(
        new AppError('Erro ao listar notificações', { statusCode: 500 }),
      );
    }
  }

  @MessagePattern('notification.mark.read')
  async markAsRead(
    @Payload() data: { notificationId: string; userId: string },
  ) {
    try {
      await this.notificationService.markAsRead(
        data.notificationId,
        data.userId,
      );
      return Result.ok(undefined);
    } catch (err) {
      this.logger.error(
        `Erro ao marcar notificação como lida: ${err instanceof Error ? err.message : String(err)}`,
      );
      return Result.err(
        new AppError('Erro ao marcar como lida', { statusCode: 500 }),
      );
    }
  }

  @MessagePattern('notification.mark.all.read')
  async markAllAsRead(@Payload() data: { userId: string }) {
    try {
      await this.notificationService.markAllAsRead(data.userId);
      return Result.ok(undefined);
    } catch (err) {
      this.logger.error(
        `Erro ao marcar todas como lidas: ${err instanceof Error ? err.message : String(err)}`,
      );
      return Result.err(
        new AppError('Erro ao marcar todas como lidas', { statusCode: 500 }),
      );
    }
  }
}
