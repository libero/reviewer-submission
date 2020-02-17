import { uuidType } from 'typesafe-uuid';

export class TeamId extends uuidType<'TeamId'>() {}

export interface Person {
    firstName: string;
    lastName: string;
    email: string;
    institution: string;
}

export type Author = Person;

export interface Team {
    id: TeamId;
    updated: Date;
    created: Date;
    members: Person[];
    role: string;
    objectId: string;
    objectType: string;
}

export interface TeamRepository {
    create(role: string, people: Person, objectId: string, objectType: string): Promise<Team | null>;
    findById(id: TeamId): Promise<Team | null>;
    update(team: Team): Promise<Team | null>;
    close(): void;
}
