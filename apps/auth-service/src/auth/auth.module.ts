import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RefreshTokenEntity, UserEntity } from 'src/entities';
import { databaseConfig } from 'src/config/database.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    // Configuração global do TypeORM
    TypeOrmModule.forRoot(databaseConfig),

    // Registra os repositories que serão usados globalmente
    TypeOrmModule.forFeature([UserEntity, RefreshTokenEntity]),

    // Configuração global do JWT
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get(
          'JWT_SECRET',
          'your-super-secret-jwt-key-here',
        ),
        signOptions: {
          expiresIn: configService.get('JWT_ACCESS_TOKEN_EXPIRES_IN', '15m'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
