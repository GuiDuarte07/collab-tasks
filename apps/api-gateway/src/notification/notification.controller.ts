import {
  Controller,
  Get,
  Patch,
  Param,
  UseGuards,
  Req,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { firstValueFrom } from 'rxjs';
import type { Result, AppError } from '@repo/shared-types';

interface Notification {
  id: string;
  userId: string;
  taskId: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}

@ApiTags('Notifications')
@ApiBearerAuth('bearer')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(
    @Inject('NOTIFICATION_SERVICE')
    private readonly notificationClient: ClientProxy,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar notificações do usuário logado' })
  async getNotifications(@Req() req: any) {
    const userId = req.user?.id;
    try {
      const result = await firstValueFrom(
        this.notificationClient.send<
          Result<{ notifications: Notification[]; unreadCount: number }>
        >('notification.user.list', { userId }),
      );

      if (result?.ok) return result.data;

      throw new HttpException(result.error, result.error.statusCode);
    } catch (error: unknown) {
      const err = error as any as AppError;
      throw new HttpException(err, err?.statusCode ?? HttpStatus.BAD_REQUEST);
    }
  }

  @Patch('mark-all-read')
  @ApiOperation({ summary: 'Marcar todas as notificações como lidas' })
  async markAllAsRead(@Req() req: any) {
    const userId = req.user?.id;
    try {
      const result = await firstValueFrom(
        this.notificationClient.send<Result<void>>(
          'notification.mark.all.read',
          { userId },
        ),
      );

      if (result?.ok) return { ok: true };

      throw new HttpException(result.error, result.error.statusCode);
    } catch (error: unknown) {
      const err = error as any as AppError;
      throw new HttpException(err, err?.statusCode ?? HttpStatus.BAD_REQUEST);
    }
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Marcar notificação como lida' })
  async markAsRead(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id;

    try {
      const result = await firstValueFrom(
        this.notificationClient.send<Result<void>>('notification.mark.read', {
          notificationId: id,
          userId,
        }),
      );

      if (result?.ok) return { ok: true };

      throw new HttpException(result.error, result.error.statusCode);
    } catch (error: unknown) {
      const err = error as any as AppError;
      throw new HttpException(err, err?.statusCode ?? HttpStatus.BAD_REQUEST);
    }
  }
}
