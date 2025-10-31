import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Comment } from './comment.types';
import { Result } from '@repo/shared-types';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class CommentGatewayService {
  constructor(@Inject('TASK_SERVICE') private client: ClientProxy) {}

  async create(
    taskId: string,
    dto: CreateCommentDto,
    userId: string,
  ): Promise<Result<Comment>> {
    return firstValueFrom(
      this.client.send<Result<Comment>>('task.comment.create', {
        taskId,
        userId,
        data: dto,
      }),
    );
  }

  async list(
    taskId: string,
    userId: string,
    page: number,
    size: number,
  ): Promise<
    Result<{ data: Comment[]; total: number; page: number; size: number }>
  > {
    return firstValueFrom(
      this.client.send<
        Result<{ data: Comment[]; total: number; page: number; size: number }>
      >('task.comment.list', {
        taskId,
        userId,
        page,
        size,
      }),
    );
  }
}
