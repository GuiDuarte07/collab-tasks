import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TaskService } from './task.service';
import { CommentService } from './comment.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Result } from '@repo/shared-types';
import { TaskEntity } from '../entities/task.entity';
import { TaskComment } from '../entities/task-comment.entity';

@Controller()
export class TaskController {
  private readonly logger = new Logger(TaskController.name);

  constructor(
    private readonly taskService: TaskService,
    private readonly commentService: CommentService,
  ) {}

  @MessagePattern('task.create')
  async create(
    @Payload() payload: { data: CreateTaskDto; userId: string },
  ): Promise<Result<TaskEntity>> {
    this.logger.log(
      `RMQ: Recebida requisição task.create (usuário: ${payload.userId})`,
    );
    return this.taskService.create(payload.data, payload.userId);
  }

  @MessagePattern('task.list')
  async list(
    @Payload() payload: { userId: string },
  ): Promise<Result<TaskEntity[]>> {
    this.logger.log(
      `RMQ: Recebida requisição task.list (usuário: ${payload.userId})`,
    );
    return this.taskService.findAll(payload.userId);
  }

  @MessagePattern('task.get')
  async get(
    @Payload() payload: { id: string; userId: string },
  ): Promise<Result<TaskEntity>> {
    this.logger.log(
      `RMQ: Recebida requisição task.get (id: ${payload.id}, usuário: ${payload.userId})`,
    );
    return this.taskService.findOne(payload.id, payload.userId);
  }

  @MessagePattern('task.update')
  async update(
    @Payload() payload: { id: string; data: UpdateTaskDto; userId: string },
  ): Promise<Result<TaskEntity>> {
    this.logger.log(
      `RMQ: Recebida requisição task.update (id: ${payload.id}, usuário: ${payload.userId})`,
    );
    return this.taskService.update(payload.id, payload.data, payload.userId);
  }

  @MessagePattern('task.delete')
  async delete(
    @Payload() payload: { id: string; userId: string },
  ): Promise<Result<void>> {
    this.logger.log(
      `RMQ: Recebida requisição task.delete (id: ${payload.id}, usuário: ${payload.userId})`,
    );
    return this.taskService.remove(payload.id, payload.userId);
  }

  @MessagePattern('task.comment.create')
  async createComment(
    @Payload()
    payload: {
      taskId: string;
      userId: string;
      data: CreateCommentDto;
    },
  ): Promise<Result<TaskComment>> {
    this.logger.log(
      `RMQ: Recebida requisição task.comment.create (tarefa: ${payload.taskId}, usuário: ${payload.userId})`,
    );
    return this.commentService.create(
      payload.taskId,
      payload.userId,
      payload.data,
    );
  }

  @MessagePattern('task.comment.list')
  async listComments(
    @Payload()
    payload: {
      taskId: string;
      userId: string;
      page: number;
      size: number;
    },
  ): Promise<
    Result<{ data: TaskComment[]; total: number; page: number; size: number }>
  > {
    this.logger.log(
      `RMQ: Recebida requisição task.comment.list (tarefa: ${payload.taskId}, usuário: ${payload.userId}, página: ${payload.page}, tamanho: ${payload.size})`,
    );
    return this.commentService.findAll(
      payload.taskId,
      payload.userId,
      payload.page,
      payload.size,
    );
  }
}
