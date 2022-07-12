import { Global, Module } from '@nestjs/common';
import { PrismaService } from './database/prisma.service';
import { CryptoService } from './security/crypto.service';
import { TimeService } from './time/time.service';
import { Web3Service } from './web3/web3.service';

@Global()
@Module({
  providers: [PrismaService, Web3Service, CryptoService, TimeService],
  exports: [PrismaService, Web3Service, CryptoService, TimeService],
})
export class CommonModule {}
