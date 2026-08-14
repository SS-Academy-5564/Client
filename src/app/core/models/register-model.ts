import { ApiResponse } from '@core/models/api-response';

export type RegisterRequest = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

/** Backend registration result containing verification resend guidance. */
export type RegistrationResult = {
  resendCooldownSeconds: number;
};

/** Backend envelope returned after registration succeeds. */
export type RegistrationResponse = ApiResponse<RegistrationResult | null>;

export type AuthResponse = {
  isLoading: boolean;
  error: string | null;
};
