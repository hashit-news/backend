import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  UseGuards,
  Request,
  Query,
  UnprocessableEntityException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RoleType } from '@prisma/client';
import { Roles } from '../../auth/decorators/role.decorator';
import { UserRequest } from '../../auth/dtos/auth.models';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { RolesGuard } from '../../auth/guards/role.guard';
import { ProblemDetail } from '../../common/filters/problem-detail/problem-detail.models';
import { QueryDto } from '../../common/models/domain/query.dto';
import { QueryRequest } from '../../common/models/http/query-request.model';
import { QueryResponse } from '../../common/models/http/query-response.model';
import { CreatePostDto } from '../services/models/create-post.dto';
import { PostsService } from '../services/posts.service';
import { CreatePostRequest } from './models/create-post-request.model';
import { PostResponse } from './models/post-response.model';

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

  @Get('')
  async getPosts(@Query() query: QueryRequest): Promise<QueryResponse<PostResponse>> {
    const queryDto = new QueryDto();
    queryDto.pageNumber = query.pageNumber ?? 0;
    queryDto.pageSize = query.pageSize ?? 10;
    queryDto.orderBy = query.orderBy;
    queryDto.orderDirection = query.orderDirection;

    const result = await this.postsService.getPosts(queryDto);

    return result;
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.User)
  @Post()
  @HttpCode(HttpStatus.OK)
  async createPost(@Request() req: UserRequest, @Body() body: CreatePostRequest): Promise<PostResponse> {
    const input = new CreatePostDto(body, req.user.id);
    const post = await this.postsService.createPost(input);

    if (!post) {
      throw new UnprocessableEntityException('Post could not be created');
    }

    return post;
  }
}
