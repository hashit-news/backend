import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Injectable()
export class AppService {
  constructor(
    @InjectPinoLogger(AppService.name)
    private readonly logger: PinoLogger
  ) {}

  getHello(): string {
    this.logger?.trace('Log from a service');
    return 'Hello World!';
  }
}
