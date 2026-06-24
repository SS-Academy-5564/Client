export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  isLoading: boolean;
  error: string | null;
}
