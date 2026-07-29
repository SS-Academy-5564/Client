export type ApiResponse<T> = {
  data: T;
  pagination?: ApiPagination | null;
  success: boolean;
  errors: ApiError[];
};

export type ApiPagination = {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export type ApiError = {
  code: string;
  field: string | null;
  message: string;
};
