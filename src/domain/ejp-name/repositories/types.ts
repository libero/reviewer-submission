import EJPName from '../services/models/ejp-name';

export interface EJPNameRepository {
    create(ejpName: EJPName): Promise<EJPName>;
    findByName(name: string): Promise<EJPName | null>;
}
