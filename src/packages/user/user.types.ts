export interface User {
    id: string;
    name: string;
    role: string | null;
}

export interface UserRepository {
    getCurrentUser(header: string): Promise<User>;
}
