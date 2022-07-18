import { Test, TestingModule } from '@nestjs/testing';
import { CryptoService } from './crypto.service';

describe(CryptoService.name, () => {
  let service: CryptoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CryptoService],
    }).compile();

    service = module.get<CryptoService>(CryptoService);
  });

  it('should generate a 256 bit secret', () => {
    // arrange
    // act
    const result = service.generate256BitSecret();

    // assert
    expect(result).toBeDefined();
    expect(result).not.toBeNull();
    expect(result.length).toBe(32);
    console.log(result);
  });
});
