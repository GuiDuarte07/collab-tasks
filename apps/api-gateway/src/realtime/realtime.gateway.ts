import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export type TaskCreatedEvent = {
  taskId: string;
  title: string;
  creatorId: string;
  assignedUserIds?: string[];
};

export type TaskUpdatedEvent = {
  taskId: string;
  title: string;
  updatedBy: string;
  assignedUserIds?: string[];
  newlyAddedUserIds?: string[];
};

export type CommentCreatedEvent = {
  taskId: string;
  commentId: string;
  authorId: string;
  assignedUserIds?: string[];
  title?: string;
};

@Injectable()
@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/',
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(private readonly jwt: JwtService) {}

  afterInit(server: Server) {
    // Middleware para autenticação JWT no handshake
    server.use((socket, next) => {
      try {
        const token = (socket.handshake.auth as any)?.token as
          | string
          | undefined;
        if (!token) {
          return next(new Error('jwt missing'));
        }
        try {
          this.jwt.verify(token);
        } catch (err: any) {
          if (err?.name === 'TokenExpiredError') {
            return next(new Error('jwt expired'));
          }
          return next(new Error('jwt invalid'));
        }
        next();
      } catch {
        next(new Error('jwt error'));
      }
    });
  }

  handleConnection(client: Socket): void {
    try {
      const token = (client.handshake.auth as any)?.token as string | undefined;
      if (!token) {
        this.logger.warn(`Socket sem token de autenticação: ${client.id}`);
        client.disconnect(true);
        return;
      }

      const payload = this.jwt.verify(token);
      const userId =
        (payload as Record<string, any>)?.sub ||
        (payload as Record<string, any>)?.userId ||
        (payload as Record<string, any>)?.id;
      if (!userId) {
        this.logger.warn(`Token do socket sem userId: ${client.id}`);
        client.disconnect(true);
        return;
      }

      client.join(`user:${userId}`);
      client.data.userId = userId;
      this.logger.log(`Socket conectado: ${client.id} usuário=${userId}`);
    } catch (e) {
      this.logger.warn(
        `Falha na autenticação do socket: ${client.id} -> ${(e as Error).message}`,
      );
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Socket desconectado: ${client.id}`);
  }

  private roomsFor(userIds?: string[]): string[] {
    return (userIds ?? []).map((id) => `user:${id}`);
  }

  emitTaskCreated(event: TaskCreatedEvent) {
    const recipients = (event.assignedUserIds ?? []).filter(
      (u) => u !== event.creatorId,
    );
    const rooms = this.roomsFor(recipients);
    this.logger.log(
      `Emitindo task:created ${event.taskId} para ${rooms.length} usuário(s)`,
    );
    if (rooms.length > 0) this.server.to(rooms).emit('task:created', event);
  }

  emitTaskUpdated(event: TaskUpdatedEvent) {
    const recipients = (event.assignedUserIds ?? []).filter(
      (u) => u !== event.updatedBy,
    );

    const rooms = this.roomsFor(recipients);
    console.log(rooms);
    this.logger.log(
      `Emitindo task:updated ${event.taskId} para ${rooms.length} usuário(s)`,
    );
    if (rooms.length > 0) this.server.to(rooms).emit('task:updated', event);
  }

  emitCommentNew(event: CommentCreatedEvent) {
    const recipients = (event.assignedUserIds ?? []).filter(
      (u) => u !== event.authorId,
    );

    const rooms = this.roomsFor(recipients);
    this.logger.log(
      `Emitindo comment:new ${event.commentId} para ${rooms.length} usuário(s)`,
    );
    if (rooms.length > 0) this.server.to(rooms).emit('comment:new', event);
  }
}
