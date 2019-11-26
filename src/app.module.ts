import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './modules/config/config.module';
import { AuthModule } from './modules/auth/auth.module';
import { SubmissionModule } from './modules/submission-adaptor/submission.module';
import { PassportModule } from '@nestjs/passport';

const configPath = process.env.CONFIG_PATH ? process.env.CONFIG_PATH : '/etc/reviewer/config.json';

@Module({
    controllers: [AppController],
    imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        GraphQLModule.forRoot({
            context: ({ req }) => ({ req }),
            typePaths: ['**/modules/**/*.graphql'],
        }),
        ConfigModule.load(configPath),
        AuthModule,
        SubmissionModule,
    ],
    providers: [AppService],
})
export class AppModule {}
