import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { ExpressConfig } from './common/config/express.config';
import { PrismaService } from './common/database/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);
  const expressConfig = config.get<ExpressConfig>('express');
  const logger = app.get(Logger);
  const prismaService = app.get(PrismaService);

  app.useLogger(logger);

  logger.log(`Nest application is running on port ${expressConfig.port}`);

  await prismaService.enableShutdownHooks(app);
  await app.listen(expressConfig.port);
}

bootstrap();
