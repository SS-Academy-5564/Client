import { ApiResponse } from '@core/models/api-response';

/** Credentials submitted to the login endpoint. */
export type LoginRequest = {
  email: string;
  password: string;
};

/** Authentication data returned after a successful login or token refresh. */
export type LoginResult = {
  accessToken: string;
  expiresAt: string;
};

/** Backend login envelope whose payload is absent when authentication fails. */
export type LoginResponse = ApiResponse<LoginResult | null>;
