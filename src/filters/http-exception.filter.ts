import { Catch, HttpException } from '@nestjs/common';
import { GqlExceptionFilter } from '@nestjs/graphql';

@Catch(HttpException)
export class HttpExceptionFilter implements GqlExceptionFilter {
    catch(exception: HttpException): object {
        return {
            error: exception.getResponse(),
            status: exception.getStatus(),
        };
    }
}
