import { Injectable } from '@nestjs/common';
// disable import for this because for some reason cuid() doens't work with this
// eslint-disable-next-line @typescript-eslint/no-var-requires
const cuid = require('cuid');

@Injectable()
export class CuidService {
  generate(): string {
    return cuid();
  }

  generateSlug(): string {
    return cuid.slug();
  }

  isCuid(str: string): boolean {
    return cuid.isCuid(str);
  }

  isSlug(slug: string): boolean {
    return cuid.isSlug(slug);
  }
}
