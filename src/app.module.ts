import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './modules/config/config.module';
import { ConfigService } from './modules/config/config.service';
import { AuthModule } from './modules/auth/auth.module';
import { SubmissionModule } from './modules/submission-adaptor/submission.module';
import { PassportModule } from '@nestjs/passport';

@Module({
  controllers: [AppController],
  imports: [
    PassportModule.register({defaultStrategy: 'jwt'}),
    GraphQLModule.forRoot({
      context: ({ req }) => ({ req }),
      typePaths: ['**/modules/**/*.graphql'],
    }),
    ConfigModule,
    AuthModule,
    SubmissionModule,
  ],
  providers: [AppService],
})
export class AppModule {}
