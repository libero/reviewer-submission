import { Catch, HttpException } from '@nestjs/common';
import { GqlExceptionFilter } from '@nestjs/graphql';

// REMOVE - reuse continumm adaptor
@Catch(HttpException)
export class HttpExceptionFilter implements GqlExceptionFilter {
    catch(exception: HttpException): object {
        return {
            error: exception.getResponse(),
            status: exception.getStatus(),
        };
    }
}
