import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserId } from '../auth/user-id.decorator';
import { TaskGatewayService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ListTasksDto } from './dto/list-tasks.dto';
import { AppError, Result } from '@repo/shared-types';
import { Task } from './types';

@ApiTags('Tasks')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskGatewayService) {}

  @Post()
  @ApiOperation({ summary: 'Criar nova tarefa' })
  @ApiResponse({ status: 201, description: 'Tarefa criada' })
  async create(
    @Body() dto: CreateTaskDto,
    @UserId() userId: string,
  ): Promise<Task> {
    try {
      const result: Result<Task> = await this.taskService.create(dto, userId);
      console.log('Create Task Result:', result);
      if (result.ok) return result.data;
      throw new HttpException(result.error, result.error.statusCode);
    } catch (error: unknown) {
      const appErr = new AppError(error, {
        statusCode: HttpStatus.BAD_REQUEST,
      });
      throw new HttpException(appErr, appErr.statusCode);
    }
  }

  @Get()
  @ApiOperation({ summary: 'Listar tarefas com filtros e paginação' })
  @ApiResponse({ status: 200, description: 'Lista de tarefas paginada' })
  async list(
    @UserId() userId: string,
    @Query() filters: ListTasksDto,
  ): Promise<{ data: Task[]; total: number; page: number; size: number }> {
    try {
      const result: Result<{
        data: Task[];
        total: number;
        page: number;
        size: number;
      }> = await this.taskService.list(userId, filters);
      if (result?.ok) return result.data;
      throw new HttpException(result.error, result.error.statusCode);
    } catch (error: unknown) {
      const appErr = new AppError(error, {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
      throw new HttpException(appErr, appErr.statusCode);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter tarefa por ID' })
  @ApiParam({ name: 'id', required: true })
  @ApiResponse({ status: 200, description: 'Tarefa encontrada' })
  @ApiResponse({ status: 404, description: 'Tarefa não encontrada' })
  async get(@Param('id') id: string, @UserId() userId: string): Promise<Task> {
    try {
      const result: Result<Task> = await this.taskService.get(id, userId);
      if (result?.ok) return result.data;
      throw new HttpException(result.error, result.error.statusCode);
    } catch (error: unknown) {
      const appErr = new AppError(error, { statusCode: HttpStatus.NOT_FOUND });
      throw new HttpException(appErr, appErr.statusCode);
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar tarefa' })
  @ApiParam({ name: 'id', required: true })
  @ApiResponse({ status: 200, description: 'Tarefa atualizada' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
    @UserId() userId: string,
  ): Promise<Task> {
    try {
      const result: Result<Task> = await this.taskService.update(
        id,
        dto,
        userId,
      );
      if (result?.ok) return result.data;
      throw new HttpException(result.error, result.error.statusCode);
    } catch (error: unknown) {
      const appErr = new AppError(error, {
        statusCode: HttpStatus.BAD_REQUEST,
      });
      throw new HttpException(appErr, appErr.statusCode);
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover tarefa' })
  @ApiParam({ name: 'id', required: true })
  @ApiResponse({ status: 204, description: 'Tarefa removida' })
  @HttpCode(204)
  async delete(
    @Param('id') id: string,
    @UserId() userId: string,
  ): Promise<void> {
    try {
      const result: Result<void> = await this.taskService.delete(id, userId);
      if (result?.ok) return;
      throw new HttpException(result.error, result.error.statusCode);
    } catch (error: unknown) {
      const appErr = new AppError(error, {
        statusCode: HttpStatus.BAD_REQUEST,
      });
      throw new HttpException(appErr, appErr.statusCode);
    }
  }
}
