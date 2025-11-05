import { Injectable, ExecutionContext } from '@nestjs/common';
import {
  ThrottlerGuard,
  ThrottlerModuleOptions,
  ThrottlerStorage,
} from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';

/**
 * Guard de rate limiting que APENAS aplica throttling em rotas públicas.
 * Rotas internas (que começam com /internal) são isentas.
 */
@Injectable()
export class PublicThrottlerGuard extends ThrottlerGuard {
  constructor(
    protected readonly options: ThrottlerModuleOptions,
    protected readonly storageService: ThrottlerStorage,
    protected readonly reflector: Reflector,
  ) {
    super(options, storageService, reflector);
  }

  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const path: string = request.url || '';

    // Ignora rate limiting para rotas internas
    if (path.startsWith('/api/internal') || path.startsWith('/internal')) {
      return true;
    }

    // Aplica o comportamento padrão do ThrottlerGuard para outras rotas
    return super.shouldSkip(context);
  }
}
