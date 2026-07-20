export type ApiResponse<T> = {
  data: T;
  pagination?: ApiPagination | null;
  success: boolean;
  errors: unknown[];
};

export type ApiPagination = {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};
