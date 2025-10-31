import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { TaskPriority, TaskStatus } from '../types';
import { IsArray, IsUUID } from 'class-validator';

class AssignmentInputDto {
  @ApiProperty({ description: 'ID do usuário atribuído', format: 'uuid' })
  @IsUUID()
  userId!: string;

  @ApiProperty({
    description: 'Papel do usuário na tarefa',
    example: 'assigned',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  role!: string;
}

export class CreateTaskDto {
  @ApiProperty({
    example: 'Implementar tela de login',
    minLength: 3,
    maxLength: 255,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  title!: string;

  @ApiPropertyOptional({ example: 'Usar Next.js + Tailwind', maxLength: 5000 })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional({
    example: '2025-12-31T23:59:59.000Z',
    description: 'ISO 8601',
  })
  @IsOptional()
  @IsISO8601()
  deadline?: string;

  @ApiPropertyOptional({ enum: TaskPriority, example: TaskPriority.MEDIUM })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({ enum: TaskStatus, example: TaskStatus.TODO })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({ type: [AssignmentInputDto] })
  @IsOptional()
  @IsArray()
  assignments?: AssignmentInputDto[];
}
