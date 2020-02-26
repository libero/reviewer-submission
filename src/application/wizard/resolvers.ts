import { WizardService } from './service';
import Submission from '../../domain/submission/services/models/submission';
import { SubmissionId, Author } from '../../domain/submission/types';
import { IResolvers } from 'apollo-server-express';
import { FileUpload } from 'graphql-upload';

const resolvers = (wizard: WizardService): IResolvers => ({
    Query: {},
    Mutation: {
        async saveDetailsPage(_, { id, details }: { id: SubmissionId; details: Author }): Promise<Submission | null> {
            return wizard.saveDetailsPage(id, details);
        },
        async uploadManuscript(_, variables: { file: FileUpload; id: SubmissionId }, context): Promise<null> {
            const { file, id: submissionId } = variables;
            const userId = context.userId;
            const { filename, mimetype, encoding, createReadStream } = await file;

            // TODO: create
            await wizard.createFile();

            // extract data
            const stream = file.createReadStream();

            const fileContents = await new Promise((resolve, reject) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const chunks: Array<any> = [];
                stream.on('data', chunk => {
                    chunks.push(chunk);
                });
                stream.on('error', reject);
                stream.on('end', () => {
                    resolve(Buffer.concat(chunks));
                });
            });

            // validate

            // get manuscript file
            const manuscriptFile = fileRepo.getManuscriptBySubmissionId(submissionId);

            if (manuscriptFile === null) {
                // create file entry
                const file = new File(submissionId, FileStatus.CREATED);

                // save it
                fileRepo.create(file);
            }

            // this can be parallel
            // 2. upload to s3
            const managedUpload = s3.upload(...);


            // 3. send to scienceBeam
            const scienceBeamPromise = scienceBeam.process(...);

            Promise.all([managedUpload.promise(), scienceBeamPromise]);

            return null;
        },
        async uploadSupportingFile(_, variables: { file: FileUpload; id: SubmissionId }, context): Promise<null> {
            const { file, id: submissionId } = variables;
            const userId = context.userId;
            return null;
        },
    },
});

export const WizardResolvers = resolvers;
