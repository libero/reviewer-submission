export interface User {
    id: string;
    name: string;
    role: string | null;
}

export interface UserRepository {
    userAdapterUrl: string;
    getCurrentUser(header: string): Promise<User>;
}
