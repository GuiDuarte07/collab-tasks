import {
  Controller,
  Post,
  Body,
  Inject,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
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
  async register(@Body() registerDto: RegisterDto) {
    try {
      const result = await firstValueFrom(
        this.authClient.send('auth.register', registerDto),
      );

      return result;
    } catch (error: unknown) {
      if (error instanceof RpcException) {
        const rpcError = error.getError();
        throw new HttpException(
          typeof rpcError === 'string' ? rpcError : 'Registration failed',
          HttpStatus.BAD_REQUEST,
        );
      }
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
  async login(@Body() loginDto: LoginDto) {
    try {
      const result = await firstValueFrom(
        this.authClient.send('auth.login', loginDto),
      );
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Login failed',
        error.status || HttpStatus.UNAUTHORIZED,
      );
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
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    try {
      const result = await firstValueFrom(
        this.authClient.send('auth.refresh', refreshTokenDto),
      );
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Token refresh failed',
        error.status || HttpStatus.UNAUTHORIZED,
      );
    }
  }
}
