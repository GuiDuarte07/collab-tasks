import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { In, Repository } from 'typeorm';
import { TaskEntity } from '../entities/task.entity';
import { TaskAssignment } from '../entities/task-assignment.entity';
import { TaskAudit } from '../entities/task-audit.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Result, AppError } from '@repo/shared-types';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);

  constructor(
    @InjectRepository(TaskEntity)
    private readonly taskRepo: Repository<TaskEntity>,
    @InjectRepository(TaskAssignment)
    private readonly assignmentRepo: Repository<TaskAssignment>,
    @InjectRepository(TaskAudit)
    private readonly auditRepo: Repository<TaskAudit>,
    @Inject('NOTIFICATION_SERVICE')
    private readonly notificationClient: ClientProxy,
    @Inject('AUTH_SERVICE')
    private readonly authClient: ClientProxy,
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
        createdBy: userId ?? null,
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

        // Auditoria: ASSIGNMENT_ADD (owner inicial)
        await this.auditRepo.save(
          this.auditRepo.create({
            taskId: saved.id,
            userId: userId ?? null,
            action: 'ASSIGNMENT_ADD',
            changes: [
              {
                field: 'assignment',
                from: null,
                to: { userId, role: 'owner' },
              },
            ],
            snapshot: {
              taskId: saved.id,
              assignment: { userId, role: 'owner' },
            },
          }),
        );
      }

      // Processa assignments enviados no DTO (adicionar/atualizar)
      if (dto.assignments && dto.assignments.length > 0) {
        const added: Array<{ userId: string; role: string }> = [];
        const updated: Array<{ userId: string; from: string; to: string }> = [];

        for (const a of dto.assignments) {
          // evita conflito com o owner já criado; mantém owner
          if (userId && a.userId === userId) continue;

          const existing = await this.assignmentRepo.findOne({
            where: { taskId: saved.id, userId: a.userId },
          });
          if (!existing) {
            await this.assignmentRepo.save(
              this.assignmentRepo.create({
                taskId: saved.id,
                userId: a.userId,
                role: a.role,
              }),
            );
            added.push({ userId: a.userId, role: a.role });
          } else if (existing.role !== a.role) {
            const from = existing.role;
            existing.role = a.role;
            await this.assignmentRepo.save(existing);
            updated.push({ userId: a.userId, from, to: a.role });
          }
        }

        if (added.length > 0) {
          await this.auditRepo.save(
            this.auditRepo.create({
              taskId: saved.id,
              userId: userId ?? null,
              action: 'ASSIGNMENT_ADD',
              changes: added.map((i) => ({
                field: 'assignment',
                from: null,
                to: { userId: i.userId, role: i.role },
              })),
              snapshot: { taskId: saved.id, added },
            }),
          );
        }
        if (updated.length > 0) {
          await this.auditRepo.save(
            this.auditRepo.create({
              taskId: saved.id,
              userId: userId ?? null,
              action: 'ASSIGNMENT_UPDATE',
              changes: updated.map((i) => ({
                field: 'assignment',
                from: { userId: i.userId, role: i.from },
                to: { userId: i.userId, role: i.to },
              })),
              snapshot: { taskId: saved.id, updated },
            }),
          );
        }
      }

      // Auditoria: CREATE
      await this.auditRepo.save(
        this.auditRepo.create({
          taskId: saved.id,
          userId: userId ?? null,
          action: 'CREATE',
          changes: null,
          snapshot: {
            id: saved.id,
            title: saved.title,
            description: saved.description,
            deadline: saved.deadline,
            priority: saved.priority,
            status: saved.status,
            createdAt: saved.createdAt,
            updatedAt: saved.updatedAt,
          },
        }),
      );
      this.logger.log(`Histórico (CREATE) registrado para tarefa ${saved.id}`);

      // Emitir evento de notificação
      const allAssignedUserIds = await this.assignmentRepo
        .find({ where: { taskId: saved.id } })
        .then((assigns) => assigns.map((a) => a.userId));

      this.notificationClient.emit('notification.task.create', {
        taskId: saved.id,
        title: saved.title,
        creatorId: userId ?? '',
        assignedUserIds: allAssignedUserIds,
      });
      this.logger.log(
        `Evento notification.task.create emitido para tarefa ${saved.id}`,
      );

      return Result.ok(saved);
    } catch (err) {
      if (this.isDuplicateAssignmentError(err)) {
        this.logger.warn('Usuário já está atribuído a esta tarefa (CREATE)');
        return Result.err(
          new AppError('Usuário já está atribuído a esta tarefa', 409),
        );
      }
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
          .leftJoinAndSelect('task.assignments', 'assignments')
          .innerJoin(
            'task.assignments',
            'userAssignment',
            'userAssignment.userId = :userId',
            { userId },
          )
          .getMany();
      } else {
        list = await this.taskRepo.find({ relations: ['assignments'] });
      }
      this.logger.log(`${list.length} tarefa(s) encontrada(s)`);

      // Enriquecer assignments com dados dos usuários
      await this.enrichTasksWithUserData(list);

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
      const found = await this.taskRepo.findOne({
        where: { id },
        relations: ['assignments'],
      });
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

      // Enriquecer assignments com dados dos usuários
      await this.enrichTasksWithUserData([found]);

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

      // Calcular mudanças a partir do DTO
      const changes: Array<{ field: string; from: unknown; to: unknown }> = [];

      if (typeof dto.title !== 'undefined' && dto.title !== found.title) {
        changes.push({ field: 'title', from: found.title, to: dto.title });
      }

      if (
        typeof dto.description !== 'undefined' &&
        (dto.description ?? null) !== (found.description ?? null)
      ) {
        changes.push({
          field: 'description',
          from: found.description ?? null,
          to: dto.description ?? null,
        });
      }

      if (
        typeof dto.priority !== 'undefined' &&
        dto.priority !== found.priority
      ) {
        changes.push({
          field: 'priority',
          from: found.priority,
          to: dto.priority,
        });
      }

      if (typeof dto.status !== 'undefined' && dto.status !== found.status) {
        changes.push({ field: 'status', from: found.status, to: dto.status });
      }

      if (typeof dto.deadline !== 'undefined') {
        const oldD = found.deadline
          ? new Date(found.deadline).toISOString()
          : null;
        const newD = dto.deadline ? new Date(dto.deadline).toISOString() : null;
        if (oldD !== newD) {
          changes.push({ field: 'deadline', from: oldD, to: newD });
        }
      }

      const { assignments: incomingAssignments, ...taskFields } = dto;
      const merged = this.taskRepo.merge(
        found,
        taskFields as Partial<TaskEntity>,
      );
      let saved: TaskEntity;
      try {
        saved = await this.taskRepo.save(merged);
      } catch (saveErr) {
        const info = this.extractDbErrorInfo(saveErr);
        this.logger.error(
          `Erro ao salvar tarefa (UPDATE save): ${info.message} | code=${info.code ?? 'n/a'} constraint=${info.constraint ?? 'n/a'}`,
          info.stack,
        );
        return Result.err(
          new AppError(
            `Erro ao salvar tarefa (save). code=${info.code ?? 'n/a'} constraint=${info.constraint ?? 'n/a'} detail=${info.detail ?? info.message}`,
            500,
          ),
        );
      }
      this.logger.log(`Tarefa ${id} atualizada com sucesso`);

      // Auditoria: UPDATE (apenas se houve alterações)
      if (changes.length > 0) {
        await this.auditRepo.save(
          this.auditRepo.create({
            taskId: id,
            userId: userId ?? null,
            action: 'UPDATE',
            changes,
            snapshot: {
              id: saved.id,
              title: saved.title,
              description: saved.description,
              deadline: saved.deadline,
              priority: saved.priority,
              status: saved.status,
              createdAt: saved.createdAt,
              updatedAt: saved.updatedAt,
            },
          }),
        );
        this.logger.log(`Histórico (UPDATE) registrado para tarefa ${id}`);
      }

      // Processar assignments se enviados: varre DTO, atualiza/insere; depois remove os que sobraram
      const toAdd: Array<{ userId: string; role: string }> = [];

      if (incomingAssignments) {
        const current = await this.assignmentRepo.find({
          where: { taskId: id },
        });

        const currentMap = new Map(current.map((a) => [a.userId, a]));
        const processed = new Set<string>();

        const toUpdate: Array<{ userId: string; from: string; to: string }> =
          [];
        const toRemove: Array<{ userId: string; role: string }> = [];

        // Percorre cada assignment enviado no DTO
        for (const a of incomingAssignments) {
          processed.add(a.userId);
          const existing = currentMap.get(a.userId);
          if (!existing) {
            toAdd.push({ userId: a.userId, role: a.role });
          } else if (existing.role !== a.role) {
            toUpdate.push({
              userId: a.userId,
              from: existing.role,
              to: a.role,
            });
          }
        }

        // Os que existem atualmente mas não vieram no DTO devem ser removidos
        for (const existing of current) {
          if (!processed.has(existing.userId)) {
            toRemove.push({ userId: existing.userId, role: existing.role });
          }
        }

        // Aplicar inclusões
        if (toAdd.length > 0) {
          await this.assignmentRepo.insert(
            toAdd.map((a) => ({
              taskId: id,
              userId: a.userId,
              role: a.role,
            })),
          );
        }

        // Aplicar atualizações
        for (const u of toUpdate) {
          const entity = currentMap.get(u.userId);
          if (!entity) continue;
          entity.role = u.to;
          await this.assignmentRepo.save(entity);
        }

        // Aplicar remoções
        if (toRemove.length > 0) {
          const removeIds = toRemove.map((r) => r.userId);
          await this.assignmentRepo.delete({
            taskId: id,
            userId: In(removeIds),
          });
        }

        // Auditorias
        if (toAdd.length > 0) {
          await this.auditRepo.save(
            this.auditRepo.create({
              taskId: id,
              userId: userId ?? null,
              action: 'ASSIGNMENT_ADD',
              changes: toAdd.map((i) => ({
                field: 'assignment',
                from: null,
                to: i,
              })),
              snapshot: { taskId: id, added: toAdd },
            }),
          );
        }
        if (toUpdate.length > 0) {
          await this.auditRepo.save(
            this.auditRepo.create({
              taskId: id,
              userId: userId ?? null,
              action: 'ASSIGNMENT_UPDATE',
              changes: toUpdate.map((i) => ({
                field: 'assignment',
                from: { userId: i.userId, role: i.from },
                to: { userId: i.userId, role: i.to },
              })),
              snapshot: { taskId: id, updated: toUpdate },
            }),
          );
        }
        if (toRemove.length > 0) {
          await this.auditRepo.save(
            this.auditRepo.create({
              taskId: id,
              userId: userId ?? null,
              action: 'ASSIGNMENT_REMOVE',
              changes: [{ field: 'assignments', from: toRemove, to: [] }],
              snapshot: { taskId: id, removed: toRemove },
            }),
          );
        }
      }

      const allAssignedUserIds = await this.assignmentRepo
        .find({ where: { taskId: id } })
        .then((assigns) => assigns.map((a) => a.userId));

      const newlyAddedUserIds = incomingAssignments
        ? allAssignedUserIds.filter((uid) =>
            toAdd.some((a) => a.userId === uid),
          )
        : [];

      this.notificationClient.emit('notification.task.update', {
        taskId: id,
        title: saved.title,
        updatedBy: userId ?? '',
        assignedUserIds: allAssignedUserIds,
        newlyAddedUserIds,
      });
      this.logger.log(
        `Evento notification.task.update emitido para tarefa ${id}`,
      );

      return Result.ok(saved);
    } catch (err) {
      if (this.isDuplicateAssignmentError(err)) {
        this.logger.warn(
          `Usuário já está atribuído a esta tarefa (UPDATE ${id})`,
        );
        return Result.err(
          new AppError('Usuário já está atribuído a esta tarefa', 409),
        );
      }
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
      // Auditoria: DELETE (snapshot antes da remoção)
      await this.auditRepo.save(
        this.auditRepo.create({
          taskId: id,
          userId: userId ?? null,
          action: 'DELETE',
          changes: null,
          snapshot: {
            id: found.id,
            title: found.title,
            description: found.description,
            deadline: found.deadline,
            priority: found.priority,
            status: found.status,
            createdAt: found.createdAt,
            updatedAt: found.updatedAt,
          },
        }),
      );

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

  /**
   * Enriquece as tasks com dados dos usuários via auth.users.findMany
   */
  private async enrichTasksWithUserData(tasks: TaskEntity[]): Promise<void> {
    try {
      const allUserIds = new Set<string>();
      for (const task of tasks) {
        if (task.assignments) {
          for (const assign of task.assignments) {
            allUserIds.add(assign.userId);
          }
        }
      }

      if (allUserIds.size === 0) return;

      const queries = Array.from(allUserIds).map((userId) => ({ userId }));
      const result = await firstValueFrom(
        this.authClient.send<
          Result<
            Array<{ id: string; name: string; username: string; email: string }>
          >
        >('auth.users.findMany', { queries }),
      );

      if (!result?.ok || !result.data) {
        this.logger.warn(
          'Falha ao enriquecer assignments com dados de usuário',
        );
        return;
      }

      const usersById = new Map(result.data.map((u) => [u.id, u]));

      for (const task of tasks) {
        if (task.assignments) {
          for (const assign of task.assignments) {
            const user = usersById.get(assign.userId);
            if (user) {
              Object.assign(assign, {
                name: user.name,
                username: user.username,
                email: user.email,
              });
            }
          }
        }
      }
    } catch (err) {
      this.logger.error(
        `Erro ao enriquecer tasks com dados de usuário: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  private isDuplicateAssignmentError(err: unknown): boolean {
    type PgError = {
      code?: unknown;
      constraint?: unknown;
      driverError?: { code?: unknown; constraint?: unknown };
    };
    const e = err as PgError;
    const code =
      typeof e.code === 'string'
        ? e.code
        : typeof e.driverError?.code === 'string'
          ? e.driverError.code
          : undefined;
    const constraint =
      typeof e.constraint === 'string'
        ? e.constraint
        : typeof e.driverError?.constraint === 'string'
          ? e.driverError.constraint
          : undefined;
    if (code === '23505') {
      if (
        constraint === 'IDX_2f1f822596c4af9491d12ff0cb' ||
        constraint === 'task_assignments_task_id_user_id_key'
      ) {
        return true;
      }
      return true;
    }
    return false;
  }

  /** Extrai informações úteis de erros de banco (Postgres/TypeORM) para logging/resposta */
  private extractDbErrorInfo(err: unknown): {
    message: string;
    code?: string;
    constraint?: string;
    detail?: string;
    stack?: string;
  } {
    type PgError = {
      message?: unknown;
      code?: unknown;
      constraint?: unknown;
      detail?: unknown;
      stack?: unknown;
      driverError?: {
        message?: unknown;
        code?: unknown;
        constraint?: unknown;
        detail?: unknown;
        stack?: unknown;
      };
    };
    const e = err as PgError;
    const code =
      typeof e.code === 'string'
        ? e.code
        : typeof e.driverError?.code === 'string'
          ? e.driverError.code
          : undefined;
    const constraint =
      typeof e.constraint === 'string'
        ? e.constraint
        : typeof e.driverError?.constraint === 'string'
          ? e.driverError.constraint
          : undefined;
    const detail =
      typeof e.detail === 'string'
        ? e.detail
        : typeof e.driverError?.detail === 'string'
          ? e.driverError.detail
          : undefined;
    const message =
      typeof e.message === 'string'
        ? e.message
        : typeof e.driverError?.message === 'string'
          ? e.driverError.message
          : 'Unknown error';
    const stack =
      typeof e.stack === 'string'
        ? e.stack
        : typeof e.driverError?.stack === 'string'
          ? e.driverError.stack
          : undefined;
    return { message, code, constraint, detail, stack };
  }
}
