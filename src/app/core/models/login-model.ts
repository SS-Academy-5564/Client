export interface LoginRequest {
  email: string;
  password: string;
}

export interface ApiError {
  code: string;
  field?: string;
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  errors: ApiError[];
}

export interface LoginResult {
  accessToken: string;
  expiresAt: string;
}

export type LoginResponse = ApiResponse<LoginResult>;
