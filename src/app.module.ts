import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CommonModule } from './common/common.module';
import expressConfig from './common/config/express.config';
import loggingConfig from './common/config/logging.config';
import authConfig from './common/config/auth.config';
import { CuidService } from './common/security/cuid.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      load: [expressConfig, loggingConfig, authConfig],
    }),
    LoggerModule.forRootAsync({
      inject: [ConfigService, CuidService],
      useFactory: async (configService: ConfigService) => ({
        pinoHttp: {
          level: configService.get<string>('logging.defaultLevel', 'debug'),
          transport:
            configService.get<string>('express.environment') !== 'production' ? { target: 'pino-pretty' } : undefined,
        },
      }),
    }),
    CommonModule,
    AuthModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
