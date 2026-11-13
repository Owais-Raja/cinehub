export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    timestamp?: string;
    page?: number;
    limit?: number;
    totalCount?: number;
    [key: string]: unknown;
  };
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
    [key: string]: unknown;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

