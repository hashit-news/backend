import { RoleType } from '@prisma/client';
import { RolesGuard } from './role.guard';

const mockReflector = {
  get: jest.fn(),
  getAll: jest.fn(),
  getAllAndMerge: jest.fn(),
  getAllAndOverride: jest.fn(),
};

let mockGetRequest = jest.fn().mockImplementation(() => ({
  user: {
    id: '1',
    roles: [RoleType.User],
  },
}));

const mockHttpArgumentsHost = jest.fn().mockImplementation(() => ({
  getResponse: jest.fn(),
  getRequest: mockGetRequest,
}));

const mockExecutionContext = {
  getClass: jest.fn(),
  getHandler: jest.fn(),
  getArgs: jest.fn(),
  getArgByIndex: jest.fn(),
  getType: jest.fn(),
  switchToRpc: jest.fn(),
  switchToWs: jest.fn(),
  switchToHttp: mockHttpArgumentsHost,
};

describe(RolesGuard.name, () => {
  let guard: RolesGuard;

  beforeAll(() => {
    guard = new RolesGuard(mockReflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return true if user has role', () => {
    // arrange
    jest.spyOn(mockReflector, 'getAllAndOverride').mockImplementation(() => [RoleType.User]);
    const expectedResult = true;

    // act
    const result = guard.canActivate(mockExecutionContext);

    // assert
    expect(result).toBe(expectedResult);
  });

  it('should return true - no role types found in decorator', () => {
    // arrange
    jest.spyOn(mockReflector, 'getAllAndOverride').mockImplementation(() => []);
    const expectedResult = true;

    // act
    const result = guard.canActivate(mockExecutionContext);

    // assert
    expect(result).toBe(expectedResult);
  });

  it('should return true - no decorator found', () => {
    // arrange
    jest.spyOn(mockReflector, 'getAllAndOverride').mockImplementation(() => null);
    const expectedResult = true;

    // act
    const result = guard.canActivate(mockExecutionContext);

    // assert
    expect(result).toBe(expectedResult);
  });

  it('should return false - user not in role', () => {
    // arrange
    jest.spyOn(mockReflector, 'getAllAndOverride').mockImplementation(() => [RoleType.Admin]);
    const expectedResult = false;

    // act
    const result = guard.canActivate(mockExecutionContext);

    // assert
    expect(result).toBe(expectedResult);
  });

  it('should return false - user not found', () => {
    // arrange
    jest.spyOn(mockReflector, 'getAllAndOverride').mockImplementation(() => [RoleType.Admin]);
    mockGetRequest = jest.fn().mockImplementation(() => {
      return { user: null };
    });
    const expectedResult = false;

    // act
    const result = guard.canActivate(mockExecutionContext);

    // assert
    expect(result).toBe(expectedResult);
  });

  it('should return false - user has no roles', () => {
    // arrange
    jest.spyOn(mockReflector, 'getAllAndOverride').mockImplementation(() => [RoleType.Admin]);
    mockGetRequest.mockImplementation(() => {
      return {
        user: {
          id: '1',
        },
      };
    });
    const expectedResult = false;

    // act
    const result = guard.canActivate(mockExecutionContext);

    // assert
    expect(result).toBe(expectedResult);
  });
});
