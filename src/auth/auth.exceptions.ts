import { AccessTokenErrorCode } from './auth.models';

export class AccessTokenException extends Error {
  constructor(private readonly code: AccessTokenErrorCode) {
    super('Access token error');
  }

  getErrorCode(): AccessTokenErrorCode {
    return this.code;
  }
}
