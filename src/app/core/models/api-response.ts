export type ApiResponse<T> = {
  data: T;
  pagination: null;
  success: boolean;
  errors: unknown[];
};
