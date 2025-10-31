import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  IsArray,
  IsUUID,
} from 'class-validator';
import { TaskPriority, TaskStatus } from '../types';

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

export class UpdateTaskDto {
  @ApiPropertyOptional({ minLength: 3, maxLength: 255 })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ maxLength: 5000 })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional({ description: 'ISO 8601' })
  @IsOptional()
  @IsISO8601()
  deadline?: string;

  @ApiPropertyOptional({ enum: TaskPriority })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({ enum: TaskStatus })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({ type: [AssignmentInputDto] })
  @IsOptional()
  @IsArray()
  assignments?: AssignmentInputDto[];
}
