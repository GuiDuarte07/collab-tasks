import {
  Body,
  Controller,
  Inject,
  Post,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import type { Result, AppError } from '@repo/shared-types';

type FoundUser = { id: string; name: string; username: string; email: string };

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
  ) {}

  @Post('find-many')
  @ApiOperation({ summary: 'Buscar usuários por credenciais (array)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuários encontrados',
    schema: {
      example: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Maria Silva',
          username: 'maria',
          email: 'maria@example.com',
        },
      ],
    },
  })
  async findMany(
    @Body()
    body: Array<{ userId?: string; username?: string; email?: string }>,
  ): Promise<FoundUser[]> {
    const queries = Array.isArray(body)
      ? body.map((q) => ({
          userId: q.userId,
          username: q.username,
          email: q.email,
        }))
      : [];
    if (queries.length === 0) return [];

    try {
      const result = await firstValueFrom(
        this.authClient.send<
          Result<
            Array<{ id: string; name: string; username: string; email: string }>
          >
        >('auth.users.findMany', { queries }),
      );

      if (result?.ok) return result.data;

      throw new HttpException(result.error, result.error.statusCode);
    } catch (error: unknown) {
      const err = error as any as AppError;
      throw new HttpException(err, err?.statusCode ?? HttpStatus.BAD_REQUEST);
    }
  }
}
