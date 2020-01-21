import { createParamDecorator } from '@nestjs/common';

export const AuthToken = createParamDecorator(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (data, [root, args, ctx, info]) => ctx.req.get('authorization'),
);
