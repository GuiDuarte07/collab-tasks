import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { RefreshTokenEntity, UserEntity } from 'src/entities';
jest.mock('bcryptjs');
jest.mock('uuid', () => ({
  v4: () => 'mock-uuid',
}));

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<UserEntity>;
  let refreshTokenRepository: Repository<RefreshTokenEntity>;
  let jwtService: JwtService;

  const mockUser = {
    id: 'user-id',
    name: 'John Doe',
    email: 'john@example.com',
    username: 'johndoe',
    password: 'hashed-password',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRefreshToken = {
    id: 'token-id',
    token: 'refresh-token',
    userId: 'user-id',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 day
    createdAt: new Date(),
    user: mockUser,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(RefreshTokenEntity),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string) => {
              const config = {
                JWT_ACCESS_TOKEN_EXPIRES_IN: '15m',
                JWT_REFRESH_TOKEN_EXPIRES_IN: '7d',
              };
              return config[key] || defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<UserEntity>>(
      getRepositoryToken(UserEntity),
    );
    refreshTokenRepository = module.get<Repository<RefreshTokenEntity>>(
      getRepositoryToken(RefreshTokenEntity),
    );
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerData = {
        name: 'John Doe',
        username: 'johndoe',
        email: 'john@example.com',
        password: 'password123',
      };

      (userRepository.findOne as jest.Mock).mockResolvedValue(null);
      (userRepository.create as jest.Mock).mockReturnValue(mockUser);
      (userRepository.save as jest.Mock).mockResolvedValue(mockUser);
      (jwtService.sign as jest.Mock).mockReturnValue('access-token');
      (refreshTokenRepository.create as jest.Mock).mockReturnValue(
        mockRefreshToken,
      );
      (refreshTokenRepository.save as jest.Mock).mockResolvedValue(
        mockRefreshToken,
      );

      const result = await service.register(registerData);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(result.user).not.toHaveProperty('password');
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    });

    it('should throw ConflictException if user already exists', async () => {
      const registerData = {
        name: 'John Doe',
        username: 'johndoe',
        email: 'john@example.com',
        password: 'password123',
      };

      (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);

      await expect(service.register(registerData)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const loginData = {
        email: 'john@example.com',
        password: 'password123',
      };

      (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwtService.sign as jest.Mock).mockReturnValue('access-token');
      (refreshTokenRepository.create as jest.Mock).mockReturnValue(
        mockRefreshToken,
      );
      (refreshTokenRepository.save as jest.Mock).mockResolvedValue(
        mockRefreshToken,
      );

      const result = await service.login(loginData);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'password123',
        'hashed-password',
      );
    });

    it('should throw UnauthorizedException if user not found', async () => {
      const loginData = {
        email: 'john@example.com',
        password: 'password123',
      };

      (userRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.login(loginData)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      const loginData = {
        email: 'john@example.com',
        password: 'wrong-password',
      };

      (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginData)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const refreshTokenData = {
        refreshToken: 'valid-refresh-token',
      };

      (refreshTokenRepository.findOne as jest.Mock).mockResolvedValue(
        mockRefreshToken,
      );
      (jwtService.sign as jest.Mock).mockReturnValue('new-access-token');
      (refreshTokenRepository.create as jest.Mock).mockReturnValue(
        mockRefreshToken,
      );
      (refreshTokenRepository.save as jest.Mock).mockResolvedValue(
        mockRefreshToken,
      );
      (refreshTokenRepository.remove as jest.Mock).mockResolvedValue(
        mockRefreshToken,
      );

      const result = await service.refreshToken(refreshTokenData);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(refreshTokenRepository.remove).toHaveBeenCalledWith(
        mockRefreshToken,
      );
    });

    it('should throw UnauthorizedException if refresh token not found', async () => {
      const refreshTokenData = {
        refreshToken: 'invalid-refresh-token',
      };

      (refreshTokenRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.refreshToken(refreshTokenData)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if refresh token is expired', async () => {
      const expiredToken = {
        ...mockRefreshToken,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      };

      const refreshTokenData = {
        refreshToken: 'expired-refresh-token',
      };

      (refreshTokenRepository.findOne as jest.Mock).mockResolvedValue(
        expiredToken,
      );
      (refreshTokenRepository.remove as jest.Mock).mockResolvedValue(
        expiredToken,
      );

      await expect(service.refreshToken(refreshTokenData)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(refreshTokenRepository.remove).toHaveBeenCalledWith(expiredToken);
    });
  });
});
