import { Global, Module } from '@nestjs/common';
import { PrismaService } from './database/prisma.service';
import { FileService } from './files/file.service';
import { CryptoService } from './security/crypto.service';
import { CuidService } from './security/cuid.service';
import { TimeService } from './time/time.service';
import { Web3Service } from './web3/web3.service';

@Global()
@Module({
  providers: [PrismaService, Web3Service, CryptoService, TimeService, CuidService, FileService],
  exports: [PrismaService, Web3Service, CryptoService, TimeService, CuidService, FileService],
})
export class CommonModule {}
