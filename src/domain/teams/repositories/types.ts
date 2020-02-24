import { TeamId } from '../types';

export interface TeamRepository {
    findByObjectIdAndRole(id: string, role: string): Promise<TeamDTO[]>;
    create(dtoSubmission: Omit<TeamDTO, 'updated'>): Promise<TeamDTO>;
    update(dtoTeam: TeamDTO): Promise<TeamDTO>;
}

export interface TeamDTO {
    id: TeamId;
    created: Date;
    updated?: Date;
    team_members: Array<{}>[];
    role: string;
    object_id: string;
    object_type: string;
}
