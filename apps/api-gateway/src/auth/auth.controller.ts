import {
  AuthResponse,
  RefreshTokenResponse,
  Result,
  AppError,
} from '@repo/shared-types';
import {
  Controller,
  Post,
  Body,
  Inject,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Registra um novo usuário' })
  @ApiResponse({
    status: 201,
    description: 'Usuário criado com sucesso',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe',
        username: 'johndoe',
        email: 'john@example.com',
        createdAt: '2025-10-28T10:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request',
    schema: {
      example: {
        statusCode: 400,
        message: 'Email já está em uso',
        error: 'Bad Request',
      },
    },
  })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponse> {
    try {
      const result = await firstValueFrom(
        this.authClient.send<Result<AuthResponse>>(
          'auth.register',
          registerDto,
        ),
      );

      if (result?.ok) return result.data as AuthResponse;

      throw new HttpException(result.error, result.error.statusCode);
    } catch (error: unknown) {
      const appErr = new AppError(error, {
        statusCode: HttpStatus.BAD_REQUEST,
      });
      throw new HttpException(appErr, appErr.statusCode);
    }
  }

  @Post('login')
  @ApiOperation({ summary: 'Logar usuário' })
  @ApiResponse({
    status: 200,
    description: 'Login realizado com sucesso',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'John Doe',
          username: 'johndoe',
          email: 'john@example.com',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Credênciais inválidas',
    schema: {
      example: {
        statusCode: 401,
        message: 'Email ou senha inválidos',
        error: 'Unauthorized',
      },
    },
  })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponse> {
    try {
      const result = await firstValueFrom(
        this.authClient.send<Result<AuthResponse>>('auth.login', loginDto),
      );
      if (result?.ok) {
        return result.data as AuthResponse;
      }

      throw new HttpException(result.error, result.error.statusCode);
    } catch (error: unknown) {
      const appErr = new AppError(error, {
        statusCode: HttpStatus.UNAUTHORIZED,
      });
      throw new HttpException(appErr, appErr.statusCode);
    }
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid refresh token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Invalid or expired refresh token',
        error: 'Unauthorized',
      },
    },
  })
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<RefreshTokenResponse> {
    try {
      const result = await firstValueFrom(
        this.authClient.send<Result<RefreshTokenResponse>>(
          'auth.refresh',
          refreshTokenDto,
        ),
      );
      if (result.ok) {
        return result.data as RefreshTokenResponse;
      }

      throw new HttpException(result.error, result.error.statusCode);
    } catch (error: unknown) {
      const appErr = new AppError(error, {
        statusCode: HttpStatus.UNAUTHORIZED,
      });
      throw new HttpException(appErr, appErr.statusCode);
    }
  }
}
