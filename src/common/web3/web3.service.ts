import { BadRequestException, Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import { GetAddressResult } from './web3.models';

@Injectable()
export class Web3Service {
  getAddress(address: string): GetAddressResult {
    try {
      return { isValid: true, address: ethers.utils.getAddress(address) };
    } catch (err) {
      return { isValid: false };
    }
  }

  validateSignature(publicAddress: string, signature: string, signedMessage: string) {
    const { isValid, address } = this.getAddress(publicAddress);

    if (!isValid) {
      throw new BadRequestException('Invalid public address');
    }

    try {
      const recoveredAddress = ethers.utils.verifyMessage(signature, signedMessage);
      return address === recoveredAddress;
    } catch (err) {
      return false;
    }
  }
}
