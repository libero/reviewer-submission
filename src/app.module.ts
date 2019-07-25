import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './packages/config/config.module';
import { ConfigService } from './packages/config/config.service';
import { AuthModule } from './packages/auth/auth.module';
import { SubmissionModule } from './packages/submission/submission.module';
import { PassportModule } from '@nestjs/passport';

@Module({
  controllers: [AppController],
  imports: [
    PassportModule.register({defaultStrategy: 'jwt'}),
    GraphQLModule.forRoot({
      context: ({ req }) => ({ req }),
      typePaths: ['./**/*.graphql'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        type: configService.get('DB_TYPE'),
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
      } as TypeOrmModuleOptions),
    }),
    ConfigModule,
    AuthModule,
    SubmissionModule,
  ],
  providers: [AppService],
})
export class AppModule {}
