import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import {
  RealtimeGateway,
  TaskCreatedEvent,
  TaskUpdatedEvent,
  CommentCreatedEvent,
} from './realtime.gateway';
import { InternalSecretGuard } from './internal-secret.guard';

@Controller('internal/notify')
@UseGuards(InternalSecretGuard)
export class InternalNotifyController {
  constructor(private readonly gateway: RealtimeGateway) {}

  // Implementação posterior: Add auth (shared secret header)

  @Post('task-created')
  @HttpCode(202)
  taskCreated(@Body() body: TaskCreatedEvent) {
    this.gateway.emitTaskCreated(body);
    return { ok: true };
  }

  @Post('task-updated')
  @HttpCode(202)
  taskUpdated(@Body() body: TaskUpdatedEvent) {
    this.gateway.emitTaskUpdated(body);
    return { ok: true };
  }

  @Post('comment-new')
  @HttpCode(202)
  commentNew(@Body() body: CommentCreatedEvent) {
    this.gateway.emitCommentNew(body);
    return { ok: true };
  }
}
