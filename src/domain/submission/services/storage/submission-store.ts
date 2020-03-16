import { SubmissionWriter, PackageLocation } from './types';
import { SubmissionId } from '../../types';

export class SubmissionStore {
    constructor(private readonly locations: SubmissionWriter[]) {}

    write(id: SubmissionId, buffer: Buffer): Promise<PackageLocation[]> {
        const promises = this.locations.map(store => store.write(id, buffer));
        return Promise.all(promises);
    }
}
