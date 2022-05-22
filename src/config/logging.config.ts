import { registerAs } from '@nestjs/config';

export interface LoggingConfig {
  defaultLevel: string;
}

export default registerAs(
  'logging',
  (): LoggingConfig => ({
    defaultLevel: process.env.APP_LOGLEVEL || 'debug',
  }),
);
