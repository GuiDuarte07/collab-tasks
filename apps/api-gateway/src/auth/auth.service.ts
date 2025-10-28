import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class AuthService {
  constructor(@Inject('AUTH_SERVICE') private readonly client: ClientProxy) {}

  async login(email: string, password: string) {
    const response$ = this.client.send(
      { cmd: 'validate_user' },
      { email, password },
    );
    return await lastValueFrom(response$);
  }
}
