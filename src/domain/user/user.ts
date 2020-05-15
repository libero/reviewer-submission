export interface User {
    id: string;
    name: string;
    role: string | null;
}

export interface EditorAlias {
    id: string;
    name: string;
    aff: string;
    focuses: string[];
    expertises: string[];
}

export interface UserRepository {
    getCurrentUser(header: string): Promise<User>;
}
