import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import { GetAddressResult } from './web3.models';

@Injectable()
export class Web3Service {
  getAddress(address: string): GetAddressResult {
    try {
      return { isValid: true, address: ethers.utils.getAddress(address) };
    } catch (err) {
      return { isValid: false, error: err };
    }
  }
}
