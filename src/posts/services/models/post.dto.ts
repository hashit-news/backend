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
