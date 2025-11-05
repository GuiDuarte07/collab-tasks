import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class InternalSecretGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();

    const expected = process.env.NOTIFY_INTERNAL_SECRET;
    if (!expected) return true;

    const provided = req.headers['x-internal-secret'];
    if (typeof provided === 'string' && provided === expected) return true;

    throw new UnauthorizedException('Invalid internal secret');
  }
}
