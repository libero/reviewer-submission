import { Controller, Get, Res } from '@nestjs/common';
import { AppService } from './app.service';
// REMOVE
@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {}

    @Get('/health')
    async sendHealthCheck(@Res() res): Promise<{ ok: true }> {
        return res.status(200).json({ ok: true });
    }
}
