import { Global, Module } from '@nestjs/common';
import { PrismaService } from './database/prisma.service';
import { CryptoService } from './security/crypto.service';
import { Web3Service } from './web3/web3.service';

@Global()
@Module({
  providers: [PrismaService, Web3Service, CryptoService],
  exports: [PrismaService, Web3Service, CryptoService],
})
export class CommonModule {}
