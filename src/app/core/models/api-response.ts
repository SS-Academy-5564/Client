export interface ApiResponse<T> {
  data: T;
  pagination: null;
  success: boolean;
  errors: any[];
}