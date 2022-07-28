import { PostDto } from '../../services/models/post.dto';

/**
 * A post
 */
export class PostResponse implements PostDto {
  /**
   * The id of the post.
   */
  id: string;

  /**
   * The title of the post.
   */
  title: string;

  /**
   * The body of the post.
   */
  body: string;

  /**
   * The id of the user that created the post.
   */
  createdByUserId: string;

  /**
   * The username of the user that created the post.
   */
  createdByUser: string;

  /**
   * The date the post was created.
   */
  createdAt: Date;

  /**
   * The date the post was last updated.
   */
  updatedAt: Date;

  /**
   * The hashtags of the post.
   */
  hashtags: string[];
}
