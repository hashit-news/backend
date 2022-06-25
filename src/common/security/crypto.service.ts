import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';

@Injectable()
export class CryptoService {
  generateNonce() {
    return randomBytes(16).toString('hex');
  }
}
