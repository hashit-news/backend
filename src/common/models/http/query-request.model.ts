import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class QueryRequest {
  @Min(0)
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  pageNumber?: number;

  @Min(0)
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  pageSize?: number;

  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}
