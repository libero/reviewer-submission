import { AuthorTeamMember } from '../../repositories/types';
import { TeamId } from '../../types';

export default class Team {
    id: TeamId;
    created: Date;
    updated?: Date;
    teamMembers: Array<AuthorTeamMember>;
    role: string;
    objectId: string;
    objectType: string;

    public constructor(
        id: TeamId,
        created: Date,
        teamMembers: Array<AuthorTeamMember>,
        role: string,
        objectId: string,
        objectType: string,
    ) {
        this.id = id;
        this.created = created;
        this.teamMembers = teamMembers;
        this.role = role;
        this.objectId = objectId;
        this.objectType = objectType;
    }
}