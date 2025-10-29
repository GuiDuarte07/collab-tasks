import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import {
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
} from '@repo/shared-types';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthResponse = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    user: {
      id: 'user-id',
      name: 'John Doe',
      email: 'john@example.com',
      username: 'johndoe',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  const mockRefreshTokenResponse = {
    accessToken: 'new-access-token',
    refreshToken: 'new-refresh-token',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
            refreshToken: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const registerData: RegisterRequest = {
        name: 'John Doe',
        username: 'johndoe',
        email: 'john@example.com',
        password: 'password123',
      };

      (authService.register as jest.Mock).mockResolvedValue(mockAuthResponse);

      const result = await controller.register(registerData);

      expect(authService.register).toHaveBeenCalledWith(registerData);
      expect(result).toEqual(mockAuthResponse);
    });
  });

  describe('login', () => {
    it('should login user', async () => {
      const loginData: LoginRequest = {
        email: 'john@example.com',
        password: 'password123',
      };

      (authService.login as jest.Mock).mockResolvedValue(mockAuthResponse);

      const result = await controller.login(loginData);

      expect(authService.login).toHaveBeenCalledWith(loginData);
      expect(result).toEqual(mockAuthResponse);
    });
  });

  describe('refreshToken', () => {
    it('should refresh token', async () => {
      const refreshTokenData: RefreshTokenRequest = {
        refreshToken: 'valid-refresh-token',
      };

      (authService.refreshToken as jest.Mock).mockResolvedValue(
        mockRefreshTokenResponse,
      );

      const result = await controller.refreshToken(refreshTokenData);

      expect(authService.refreshToken).toHaveBeenCalledWith(refreshTokenData);
      expect(result).toEqual(mockRefreshTokenResponse);
    });
  });
});
