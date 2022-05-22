import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { ExpressConfig } from './config/express.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);
  const expressConfig = config.get<ExpressConfig>('express');
  const logger = app.get(Logger);

  app.useLogger(logger);
  logger.log(`Nest application is running on port ${expressConfig.port}`);
  await app.listen(expressConfig.port);
}

bootstrap();
