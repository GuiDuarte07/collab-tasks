import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { TaskModule } from './task/task.module';
import { RealtimeModule } from './realtime/realtime.module';
import { NotificationModule } from './notification/notification.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PublicThrottlerGuard } from './common/guards/public-throttler.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '.env'],
      expandVariables: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 1000, // 1 segundo
        limit: 10, // 10 requisições
      },
    ]),
    AuthModule,
    TaskModule,
    RealtimeModule,
    NotificationModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: PublicThrottlerGuard,
    },
  ],
})
export class AppModule {}
