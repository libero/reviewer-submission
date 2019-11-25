import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './modules/config/config.module';
import { AuthModule } from './modules/auth/auth.module';
import { SubmissionModule } from './modules/submission-adaptor/submission.module';
import { PassportModule } from '@nestjs/passport';
import { resolve } from 'path';

@Module({
    controllers: [AppController],
    imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        GraphQLModule.forRoot({
            context: ({ req }) => ({ req }),
            typePaths: ['**/modules/**/*.graphql'],
        }),
        ConfigModule.load(resolve(__dirname, '..', 'config', 'config.json')),
        AuthModule,
        SubmissionModule,
    ],
    providers: [AppService],
})
export class AppModule {}
