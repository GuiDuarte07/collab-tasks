import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpException,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserId } from '../auth/user-id.decorator';
import { CommentGatewayService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { AppError, Result } from '@repo/shared-types';
import { Comment } from './comment.types';

@ApiTags('Comments')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard)
@Controller('tasks/:taskId/comments')
export class CommentController {
  constructor(private readonly commentService: CommentGatewayService) {}

  @Post()
  @ApiOperation({ summary: 'Criar comentário em uma tarefa' })
  @ApiParam({ name: 'taskId', description: 'ID da tarefa' })
  @ApiResponse({ status: 201, description: 'Comentário criado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  async create(
    @Param('taskId') taskId: string,
    @Body() dto: CreateCommentDto,
    @UserId() userId: string,
  ): Promise<Comment> {
    try {
      const result: Result<Comment> = await this.commentService.create(
        taskId,
        dto,
        userId,
      );
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
  @ApiOperation({ summary: 'Listar comentários de uma tarefa com paginação' })
  @ApiParam({ name: 'taskId', description: 'ID da tarefa' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número da página (padrão: 1)',
  })
  @ApiQuery({
    name: 'size',
    required: false,
    type: Number,
    description: 'Tamanho da página (padrão: 10)',
  })
  @ApiResponse({ status: 200, description: 'Lista paginada de comentários' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  async list(
    @Param('taskId') taskId: string,
    @Query('page') page?: string,
    @Query('size') size?: string,
    @UserId() userId?: string,
  ): Promise<{ data: Comment[]; total: number; page: number; size: number }> {
    try {
      const pageNum = page ? parseInt(page, 10) : 1;
      const sizeNum = size ? parseInt(size, 10) : 10;

      const result = await this.commentService.list(
        taskId,
        userId,
        pageNum,
        sizeNum,
      );
      if (result?.ok) return result.data;
      throw new HttpException(result.error, result.error.statusCode);
    } catch (error: unknown) {
      const appErr = new AppError(error, {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
      throw new HttpException(appErr, appErr.statusCode);
    }
  }
}
