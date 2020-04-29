import { AuthorDetails } from '../../submission/types';
import Team from '../services/models/team';

export interface TeamRepository {
    findByObjectIdAndRole(id: string, role: string): Promise<Team[]>;
    create(dtoTeam: Omit<Team, 'id' | 'created' | 'updated'>): Promise<Team>;
    update(dtoTeam: Team): Promise<Team>;
}

export type AuthorTeamMember = {
    alias: AuthorDetails;
    meta: { corresponding: true };
};

export type PeopleTeamMember = {
    meta:
        | {
              elifePersonId: string;
          }
        | {
              name: string;
              email: string;
          };
};
