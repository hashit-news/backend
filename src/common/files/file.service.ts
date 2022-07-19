import { Injectable } from '@nestjs/common';
import * as fs from 'fs';

@Injectable()
export class FileService {
  async readFile(filePath: string, encoding: BufferEncoding): Promise<string> {
    return await fs.promises.readFile(filePath, encoding);
  }
}
