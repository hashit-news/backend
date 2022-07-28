export interface QueryResult<T> {
  data: T[];
  total: number;
  pageNumber: number;
  pageSize: number;
}
