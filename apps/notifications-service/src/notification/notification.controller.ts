import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { NotificationService } from './notification.service';
import type {
  TaskCreatedEvent,
  TaskUpdatedEvent,
  CommentCreatedEvent,
} from './events.interface';

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
}
