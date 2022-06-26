import { Test, TestingModule } from '@nestjs/testing';
import { Web3Service } from './web3.service';

describe('Web3Service', () => {
  let service: Web3Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Web3Service],
    }).compile();

    service = module.get<Web3Service>(Web3Service);
  });

  it('should get address', () => {
    // arrange
    const address = '0x8ba1f109551bd432803012645ac136ddd64dba72';
    const expectedAddress = '0x8ba1f109551bD432803012645Ac136ddd64DBA72';

    // act
    const result = service.getAddress(address);

    // assert
    expect(result).toBeDefined();
    expect(result).not.toBeNull();
    expect(result.isValid).toBeTruthy();
    expect(result.error).toBeUndefined();
    expect(result.address).toBe(expectedAddress);
  });

  it('should fail to get address because of invalid address', () => {
    // arrange
    const address = 'I like turtles.';

    // act
    const result = service.getAddress(address);

    // assert
    expect(result).toBeDefined();
    expect(result).not.toBeNull();
    expect(result.isValid).toBeFalsy();
    expect(result.address).toBeUndefined();
    expect(result.error).toBeDefined();
    expect(result.error.message).toContain('invalid address');
  });

  it('should fail to get address because of invalid casing', () => {
    // arrange
    const address = '0x8Ba1f109551bD432803012645Ac136ddd64DBA72';

    // act
    const result = service.getAddress(address);

    // assert
    expect(result).toBeDefined();
    expect(result).not.toBeNull();
    expect(result.isValid).toBeFalsy();
    expect(result.address).toBeUndefined();
    expect(result.error).toBeDefined();
    expect(result.error.message).toContain('bad address checksum');
  });

  it('should get address from ICAP address', () => {
    // arrange
    const address = 'XE65GB6LDNXYOFTX0NSV3FUWKOWIXAMJK36';
    const expectedAddress = '0x8ba1f109551bD432803012645Ac136ddd64DBA72';

    // act
    const result = service.getAddress(address);
    console.log(result);
    // assert
    expect(result).toBeDefined();
    expect(result).not.toBeNull();
    expect(result.isValid).toBeTruthy();
    expect(result.error).toBeUndefined();
    expect(result.address).toBe(expectedAddress);
  });

  it('should fail to get address because of invalid icap checksum', () => {
    // arrange
    const address = 'XE65GB6LDNXYOFTX0NSV3FUWKOWIXAMJK37';

    // act
    const result = service.getAddress(address);

    // assert
    expect(result).toBeDefined();
    expect(result).not.toBeNull();
    expect(result.isValid).toBeFalsy();
    expect(result.address).toBeUndefined();
    expect(result.error).toBeDefined();
    expect(result.error.message).toContain('bad icap checksum');
  });
});
