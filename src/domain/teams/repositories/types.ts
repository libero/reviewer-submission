import { TeamId } from '../types';
import { Author } from 'src/domain/submission/types';

export interface TeamRepository {
    findByObjectIdAndRole(id: string, role: string): Promise<TeamDTO[]>;
    create(dtoSubmission: Omit<TeamDTO, 'updated'>): Promise<TeamDTO>;
    update(dtoTeam: TeamDTO): Promise<TeamDTO>;
}

export type AuthorTeamMember = {
    alias: Author;
    meta: { corresponding: true };
};

export type TeamDTO = {
    id: TeamId;
    created: Date;
    updated?: Date;
    teamMembers: Array<AuthorTeamMember>;
    role: string;
    objectId: string;
    objectType: string;
};
