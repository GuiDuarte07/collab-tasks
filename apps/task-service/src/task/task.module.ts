import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
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
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig),
    TypeOrmModule.forFeature([
      TaskEntity,
      TaskAssignment,
      TaskComment,
      TaskAudit,
    ]),
    ClientsModule.registerAsync([
      {
        name: 'NOTIFICATION_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [
              configService.get('RABBITMQ_URL') ||
                'amqp://guest:guest@localhost:5672',
            ],
            queue: 'notification_queue',
            queueOptions: { durable: false },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [TaskController],
  providers: [TaskService, CommentService],
})
export class TaskModule {}
