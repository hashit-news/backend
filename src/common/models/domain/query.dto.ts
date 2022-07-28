import { IsInt, Min } from 'class-validator';

export class QueryDto {
  @Min(-1)
  @IsInt()
  pageNumber: number;

  @Min(-1)
  @IsInt()
  pageSize: number;

  orderBy?: string;
  orderDirection?: 'asc' | 'desc';

  get skip() {
    return this.pageNumber * this.pageSize;
  }

  get take() {
    return this.pageSize;
  }
}
