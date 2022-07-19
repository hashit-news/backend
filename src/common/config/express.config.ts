import { registerAs } from '@nestjs/config';

export interface ExpressConfig {
  environment: string;
  port: number;
}

export default registerAs(
  'express',
  (): ExpressConfig => ({
    environment: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.APP_PORT || '8080', 10) || 8080,
  })
);

export const isProduction = () => {
  return process.env.NODE_ENV === 'production';
};
