if (process.env.INCLUDE_NEW_RELIC && process.env.INCLUDE_NEW_RELIC === 'true') {
    require('newrelic');
}

import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as helmet from 'helmet';
import * as knex from 'knex';
import { Express, Request, Response } from 'express';
import { ApolloServer, AuthenticationError, UserInputError } from 'apollo-server-express';
import config, { S3Config, SESConfig } from './config';
import { InfraLogger as logger } from './logger';
import { join } from 'path';
import { loadSchema } from '@graphql-tools/load';
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader';
import { addResolversToSchema } from '@graphql-tools/schema';
import { mergeResolvers } from '@graphql-tools/merge';
import { verify } from 'jsonwebtoken';
import { GraphQLError, GraphQLFormattedError } from 'graphql';
import * as hpp from 'hpp';
import * as depthLimit from 'graphql-depth-limit';
import { simpleEstimator, fieldExtensionsEstimator, directiveEstimator, getComplexity } from 'graphql-query-complexity';
import { separateOperations } from 'graphql';
import { Server } from 'http';
import { SubmissionService } from './domain/submission';
import { SurveyService } from './domain/survey';
import { UserResolvers, UserService } from './domain/user';
import { DashboardResolvers } from './application/dashboard/resolvers';
import { DashboardService } from './application/dashboard/service';
import { WizardService } from './application/wizard/service';
import { WizardResolvers } from './application/wizard/resolvers';
import { TeamService } from './domain/teams/services/team-service';
import { PermissionService } from './application/permission/service';
import { SemanticExtractionService } from './domain/semantic-extraction/services/semantic-extraction-service';
import { FileService } from './domain/file/services/file-service';
import { AuditService } from './domain/audit/services/audit';
import { S3Store } from './domain/submission/services/storage/s3-store';
import { SftpStore } from './domain/submission/services/storage/sftp-store';
import { KnexEJPNamesRepository } from './domain/ejp-name/repositories/ejp-name';
import { MecaExporter } from './domain/submission/services/exporter/meca-exporter';
import * as S3 from 'aws-sdk/clients/s3';
import * as SES from 'aws-sdk/clients/ses';
import { createKnexAdapter } from './domain/knex-table-adapter';
import { MailService } from './domain/mail/services/mail-service';
import { SubmissionId } from './domain/submission/types';

import { MecaImportCallback } from './domain/submission/services/exporter/meca-import-callback';

// found via https://github.com/digicatapult/graphql-complexity-experiment/blob/master/app/apollo.js
const estimators = [
    // complexity based on field extension in resolver
    fieldExtensionsEstimator(),
    // complexity based on SDL directives
    directiveEstimator(),
    // fallback complexity when no other value is provided
    simpleEstimator({ defaultComplexity: 1 }),
];

const dumpConfig = (): void => {
    logger.info(`config.port: ${config.port}`);
    logger.info(`config.db_connection.host: ${config.db_connection.host}`);
    logger.info(`config.s3.awsEndPoint: ${config.s3.awsEndPoint}`);
    logger.info(`config.s3.fileBucket: ${config.s3.fileBucket}`);
    logger.info(`config.user_api_url: ${config.user_api_url}`);
    logger.info(`config.science_beam.api_url: ${config.science_beam.api_url}`);
};

const createS3 = (s3config: S3Config): S3 => {
    const defaultOptions = {
        accessKeyId: s3config.accessKeyId,
        secretAccessKey: s3config.secretAccessKey,
        apiVersion: '2006-03-01',
        signatureVersion: 'v4',
        s3ForcePathStyle: s3config.s3ForcePathStyle,
    };
    const s3Options = s3config.awsEndPoint ? { ...defaultOptions, endpoint: s3config.awsEndPoint } : defaultOptions;
    return new S3(s3Options);
};

const createSes = (sesConfig: SESConfig): SES => {
    const defaultOptions = {
        accessKeyId: sesConfig.accessKeyId,
        secretAccessKey: sesConfig.secretAccessKey,
        region: sesConfig.region,
    };
    const sesOptions = defaultOptions;
    return new SES(sesOptions);
};

const init = async (): Promise<void> => {
    logger.info('Starting service');
    dumpConfig();
    // Start the application
    const app: Express = express();
    const knexConnection = knex({
        client: 'pg',
        connection: config.db_connection,
    });

    const waitForServerClosure = async (server: Server): Promise<void> => {
        return new Promise(resolve => {
            server.close(() => resolve());
        });
    };

    const shutDown = async (server: Server): Promise<void> => {
        await knexConnection.destroy();
        await waitForServerClosure(server);
        process.exit();
    };

    logger.info(`Initialising domain services...`);
    const srvAudit = new AuditService(knexConnection);
    const srvSurvey = new SurveyService(knexConnection);
    const srvUser = new UserService(config.user_api_url);
    const srvTeam = new TeamService(knexConnection);
    const srvMail = new MailService(createSes(config.ses), config.mail.sender, config.mail.sendmail);
    const srvFile = new FileService(knexConnection, createS3(config.s3), config.s3.fileBucket, srvAudit);
    const s3Store = new S3Store(config.s3, config.meca_config);
    const sftpStore = new SftpStore(config.meca_config);
    const ejpNames = new KnexEJPNamesRepository(createKnexAdapter(knexConnection, 'public'));
    const mecaExporter = new MecaExporter(srvFile, ejpNames, config.authentication_jwt_secret);
    const srvSubmission = new SubmissionService(
        knexConnection,
        mecaExporter,
        s3Store,
        sftpStore,
        srvMail,
        srvAudit,
        srvFile,
    );
    const srvExtractionService = new SemanticExtractionService(knexConnection, config.science_beam);
    const mecaImportCallback = new MecaImportCallback(
        srvSubmission,
        srvAudit,
        srvMail,
        config.meca_config.email.subject_prefix,
        config.meca_config.email.recipient,
    );

    logger.info(`Initialising application services...`);
    const srvPermission = new PermissionService();
    const srvDashboard = new DashboardService(srvPermission, srvSubmission);
    const srvWizard = new WizardService(srvPermission, srvSubmission, srvTeam, srvFile, srvExtractionService, config);

    const resolvers = mergeResolvers([
        DashboardResolvers(srvDashboard, srvUser, srvTeam),
        UserResolvers(srvUser),
        WizardResolvers(srvWizard, srvUser, srvSurvey),
    ]);

    logger.info(`Initialising Express...`);

    // best to mount helmet so soon as possible to ensure headers are set: defaults - https://www.npmjs.com/package/helmet#how-it-works
    app.use(helmet());
    app.use(hpp());
    app.get('/health', (_: Request, res: Response) => res.sendStatus(200));

    app.post('/retry-export/:id', async (req: Request<{ id: string }>, res: Response) => {
        const submissionId = (req.params.id as unknown) as SubmissionId;
        let submission;
        try {
            submission = await srvSubmission.get(submissionId);
        } catch {
            res.sendStatus(400);
            return;
        }
        if (submission.status !== 'MECA_EXPORT_FAILED') {
            logger.warn(`Unable to retry MECA export of submission ${submissionId}: not in failed state`);
            res.status(400).send({ error: 'Submission not in failed state' });
            return;
        }
        const fullSubmission = await srvWizard.getFullSubmission(submissionId);
        fullSubmission.status = submission.status;
        logger.info(`Attempting to resubmit submission ${submissionId}`);
        srvSubmission
            .resubmit(fullSubmission)
            .then(() => {
                logger.info(`Resubmit of submission ${submissionId} successful.`);
                res.sendStatus(200);
                return;
            })
            .catch(() => {
                logger.info(`Failed to resubmit submission ${submissionId}.`);
                res.sendStatus(500);
            });
    });

    // meca import callback
    app.post('/meca-result/:id', bodyParser.json(), async (req: Request, res: Response) => {
        const authHeader = req.get('authorization');
        const token = authHeader && authHeader.match(/Bearer (.+)/) && RegExp.$1;
        const manuscriptId = req.params.id;

        if (token !== config.meca_config.api_key) {
            logger.warn('MECA callback received with invalid API key', {
                manuscriptId,
            });
            res.status(403).send({ error: 'Invalid API key' });
            return;
        }

        const { body }: { body: { result: string } } = req;
        if (!body || !mecaImportCallback.validateResponse(body.result)) {
            logger.warn('MECA callback received with invalid request body', {
                manuscriptId,
                body,
            });
            res.status(400).send({ error: 'Invalid request body' });
            return;
        }

        try {
            await mecaImportCallback.storeResult(req.params.id, body);
            res.sendStatus(204);
        } catch (err) {
            logger.error('Failed to process MECA callback', {
                manuscriptId,
                error: err.message,
            });
            res.status(500).send({ error: err.message });
        }
    });

    const schema = await loadSchema(join(__dirname, './schemas/**/*.graphql'), {
        loaders: [new GraphQLFileLoader()],
    });
    const schemaWithResolvers = addResolversToSchema({ schema, resolvers });

    logger.info(`Initialising ApolloServer...`);
    const apolloServer = new ApolloServer({
        schema: schemaWithResolvers,
        uploads: {
            maxFileSize: config.max_file_size_in_bytes,
        },
        plugins: [
            {
                // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
                requestDidStart: () => ({
                    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
                    didResolveOperation({ request, document }) {
                        // @todo: may need to have resolver level complexity.
                        // This needs to be revisited when the queries and their complexities are known
                        const complexity = getComplexity({
                            schema: schemaWithResolvers,
                            query: request.operationName
                                ? separateOperations(document)[request.operationName]
                                : document,
                            variables: request.variables,
                            estimators,
                        });
                        if (complexity >= config.max_ql_complexity) {
                            logger.error('Max query complexity reached');
                            throw new UserInputError(
                                `${complexity} is over max ${config.max_ql_complexity} complexity`,
                            );
                        }
                    },
                }),
            },
        ],
        validationRules: [depthLimit(config.max_ql_depth)],
        // @todo: Introspection queries will be blocked unless you are authenticated.
        // The point to consider - is this expected behaviour or should it allow Introspection regardless of auth status.
        context: ({ req, connection }): { userId: string; authorizationHeader: string } => {
            if (connection) {
                return connection.context;
            }
            try {
                // @todo: we need to use the correct libero auth token
                const token = (req.headers.authorization || '').split(' ')[1];
                const decodedToken = verify(token, config.authentication_jwt_secret) as { sub: string };
                return { userId: decodedToken.sub, authorizationHeader: req.headers.authorization || '' };
            } catch (e) {
                throw new AuthenticationError('You must be logged in');
            }
        },
        formatError: (error: GraphQLError): GraphQLFormattedError => {
            // @todo: revisit how we handle errors
            logger.error(error.message, (error.originalError && error.originalError.stack) || '');
            return error;
        },
        subscriptions: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onConnect: (connectionParams: any): any => {
                if (connectionParams.Authorization) {
                    const token = connectionParams.Authorization.split(' ')[1];
                    const decodedToken = verify(token, config.authentication_jwt_secret) as {
                        sub: string;
                    };
                    return { userId: decodedToken.sub, authorizationHeader: connectionParams.Authorization };
                }
                logger.error('Auth token is missing');
                throw new Error('Missing auth token!');
            },
        },
    });
    apolloServer.applyMiddleware({ app });
    const server = app.listen(config.port, () => logger.info(`Service listening on port ${config.port}`));
    apolloServer.installSubscriptionHandlers(server);
    process.on('SIGTERM', async () => {
        logger.info('SIGTERM called');
        await shutDown(server);
    });
    process.on('SIGINT', async () => {
        logger.info('SIGINT called');
        await shutDown(server);
    });
};

init();
