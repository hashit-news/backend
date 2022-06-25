import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import { GetAddressResult } from './web3.models';

@Injectable()
export class Web3Service {
  getAddress(address: string): GetAddressResult {
    const isValid = ethers.utils.isAddress(address);

    if (!isValid) {
      return { isValid };
    }

    try {
      return { isValid, address: ethers.utils.getAddress(address) };
    } catch {
      return { isValid };
    }
  }
}
