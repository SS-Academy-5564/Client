export type LoginRequest = {
  email: string;
  password: string;
};

export type ApiError = {
  code: string;
  field?: string;
  message: string;
};

export type ApiResponse<T> = {
  success: boolean;
  data: T | null;
  errors: ApiError[];
};

export type LoginResult = {
  accessToken: string;
  expiresAt: string;
};

export type LoginResponse = ApiResponse<LoginResult>;
