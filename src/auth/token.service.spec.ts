import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { UserDto } from '../users/user.models';
import { TokenService } from './token.service';
import authConfig from '../common/config/auth.config';
import { RoleEnum } from '@prisma/client';

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
    const payload: UserDto = {
      id: '1',
      username: 'test',
      roles: [RoleEnum.Admin],
    };

    // act
    const token = await service.generateJwtToken(payload);
    const decodedPayload = await service.verifyJwtToken(token);

    // assert
    expect(token).toBeDefined();
    expect(token).not.toBeNull();
    expect(decodedPayload).toBeDefined();
    expect(decodedPayload).not.toBeNull();
    expect(decodedPayload.id).toEqual(payload.id);
    expect(decodedPayload.username).toEqual(payload.username);
    expect(decodedPayload.roles).toEqual(payload.roles);
    expect(decodedPayload).toMatchObject(payload);
  });
});
