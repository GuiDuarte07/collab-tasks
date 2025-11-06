import { IsOptional, IsInt, Min, IsIn, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListTasksDto {
  @ApiPropertyOptional({
    description: 'Número da página',
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Tamanho da página',
    minimum: 1,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  size?: number;

  @ApiPropertyOptional({
    description: 'Filtrar por status',
    enum: ['todo', 'in_progress', 'review', 'done'],
  })
  @IsOptional()
  @IsIn(['todo', 'in_progress', 'review', 'done'])
  status?: 'todo' | 'in_progress' | 'review' | 'done';

  @ApiPropertyOptional({
    description: 'Filtrar por prioridade',
    enum: ['low', 'medium', 'high', 'urgent'],
  })
  @IsOptional()
  @IsIn(['low', 'medium', 'high', 'urgent'])
  priority?: 'low' | 'medium' | 'high' | 'urgent';

  @ApiPropertyOptional({ description: 'Buscar no título ou descrição' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Campo para ordenação',
    enum: ['createdAt', 'updatedAt', 'deadline', 'priority', 'status'],
    default: 'createdAt',
  })
  @IsOptional()
  @IsIn(['createdAt', 'updatedAt', 'deadline', 'priority', 'status'])
  sortBy?: 'createdAt' | 'updatedAt' | 'deadline' | 'priority' | 'status';

  @ApiPropertyOptional({
    description: 'Ordem da ordenação',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
  })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC';
}
