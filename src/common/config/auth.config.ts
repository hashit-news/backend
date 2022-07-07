import { registerAs } from '@nestjs/config';

export interface AuthConfig {
  issuer: string;
  expiresIn: number;
  refreshTokenExpiresIn: number;
  privateKeyFile: string;
  publicKeyFile: string;
}

export default registerAs(
  'auth',
  (): AuthConfig => ({
    issuer: process.env.AUTH_JWT_ISSUER || 'hashit',
    expiresIn: parseInt(process.env.AUTH_JWT_DEFAULT_EXPIRY_SECS || '300', 10) || 300,
    refreshTokenExpiresIn: parseInt(process.env.AUTH_JWT_REFRESH_TOKEN_EXPIRY || '604800', 10) || 604800,
    privateKeyFile: process.env.AUTH_JWT_PRIVATE_KEY_FILE || './private.key',
    publicKeyFile: process.env.AUTH_JWT_PUBLIC_KEY_FILE || './public.key',
  })
);
