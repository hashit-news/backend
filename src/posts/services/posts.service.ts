import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { QueryResult } from '../../common/models/domain/query-result.dto';
import { QueryDto } from '../../common/models/domain/query.dto';
import { CreatePostDto } from './models/create-post.dto';
import { PostDto } from './models/post.dto';

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPostById(id: string): Promise<PostDto | null> {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        createdBy: true,
        postHashTags: {
          include: {
            hashtag: true,
          },
        },
      },
    });

    if (!post) {
      return null;
    }

    return {
      id: post.id,
      title: post.title,
      body: post.body,
      createdAt: post.createdAt,
      createdByUserId: post.createdBy.id,
      updatedAt: post.updatedAt,
      createdByUser: post.createdBy.username || post.createdBy.walletAddress,
      hashtags: post.postHashTags.map(x => x.hashtag.name),
    };
  }

  async getPosts(filter: QueryDto): Promise<QueryResult<PostDto>> {
    const { pageNumber, pageSize, skip, take, orderBy, orderDirection } = filter;

    const posts = await this.prisma.post.findMany({
      skip,
      take,
      orderBy: orderBy ? { [orderBy]: orderDirection || 'asc' } : undefined,
      include: {
        createdBy: true,
        postHashTags: {
          include: {
            hashtag: true,
          },
        },
      },
    });

    return {
      data: posts.map(post => {
        return {
          id: post.id,
          title: post.title,
          body: post.body,
          createdAt: post.createdAt,
          createdByUserId: post.createdBy.id,
          updatedAt: post.updatedAt,
          createdByUser: post.createdBy.username || post.createdBy.walletAddress,
          hashtags: post.postHashTags.map(x => x.hashtag.name),
        };
      }),
      total: await this.prisma.post.count(),
      pageNumber,
      pageSize,
    };
  }

  async createPost(input: CreatePostDto): Promise<PostDto | null> {
    const { title, body, createdByUserId, hashtags } = input;
    const user = await this.prisma.user.findUnique({ where: { id: createdByUserId } });

    if (!user) {
      throw new UnprocessableEntityException('User not found');
    }

    const dbHashtags = await this.prisma.hashtag.findMany({
      where: { name: { in: hashtags } },
    });

    const newHashtags = hashtags.filter(hashtag => !dbHashtags.find(dbHashtag => dbHashtag.name === hashtag));

    for (const newHashtag of newHashtags) {
      const newDbHashtag = await this.prisma.hashtag.create({
        data: {
          name: newHashtag,
        },
      });

      dbHashtags.push(newDbHashtag);
    }

    const post = await this.prisma.post.create({
      data: {
        title,
        body,
        createdByUserId,
        postHashTags: {
          create: dbHashtags.map(dbHashtag => {
            return {
              hashtagId: dbHashtag.id,
            };
          }),
        },
      },
      include: {
        createdBy: true,
        postHashTags: {
          include: {
            hashtag: true,
          },
        },
      },
    });

    return {
      id: post.id,
      title: post.title,
      body: post.body,
      createdAt: post.createdAt,
      createdByUserId: post.createdBy.id,
      updatedAt: post.updatedAt,
      createdByUser: post.createdBy.username || post.createdBy.walletAddress,
      hashtags: dbHashtags.map(x => x.name),
    };
  }
}