export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  userId: string;
  username: string;
  email: string;
  roles: string[];
  avatarUrl?: string;
}

export interface CurrentUser {
  accessToken: string;
  refreshToken: string;
  userId: string;
  username: string;
  email: string;
  roles: string[];
  avatarUrl?: string;
}
