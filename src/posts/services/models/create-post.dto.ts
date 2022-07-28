import { IsNotEmpty, ArrayNotEmpty, ArrayUnique, IsArray, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { CreatePostRequest } from '../../controllers/models/create-post-request.model';

export class CreatePostDto {
  constructor(req: CreatePostRequest, createdByUserId: string) {
    this.title = req.title;
    this.body = req.body;
    this.hashtags = req.hashtags;
    this.createdByUserId = createdByUserId;
  }

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
