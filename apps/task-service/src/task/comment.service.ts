import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskComment } from '../entities/task-comment.entity';
import { TaskAssignment } from '../entities/task-assignment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Result, AppError } from '@repo/shared-types';

@Injectable()
export class CommentService {
  private readonly logger = new Logger(CommentService.name);

  constructor(
    @InjectRepository(TaskComment)
    private readonly commentRepo: Repository<TaskComment>,
    @InjectRepository(TaskAssignment)
    private readonly assignmentRepo: Repository<TaskAssignment>,
  ) {}

  async create(
    taskId: string,
    userId: string,
    dto: CreateCommentDto,
  ): Promise<Result<TaskComment>> {
    this.logger.log(
      `Criando comentário na tarefa ${taskId} (usuário: ${userId})`,
    );
    try {
      // Valida se o usuário tem acesso à tarefa
      const hasAccess = await this.assignmentRepo.exists({
        where: { taskId, userId },
      });
      if (!hasAccess) {
        this.logger.warn(
          `Usuário ${userId} sem acesso à tarefa ${taskId} (negado criar comentário)`,
        );
        return Result.err(new AppError('Acesso negado', 403));
      }

      const comment = this.commentRepo.create({
        taskId,
        userId,
        content: dto.content,
      });
      const saved = await this.commentRepo.save(comment);
      this.logger.log(`Comentário ${saved.id} criado com sucesso`);
      return Result.ok(saved);
    } catch (err) {
      this.logger.error(
        `Erro ao criar comentário: ${err instanceof Error ? err.message : String(err)}`,
        err instanceof Error ? err.stack : undefined,
      );
      return Result.err(new AppError(err, { statusCode: 500 }));
    }
  }

  async findAll(
    taskId: string,
    userId: string,
    page: number = 1,
    size: number = 10,
  ): Promise<
    Result<{ data: TaskComment[]; total: number; page: number; size: number }>
  > {
    this.logger.log(
      `Listando comentários da tarefa ${taskId} (usuário: ${userId}, página: ${page}, tamanho: ${size})`,
    );
    try {
      // Valida se o usuário tem acesso à tarefa
      const hasAccess = await this.assignmentRepo.exists({
        where: { taskId, userId },
      });
      if (!hasAccess) {
        this.logger.warn(
          `Usuário ${userId} sem acesso à tarefa ${taskId} (negado listar comentários)`,
        );
        return Result.err(new AppError('Acesso negado', 403));
      }

      const [comments, total] = await this.commentRepo.findAndCount({
        where: { taskId },
        order: { createdAt: 'ASC' },
        skip: (page - 1) * size,
        take: size,
      });

      this.logger.log(
        `${comments.length} comentário(s) encontrado(s) na tarefa ${taskId} (página ${page}/${Math.ceil(total / size)})`,
      );

      return Result.ok({
        data: comments,
        total,
        page,
        size,
      });
    } catch (err) {
      this.logger.error(
        `Erro ao listar comentários: ${err instanceof Error ? err.message : String(err)}`,
        err instanceof Error ? err.stack : undefined,
      );
      return Result.err(new AppError(err, { statusCode: 500 }));
    }
  }
}
