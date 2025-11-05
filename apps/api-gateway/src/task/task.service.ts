import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { Result } from '@repo/shared-types';
import { Task } from './types';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ListTasksDto } from './dto/list-tasks.dto';

@Injectable()
export class TaskGatewayService {
  constructor(@Inject('TASK_SERVICE') private readonly client: ClientProxy) {}

  create(dto: CreateTaskDto, userId: string) {
    return firstValueFrom(
      this.client.send<Result<Task>>('task.create', { data: dto, userId }),
    );
  }

  list(userId: string, filters?: ListTasksDto) {
    return firstValueFrom(
      this.client.send<
        Result<{ data: Task[]; total: number; page: number; size: number }>
      >('task.list', { userId, filters }),
    );
  }

  get(id: string, userId: string) {
    return firstValueFrom(
      this.client.send<Result<Task>>('task.get', { id, userId }),
    );
  }

  update(id: string, data: UpdateTaskDto, userId: string) {
    return firstValueFrom(
      this.client.send<Result<Task>>('task.update', { id, data, userId }),
    );
  }

  delete(id: string, userId: string) {
    return firstValueFrom(
      this.client.send<Result<void>>('task.delete', { id, userId }),
    );
  }
}
