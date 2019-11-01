import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AppService } from './app.service';
import { resolve } from 'path';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/health')
  async sendHealthCheck(@Res() res): Promise<{ok: true}> {
    return res.status(200).json({ok: true});
  }

  @Get('/jwt-auth-test')
  @UseGuards(AuthGuard('jwt'))
  async jwtAuthTest(@Res() res): Promise<void>  {
    // Currently we can't authenticate because this application has no concept of a user, nor does it have a way to look up a user
    res.status(200).json({msg: 'you shouldn\' make it this far'});
  }
}
