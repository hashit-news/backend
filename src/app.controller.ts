import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { RoleType } from '@prisma/client';
import { AppService } from './app.service';
import { Roles } from './auth/decorators/role.decorator';
import { UserRequest } from './auth/dtos/auth.models';
import { JwtAuthGuard } from './auth/guards/jwt.guard';
import { RolesGuard } from './auth/guards/role.guard';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/protected')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.Admin)
  getProtectedHello(@Request() req: UserRequest) {
    return req.user;
  }
}
