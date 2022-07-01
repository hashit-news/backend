import { BadRequestException, Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import { GetAddressResult, GetResult } from './web3.models';

@Injectable()
export class Web3Service {
  getAddress(address: string): GetAddressResult {
    try {
      return { isValid: true, address: ethers.utils.getAddress(address) };
    } catch (err) {
      return { isValid: false, error: (err as Error)?.message };
    }
  }

  validateSignature(publicAddress: string, signature: string, signedMessage: string): GetResult {
    const { isValid, address, error } = this.getAddress(publicAddress);

    if (!isValid) {
      throw new BadRequestException(error, 'Invalid public address');
    }

    try {
      const recoveredAddress = ethers.utils.verifyMessage(signature, signedMessage);
      return { isValid: address === recoveredAddress };
    } catch (err) {
      return { isValid: false, error: (err as Error)?.message };
    }
  }
}
