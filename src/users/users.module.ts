import { Module } from '@nestjs/common';
import { PrismaService } from 'src/common/database/prisma.service';
import { Web3Module } from '../web3/web3.module';
import { Web3Service } from '../web3/web3.service';
import { UsersService } from './users.service';

@Module({
  imports: [Web3Module],
  providers: [UsersService, PrismaService, Web3Service],
  exports: [UsersService],
})
export class UsersModule {}
