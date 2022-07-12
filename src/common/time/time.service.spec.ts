import { Test, TestingModule } from '@nestjs/testing';
import * as moment from 'moment';
import { TimeService } from './time.service';

describe(TimeService.name, () => {
  let service: TimeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TimeService],
    }).compile();

    service = module.get<TimeService>(TimeService);
  });

  it('should get current time', () => {
    // arrange
    const expected = moment.utc().unix();

    // act
    const now = service.getUtcNow();

    // assert
    expect(now.unix()).toBeCloseTo(expected);
  });
});
