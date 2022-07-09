import { Injectable } from '@nestjs/common';
import * as moment from 'moment';

@Injectable()
export class TimeService {
  getUtcNow() {
    return moment.utc();
  }
}
