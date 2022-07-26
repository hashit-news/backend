import { IsNotEmpty, ArrayNotEmpty, ArrayUnique, IsArray, ArrayMinSize, ArrayMaxSize } from 'class-validator';

export class CreatePostInputDto {
  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  body: string;

  @IsNotEmpty()
  createdByUserId: string;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  hashtags: string[];
}

export interface PostDto {
  id: string;
  title: string;
  body: string;
  createdByUserId: string;
  createdByUser: string;
  createdAt: Date;
  updatedAt: Date;
  hashtags: string[];
}
