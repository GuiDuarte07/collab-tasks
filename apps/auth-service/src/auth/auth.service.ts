import { UserEntity } from './../entities/user.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import {
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  AuthResponse,
  RefreshTokenResponse,
  UserResponse,
  Result,
  AppError,
} from '@repo/shared-types';
import { RefreshTokenEntity } from '../entities';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(RefreshTokenEntity)
    private readonly refreshTokenRepository: Repository<RefreshTokenEntity>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerData: RegisterRequest): Promise<Result<AuthResponse>> {
    const { name, username, email, password } = registerData;

    const existingUser = await this.userRepository.findOne({
      where: [{ email }, { username }],
    });

    if (existingUser) {
      return Result.err(
        new AppError(
          'Usuário com este email ou nome de usuário já existe',
          409,
        ),
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.userRepository.create({
      name,
      username,
      email,
      password: hashedPassword,
    });

    const savedUser = await this.userRepository.save(user);

    const tokens = await this.generateTokens(savedUser.id);

    return Result.ok<AuthResponse>({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this.mapUserToResponse(savedUser),
    });
  }

  async login(loginData: LoginRequest): Promise<Result<AuthResponse>> {
    const { email, password } = loginData;

    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      return Result.err(new AppError('Credenciais inválidas', 401));
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return Result.err(new AppError('Credenciais inválidas', 401));
    }

    const tokens = await this.generateTokens(user.id);

    return Result.ok<AuthResponse>({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this.mapUserToResponse(user),
    });
  }

  async refreshToken(
    refreshTokenData: RefreshTokenRequest,
  ): Promise<Result<RefreshTokenResponse>> {
    const { refreshToken } = refreshTokenData;

    const tokenRecord = await this.refreshTokenRepository.findOne({
      where: { token: refreshToken },
      relations: ['user'],
    });

    if (!tokenRecord) {
      return Result.err(new AppError('Refresh token inválido', 401));
    }

    if (tokenRecord.expiresAt < new Date()) {
      await this.refreshTokenRepository.remove(tokenRecord);
      return Result.err(new AppError('Refresh token expirado', 401));
    }

    const tokens = await this.generateTokens(tokenRecord.user.id);

    await this.refreshTokenRepository.remove(tokenRecord);

    return Result.ok<RefreshTokenResponse>({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  }

  private async generateTokens(
    userId: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { sub: userId };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_ACCESS_TOKEN_EXPIRES_IN', '15m'),
    });

    const refreshToken = uuidv4() as string;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const refreshTokenRecord = this.refreshTokenRepository.create({
      token: refreshToken,
      userId,
      expiresAt,
    });

    await this.refreshTokenRepository.save(refreshTokenRecord);

    return { accessToken, refreshToken };
  }

  private mapUserToResponse(user: UserEntity): UserResponse {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
