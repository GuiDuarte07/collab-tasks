import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { CommentService } from './comment.service';
import {
  TaskEntity,
  TaskAssignment,
  TaskComment,
  TaskAudit,
} from '../entities';
import { databaseConfig } from '../config/database.config';

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig),
    TypeOrmModule.forFeature([
      TaskEntity,
      TaskAssignment,
      TaskComment,
      TaskAudit,
    ]),
  ],
  controllers: [TaskController],
  providers: [TaskService, CommentService],
})
export class TaskModule {}
