import { User, UserRepository } from './user.types';
import { UserController } from './user.controller';

describe('submission controller', () => {
    const mockUser: User = {
        id: '123',
        name: 'Bob',
        role: 'author',
    };

    const mockUserNoRole = {
        id: mockUser.id,
        name: mockUser.name,
        role: null,
    };

    const newMockUserRepository = (): UserRepository => ({
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        getCurrentUser(header: string): Promise<User> {
            return header === 'null' ? Promise.resolve(mockUserNoRole) : Promise.resolve(mockUser);
        },
    });

    describe('find the user information', () => {
        it('finds the current user meta', async () => {
            const mockRepo = newMockUserRepository();

            const controller = new UserController(mockRepo);

            const user = await controller.getCurrentUser('');

            expect(user.id).toBe(mockUser.id);
            expect(user.name).toBe(mockUser.name);
            expect(user.role).toBe(mockUser.role);
        });

        it('finds the current user meta with a null role', async () => {
            const mockRepo = newMockUserRepository();

            const controller = new UserController(mockRepo);

            const user = await controller.getCurrentUser('null');

            expect(user.id).toBe(mockUser.id);
            expect(user.name).toBe(mockUser.name);
            expect(user.role).toBeNull();
        });
    });
});
