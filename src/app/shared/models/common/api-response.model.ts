export interface ApiResponse<T> {
  data: T;
  message?: string;
  success?: boolean;
  timestamp?: string;
}

export interface ErrorResponse {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  message?: string;
  errors?: Record<string, string[]>;
}
