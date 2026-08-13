/** Standard backend response envelope. */
export type ApiResponse<T> = {
  data: T;
  pagination?: ApiPagination | null;
  success: boolean;
  errors: ApiError[];
};

/** Pagination metadata returned for collection endpoints. */
export type ApiPagination = {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

/** Structured backend error returned in an API envelope. */
export type ApiError = {
  code: string;
  field: string | null;
  message: string;
};
