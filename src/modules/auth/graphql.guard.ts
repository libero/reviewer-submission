import { Injectable, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';

type TRequest = object;

@Injectable()
export class GqlAuthGuard extends AuthGuard('jwt') {
    getRequest(context: ExecutionContext): TRequest {
        const ctx = GqlExecutionContext.create(context);
        return ctx.getContext().req;
    }
}
