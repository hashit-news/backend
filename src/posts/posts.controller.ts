import { Body, Controller, Get, NotFoundException, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RoleType } from '@prisma/client';
import { Roles } from '../auth/decorators/role.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/role.guard';
import { ProblemDetail } from '../common/filters/problem-detail/problem-detail.models';
import { CreatePostInputDto } from './posts.models';
import { PostsService } from './posts.service';

@ApiTags('posts')
@Controller('posts')
@ApiResponse({ status: 401, type: ProblemDetail, description: 'Unauthorized' })
@ApiResponse({ status: 403, type: ProblemDetail, description: 'Forbidden' })
@ApiResponse({ status: 404, type: ProblemDetail, description: 'Not found' })
@ApiResponse({ status: 422, type: ProblemDetail, description: 'Unprocessable entity' })
@ApiResponse({ status: 500, type: ProblemDetail, description: 'Internal Service Error' })
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get(':id')
  async getPost(@Param('id') id: string) {
    const post = await this.postsService.getPostById(id);

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return post;
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.User)
  @Post()
  async createPost(@Body() body: CreatePostInputDto) {
    const post = await this.postsService.createPost(body);

    return post;
  }
}
