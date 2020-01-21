import { Query, Resolver } from '@nestjs/graphql';
import { User } from '../../packages/user/user.types';
import { UserService } from './user.service';
import { AuthToken } from '../../decorators/authToken.decorator';

/*
 * Return the details of the currently logged in User
 */
@Resolver()
export class UserResolver {
    constructor(private readonly userService: UserService) {}

    @Query('getCurrentUser')
    async getCurrentUser(@AuthToken() header: string): Promise<User> {
        return await this.userService.getCurrentUser(header);
    }
}
