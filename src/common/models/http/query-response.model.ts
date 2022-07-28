import { QueryResult } from '../domain/query-result.dto';

export class QueryResponse<T> implements QueryResult<T> {
  data: T[];
  total: number;
  pageNumber: number;
  pageSize: number;
}
