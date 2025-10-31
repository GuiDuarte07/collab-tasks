import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { Result } from '@repo/shared-types';
import { Task } from './types';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TaskGatewayService {
  constructor(@Inject('TASK_SERVICE') private readonly client: ClientProxy) {}

  create(dto: CreateTaskDto, userId: string) {
    return firstValueFrom(
      this.client.send<Result<Task>>('task.create', { data: dto, userId }),
    );
  }

  list(userId: string) {
    return firstValueFrom(
      this.client.send<Result<Task[]>>('task.list', { userId }),
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
