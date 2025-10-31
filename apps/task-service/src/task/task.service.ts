import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskEntity } from '../entities/task.entity';
import { TaskAssignment } from '../entities/task-assignment.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Result, AppError } from '@repo/shared-types';

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);

  constructor(
    @InjectRepository(TaskEntity)
    private readonly taskRepo: Repository<TaskEntity>,
    @InjectRepository(TaskAssignment)
    private readonly assignmentRepo: Repository<TaskAssignment>,
  ) {}

  async create(
    dto: CreateTaskDto,
    userId?: string,
  ): Promise<Result<TaskEntity>> {
    this.logger.log(
      `Iniciando criação de tarefa: ${dto.title}${userId ? ` (usuário: ${userId})` : ''}`,
    );
    try {
      const entity = this.taskRepo.create({
        title: dto.title,
        description: dto.description ?? null,
        deadline: dto.deadline ?? null,
        priority: dto.priority,
        status: dto.status,
      });

      const saved = await this.taskRepo.save(entity);
      this.logger.log(`Tarefa criada com sucesso: ${saved.id}`);

      // Se tivermos userId, cria uma atribuição 'owner' automaticamente
      if (userId) {
        const assign = this.assignmentRepo.create({
          taskId: saved.id,
          userId,
          role: 'owner',
        });
        await this.assignmentRepo.save(assign);
        this.logger.log(
          `Atribuição owner criada para tarefa ${saved.id} e usuário ${userId}`,
        );
      }

      return Result.ok(saved);
    } catch (err) {
      this.logger.error(
        `Erro ao criar tarefa: ${err instanceof Error ? err.message : String(err)}`,
        err instanceof Error ? err.stack : undefined,
      );
      return Result.err(new AppError(err, { statusCode: 500 }));
    }
  }

  async findAll(userId?: string): Promise<Result<TaskEntity[]>> {
    this.logger.log(`Listando tarefas${userId ? ` (usuário: ${userId})` : ''}`);
    try {
      let list: TaskEntity[];
      if (userId) {
        list = await this.taskRepo
          .createQueryBuilder('task')
          .innerJoin(
            'task_assignments',
            'assign',
            'assign.task_id = task.id AND assign.user_id = :userId',
            { userId },
          )
          .getMany();
      } else {
        list = await this.taskRepo.find();
      }
      this.logger.log(`${list.length} tarefa(s) encontrada(s)`);
      return Result.ok(list);
    } catch (err) {
      this.logger.error(
        `Erro ao listar tarefas: ${err instanceof Error ? err.message : String(err)}`,
        err instanceof Error ? err.stack : undefined,
      );
      return Result.err(new AppError(err, { statusCode: 500 }));
    }
  }

  async findOne(id: string, userId?: string): Promise<Result<TaskEntity>> {
    this.logger.log(
      `Buscando tarefa ${id}${userId ? ` (usuário: ${userId})` : ''}`,
    );
    try {
      const found = await this.taskRepo.findOne({ where: { id } });
      if (!found) {
        this.logger.warn(`Tarefa ${id} não encontrada`);
        return Result.err(new AppError('Tarefa não encontrada', 404));
      }
      if (userId) {
        const hasAccess = await this.assignmentRepo.exists({
          where: { taskId: id, userId },
        });
        if (!hasAccess) {
          this.logger.warn(
            `Usuário ${userId} sem acesso à tarefa ${id} (negado)`,
          );
          return Result.err(new AppError('Acesso negado', 403));
        }
      }
      this.logger.log(`Tarefa ${id} encontrada com sucesso`);
      return Result.ok(found);
    } catch (err) {
      this.logger.error(
        `Erro ao buscar tarefa ${id}: ${err instanceof Error ? err.message : String(err)}`,
        err instanceof Error ? err.stack : undefined,
      );
      return Result.err(new AppError(err, { statusCode: 500 }));
    }
  }

  async update(
    id: string,
    dto: UpdateTaskDto,
    userId?: string,
  ): Promise<Result<TaskEntity>> {
    this.logger.log(
      `Atualizando tarefa ${id}${userId ? ` (usuário: ${userId})` : ''}`,
    );
    try {
      const found = await this.taskRepo.findOne({ where: { id } });
      if (!found) {
        this.logger.warn(`Tarefa ${id} não encontrada para atualização`);
        return Result.err(new AppError('Tarefa não encontrada', 404));
      }
      if (userId) {
        const hasAccess = await this.assignmentRepo.exists({
          where: { taskId: id, userId },
        });
        if (!hasAccess) {
          this.logger.warn(
            `Usuário ${userId} sem acesso à tarefa ${id} (negado update)`,
          );
          return Result.err(new AppError('Acesso negado', 403));
        }
      }
      const merged = this.taskRepo.merge(found, dto);
      const saved = await this.taskRepo.save(merged);
      this.logger.log(`Tarefa ${id} atualizada com sucesso`);
      return Result.ok(saved);
    } catch (err) {
      this.logger.error(
        `Erro ao atualizar tarefa ${id}: ${err instanceof Error ? err.message : String(err)}`,
        err instanceof Error ? err.stack : undefined,
      );
      return Result.err(new AppError(err, { statusCode: 500 }));
    }
  }

  async remove(id: string, userId?: string): Promise<Result<void>> {
    this.logger.log(
      `Removendo tarefa ${id}${userId ? ` (usuário: ${userId})` : ''}`,
    );
    try {
      const found = await this.taskRepo.findOne({ where: { id } });
      if (!found) {
        this.logger.warn(`Tarefa ${id} não encontrada para remoção`);
        return Result.err(new AppError('Tarefa não encontrada', 404));
      }
      if (userId) {
        const hasAccess = await this.assignmentRepo.exists({
          where: { taskId: id, userId },
        });
        if (!hasAccess) {
          this.logger.warn(
            `Usuário ${userId} sem acesso à tarefa ${id} (negado delete)`,
          );
          return Result.err(new AppError('Acesso negado', 403));
        }
      }
      await this.taskRepo.remove(found);
      this.logger.log(`Tarefa ${id} removida com sucesso`);
      return Result.ok(undefined);
    } catch (err) {
      this.logger.error(
        `Erro ao remover tarefa ${id}: ${err instanceof Error ? err.message : String(err)}`,
        err instanceof Error ? err.stack : undefined,
      );
      return Result.err(new AppError(err, { statusCode: 500 }));
    }
  }
}
