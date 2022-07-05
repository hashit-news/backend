import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { TokenService } from './token.service';
import authConfig from '../common/config/auth.config';
import { UserIdUsernameDto } from './auth.models';

describe('TokenService', () => {
  let service: TokenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ load: [authConfig] })],
      providers: [TokenService, JwtService],
    }).compile();

    service = module.get<TokenService>(TokenService);
  });

  it('should generate valid JWT', async () => {
    // arrange
    const user: UserIdUsernameDto = {
      id: '1',
      username: 'fujiwara_takumi',
    };

    // act
    const token = await service.generateJwtToken(user);
    const payload = await service.verifyJwtToken(token);

    // assert
    expect(token).toBeDefined();
    expect(token).not.toBeNull();
    expect(payload).toBeDefined();
    expect(payload).not.toBeNull();
    expect(payload.sub).toEqual(user.id);
    expect(payload.name).toEqual(user.username);
  });
});
