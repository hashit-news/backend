import { BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { ProblemDetailFilter } from './problem-detail.filter';
import { ProblemDetail } from './problem-detail.interfaces';
import { PROBLEM_CONTENT_TYPE, PROBLEM_TYPE_BASE_URL } from './constants';

const mockJson = jest.fn();

const mockStatus = jest.fn().mockImplementation(() => ({
  json: mockJson,
}));

const mockType = jest.fn().mockImplementation(() => ({
  status: mockStatus,
}));

const mockGetRequest = jest.fn().mockImplementation(() => ({
  path: '/',
}));

const mockGetResponse = jest.fn().mockImplementation(() => ({
  type: mockType,
}));

const mockHttpArgumentsHost = jest.fn().mockImplementation(() => ({
  getResponse: mockGetResponse,
  getRequest: mockGetRequest,
}));

const mockArgumentsHost = {
  switchToHttp: mockHttpArgumentsHost,
  getArgByIndex: jest.fn(),
  getArgs: jest.fn(),
  getType: jest.fn(),
  switchToRpc: jest.fn(),
  switchToWs: jest.fn(),
};

describe(ProblemDetailFilter.name, () => {
  let filter: ProblemDetailFilter;

  beforeAll(() => {
    filter = new ProblemDetailFilter();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return problem detail', () => {
    // arrange
    const status = HttpStatus.BAD_REQUEST;
    const expectedResponse: ProblemDetail = {
      status: HttpStatus.BAD_REQUEST,
      title: 'Bad Request',
      type: `${PROBLEM_TYPE_BASE_URL}/${status}`,
      instance: '/',
    };
    try {
      throw new BadRequestException('Bad Request');
    } catch (err) {
      const exception = err as HttpException;
      expectedResponse.detail = exception.stack;
      expectedResponse.title = exception.message;

      // act
      filter.catch(exception, mockArgumentsHost);
    }
    // assert
    // expect(mockType).toHaveBeenCalledWith(PROBLEM_CONTENT_TYPE);
    // expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    assertResponse(status, expectedResponse);
  });

  const assertResponse = (expectedStatus: number, expectedJson: ProblemDetail) => {
    expect(mockType).toHaveBeenCalledWith(PROBLEM_CONTENT_TYPE);
    expect(mockStatus).toHaveBeenCalledWith(expectedStatus);
    expect(mockJson).toHaveBeenCalledWith(expectedJson);
  };
});
