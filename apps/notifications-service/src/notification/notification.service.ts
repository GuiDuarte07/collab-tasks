import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
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
    private readonly http: HttpService,
  ) {}

  private get gatewayBaseUrl(): string {
    return (
      process.env.NOTIFY_GATEWAY_BASE_URL ||
      process.env.API_GATEWAY_URL ||
      'http://api-gateway:3001'
    );
  }

  private get internalSecret(): string | undefined {
    return process.env.NOTIFY_INTERNAL_SECRET;
  }

  private async postToGateway(path: string, payload: unknown): Promise<void> {
    const candidates = [
      this.gatewayBaseUrl,
      // fallback para ambiente local fora do Docker
      'http://localhost:3001',
    ].filter(Boolean);

    const errors: string[] = [];

    for (const base of candidates) {
      const url = `${base}${path.startsWith('/') ? '' : '/'}${path}`;
      try {
        await lastValueFrom(
          this.http.post(url, payload, {
            headers: this.internalSecret
              ? { 'x-internal-secret': this.internalSecret }
              : undefined,
            timeout: 2500,
          }),
        );
        return; // sucesso
      } catch (err: unknown) {
        const msg =
          typeof err === 'object' && err && 'toString' in err
            ? // eslint-disable-next-line @typescript-eslint/no-base-to-string
              String(err)
            : 'erro desconhecido';
        errors.push(`${url} -> ${msg}`);
      }
    }

    this.logger.warn(
      `Falha ao encaminhar evento para API Gateway (tentativas: ${errors.length}): ${errors.join(' | ')}`,
    );
  }

  async handleTaskCreated(event: TaskCreatedEvent): Promise<void> {
    this.logger.log(
      `Processando notification.task.create: taskId=${event.taskId}, assignedUsers=${event.assignedUserIds.length}`,
    );

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

    // encaminhar para o gateway emitir via Socket.IO
    await this.postToGateway('/api/internal/notify/task-created', event);
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

    // encaminhar para o gateway emitir via Socket.IO
    await this.postToGateway('/api/internal/notify/task-updated', event);
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

    // encaminhar para o gateway emitir via Socket.IO
    await this.postToGateway('/api/internal/notify/comment-new', event);
  }

  async getUserNotifications(userId: string): Promise<{
    notifications: NotificationEntity[];
    unreadCount: number;
  }> {
    this.logger.log(`Buscando notificações para userId=${userId}`);

    const notifications = await this.notificationRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50, // últimas 50
    });

    const unreadCount = await this.notificationRepo.count({
      where: { userId, read: false },
    });

    this.logger.log(
      `Retornando ${notifications.length} notificações (${unreadCount} não lidas) para userId=${userId}`,
    );

    return { notifications, unreadCount };
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    this.logger.log(
      `Marcando notificação como lida: notificationId=${notificationId}, userId=${userId}`,
    );

    const notification = await this.notificationRepo.findOne({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      this.logger.warn(
        `Notificação não encontrada: notificationId=${notificationId}, userId=${userId}`,
      );
      throw new Error('Notificação não encontrada');
    }

    notification.read = true;
    await this.notificationRepo.save(notification);

    this.logger.log(`Notificação ${notificationId} marcada como lida`);
  }

  async markAllAsRead(userId: string): Promise<void> {
    this.logger.log(
      `Marcando todas as notificações como lidas para userId=${userId}`,
    );

    const result = await this.notificationRepo.update(
      { userId, read: false },
      { read: true },
    );

    this.logger.log(
      `${result.affected || 0} notificação(ões) marcada(s) como lida(s) para userId=${userId}`,
    );
  }
}
