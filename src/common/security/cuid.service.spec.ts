import { CuidService } from './cuid.service';

describe(CuidService.name, () => {
  let service: CuidService;

  beforeAll(() => {
    service = new CuidService();
  });

  it('should generate a cuid', () => {
    // arrange
    // act
    const cuid = service.generate();

    // assert
    expect(cuid).toBeDefined();
    expect(cuid).not.toBeNull();
    expect(service.isCuid(cuid)).toBeTruthy();
  });

  it('should generate a slug', () => {
    // arrange
    // act
    const slug = service.generateSlug();

    // assert
    expect(slug).toBeDefined();
    expect(slug).not.toBeNull();
    expect(service.isSlug(slug)).toBeTruthy();
  });

  it('should detect a cuid', () => {
    // arrange
    const cuid = 'cl5rnin190000g0s42qrv5ltq';
    const notCuid = 'blah';

    // act
    const isCuid = service.isCuid(cuid);
    const isNotCuid = service.isCuid(notCuid);

    // assert
    expect(isCuid).toBeTruthy();
    expect(isNotCuid).toBeFalsy();
  });

  it('should detect a slug', () => {
    // arrange
    const slug = '1l1g4um';
    const notSlug = 'blah';

    // act
    const isSlug = service.isSlug(slug);
    const isNotSlug = service.isSlug(notSlug);

    // assert
    expect(isSlug).toBeTruthy();
    expect(isNotSlug).toBeFalsy();
  });
});
