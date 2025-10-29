export interface BaseUser {
  id: string;
  email: string;
  username: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserResponse extends Omit<BaseUser, "password"> {
  // Omite campos sensíveis como password
}

export interface TokenPayload {
  sub: string;
  email: string;
  username: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserResponse;
}
