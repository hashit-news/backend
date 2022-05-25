import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { AuthenticationModule } from './authentication/authentication.module';
import expressConfig from './common/config/express.config';
import loggingConfig from './common/config/logging.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      load: [expressConfig, loggingConfig],
    }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        pinoHttp: {
          level: configService.get<string>('logging.defaultLevel', 'debug'),
          transport:
            configService.get<string>('express.environment') !== 'production' ? { target: 'pino-pretty' } : undefined,
        },
      }),
    }),
    AuthenticationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
