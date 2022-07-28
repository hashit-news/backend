import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../common/database/prisma.service';
import { PostsService } from '../services/posts.service';
import { PostsController } from './posts.controller';

describe('PostsController', () => {
  let controller: PostsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
      controllers: [PostsController],
    }).compile();

    controller = module.get<PostsController>(PostsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
