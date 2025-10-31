import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { TaskEntity, TaskAssignment } from '../entities';
import { databaseConfig } from '../config/database.config';

@Module({
  imports: [
    // Configuração global do TypeORM
    TypeOrmModule.forRoot(databaseConfig),

    // Registra os repositories que serão usados globalmente
    TypeOrmModule.forFeature([TaskEntity, TaskAssignment]),
  ],
  controllers: [TaskController],
  providers: [TaskService],
})
export class TaskModule {}
