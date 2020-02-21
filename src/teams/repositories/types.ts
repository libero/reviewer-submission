import { TeamId } from '../types';

export interface TeamRepository {
    findByObjectId(id: string): Promise<TeamDTO[]>;
    create(dtoSubmission: Omit<TeamDTO, 'updated'>): Promise<TeamDTO>;
    update(dtoTeam: Partial<TeamDTO> & { id: TeamId }): Promise<TeamDTO>;
}

export interface TeamDTO {
    id: TeamId;
    updated: Date;
}
