// REMOVE
import {
    Module,
    OnModuleInit,
    OnModuleDestroy,
    OnApplicationBootstrap,
    OnApplicationShutdown,
    Logger,
} from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { SubmissionModule } from './modules/submission-adaptor/submission.module';
import { UserModule } from './modules/user-adapter/user.module';
import { PassportModule } from '@nestjs/passport';

@Module({
    controllers: [AppController],
    imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        GraphQLModule.forRoot({
            context: ({ req }) => ({ req }),
            typePaths: ['**/modules/**/*.graphql'],
        }),
        AuthModule,
        SubmissionModule,
        UserModule,
    ],
    providers: [AppService],
})
export class AppModule implements OnModuleInit, OnModuleDestroy, OnApplicationBootstrap, OnApplicationShutdown {
    private readonly logger = new Logger(AppModule.name);

    onModuleInit(): void {
        this.logger.log('AppModule successfully initialized.');
    }
    onModuleDestroy(): void {
        this.logger.log('AppModule destroyed.');
    }
    onApplicationBootstrap(): void {
        this.logger.log('AppModule bootstrapped.');
    }
    onApplicationShutdown(signal?: string): void {
        this.logger.log(`AppModule received signal: ${signal}`);
    }
}
