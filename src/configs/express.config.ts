import { registerAs } from '@nestjs/config';

export interface ExpressConfig {
  environment: string;
  port: number;
}

export default registerAs(
  'express',
  (): ExpressConfig => ({
    environment: process.env.NODE_ENV,
    port: parseInt(process.env.APP_PORT, 10) || 8080,
  })
);
