import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerDocumentOptions, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { ExpressConfig } from './common/config/express.config';
import { PrismaService } from './common/database/prisma.service';
import { ProblemDetailFilter } from './common/filters/problem-detail/problem-detail.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.enableCors();
  app.useGlobalFilters(new ProblemDetailFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory(errors) {
        return new BadRequestException(errors, 'Validation failed');
      },
    })
  );
  const config = app.get(ConfigService);
  const expressConfig = config.get<ExpressConfig>('express');

  if (!expressConfig) {
    throw new Error('Express config not found');
  }

  const logger = app.get(Logger);
  const prismaService = app.get(PrismaService);

  app.useLogger(logger);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('hashit API')
    .setVersion('1.0')
    .addTag('hashit')
    .addBearerAuth()
    .build();

  const swaggerOptions: SwaggerDocumentOptions = {
    operationIdFactory: (_controllerKey: string, methodKey: string) => methodKey,
  };

  const document = SwaggerModule.createDocument(app, swaggerConfig, swaggerOptions);
  SwaggerModule.setup('docs', app, document, {
    explorer: true,
  });

  logger.log(`Nest application is running on port ${expressConfig.port}`);

  await prismaService.enableShutdownHooks(app);
  await app.listen(expressConfig.port);
}

bootstrap();
