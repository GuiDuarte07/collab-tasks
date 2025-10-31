import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TaskController } from './task.controller';
import { CommentController } from './comment.controller';
import { TaskGatewayService } from './task.service';
import { CommentGatewayService } from './comment.service';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'TASK_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [
              configService.get('RABBITMQ_URL') ||
                'amqp://guest:guest@localhost:5672',
            ],
            queue: 'task_queue',
            queueOptions: { durable: false },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [TaskController, CommentController],
  providers: [TaskGatewayService, CommentGatewayService],
})
export class TaskModule {}
