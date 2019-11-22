import { Injectable, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GqlAuthGuard extends AuthGuard('jwt') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getRequest(context: ExecutionContext): any {
        const ctx = GqlExecutionContext.create(context);
        return ctx.getContext().req;
    }
}
