import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import type {
  AuthResponse,
  LoginRequest,
  RefreshTokenRequest,
  RefreshTokenResponse,
  RegisterRequest,
  Result,
} from '@repo/shared-types';
@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern('auth.register')
  async register(
    @Payload() data: RegisterRequest,
  ): Promise<Result<AuthResponse>> {
    return await this.authService.register(data);
  }

  @MessagePattern('auth.login')
  async login(@Payload() data: LoginRequest): Promise<Result<AuthResponse>> {
    return await this.authService.login(data);
  }

  @MessagePattern('auth.refresh')
  async refreshToken(
    @Payload() data: RefreshTokenRequest,
  ): Promise<Result<RefreshTokenResponse>> {
    return await this.authService.refreshToken(data);
  }
}
