import { Module } from '@nestjs/common';
import { UserResolver } from './user.resolver';
import { UserService } from './user.service';
import { ConfigModule } from '../config/config.module';
// REMOVE WHOLE FOLDER
@Module({
    imports: [ConfigModule],
    providers: [UserService, UserResolver],
})
export class UserModule {}
