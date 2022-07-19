import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ethers } from 'ethers';
import { Web3Service } from './web3.service';

describe(Web3Service.name, () => {
  let service: Web3Service;

  beforeAll(async () => {
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
  });

  it('should get address from ICAP address', () => {
    // arrange
    const address = 'XE65GB6LDNXYOFTX0NSV3FUWKOWIXAMJK36';
    const expectedAddress = '0x8ba1f109551bD432803012645Ac136ddd64DBA72';

    // act
    const result = service.getAddress(address);

    // assert
    expect(result).toBeDefined();
    expect(result).not.toBeNull();
    expect(result.isValid).toBeTruthy();
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
  });

  it('should validate signed message', async () => {
    // arrange
    const wallet = ethers.Wallet.createRandom();
    const signature = 'I like turtles.';
    const signedMessage = await wallet.signMessage(signature);
    const walletAddress = wallet.address;

    // act
    const isValid = service.validateSignature(walletAddress, signature, signedMessage);

    // assert
    expect(isValid).toBeTruthy();
  });

  it('should fail to validate signed message because of invalid signature', () => {
    // arrange
    const wallet = ethers.Wallet.createRandom();
    const signature = 'I like turtles.';
    const signedMessage = 'mumbo_jumble';
    const walletAddress = wallet.address;

    // act
    const isValid = service.validateSignature(walletAddress, signature, signedMessage);

    // assert
    expect(isValid).toBeFalsy();
  });

  it('should fail to validate signed message because of invalid public address', () => {
    // arrange
    const signature = 'I like turtles.';
    const signedMessage = 'mumbo_jumble';
    const walletAddress = 'INVALID_ADDRESS';

    // actsert
    expect(() => service.validateSignature(walletAddress, signature, signedMessage)).toThrowError(BadRequestException);
  });
});
