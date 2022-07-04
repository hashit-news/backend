import { registerAs } from '@nestjs/config';

export interface AuthConfig {
  issuer: string;
  expiresIn: string;
  privateKeyFile: string;
  publicKeyFile: string;
}

export default registerAs(
  'auth',
  (): AuthConfig => ({
    issuer: process.env.AUTH_JWT_ISSUER || 'hashit',
    expiresIn: process.env.AUTH_JWT_DEFAULT_EXPIRY || '1h',
    privateKeyFile: process.env.AUTH_JWT_PRIVATE_KEY_FILE || './private.key',
    publicKeyFile: process.env.AUTH_JWT_PUBLIC_KEY_FILE || './public.key',
  })
);
