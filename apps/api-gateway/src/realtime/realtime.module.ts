import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RealtimeGateway } from './realtime.gateway';
import { InternalNotifyController } from './internal-notify.controller';

@Module({
  imports: [
    JwtModule.registerAsync({
      global: false,
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET', 'your-super-secret-jwt-key-here'),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [RealtimeGateway],
  controllers: [InternalNotifyController],
  exports: [RealtimeGateway],
})
export class RealtimeModule {}
