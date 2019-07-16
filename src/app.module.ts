import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GraphQLModule } from '@nestjs/graphql';
import { SubmissionModule } from './submission/submission.module';

@Module({
  imports: [
    GraphQLModule.forRoot({
      typePaths: ['./**/*.graphql'],
    }),
    SubmissionModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
