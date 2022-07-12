import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';

@Injectable()
export class CryptoService {
  generate256BitSecret() {
    return randomBytes(16).toString('hex');
  }
}
