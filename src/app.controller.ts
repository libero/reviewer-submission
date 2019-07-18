import { Controller, Get, Param, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { resolve } from 'path';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/cats')
  getCats(): Object {
    return {
      name: 'Snazzle'
    }
  }

  @Get('*')
  async serveRoot(@Res() res): Promise<any> {
    res.sendFile(resolve('../client/dist/index.html'))
  }
}
