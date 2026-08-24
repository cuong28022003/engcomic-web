export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first?: boolean;
  last?: boolean;
  empty?: boolean;
}

export interface PageParams {
  page?: number;
  size?: number;
  sort?: string;
  [key: string]: string | number | boolean | undefined;
}
