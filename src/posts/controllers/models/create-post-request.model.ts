import { IsNotEmpty, ArrayNotEmpty, ArrayUnique, IsArray, ArrayMinSize, ArrayMaxSize } from 'class-validator';

export class CreatePostRequest {
  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  body: string;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  hashtags: string[];
}
